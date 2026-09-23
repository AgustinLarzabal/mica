import { useSuspenseQuery } from "@tanstack/react-query"

import { ExploreGrid } from "./components/explore-grid"
import { RouteMessage } from "@/components/route-message"
import { coinListQueryOptions } from "@/features/coin-viewer/queries"

export function Explore({ issuerCode }: { issuerCode?: string }) {
  const { data } = useSuspenseQuery(coinListQueryOptions(issuerCode))

  if (data.coins.length === 0) {
    return (
      <RouteMessage>No coins have been added to the archive yet</RouteMessage>
    )
  }

  return <ExploreGrid coins={data.coins} />
}
