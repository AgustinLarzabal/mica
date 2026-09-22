import { Link } from "@tanstack/react-router"
import { Flag } from "@workspace/ui/components/flags/flag"
import { cn } from "@workspace/ui/lib/utils"
import type { CoinResponse } from "@workspace/api"
import type { ComponentProps } from "react"

type ExploreCoinProps = Omit<ComponentProps<"a">, "children" | "href"> & {
  coin: CoinResponse
}

function isIsoIssuerCode(code: string) {
  return /^[A-Z]{2}$/.test(code)
}

export function ExploreCoin({ className, coin, ...props }: ExploreCoinProps) {
  console.log("coin", coin)

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
      {isIsoIssuerCode(coin.issuer.code) ? (
        <span className="absolute inset-s-5 top-5 flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <Flag code={coin.issuer.code} width={16} decorative />
          {coin.issuer.name}
        </span>
      ) : (
        <span className="absolute inset-s-5 top-5 flex items-center gap-2 font-mono text-xs text-muted-foreground">
          {coin.issuer.name}
        </span>
      )}
      <img src="/coin-placeholder.webp" className="w-1/2 grayscale" />
      <span className="absolute right-3 bottom-3 left-3 h-[2lh] text-center font-mono text-xs tracking-wider text-muted-foreground">
        {coin.title}
      </span>
    </Link>
  )
}
