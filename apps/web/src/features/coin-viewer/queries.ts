import { queryOptions } from "@tanstack/react-query"
import { coinIdSchema } from "@workspace/api"

import { getCoin, getCoins } from "./api-client"

export class InvalidCoinIdError extends Error {}

export function coinListQueryOptions() {
  return queryOptions({
    queryKey: ["coins", "list"] as const,
    queryFn: getCoins,
    staleTime: 30_000,
  })
}

export function validateCoinId(coinId: string) {
  if (!coinIdSchema.safeParse(coinId).success) {
    throw new InvalidCoinIdError("Invalid coin identifier")
  }

  return coinId
}

export function coinDetailQueryOptions(coinId: string) {
  const validCoinId = validateCoinId(coinId)

  return queryOptions({
    queryKey: ["coins", "detail", validCoinId] as const,
    queryFn: () => getCoin(validCoinId),
    staleTime: 30_000,
  })
}
