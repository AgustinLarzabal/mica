import { createMemoryHistory, RouterProvider } from "@tanstack/react-router"
import { act, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { getRouter } from "@/router"

vi.mock("@tanstack/react-devtools", () => ({
  TanStackDevtools: () => null,
}))

const coinId = "00000000-0000-4000-8000-000000000001"
const coin = {
  id: coinId,
  title: "First coin",
  issuer: { name: "Argentina", code: "AR" },
  createdAt: "2026-09-16T10:00:00.000Z",
  updatedAt: "2026-09-16T11:00:00.000Z",
}
const issuers = [
  { name: "Argentina", code: "AR" },
  { name: "Roman Empire", code: "ROMAN" },
  { name: "Uruguay", code: "UY" },
]

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
    status,
  })
}

function createDeferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })

  return { promise, resolve }
}

function createArchiveFetch(coins: Array<typeof coin> = [coin]) {
  return (input: string | URL | Request) =>
    Promise.resolve(
      String(input).endsWith("/v1/issuers")
        ? jsonResponse({ issuers })
        : jsonResponse({ coins })
    )
}

function renderArchiveRoute(initialEntry = "/") {
  const history = createMemoryHistory({ initialEntries: [initialEntry] })
  const router = getRouter({ history })
  render(<RouterProvider router={router} />)
  return router
}

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe("Archive landing route", () => {
  it("loads Coins and Issuers concurrently and keeps loading until both are ready", async () => {
    const coinsResponse = createDeferred<Response>()
    const issuersResponse = createDeferred<Response>()
    const filteredCoinsResponse = createDeferred<Response>()
    const fetchMock = vi.fn((input: string | URL | Request) => {
      const url = String(input)

      return url.endsWith("/v1/issuers")
        ? issuersResponse.promise
        : url.endsWith("/v1/coins?issuer=ROMAN")
          ? filteredCoinsResponse.promise
          : coinsResponse.promise
    })
    vi.stubGlobal("fetch", fetchMock)

    const router = renderArchiveRoute("/?issuer=AR")

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/v1/coins?issuer=AR"
    )
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:3001/v1/issuers")
    expect(await screen.findByText("Loading coins…")).toBeVisible()

    issuersResponse.resolve(
      jsonResponse({ issuers: [{ name: "Argentina", code: "AR" }] })
    )
    await waitFor(() =>
      expect(
        router.options.context.queryClient.getQueryState(["issuers", "list"])
          ?.status
      ).toBe("success")
    )
    expect(router.state.status).toBe("pending")
    expect(screen.getByText("Loading coins…")).toBeVisible()

    coinsResponse.resolve(jsonResponse({ coins: [coin] }))
    expect(
      await screen.findByRole("link", { name: "First coin" })
    ).toBeVisible()
    expect(router.state.status).toBe("idle")
    expect(screen.getByRole("combobox", { name: "Issuer" })).toHaveTextContent(
      "Argentina"
    )
    expect(router.state.location.searchStr).toBe("?issuer=AR")

    const navigation = router.navigate({
      to: "/",
      search: { issuer: "ROMAN" },
    })
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:3001/v1/coins?issuer=ROMAN"
      )
    )
    const settlement = await Promise.race([
      navigation.then(() => "settled" as const),
      new Promise<"pending">((resolve) => {
        setTimeout(() => resolve("pending"), 0)
      }),
    ])

    expect(settlement).toBe("pending")
    filteredCoinsResponse.resolve(jsonResponse({ coins: [coin] }))
    await navigation
    expect(router.state.location.searchStr).toBe("?issuer=ROMAN")
  })

  it("keeps the selected Issuer synchronized with URL state", async () => {
    const fetchMock = vi.fn(createArchiveFetch())
    vi.stubGlobal("fetch", fetchMock)
    const router = renderArchiveRoute()
    const select = await screen.findByRole("combobox", { name: "Issuer" })

    expect(select).toHaveTextContent("All issuers")
    await router.navigate({ to: "/", search: { issuer: "ROMAN" } })

    expect(router.state.location.searchStr).toBe("?issuer=ROMAN")
    expect(select).toHaveTextContent("Roman Empire")
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/v1/coins?issuer=ROMAN"
    )

    await router.navigate({ to: "/", search: {} })

    expect(router.state.location.searchStr).toBe("")
    expect(select).toHaveTextContent("All issuers")

    router.history.back()
    await waitFor(() =>
      expect(router.state.location.searchStr).toBe("?issuer=ROMAN")
    )
    expect(select).toHaveTextContent("Roman Empire")

    router.history.forward()
    await waitFor(() => expect(router.state.location.searchStr).toBe(""))
    expect(select).toHaveTextContent("All issuers")
  })

  it("places the Issuer select in the Explore filters navigation", async () => {
    vi.stubGlobal("fetch", vi.fn(createArchiveFetch()))

    renderArchiveRoute()

    const filters = await screen.findByRole("navigation")
    expect(filters).toContainElement(
      screen.getByRole("combobox", { name: "Issuer" })
    )
  })

  it("keeps the Explore filters visible while a newly selected Issuer loads", async () => {
    const filteredCoinsResponse = createDeferred<Response>()
    const filteredCoinsRequested = createDeferred<void>()
    const fetchMock = vi.fn((input: string | URL | Request) => {
      const url = String(input)

      if (url.endsWith("/v1/issuers")) {
        return Promise.resolve(jsonResponse({ issuers }))
      }

      if (url.endsWith("/v1/coins?issuer=ROMAN")) {
        filteredCoinsRequested.resolve()
        return filteredCoinsResponse.promise
      }

      return Promise.resolve(jsonResponse({ coins: [coin] }))
    })
    vi.stubGlobal("fetch", fetchMock)
    const router = renderArchiveRoute()

    await screen.findByRole("link", { name: "First coin" })
    vi.useFakeTimers()
    const navigation = router.navigate({
      to: "/",
      search: { issuer: "ROMAN" },
    })
    await filteredCoinsRequested.promise
    await act(() => vi.advanceTimersByTimeAsync(201))

    expect(screen.getByRole("navigation")).toBeVisible()
    expect(screen.getByRole("combobox", { name: "Issuer" })).toBeVisible()

    filteredCoinsResponse.resolve(jsonResponse({ coins: [coin] }))
    await act(() => vi.advanceTimersByTimeAsync(500))
    await navigation
    expect(screen.getByRole("combobox", { name: "Issuer" })).toHaveTextContent(
      "Roman Empire"
    )
  })

  it("names a known selected Issuer when it has no Coins", async () => {
    vi.stubGlobal("fetch", vi.fn(createArchiveFetch([])))

    renderArchiveRoute("/?issuer=AR")

    expect(
      await screen.findByText("No coins found for Argentina")
    ).toBeVisible()
    expect(screen.getByRole("combobox", { name: "Issuer" })).toHaveTextContent(
      "Argentina"
    )
  })

  it("keeps the populated select available when the URL Issuer is unknown", async () => {
    vi.stubGlobal("fetch", vi.fn(createArchiveFetch([])))
    renderArchiveRoute("/?issuer=ZZ")

    expect(await screen.findByText("Issuer not found")).toBeVisible()
    const select = screen.getByRole("combobox", { name: "Issuer" })
    expect(select).toHaveTextContent("Unknown issuer (ZZ)")
  })

  it("keeps filtered and unfiltered Coin collections distinct", async () => {
    const fetchMock = vi.fn(createArchiveFetch())
    vi.stubGlobal("fetch", fetchMock)
    const router = renderArchiveRoute("/?issuer=AR")
    await screen.findByRole("link", { name: "First coin" })

    await router.navigate({ to: "/", search: {} })

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/v1/coins?issuer=AR"
    )
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:3001/v1/coins")
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it.each(["", "ar", "A", "ABC_123"])(
    "shows an error for malformed Issuer Code %j without rewriting or requesting",
    async (issuerCode) => {
      const fetchMock = vi.fn(() =>
        Promise.resolve(jsonResponse({ coins: [coin] }))
      )
      vi.stubGlobal("fetch", fetchMock)
      const search = `?issuer=${encodeURIComponent(issuerCode)}`

      const router = renderArchiveRoute(`/${search}`)

      expect(await screen.findByText("Invalid issuer code")).toBeVisible()
      expect(fetchMock).not.toHaveBeenCalled()
      expect(router.state.location.searchStr).toBe(search)
    }
  )

  it.each([
    ["ISO", { name: "Argentina", code: "AR" }],
    ["Archive-defined", { name: "Roman Empire", code: "ROMAN" }],
  ])(
    "renders one %s Issuer's persisted Coin tile",
    async (_category, issuer) => {
      const fetchMock = vi.fn(createArchiveFetch([{ ...coin, issuer }]))
      vi.stubGlobal("fetch", fetchMock)

      renderArchiveRoute()

      const link = await screen.findByRole("link", { name: "First coin" })
      expect(link).toHaveAttribute("href", `/coins/${coinId}`)
      expect(screen.queryByText(coinId)).not.toBeInTheDocument()
      expect(screen.getAllByText(issuer.name).length).toBeGreaterThan(0)
      expect(fetchMock).toHaveBeenCalledTimes(2)
    }
  )

  it("bounds Explore Coin animation delays", async () => {
    const coins = Array.from({ length: 20 }, (_, index) => ({
      ...coin,
      id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
      title: `Coin ${index + 1}`,
    }))
    vi.stubGlobal("fetch", vi.fn(createArchiveFetch(coins)))

    renderArchiveRoute()

    expect(await screen.findByRole("link", { name: "Coin 2" })).toHaveStyle({
      animationDelay: "60ms",
    })
    expect(screen.getByRole("link", { name: "Coin 20" })).toHaveStyle({
      animationDelay: "240ms",
    })
  })

  it("shows the empty archive message", async () => {
    vi.stubGlobal("fetch", vi.fn(createArchiveFetch([])))

    renderArchiveRoute()

    expect(
      await screen.findByText("No coins have been added to the archive yet")
    ).toBeInTheDocument()
  })

  it("shows loading feedback while the Coin list is pending", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {}))
    )

    renderArchiveRoute()

    expect(await screen.findByText("Loading coins…")).toBeInTheDocument()
  })

  it("distinguishes a malformed Coin list response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: string | URL | Request) =>
        String(input).endsWith("/v1/issuers")
          ? Promise.resolve(jsonResponse({ issuers }))
          : Promise.resolve(jsonResponse({ coins: [{ id: coinId }] }))
      )
    )

    renderArchiveRoute()

    expect(
      await screen.findByText("Invalid coin list response")
    ).toBeInTheDocument()
    expect(screen.getByRole("combobox", { name: "Issuer" })).toBeVisible()
  })

  it("shows request failures", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")))

    renderArchiveRoute()

    expect(await screen.findByText("Unable to load coins")).toBeInTheDocument()
  })

  it("shows server failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(jsonResponse({ error: {} }, 503)))
    )

    renderArchiveRoute()

    expect(await screen.findByText("Unable to load coins")).toBeInTheDocument()
  })

  it("uses the route error state for an invalid Issuer response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: string | URL | Request) =>
        Promise.resolve(
          String(input).endsWith("/v1/issuers")
            ? jsonResponse({ issuers: [{ name: "Argentina", id: "internal" }] })
            : jsonResponse({ coins: [coin] })
        )
      )
    )

    renderArchiveRoute()

    expect(
      await screen.findByText("Invalid issuer list response")
    ).toBeVisible()
    expect(screen.queryByRole("combobox", { name: "Issuer" })).toBeNull()
  })

  it("uses the route error state when the Issuer request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: string | URL | Request) =>
        String(input).endsWith("/v1/issuers")
          ? Promise.reject(new TypeError("offline"))
          : Promise.resolve(jsonResponse({ coins: [coin] }))
      )
    )

    renderArchiveRoute()

    expect(await screen.findByText("Unable to load coins")).toBeVisible()
    expect(screen.queryByRole("combobox", { name: "Issuer" })).toBeNull()
  })

  it("navigates from a Coin tile to the Coin detail route", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: string | URL | Request) => {
        const url = String(input)
        return Promise.resolve(
          url.endsWith("/v1/issuers")
            ? jsonResponse({ issuers })
            : jsonResponse(
                url.endsWith(`/v1/coins/${coinId}`) ? coin : { coins: [coin] }
              )
        )
      })
    )
    const user = userEvent.setup()
    const router = renderArchiveRoute()

    await user.click(await screen.findByRole("link", { name: "First coin" }))

    expect(
      await screen.findByRole("heading", { name: "First coin" })
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe(`/coins/${coinId}`)
  })

  it("does not show pending feedback when Coin detail resolves quickly", async () => {
    const detailResponse = createDeferred<Response>()
    const detailRequested = createDeferred<void>()
    const fetchMock = vi.fn((input: string | URL | Request) => {
      const url = String(input)

      if (url.endsWith(`/v1/coins/${coinId}`)) {
        detailRequested.resolve()
        return detailResponse.promise
      }

      return Promise.resolve(
        url.endsWith("/v1/issuers")
          ? jsonResponse({ issuers })
          : jsonResponse({ coins: [coin] })
      )
    })
    vi.stubGlobal("fetch", fetchMock)
    renderArchiveRoute()
    const coinLink = await screen.findByRole("link", { name: "First coin" })
    vi.useFakeTimers()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    const navigation = user.click(coinLink)
    await detailRequested.promise
    await act(() => vi.advanceTimersByTimeAsync(100))

    expect(screen.queryByText("Loading coin…")).not.toBeInTheDocument()

    detailResponse.resolve(jsonResponse(coin))
    await act(() => vi.advanceTimersByTimeAsync(500))
    await navigation
    expect(
      screen.getByRole("heading", { name: "First coin" })
    ).toBeVisible()
    expect(screen.queryByText("Loading coin…")).not.toBeInTheDocument()
  })

  it("shows pending feedback when Coin detail remains slow", async () => {
    const detailResponse = createDeferred<Response>()
    const detailRequested = createDeferred<void>()
    vi.stubGlobal(
      "fetch",
      vi.fn((input: string | URL | Request) => {
        const url = String(input)

        if (url.endsWith(`/v1/coins/${coinId}`)) {
          detailRequested.resolve()
          return detailResponse.promise
        }

        return Promise.resolve(
          url.endsWith("/v1/issuers")
            ? jsonResponse({ issuers })
            : jsonResponse({ coins: [coin] })
        )
      })
    )
    renderArchiveRoute()
    const coinLink = await screen.findByRole("link", { name: "First coin" })
    vi.useFakeTimers()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    const navigation = user.click(coinLink)
    await detailRequested.promise
    await act(() => vi.advanceTimersByTimeAsync(201))

    expect(screen.getByText("Loading coin…")).toBeVisible()

    detailResponse.resolve(jsonResponse(coin))
    await act(() => vi.advanceTimersByTimeAsync(500))
    await navigation
    expect(
      screen.getByRole("heading", { name: "First coin" })
    ).toBeVisible()
  })

  it("preloads Coin detail on intent and reuses it during navigation", async () => {
    const detailResponse = createDeferred<Response>()
    const detailRequested = createDeferred<void>()
    const fetchMock = vi.fn((input: string | URL | Request) => {
      const url = String(input)

      if (url.endsWith(`/v1/coins/${coinId}`)) {
        detailRequested.resolve()
        return detailResponse.promise
      }

      return Promise.resolve(
        url.endsWith("/v1/issuers")
          ? jsonResponse({ issuers })
          : jsonResponse({ coins: [coin] })
      )
    })
    vi.stubGlobal("fetch", fetchMock)
    const user = userEvent.setup()
    const router = renderArchiveRoute()
    const coinLink = await screen.findByRole("link", { name: "First coin" })

    await user.hover(coinLink)
    await detailRequested.promise
    detailResponse.resolve(jsonResponse(coin))
    await waitFor(() =>
      expect(
        router.options.context.queryClient.getQueryState([
          "coins",
          "detail",
          coinId,
        ])?.status
      ).toBe("success")
    )

    await user.click(coinLink)

    expect(
      await screen.findByRole("heading", { name: "First coin" })
    ).toBeVisible()
    expect(screen.queryByText("Loading coin…")).not.toBeInTheDocument()
    expect(
      fetchMock.mock.calls.filter(([input]) =>
        String(input).endsWith(`/v1/coins/${coinId}`)
      )
    ).toHaveLength(1)
  })

  it("enables view transitions for router navigations", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {}))
    )

    const router = renderArchiveRoute()

    expect(router.options.defaultViewTransition).toBe(true)
  })
})
