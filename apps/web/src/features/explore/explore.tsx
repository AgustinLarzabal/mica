import { useSuspenseQuery } from "@tanstack/react-query"

import { ExploreGrid } from "./components/explore-grid"
import { coinCatalogQueryOptions } from "@/features/coin/queries"

export function Explore() {
  const { data } = useSuspenseQuery(coinCatalogQueryOptions())

  if (data.coins.length === 0) {
    return (
      <p role="status" className="p-8 text-center font-mono text-sm">
        No coins have been catalogued yet
      </p>
    )
  }

  return <ExploreGrid coins={data.coins} />
}
