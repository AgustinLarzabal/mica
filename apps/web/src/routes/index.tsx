import { createFileRoute } from "@tanstack/react-router"
import { Header } from "@/components/header"
import { ExploreGrid } from "@/features/explore/components/explore-grid"

export const Route = createFileRoute("/")({ component: App })

function App() {
  return (
    <>
      <Header />
      <main className="mt-18 mb-14">
        <ExploreGrid />
      </main>
    </>
  )
}
