import { createFileRoute, notFound } from "@tanstack/react-router"
import type { ErrorComponentProps } from "@tanstack/react-router"

import {
  CoinNotFoundError,
  InvalidCoinResponseError,
} from "@/features/coin/api-client"
import { CoinViewer } from "@/features/coin/components/coin-viewer"
import {
  coinDetailQueryOptions,
  InvalidCoinIdError,
  validateCoinId,
} from "@/features/coin/queries"

export const Route = createFileRoute("/coins/$coinId")({
  component: CoinViewerRoute,
  errorComponent: CoinViewerError,
  loader: async ({ context, params }) => {
    const coinId = validateCoinId(params.coinId)
    try {
      await context.queryClient.query(coinDetailQueryOptions(coinId))
    } catch (error) {
      if (error instanceof CoinNotFoundError) {
        throw notFound()
      }
      throw error
    }
  },
  notFoundComponent: () => <RouteMessage>Coin not found</RouteMessage>,
  pendingComponent: () => <RouteMessage>Loading coin…</RouteMessage>,
  pendingMs: 0,
})

function CoinViewerRoute() {
  const { coinId } = Route.useParams()
  return <CoinViewer coinId={coinId} />
}

function CoinViewerError({ error }: ErrorComponentProps) {
  if (error instanceof InvalidCoinIdError) {
    return <RouteMessage>Invalid coin identifier</RouteMessage>
  }
  if (error instanceof InvalidCoinResponseError) {
    return <RouteMessage>Invalid coin response</RouteMessage>
  }

  return <RouteMessage>Unable to load coin</RouteMessage>
}

function RouteMessage({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <p role="status">{children}</p>
    </main>
  )
}
