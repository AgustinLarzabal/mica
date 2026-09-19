import { useSuspenseQuery } from "@tanstack/react-query"

import { ExploreGrid } from "./components/explore-grid"
import { RouteMessage } from "@/components/route-message"
import { coinCatalogQueryOptions } from "@/features/coin/queries"

export function Explore() {
  const { data } = useSuspenseQuery(coinCatalogQueryOptions())

  if (data.coins.length === 0) {
    return <RouteMessage>No coins have been catalogued yet</RouteMessage>
  }

  return <ExploreGrid coins={data.coins} />
}
