import { Link } from "@tanstack/react-router"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"

export function CoinViewerHeader({ title }: { title: string }) {
  return (
    <header className="flex h-18 items-center border-b px-5 md:px-10">
      <Breadcrumb className="min-w-0">
        <BreadcrumbList className="flex-nowrap gap-2 font-mono text-xs tracking-widest text-muted uppercase">
          <BreadcrumbItem className="shrink-0">
            <BreadcrumbLink render={<Link to="/" />}>Archive</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="shrink-0">/</BreadcrumbSeparator>
          <BreadcrumbItem className="min-w-0">
            <BreadcrumbPage className="truncate">{title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  )
}
