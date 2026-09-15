import { useQuery } from "@tanstack/react-query"

import {
  DatabaseUnavailableError,
  getApiHealth,
  getDatabaseReadiness,
} from "./api-client"

export function SystemStatus() {
  const health = useQuery({
    queryKey: ["system-status", "health"],
    queryFn: getApiHealth,
    retry: false,
  })
  const readiness = useQuery({
    queryKey: ["system-status", "readiness"],
    queryFn: getDatabaseReadiness,
    retry: false,
  })

  return (
    <section aria-labelledby="system-status-heading" className="space-y-8">
      <div className="space-y-2">
        <p className="font-mono text-xs tracking-widest text-muted uppercase">
          Diagnostics
        </p>
        <h1 id="system-status-heading" className="text-3xl font-semibold">
          System status
        </h1>
        <p className="max-w-xl text-muted">
          Live checks for the application infrastructure. These diagnostics are
          separate from the coin archive.
        </p>
      </div>
      <dl className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border bg-card p-5">
          <dt className="font-mono text-sm text-muted">API process</dt>
          <dd className="mt-3 text-lg font-medium" aria-live="polite">
            {health.isPending
              ? "Checking API availability…"
              : health.isSuccess
                ? "API operational"
                : "API unavailable"}
          </dd>
        </div>
        <div className="rounded-lg border bg-card p-5">
          <dt className="font-mono text-sm text-muted">PostgreSQL</dt>
          <dd className="mt-3 text-lg font-medium" aria-live="polite">
            {health.isError
              ? "Database status unknown because the API is unavailable"
              : readiness.isPending
                ? "Checking database readiness…"
                : readiness.isSuccess
                  ? "Database ready"
                  : readiness.error instanceof DatabaseUnavailableError
                    ? "Database unavailable"
                    : "Database status unknown because the readiness check failed"}
          </dd>
        </div>
      </dl>
    </section>
  )
}
