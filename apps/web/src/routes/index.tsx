import { createFileRoute } from "@tanstack/react-router"
import { Header } from "@/components/header"
import { Explore } from "@/features/explore/explore"

export const Route = createFileRoute("/")({ component: App })

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
