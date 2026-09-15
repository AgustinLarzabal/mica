import { API_BASE_URL } from "@/config"

export class DatabaseUnavailableError extends Error {}

async function requestStatus(path: "/health" | "/ready") {
  const response = await fetch(`${API_BASE_URL}${path}`)

  if (!response.ok) {
    if (path === "/ready" && response.status === 503) {
      throw new DatabaseUnavailableError("PostgreSQL is not ready")
    }

    throw new Error(`Status request failed with HTTP ${response.status}`)
  }

  return (await response.json()) as { status: "ok" }
}

export function getApiHealth() {
  return requestStatus("/health")
}

export function getDatabaseReadiness() {
  return requestStatus("/ready")
}
