import { createFileRoute } from "@tanstack/react-router"
import { ItemViewer } from "@/features/item/item-viewer"

export const Route = createFileRoute("/items/$itemId")({
  component: RouteComponent,
})

function RouteComponent() {
  return <ItemViewer />
}
