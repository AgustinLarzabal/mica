import { createFileRoute } from "@tanstack/react-router"

import { Header } from "@/components/header"
import { SystemStatus } from "@/features/system-status/system-status"

export const Route = createFileRoute("/system-status")({
  component: SystemStatusRoute,
  head: () => ({ meta: [{ title: "System status | Mica" }] }),
})

function SystemStatusRoute() {
  return (
    <>
      <Header />
      <main className="mx-auto mt-18 mb-14 w-full max-w-3xl px-5 py-12 md:px-10">
        <SystemStatus />
      </main>
    </>
  )
}
