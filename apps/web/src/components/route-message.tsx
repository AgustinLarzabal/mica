import { Empty, EmptyTitle } from "@workspace/ui/components/empty"
import type { ReactNode } from "react"

export function RouteMessage({ children }: { children: ReactNode }) {
  return (
    <Empty>
      <EmptyTitle>{children}</EmptyTitle>
    </Empty>
  )
}
