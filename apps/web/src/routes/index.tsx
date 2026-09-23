import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import type { ErrorComponentProps } from "@tanstack/react-router"
import { Header } from "@/components/header"
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
import { IssuerSelect } from "@/features/explore/components/issuer-select"
import { Explore } from "@/features/explore/explore"

export const Route = createFileRoute("/")({
  component: App,
  errorComponent: CoinListError,
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
    const coinQuery = coinListQueryOptions(issuerCode)
    await Promise.all([
      context.queryClient.query(coinQuery),
      context.queryClient.query(issuerListQueryOptions()),
    ])
  },
  pendingComponent: () => <RouteMessage>Loading coins…</RouteMessage>,
  pendingMs: 0,
})

function App() {
  const { issuer: issuerCode } = Route.useSearch()
  const { data } = useSuspenseQuery(issuerListQueryOptions())
  const selectedIssuer = data.issuers.find(
    (issuer) => issuer.code === issuerCode
  )

  return (
    <>
      <Header />
      <main className="mt-18 mb-14">
        <IssuerSelect
          issuerCode={selectedIssuer?.code}
          issuers={data.issuers}
        />
        {issuerCode && !selectedIssuer ? (
          <RouteMessage>Issuer not found</RouteMessage>
        ) : (
          <Explore issuerCode={issuerCode} issuerName={selectedIssuer?.name} />
        )}
      </main>
    </>
  )
}

function CoinListError({ error }: ErrorComponentProps) {
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
