import { Empty, EmptyHeader, EmptyTitle } from "@workspace/ui/components/empty"
import type { ReactNode } from "react"

export function RouteMessage({ children }: { children: ReactNode }) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>{children}</EmptyTitle>
      </EmptyHeader>
    </Empty>
  )
}
