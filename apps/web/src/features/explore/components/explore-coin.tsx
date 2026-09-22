import { Link } from "@tanstack/react-router"
import { cn } from "@workspace/ui/lib/utils"
import type { CoinResponse } from "@workspace/api"
import type { ComponentProps } from "react"

type ExploreCoinProps = Omit<ComponentProps<"a">, "children" | "href"> & {
  coin: CoinResponse
}

export function ExploreCoin({ className, coin, ...props }: ExploreCoinProps) {
  return (
    <Link
      to="/coins/$coinId"
      params={{ coinId: coin.id }}
      className={cn(
        "group relative flex aspect-square animate-fade-in flex-col items-center justify-center border-r border-b p-5 transition-colors hover:bg-sidebar max-md:nth-[2n]:border-r-0 md:max-lg:nth-[3n]:border-r-0 lg:max-xl:nth-[4n]:border-r-0 xl:nth-[5n]:border-r-0",
        className
      )}
      {...props}
    >
      <img src="/coin-placeholder.webp" className="w-1/2 grayscale" />
      <span className="absolute right-3 bottom-3 left-3 translate-y-1.5 text-center font-mono text-xs tracking-wider text-muted-foreground opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
        {coin.title}
      </span>
      {/* <span
        aria-hidden="true"
        className="font-mono text-xs break-all text-muted-foreground"
      >
        {coin.id}
      </span> */}
    </Link>
  )
}
