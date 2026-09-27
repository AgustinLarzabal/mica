import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import type { ErrorComponentProps } from "@tanstack/react-router"

import { RouteMessage } from "@/components/route-message"
import { InvalidCoinListResponseError } from "@/features/coin-viewer/api-client"
import {
  coinListQueryOptions,
  InvalidIssuerCodeError,
  issuerListQueryOptions,
} from "@/features/coin-viewer/queries"
import { Explore } from "@/features/explore/explore"

export const Route = createFileRoute("/_explore/")({
  component: ExploreRoute,
  errorComponent: ExploreError,
  loaderDeps: ({ search: { issuer: issuerCode } }) => ({ issuerCode }),
  loader: async ({ context, deps: { issuerCode } }) => {
    await context.queryClient.query(coinListQueryOptions(issuerCode))
  },
  pendingComponent: () => <RouteMessage>Loading coins…</RouteMessage>,
})

function ExploreRoute() {
  const { issuer: issuerCode } = Route.useSearch()
  const { data: issuerList } = useSuspenseQuery(issuerListQueryOptions())
  const selectedIssuer = issuerList.issuers.find(
    (issuer) => issuer.code === issuerCode
  )

  return issuerCode && !selectedIssuer ? (
    <RouteMessage>Issuer not found</RouteMessage>
  ) : (
    <Explore issuer={selectedIssuer} />
  )
}

function ExploreError({ error }: ErrorComponentProps) {
  return (
    <RouteMessage>
      {error instanceof InvalidCoinListResponseError
        ? "Invalid coin list response"
        : error instanceof InvalidIssuerCodeError
          ? "Invalid issuer code"
          : "Unable to load coins"}
    </RouteMessage>
  )
}
