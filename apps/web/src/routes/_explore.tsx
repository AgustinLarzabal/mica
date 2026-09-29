import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Outlet } from "@tanstack/react-router"
import type { ErrorComponentProps } from "@tanstack/react-router"

import { RouteMessage } from "@/components/route-message"
import {
  coinListQueryOptions,
  InvalidIssuerCodeError,
  InvalidIssuerListResponseError,
  issuerListQueryOptions,
} from "@/data/archive"
import { ExploreFilters } from "@/features/explore/components/explore-filters"

export const Route = createFileRoute("/_explore")({
  component: ExploreLayout,
  errorComponent: ExploreLayoutError,
  validateSearch: (search): { issuer?: string } => ({
    issuer:
      search.issuer === undefined
        ? undefined
        : typeof search.issuer === "string"
          ? search.issuer
          : "",
  }),
  beforeLoad: ({ search: { issuer: issuerCode } }) => {
    coinListQueryOptions(issuerCode)
  },
  loader: async ({ context }) => {
    await context.queryClient.query(issuerListQueryOptions())
  },
  pendingComponent: () => <RouteMessage>Loading coins…</RouteMessage>,
})

function ExploreLayout() {
  const { issuer: issuerCode } = Route.useSearch()
  const { data: issuerList } = useSuspenseQuery(issuerListQueryOptions())

  return (
    <main className="mt-18 mb-14 flex flex-1 flex-col">
      <ExploreFilters issuerCode={issuerCode} issuers={issuerList.issuers} />
      <Outlet />
    </main>
  )
}

function ExploreLayoutError({ error }: ErrorComponentProps) {
  return (
    <RouteMessage>
      {error instanceof InvalidIssuerListResponseError
        ? "Invalid issuer list response"
        : error instanceof InvalidIssuerCodeError
          ? "Invalid issuer code"
          : "Unable to load coins"}
    </RouteMessage>
  )
}
