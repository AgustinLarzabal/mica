import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Suspense } from "react"
import type { ErrorComponentProps } from "@tanstack/react-router"
import { RouteMessage } from "@/components/route-message"
import {
  InvalidCoinListResponseError,
  InvalidIssuerListResponseError,
} from "@/features/coin-viewer/api-client"
import {
  coinListQueryOptions,
  InvalidIssuerCodeError,
  issuerListQueryOptions,
} from "@/features/coin-viewer/queries"
import { ExploreFilters } from "@/features/explore/components/explore-filters"
import { Explore } from "@/features/explore/explore"

export const Route = createFileRoute("/")({
  component: App,
  errorComponent: ExploreError,
  validateSearch: (search): { issuer?: string } => ({
    issuer:
      search.issuer === undefined
        ? undefined
        : typeof search.issuer === "string"
          ? search.issuer
          : "",
  }),
  loaderDeps: ({ search: { issuer: issuerCode } }) => ({ issuerCode }),
  loader: async ({ context, deps: { issuerCode } }) => {
    const coinListOptions = coinListQueryOptions(issuerCode)

    void context.queryClient.prefetchQuery(coinListOptions)
    await context.queryClient.ensureQueryData(issuerListQueryOptions())
  },
  pendingComponent: () => <RouteMessage>Loading coins…</RouteMessage>,
  pendingMs: 0,
})

function App() {
  const { issuer: issuerCode } = Route.useSearch()
  const { data: issuerList } = useSuspenseQuery(issuerListQueryOptions())
  const selectedIssuer = issuerList.issuers.find(
    (issuer) => issuer.code === issuerCode
  )

  return (
    <main className="mt-18 mb-14 flex flex-1 flex-col">
      <ExploreFilters issuerCode={issuerCode} issuers={issuerList.issuers} />
      <Suspense fallback={<RouteMessage>Loading coins…</RouteMessage>}>
        {issuerCode && !selectedIssuer ? (
          <RouteMessage>Issuer not found</RouteMessage>
        ) : (
          <Explore issuer={selectedIssuer} />
        )}
      </Suspense>
    </main>
  )
}

function ExploreError({ error }: ErrorComponentProps) {
  return (
    <RouteMessage>
      {error instanceof InvalidCoinListResponseError
        ? "Invalid coin list response"
        : error instanceof InvalidIssuerListResponseError
          ? "Invalid issuer list response"
          : error instanceof InvalidIssuerCodeError
            ? "Invalid issuer code"
            : "Unable to load coins"}
    </RouteMessage>
  )
}
