import { afterEach, describe, expect, it, vi } from "vitest"

import { getCoin, InvalidCoinResponseError } from "./api-client"

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

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("Coin API client", () => {
  it.each([
    ["ISO", { name: "Argentina", code: "AR" }],
    ["Archive-defined", { name: "Roman Empire", code: "ROMAN" }],
  ])("accepts an %s Issuer Code", async (_category, issuer) => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(coinResponse(issuer)))
    )

    await expect(getCoin(coinId)).resolves.toEqual(
      expect.objectContaining({ issuer })
    )
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

    await expect(getCoin(coinId)).rejects.toBeInstanceOf(
      InvalidCoinResponseError
    )
  })
})
