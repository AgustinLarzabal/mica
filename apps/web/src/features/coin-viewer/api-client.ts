import {
  coinListResponseSchema,
  coinNotFoundErrorSchema,
  coinResponseSchema,
  issuerListResponseSchema,
} from "@workspace/api"
import type {
  CoinListResponse,
  CoinResponse,
  IssuerListResponse,
} from "@workspace/api"

import { API_BASE_URL } from "@/config"

export class CoinNotFoundError extends Error {}
export class InvalidCoinResponseError extends Error {}
export class CoinRequestError extends Error {}
export class InvalidCoinListResponseError extends Error {}
export class CoinListRequestError extends Error {}
export class InvalidIssuerListResponseError extends Error {}
export class IssuerListRequestError extends Error {}

export async function getIssuers(): Promise<IssuerListResponse> {
  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}/v1/issuers`)
  } catch (error) {
    throw new IssuerListRequestError("Issuer list request failed", {
      cause: error,
    })
  }

  if (!response.ok) {
    throw new IssuerListRequestError(
      `Issuer list request failed with HTTP ${response.status}`
    )
  }

  try {
    return issuerListResponseSchema.parse(await response.json())
  } catch (error) {
    throw new InvalidIssuerListResponseError(
      "Issuer list response is invalid",
      { cause: error }
    )
  }
}

export async function getCoins(issuerCode?: string): Promise<CoinListResponse> {
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

export async function getCoin(coinId: string): Promise<CoinResponse> {
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
