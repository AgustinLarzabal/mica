import { createFileRoute, Outlet } from "@tanstack/react-router"
import { ItemHeader } from "@/features/item/components/item-header"

export const Route = createFileRoute("/items")({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <>
      <ItemHeader />
      <main className="flex flex-1">
        <Outlet />
      </main>
    </>
  )
}
