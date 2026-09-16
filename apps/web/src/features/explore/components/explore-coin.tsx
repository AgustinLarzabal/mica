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
        "flex aspect-square animate-fade-in flex-col justify-between border-r border-b p-5 max-md:nth-[2n]:border-r-0 md:max-lg:nth-[3n]:border-r-0 lg:max-xl:nth-[4n]:border-r-0 xl:nth-[5n]:border-r-0",
        className
      )}
      {...props}
    >
      <span className="font-mono text-base">{coin.title}</span>
      <span
        aria-hidden="true"
        className="font-mono text-xs break-all text-muted-foreground"
      >
        {coin.id}
      </span>
    </Link>
  )
}
