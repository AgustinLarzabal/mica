import type { ReactNode } from "react"

export function RouteMessage({ children }: { children: ReactNode }) {
  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <p role="status">{children}</p>
    </main>
  )
}
