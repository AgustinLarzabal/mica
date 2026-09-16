import { useSuspenseQuery } from "@tanstack/react-query"

import { coinDetailQueryOptions } from "./queries"

function formatUtc(instant: string) {
  return `${instant.slice(0, 10)} ${instant.slice(11, 16)} UTC`
}

export function CoinDetail({ coinId }: { coinId: string }) {
  const { data: coin } = useSuspenseQuery(coinDetailQueryOptions(coinId))

  return (
    <main className="flex flex-1 items-start justify-center p-8">
      <article aria-labelledby="coin-title" className="w-full max-w-2xl">
        <h1 id="coin-title" className="font-mono text-2xl">
          {coin.title}
        </h1>
        <dl className="mt-4 space-y-2 font-mono text-sm text-muted-foreground">
          <div>
            <dt className="sr-only">Added</dt>
            <dd>Added {formatUtc(coin.createdAt)}</dd>
          </div>
          {coin.updatedAt !== coin.createdAt ? (
            <div>
              <dt className="sr-only">Updated</dt>
              <dd>Updated {formatUtc(coin.updatedAt)}</dd>
            </div>
          ) : null}
        </dl>
      </article>
    </main>
  )
}
