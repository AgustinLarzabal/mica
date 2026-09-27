import { ExploreCoin } from "./explore-coin"
import type { CoinResponse } from "@workspace/api"

const COIN_ANIMATION_STAGGER_MS = 60
const MAX_COIN_ANIMATION_DELAY_MS = 240

export function ExploreGrid({ coins }: { coins: Array<CoinResponse> }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {coins.map((coin, index) => (
        <ExploreCoin
          key={coin.id}
          coin={coin}
          style={{
            animationDelay: `${Math.min(
              index * COIN_ANIMATION_STAGGER_MS,
              MAX_COIN_ANIMATION_DELAY_MS
            )}ms`,
          }}
        />
      ))}
    </div>
  )
}
