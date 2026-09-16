import { ExploreCoin } from "./explore-coin"
import type { CoinResponse } from "@workspace/api"

export function ExploreGrid({ coins }: { coins: Array<CoinResponse> }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {coins.map((coin, index) => (
        <ExploreCoin
          key={coin.id}
          coin={coin}
          style={{ animationDelay: `${index * 60}ms` }}
        />
      ))}
    </div>
  )
}
