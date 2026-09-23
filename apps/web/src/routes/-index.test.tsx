import { createMemoryHistory, RouterProvider } from "@tanstack/react-router"
import { render, screen } from "@testing-library/react"
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

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
    status,
  })
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
  it("requests the filtered Coin collection when opened with an Issuer Code", async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(jsonResponse({ coins: [coin] }))
    )
    vi.stubGlobal("fetch", fetchMock)

    const router = renderArchiveRoute("/?issuer=AR")

    expect(
      await screen.findByRole("link", { name: "First coin" })
    ).toBeVisible()
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      "http://localhost:3001/v1/coins?issuer=AR"
    )
    expect(router.state.location.searchStr).toBe("?issuer=AR")
  })

  it("keeps filtered and unfiltered Coin collections distinct", async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(jsonResponse({ coins: [coin] }))
    )
    vi.stubGlobal("fetch", fetchMock)
    const router = renderArchiveRoute("/?issuer=AR")
    await screen.findByRole("link", { name: "First coin" })

    await router.navigate({ to: "/", search: {} })

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "http://localhost:3001/v1/coins?issuer=AR"
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "http://localhost:3001/v1/coins"
    )
    expect(fetchMock).toHaveBeenCalledTimes(2)
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
      const fetchMock = vi.fn(() =>
        Promise.resolve(jsonResponse({ coins: [{ ...coin, issuer }] }))
      )
      vi.stubGlobal("fetch", fetchMock)

      renderArchiveRoute()

      const link = await screen.findByRole("link", { name: "First coin" })
      expect(link).toHaveAttribute("href", `/coins/${coinId}`)
      expect(screen.queryByText(coinId)).not.toBeInTheDocument()
      expect(screen.getByText(issuer.name)).toBeInTheDocument()
      expect(fetchMock).toHaveBeenCalledTimes(1)
    }
  )

  it("shows the empty archive message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(jsonResponse({ coins: [] })))
    )

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
      vi.fn(() => Promise.resolve(jsonResponse({ coins: [{ id: coinId }] })))
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

  it("navigates from a Coin tile to the Coin detail route", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: string | URL | Request) => {
        const url = String(input)
        return Promise.resolve(
          jsonResponse(
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
