import { createFileRoute, notFound } from "@tanstack/react-router"
import type { ErrorComponentProps } from "@tanstack/react-router"

import {
  CoinNotFoundError,
  InvalidCoinResponseError,
} from "@/features/coin/api-client"
import { CoinDetail } from "@/features/coin/coin-detail"
import {
  coinDetailQueryOptions,
  InvalidCoinIdError,
  validateCoinId,
} from "@/features/coin/queries"

export const Route = createFileRoute("/coins/$coinId")({
  component: CoinDetailRoute,
  errorComponent: CoinDetailError,
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

function CoinDetailRoute() {
  const { coinId } = Route.useParams()
  return <CoinDetail coinId={coinId} />
}

function CoinDetailError({ error }: ErrorComponentProps) {
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
