import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/items/$itemId")({
  component: RouteComponent,
})

function RouteComponent() {
  return <main className="mt-18 mb-14">Hello "/items/$itemId"!</main>
}
