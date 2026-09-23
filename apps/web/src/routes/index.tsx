import { createFileRoute } from "@tanstack/react-router"
import type { ErrorComponentProps } from "@tanstack/react-router"
import { Header } from "@/components/header"
import { RouteMessage } from "@/components/route-message"
import { InvalidCoinListResponseError } from "@/features/coin-viewer/api-client"
import {
  coinListQueryOptions,
  InvalidIssuerCodeError,
} from "@/features/coin-viewer/queries"
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
    await context.queryClient.query(coinListQueryOptions(issuerCode))
  },
  pendingComponent: () => <RouteMessage>Loading coins…</RouteMessage>,
  pendingMs: 0,
})

function App() {
  const { issuer: issuerCode } = Route.useSearch()

  return (
    <>
      <Header />
      <main className="mt-18 mb-14">
        <Explore issuerCode={issuerCode} />
      </main>
    </>
  )
}

function CoinListError({ error }: ErrorComponentProps) {
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
