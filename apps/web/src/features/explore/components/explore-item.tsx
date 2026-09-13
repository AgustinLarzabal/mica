import { Link } from "@tanstack/react-router"
import { cn } from "@workspace/ui/lib/utils"
import type { ComponentProps } from "react"

type ExploreItemProps = Omit<ComponentProps<"a">, "href"> & {
  itemId: string
}

export function ExploreItem({
  className,
  children,
  itemId,
  ...props
}: ExploreItemProps) {
  return (
    <Link
      to="/items/$itemId"
      params={{ itemId }}
      className={cn(
        "aspect-square animate-fade-in border-r border-b max-md:nth-[2n]:border-r-0 md:max-lg:nth-[3n]:border-r-0 lg:max-xl:nth-[4n]:border-r-0 xl:nth-[5n]:border-r-0",

        className
      )}
      {...props}
    >
      {children}
    </Link>
  )
}
