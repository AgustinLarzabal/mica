import { createFileRoute } from "@tanstack/react-router"
import { Explore } from "@/features/explore"

export const Route = createFileRoute("/")({ component: App })

function App() {
  return (
    <main className="mt-18 mb-14">
      <Explore />
    </main>
  )
}
