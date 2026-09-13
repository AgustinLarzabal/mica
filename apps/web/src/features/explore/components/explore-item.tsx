import { cn } from "@workspace/ui/lib/utils"
import type { ComponentProps } from "react"

type ExploreItemProps = ComponentProps<"div">

export function ExploreItem({
  className,
  children,
  ...props
}: ExploreItemProps) {
  return (
    <div
      className={cn(
        "aspect-square animate-fade-in border-r border-b max-md:nth-[2n]:border-r-0 md:max-lg:nth-[3n]:border-r-0 lg:max-xl:nth-[4n]:border-r-0 xl:nth-[5n]:border-r-0",

        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
