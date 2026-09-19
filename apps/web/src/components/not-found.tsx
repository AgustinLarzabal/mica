import { Link } from "@tanstack/react-router"
import { Button } from "@workspace/ui/components/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/empty"

export function NotFound() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>404 - Page not found</EmptyTitle>
        <EmptyDescription>
          The page you&apos;re looking for doesn&apos;t exist.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button size="sm" render={<Link to="/" />}>
          Home
        </Button>
      </EmptyContent>
    </Empty>
  )
}
