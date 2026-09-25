import { createMemoryHistory, RouterProvider } from "@tanstack/react-router"
import { render, screen, waitFor } from "@testing-library/react"
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
  vi.unstubAllGlobals()
})

describe("Archive landing route", () => {
  it("loads Coins and Issuers concurrently and keeps loading until both are ready", async () => {
    let resolveCoins!: (response: Response) => void
    let resolveIssuers!: (response: Response) => void
    const coinsResponse = new Promise<Response>((resolve) => {
      resolveCoins = resolve
    })
    const issuersResponse = new Promise<Response>((resolve) => {
      resolveIssuers = resolve
    })
    const fetchMock = vi.fn((input: string | URL | Request) =>
      String(input).endsWith("/v1/issuers") ? issuersResponse : coinsResponse
    )
    vi.stubGlobal("fetch", fetchMock)

    const router = renderArchiveRoute("/?issuer=AR")

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/v1/coins?issuer=AR"
    )
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:3001/v1/issuers")
    expect(screen.getByText("Loading coins…")).toBeVisible()

    resolveCoins(jsonResponse({ coins: [coin] }))
    await Promise.resolve()
    expect(screen.getByText("Loading coins…")).toBeVisible()

    resolveIssuers(
      jsonResponse({ issuers: [{ name: "Argentina", code: "AR" }] })
    )
    expect(
      await screen.findByRole("link", { name: "First coin" })
    ).toBeVisible()
    expect(screen.getByRole("combobox", { name: "Issuer" })).toHaveValue("AR")
    expect(router.state.location.searchStr).toBe("?issuer=AR")
  })

  it("lists every Issuer in API order and navigates through URL state", async () => {
    const fetchMock = vi.fn(createArchiveFetch())
    vi.stubGlobal("fetch", fetchMock)
    const user = userEvent.setup()
    const router = renderArchiveRoute()
    const select = await screen.findByRole("combobox", { name: "Issuer" })

    expect(
      screen.getAllByRole("option").map((option) => option.textContent)
    ).toEqual(["All issuers", "Argentina", "Roman Empire", "Uruguay"])

    await user.selectOptions(select, "ROMAN")

    await waitFor(() =>
      expect(router.state.location.searchStr).toBe("?issuer=ROMAN")
    )
    expect(select).toHaveValue("ROMAN")
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/v1/coins?issuer=ROMAN"
    )

    await user.selectOptions(select, "")

    await waitFor(() => expect(router.state.location.searchStr).toBe(""))
    expect(select).toHaveValue("")

    router.history.back()
    await waitFor(() =>
      expect(router.state.location.searchStr).toBe("?issuer=ROMAN")
    )
    expect(select).toHaveValue("ROMAN")

    router.history.forward()
    await waitFor(() => expect(router.state.location.searchStr).toBe(""))
    expect(select).toHaveValue("")
  })

  it("places the Issuer select in the Explore filters navigation", async () => {
    vi.stubGlobal("fetch", vi.fn(createArchiveFetch()))

    renderArchiveRoute()

    const filters = await screen.findByRole("navigation")
    expect(filters).toContainElement(
      screen.getByRole("combobox", { name: "Issuer" })
    )
  })

  it("names a known selected Issuer when it has no Coins", async () => {
    vi.stubGlobal("fetch", vi.fn(createArchiveFetch([])))

    renderArchiveRoute("/?issuer=AR")

    expect(
      await screen.findByText("No coins found for Argentina")
    ).toBeVisible()
    expect(screen.getByRole("combobox", { name: "Issuer" })).toHaveValue("AR")
  })

  it("keeps the populated select available when the URL Issuer is unknown", async () => {
    vi.stubGlobal("fetch", vi.fn(createArchiveFetch([])))

    renderArchiveRoute("/?issuer=ZZ")

    expect(await screen.findByText("Issuer not found")).toBeVisible()
    expect(screen.getByRole("combobox", { name: "Issuer" })).toHaveValue("ZZ")
    expect(
      screen.getByRole("option", { name: "Unknown issuer (ZZ)" })
    ).toBeDisabled()
    expect(screen.getAllByRole("option")).toHaveLength(5)
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
        Promise.resolve(
          String(input).endsWith("/v1/issuers")
            ? jsonResponse({ issuers })
            : jsonResponse({ coins: [{ id: coinId }] })
        )
      )
    )

    renderArchiveRoute()

    expect(
      await screen.findByText("Invalid coin list response")
    ).toBeInTheDocument()
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

  it("enables view transitions for router navigations", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {}))
    )

    const router = renderArchiveRoute()

    expect(router.options.defaultViewTransition).toBe(true)
  })
})
