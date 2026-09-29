import { queryOptions } from "@tanstack/react-query"
import { issuerListResponseSchema } from "@workspace/api"
import type { IssuerListResponse } from "@workspace/api"

import { API_BASE_URL } from "@/config"

export class InvalidIssuerListResponseError extends Error {}
class IssuerListRequestError extends Error {}

async function getIssuers(): Promise<IssuerListResponse> {
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

export function issuerListQueryOptions() {
  return queryOptions({
    queryKey: ["issuers", "list"] as const,
    queryFn: getIssuers,
    staleTime: Infinity,
  })
}
