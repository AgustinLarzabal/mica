import { createFileRoute } from "@tanstack/react-router"
import type { ErrorComponentProps } from "@tanstack/react-router"
import { Header } from "@/components/header"
import { InvalidCoinCatalogResponseError } from "@/features/coin/api-client"
import { coinCatalogQueryOptions } from "@/features/coin/queries"
import { Explore } from "@/features/explore/explore"

export const Route = createFileRoute("/")({
  component: App,
  errorComponent: CatalogError,
  loader: async ({ context }) => {
    await context.queryClient.query(coinCatalogQueryOptions())
  },
  pendingComponent: () => (
    <CatalogRouteMessage>Loading coin catalog…</CatalogRouteMessage>
  ),
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
    <CatalogRouteMessage>
      {error instanceof InvalidCoinCatalogResponseError
        ? "Invalid coin catalog response"
        : "Unable to load coin catalog"}
    </CatalogRouteMessage>
  )
}

function CatalogRouteMessage({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <p role="status">{children}</p>
    </main>
  )
}
