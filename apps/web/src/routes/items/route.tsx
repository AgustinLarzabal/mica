import { createFileRoute } from "@tanstack/react-router"
import { ExploreHeader } from "@/features/explore/components/explore-header"
import { ItemViewer } from "@/features/item/components/item-viewer"

export const Route = createFileRoute("/items")({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <>
      <ExploreHeader />
      <main className="flex flex-1">
        <ItemViewer />
      </main>
    </>
  )
}
