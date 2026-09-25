import { queryOptions } from "@tanstack/react-query"
import { coinIdSchema, issuerCodeSchema } from "@workspace/api"

import { getCoin, getCoins, getIssuers } from "./api-client"

export class InvalidCoinIdError extends Error {}
export class InvalidIssuerCodeError extends Error {}

export function coinListQueryOptions(issuerCode?: string) {
  if (
    issuerCode !== undefined &&
    !issuerCodeSchema.safeParse(issuerCode).success
  ) {
    throw new InvalidIssuerCodeError("Invalid issuer code")
  }

  return queryOptions({
    queryKey: ["coins", "list", issuerCode ?? null] as const,
    queryFn: () => getCoins(issuerCode),
    staleTime: 30_000,
  })
}

export function issuerListQueryOptions() {
  return queryOptions({
    queryKey: ["issuers", "list"] as const,
    queryFn: getIssuers,
    staleTime: Infinity,
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
