import { createFileRoute } from "@tanstack/react-router"
import type { ErrorComponentProps } from "@tanstack/react-router"
import { Header } from "@/components/header"
import { RouteMessage } from "@/components/route-message"
import { InvalidCoinListResponseError } from "@/features/coin-viewer/api-client"
import { coinListQueryOptions } from "@/features/coin-viewer/queries"
import { Explore } from "@/features/explore/explore"

export const Route = createFileRoute("/")({
  component: App,
  errorComponent: CoinListError,
  loader: async ({ context }) => {
    await context.queryClient.query(coinListQueryOptions())
  },
  pendingComponent: () => <RouteMessage>Loading coins…</RouteMessage>,
  pendingMs: 0,
})

function App() {
  return (
    <>
      <Header />
      <main className="mt-18 mb-14">
        <Explore />
      </main>
    </>
  )
}

function CoinListError({ error }: ErrorComponentProps) {
  return (
    <RouteMessage>
      {error instanceof InvalidCoinListResponseError
        ? "Invalid coin list response"
        : "Unable to load coins"}
    </RouteMessage>
  )
}
