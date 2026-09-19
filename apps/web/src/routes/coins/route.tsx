import { createFileRoute, Outlet } from "@tanstack/react-router"
import { CoinViewerHeader } from "@/features/coin-viewer/components/coin-viewer-header"

export const Route = createFileRoute("/coins")({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <>
      <CoinViewerHeader />
      <main className="flex flex-1">
        <Outlet />
      </main>
    </>
  )
}
