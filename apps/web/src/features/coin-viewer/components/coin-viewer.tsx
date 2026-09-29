import { useSuspenseQuery } from "@tanstack/react-query"

import { CoinViewerHeader } from "./coin-viewer-header"
import { CoinViewerLayout } from "./coin-viewer-layout"
import { coinDetailQueryOptions } from "@/data/archive"

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
