import { QueryClient } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  coinDetailQueryOptions,
  InvalidCoinIdError,
  InvalidCoinListResponseError,
  InvalidCoinResponseError,
  InvalidIssuerCodeError,
  InvalidIssuerListResponseError,
} from "./archive"
import { Route as ExploreRoute } from "@/routes/_explore"
import { Route as ExploreIndexRoute } from "@/routes/_explore.index"
import { Route as CoinRoute } from "@/routes/coins.$coinId"
import { startInstance } from "@/start"

vi.mock("@tanstack/react-devtools", () => ({
  TanStackDevtools: () => null,
}))

const coinId = "00000000-0000-4000-8000-000000000001"

function coinResponse(issuer: { code: string; name: string; id?: string }) {
  return new Response(
    JSON.stringify({
      id: coinId,
      title: "First coin",
      issuer,
      createdAt: "2026-09-16T10:00:00.000Z",
      updatedAt: "2026-09-16T11:00:00.000Z",
    }),
    { headers: { "content-type": "application/json" } }
  )
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("Archive data module", () => {
  it.each([
    ["ISO", { name: "Argentina", code: "AR" }],
    ["Archive-defined", { name: "Roman Empire", code: "ROMAN" }],
  ])("accepts an %s Issuer Code", async (_category, issuer) => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(coinResponse(issuer)))
    )
    const queryClient = createQueryClient()

    await expect(
      queryClient.fetchQuery(coinDetailQueryOptions(coinId))
    ).resolves.toEqual(expect.objectContaining({ issuer }))
    queryClient.clear()
  })

  it("rejects an exposed Issuer UUID", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          coinResponse({
            id: "10000000-0000-4000-8000-000000000001",
            name: "Roman Empire",
            code: "ROMAN",
          })
        )
      )
    )
    const queryClient = createQueryClient()

    await expect(
      queryClient.fetchQuery(coinDetailQueryOptions(coinId))
    ).rejects.toBeInstanceOf(InvalidCoinResponseError)
    queryClient.clear()
  })

  it.each([
    {
      ErrorType: InvalidCoinIdError,
      route: CoinRoute,
      message: "Invalid coin identifier",
    },
    {
      ErrorType: InvalidCoinResponseError,
      route: CoinRoute,
      message: "Invalid coin response",
    },
    {
      ErrorType: InvalidCoinListResponseError,
      route: ExploreIndexRoute,
      message: "Invalid coin list response",
    },
    {
      ErrorType: InvalidIssuerListResponseError,
      route: ExploreRoute,
      message: "Invalid issuer list response",
    },
    {
      ErrorType: InvalidIssuerCodeError,
      route: ExploreRoute,
      message: "Invalid issuer code",
    },
  ])(
    "preserves '$message' after SSR serialization",
    async ({ ErrorType, route, message }) => {
      const original = new ErrorType(message, {
        cause: new Error("Internal response details"),
      })
      const { serializationAdapters: adapters } =
        await startInstance.getOptions()
      const adapter = adapters?.find((candidate) => candidate.test(original))
      if (!adapter) throw new Error("Missing error serialization adapter")

      const payload = JSON.stringify(adapter.toSerializable(original))
      const restored = adapter.fromSerializable(JSON.parse(payload))

      expect(restored).toBeInstanceOf(ErrorType)
      expect(restored).not.toBe(original)
      expect(restored.cause).toBeUndefined()
      expect(payload).not.toContain("Internal response details")
      expect(payload).not.toContain(original.stack)

      const ErrorComponent = route.options.errorComponent
      if (!ErrorComponent) throw new Error("Missing route error component")
      render(<ErrorComponent error={restored} reset={() => {}} />)
      expect(screen.getByText(message)).toBeInTheDocument()
    }
  )
})
