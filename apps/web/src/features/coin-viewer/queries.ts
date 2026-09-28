import { queryOptions } from "@tanstack/react-query"
import { coinIdSchema, issuerCodeSchema } from "@workspace/api"

import { getCoin, getCoins, getIssuers } from "./api-client"
import type { QueryClient } from "@tanstack/react-query"
import type { CoinListResponse } from "@workspace/api"

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

function coinDetailQueryKey(coinId: string) {
  const validCoinId = validateCoinId(coinId)

  return ["coins", "detail", validCoinId] as const
}

export function primeCoinDetailQueries(
  queryClient: QueryClient,
  coinList: CoinListResponse,
  updatedAt: number
) {
  for (const coin of coinList.coins) {
    queryClient.setQueryData(coinDetailQueryKey(coin.id), coin, { updatedAt })
  }
}

export function coinDetailQueryOptions(coinId: string) {
  const queryKey = coinDetailQueryKey(coinId)

  return queryOptions({
    queryKey,
    queryFn: () => getCoin(queryKey[2]),
    staleTime: 30_000,
  })
}
