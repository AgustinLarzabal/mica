import { queryOptions } from "@tanstack/react-query"
import {
  coinIdSchema,
  coinListResponseSchema,
  coinNotFoundErrorSchema,
  coinResponseSchema,
  issuerCodeSchema,
} from "@workspace/api"
import type { QueryClient } from "@tanstack/react-query"
import type { CoinListResponse, CoinResponse } from "@workspace/api"

import { API_BASE_URL } from "@/config"

export class CoinNotFoundError extends Error {}
export class InvalidCoinResponseError extends Error {}
class CoinRequestError extends Error {}
export class InvalidCoinListResponseError extends Error {}
class CoinListRequestError extends Error {}
export class InvalidCoinIdError extends Error {}
export class InvalidIssuerCodeError extends Error {}

async function getCoins(issuerCode?: string): Promise<CoinListResponse> {
  let response: Response

  try {
    const search = new URLSearchParams()
    if (issuerCode !== undefined) {
      search.set("issuer", issuerCode)
    }
    const query = search.size === 0 ? "" : `?${search.toString()}`
    response = await fetch(`${API_BASE_URL}/v1/coins${query}`)
  } catch (error) {
    throw new CoinListRequestError("Coin list request failed", {
      cause: error,
    })
  }

  if (!response.ok) {
    throw new CoinListRequestError(
      `Coin list request failed with HTTP ${response.status}`
    )
  }

  try {
    return coinListResponseSchema.parse(await response.json())
  } catch (error) {
    throw new InvalidCoinListResponseError("Coin list response is invalid", {
      cause: error,
    })
  }
}

async function getCoin(coinId: string): Promise<CoinResponse> {
  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}/v1/coins/${coinId}`)
  } catch (error) {
    throw new CoinRequestError("Coin request failed", { cause: error })
  }

  if (response.status === 404) {
    try {
      coinNotFoundErrorSchema.parse(await response.json())
    } catch (error) {
      throw new InvalidCoinResponseError("Coin response is invalid", {
        cause: error,
      })
    }
    throw new CoinNotFoundError("Coin not found")
  }
  if (!response.ok) {
    throw new CoinRequestError(
      `Coin request failed with HTTP ${response.status}`
    )
  }

  try {
    return coinResponseSchema.parse(await response.json())
  } catch (error) {
    throw new InvalidCoinResponseError("Coin response is invalid", {
      cause: error,
    })
  }
}

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
