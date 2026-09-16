import { createFileRoute, Link, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/coins")({
  component: CoinLayout,
})

function CoinLayout() {
  return (
    <>
      <header className="flex h-18 items-center border-b px-5 md:px-10">
        <nav aria-label="Breadcrumb" className="font-mono text-xs uppercase">
          <Link to="/">Archive</Link> / Coins
        </nav>
      </header>
      <Outlet />
    </>
  )
}
