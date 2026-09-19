import { createFileRoute } from "@tanstack/react-router"
import type { ErrorComponentProps } from "@tanstack/react-router"
import { Header } from "@/components/header"
import { RouteMessage } from "@/components/route-message"
import { InvalidCoinCatalogResponseError } from "@/features/coin-viewer/api-client"
import { coinCatalogQueryOptions } from "@/features/coin-viewer/queries"
import { Explore } from "@/features/explore/explore"

export const Route = createFileRoute("/")({
  component: App,
  errorComponent: CatalogError,
  loader: async ({ context }) => {
    await context.queryClient.query(coinCatalogQueryOptions())
  },
  pendingComponent: () => <RouteMessage>Loading coin catalog…</RouteMessage>,
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

function CatalogError({ error }: ErrorComponentProps) {
  return (
    <RouteMessage>
      {error instanceof InvalidCoinCatalogResponseError
        ? "Invalid coin catalog response"
        : "Unable to load coin catalog"}
    </RouteMessage>
  )
}
