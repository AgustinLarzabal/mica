import { createMemoryHistory, RouterProvider } from "@tanstack/react-router"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { getRouter } from "@/router"

vi.mock("@tanstack/react-devtools", () => ({
  TanStackDevtools: () => null,
}))

const coinId = "00000000-0000-4000-8000-000000000001"

function renderCoinRoute(id = coinId) {
  const history = createMemoryHistory({ initialEntries: [`/coins/${id}`] })
  const router = getRouter({ history })
  render(<RouterProvider router={router} />)
  return router
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
    status,
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("Coin viewer route", () => {
  it("shows loading feedback while Coin data is pending", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {}))
    )

    renderCoinRoute()

    expect(await screen.findByText("Loading coin…")).toBeInTheDocument()
  })

  it("rejects an invalid route identifier without an HTTP request", async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)

    renderCoinRoute("not-a-uuid")

    expect(
      await screen.findByText("Invalid coin identifier")
    ).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("distinguishes a missing Coin", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          jsonResponse(
            { error: { code: "coin_not_found", message: "Coin not found" } },
            404
          )
        )
      )
    )

    const router = renderCoinRoute()

    expect(await screen.findByText("Coin not found")).toBeInTheDocument()
    expect(router.state.statusCode).toBe(404)
  })

  it.each([
    [
      "a JSON response with an unrelated error code",
      () =>
        jsonResponse(
          { error: { code: "not_found", message: "Coin not found" } },
          404
        ),
    ],
    ["an incomplete JSON response", () => jsonResponse({ error: {} }, 404)],
    ["a non-JSON response", () => new Response("Not found", { status: 404 })],
  ])("rejects %s", async (_description, createResponse) => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(createResponse()))
    )

    const router = renderCoinRoute()

    expect(await screen.findByText("Invalid coin response")).toBeInTheDocument()
    expect(screen.queryByText("Coin not found")).not.toBeInTheDocument()
    expect(router.state.statusCode).not.toBe(404)
  })

  it("distinguishes malformed success data", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(jsonResponse({ id: coinId })))
    )

    renderCoinRoute()

    expect(await screen.findByText("Invalid coin response")).toBeInTheDocument()
  })

  it("distinguishes network and server failures", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")))

    renderCoinRoute()

    expect(await screen.findByText("Unable to load coin")).toBeInTheDocument()
  })

  it("renders one responsive Coin viewer tree", async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          jsonResponse({
            id: coinId,
            title: "First coin",
            issuer: { name: "Argentina", code: "AR" },
            createdAt: "2026-09-16T10:00:00.000Z",
            updatedAt: "2026-09-16T10:00:00.000Z",
          })
        )
      )
    )

    renderCoinRoute()

    expect(
      await screen.findAllByRole("tab", { name: "Obverse", hidden: true })
    ).toHaveLength(1)

    await user.click(screen.getByRole("button", { name: "Details" }))

    expect(
      screen.getAllByRole("heading", { name: "First coin", hidden: true })
    ).toHaveLength(1)
  })

  it("switches between the mobile Coin viewer panels", async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          jsonResponse({
            id: coinId,
            title: "First coin",
            issuer: { name: "Argentina", code: "AR" },
            createdAt: "2026-09-16T10:00:00.000Z",
            updatedAt: "2026-09-16T10:00:00.000Z",
          })
        )
      )
    )

    renderCoinRoute()

    const previewToggle = await screen.findByRole("button", { name: "Preview" })
    const detailsToggle = screen.getByRole("button", { name: "Details" })

    expect(previewToggle).toHaveAttribute("aria-pressed", "true")
    expect(detailsToggle).toHaveAttribute("aria-pressed", "false")

    detailsToggle.focus()
    await user.keyboard("{Enter}")

    expect(previewToggle).toHaveAttribute("aria-pressed", "false")
    expect(detailsToggle).toHaveAttribute("aria-pressed", "true")

    previewToggle.focus()
    await user.keyboard(" ")

    expect(previewToggle).toHaveAttribute("aria-pressed", "true")
    expect(detailsToggle).toHaveAttribute("aria-pressed", "false")
  })

  it("renders persisted Coin data", async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        jsonResponse({
          id: coinId,
          title: "First coin",
          issuer: { name: "Argentina", code: "AR" },
          createdAt: "2026-09-16T10:00:00.000Z",
          updatedAt: "2026-09-16T10:00:00.000Z",
        })
      )
    )
    vi.stubGlobal("fetch", fetchMock)

    renderCoinRoute()

    expect(
      await screen.findByRole("heading", { name: "First coin" })
    ).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "First coin" })).toHaveAttribute(
      "aria-current",
      "page"
    )
    expect(screen.getByText("Argentina")).toBeInTheDocument()
    expect(screen.queryByText("Issuer")).not.toBeInTheDocument()
    const flag = screen.getByAltText("")
    expect(flag).toHaveAttribute("src", expect.stringMatching(/\/ar\.svg$/))
    expect(flag).toHaveAttribute("aria-hidden", "true")
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(
      `http://localhost:3001/v1/coins/${coinId}`
    )
  })

  it("renders an Archive-defined Issuer without a flag or visible Issuer Code", async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        jsonResponse({
          id: coinId,
          title: "Roman coin",
          issuer: { name: "Roman Empire", code: "ROMAN" },
          createdAt: "2026-09-16T10:00:00.000Z",
          updatedAt: "2026-09-16T10:00:00.000Z",
        })
      )
    )
    vi.stubGlobal("fetch", fetchMock)

    renderCoinRoute()

    expect(await screen.findByText("Roman Empire")).toBeInTheDocument()
    expect(screen.queryByText("ROMAN")).not.toBeInTheDocument()
    expect(screen.queryByAltText("")).not.toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
