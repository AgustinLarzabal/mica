import { useSuspenseQuery } from "@tanstack/react-query"

import { coinDetailQueryOptions } from "../queries"
import { CoinViewerHeader } from "./coin-viewer-header"
import { CoinViewerLayout } from "./coin-viewer-layout"

export function CoinViewer({ coinId }: { coinId: string }) {
  const { data: coin } = useSuspenseQuery(coinDetailQueryOptions(coinId))

  return (
    <>
      <CoinViewerHeader title={coin.title} />
      <main className="flex flex-1">
        <CoinViewerLayout coin={coin} />
      </main>
    </>
  )
}
