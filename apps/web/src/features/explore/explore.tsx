import { useSuspenseQuery } from "@tanstack/react-query"

import { ExploreGrid } from "./components/explore-grid"
import type { IssuerResponse } from "@workspace/api"
import { RouteMessage } from "@/components/route-message"
import { coinListQueryOptions } from "@/data/archive"

export function Explore({ issuer }: { issuer?: IssuerResponse }) {
  const { data } = useSuspenseQuery(coinListQueryOptions(issuer?.code))

  if (data.coins.length === 0) {
    return (
      <RouteMessage>
        {issuer
          ? `No coins found for ${issuer.name}`
          : "No coins have been added to the archive yet"}
      </RouteMessage>
    )
  }

  return <ExploreGrid coins={data.coins} />
}
