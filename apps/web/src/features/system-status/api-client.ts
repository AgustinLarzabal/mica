import {
  operationalOkResponseSchema,
  operationalUnavailableResponseSchema,
} from "@workspace/api"

import { API_BASE_URL } from "@/config"

export class DatabaseUnavailableError extends Error {}
export class InvalidStatusResponseError extends Error {}

async function requestStatus(path: "/health" | "/ready") {
  const response = await fetch(`${API_BASE_URL}${path}`)

  if (!response.ok) {
    if (path === "/ready" && response.status === 503) {
      try {
        operationalUnavailableResponseSchema.parse(await response.json())
      } catch (error) {
        throw new InvalidStatusResponseError("Status response is invalid", {
          cause: error,
        })
      }

      throw new DatabaseUnavailableError("PostgreSQL is not ready")
    }

    throw new Error(`Status request failed with HTTP ${response.status}`)
  }

  try {
    return operationalOkResponseSchema.parse(await response.json())
  } catch (error) {
    throw new InvalidStatusResponseError("Status response is invalid", {
      cause: error,
    })
  }
}

export function getApiHealth() {
  return requestStatus("/health")
}

export function getDatabaseReadiness() {
  return requestStatus("/ready")
}
