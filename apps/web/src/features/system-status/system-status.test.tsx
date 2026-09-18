import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { SystemStatus } from "./system-status"

function renderSystemStatus() {
  const queryClient = new QueryClient()

  return render(
    <QueryClientProvider client={queryClient}>
      <SystemStatus />
    </QueryClientProvider>
  )
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

describe("System status", () => {
  it("shows both checks as pending while the API requests are loading", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {}))
    )

    renderSystemStatus()

    expect(screen.getByText("Checking API availability…")).toBeInTheDocument()
    expect(screen.getByText("Checking database readiness…")).toBeInTheDocument()
  })

  it("shows a fully healthy system", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation(() => Promise.resolve(jsonResponse({ status: "ok" })))
    vi.stubGlobal("fetch", fetchMock)

    renderSystemStatus()

    expect(await screen.findByText("API operational")).toBeInTheDocument()
    expect(await screen.findByText("Database ready")).toBeInTheDocument()
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(
      expect.arrayContaining([
        "http://localhost:3001/health",
        "http://localhost:3001/ready",
      ])
    )
  })

  it("shows that database status is unknown when the API is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")))

    renderSystemStatus()

    expect(await screen.findByText("API unavailable")).toBeInTheDocument()
    expect(
      screen.getByText("Database status unknown because the API is unavailable")
    ).toBeInTheDocument()
  })

  it("shows database unavailability separately from a reachable API", async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) =>
      Promise.resolve(
        String(input).endsWith("/ready")
          ? jsonResponse({ status: "unavailable" }, 503)
          : jsonResponse({ status: "ok" })
      )
    )
    vi.stubGlobal("fetch", fetchMock)

    renderSystemStatus()

    expect(await screen.findByText("API operational")).toBeInTheDocument()
    expect(await screen.findByText("Database unavailable")).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it("reports the API as unavailable when the health response is malformed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) =>
        Promise.resolve(
          String(input).endsWith("/health")
            ? jsonResponse({ status: "healthy" })
            : jsonResponse({ status: "ok" })
        )
      )
    )

    renderSystemStatus()

    expect(await screen.findByText("API unavailable")).toBeInTheDocument()
    expect(
      screen.getByText("Database status unknown because the API is unavailable")
    ).toBeInTheDocument()
    expect(screen.queryByText("API operational")).not.toBeInTheDocument()
  })

  it("reports an unknown database status when the readiness success response is malformed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) =>
        Promise.resolve(
          String(input).endsWith("/ready")
            ? jsonResponse({ status: "ready" })
            : jsonResponse({ status: "ok" })
        )
      )
    )

    renderSystemStatus()

    expect(await screen.findByText("API operational")).toBeInTheDocument()
    expect(
      await screen.findByText(
        "Database status unknown because the readiness check failed"
      )
    ).toBeInTheDocument()
    expect(screen.queryByText("Database ready")).not.toBeInTheDocument()
  })

  it("does not treat a malformed readiness 503 as database unavailability", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) =>
        Promise.resolve(
          String(input).endsWith("/ready")
            ? jsonResponse({ status: "down" }, 503)
            : jsonResponse({ status: "ok" })
        )
      )
    )

    renderSystemStatus()

    expect(await screen.findByText("API operational")).toBeInTheDocument()
    expect(
      await screen.findByText(
        "Database status unknown because the readiness check failed"
      )
    ).toBeInTheDocument()
    expect(screen.queryByText("Database unavailable")).not.toBeInTheDocument()
  })

  it("does not mislabel an unexpected readiness failure as a database outage", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) =>
        Promise.resolve(
          String(input).endsWith("/ready")
            ? jsonResponse({ error: "unexpected" }, 500)
            : jsonResponse({ status: "ok" })
        )
      )
    )

    renderSystemStatus()

    expect(await screen.findByText("API operational")).toBeInTheDocument()
    expect(
      await screen.findByText(
        "Database status unknown because the readiness check failed"
      )
    ).toBeInTheDocument()
    expect(screen.queryByText("Database unavailable")).not.toBeInTheDocument()
  })
})
