import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import type { ErrorComponentProps } from "@tanstack/react-router"

import { RouteMessage } from "@/components/route-message"
import {
  coinListQueryOptions,
  InvalidCoinListResponseError,
  InvalidIssuerCodeError,
  issuerListQueryOptions,
  primeCoinDetailQueries,
} from "@/data/archive"
import { Explore } from "@/features/explore/explore"

export const Route = createFileRoute("/_explore/")({
  component: ExploreRoute,
  errorComponent: ExploreError,
  loaderDeps: ({ search: { issuer: issuerCode } }) => ({ issuerCode }),
  loader: async ({ context, deps: { issuerCode } }) => {
    const listQuery = coinListQueryOptions(issuerCode)
    const coinList = await context.queryClient.query(listQuery)
    const listState = context.queryClient.getQueryState(listQuery.queryKey)

    if (listState?.status !== "success" || listState.dataUpdatedAt === 0) {
      throw new Error("Coin list query completed without a success timestamp")
    }

    primeCoinDetailQueries(
      context.queryClient,
      coinList,
      listState.dataUpdatedAt
    )
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
