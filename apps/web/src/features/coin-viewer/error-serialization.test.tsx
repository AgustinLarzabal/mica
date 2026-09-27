import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import {
  InvalidCoinListResponseError,
  InvalidCoinResponseError,
  InvalidIssuerListResponseError,
} from "./api-client"
import { InvalidCoinIdError, InvalidIssuerCodeError } from "./queries"
import { Route as ExploreRoute } from "@/routes/_explore"
import { Route as ExploreIndexRoute } from "@/routes/_explore.index"
import { Route as CoinRoute } from "@/routes/coins.$coinId"
import { startInstance } from "@/start"

vi.mock("@tanstack/react-devtools", () => ({
  TanStackDevtools: () => null,
}))

describe("Coin errors across the SSR serialization boundary", () => {
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
    "preserves '$message' after transfer",
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
