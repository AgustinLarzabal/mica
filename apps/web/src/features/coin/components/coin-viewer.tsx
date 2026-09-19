import { useSuspenseQuery } from "@tanstack/react-query"

import { coinDetailQueryOptions } from "../queries"
import { CoinViewerDetails } from "./coin-viewer-detailts"
import { CoinViewerPreview } from "./coin-viewer-preview"
import { CoinViewerTabs } from "./coin-viewer-tabs"

export function CoinViewer({ coinId }: { coinId: string }) {
  const { data: coin } = useSuspenseQuery(coinDetailQueryOptions(coinId))

  return (
    <>
      <CoinViewerTabs coin={coin} />
      <div className="hidden flex-1 animate-fade-in lg:flex">
        <CoinViewerPreview />
        <CoinViewerDetails coin={coin} />
      </div>
    </>
  )
}
