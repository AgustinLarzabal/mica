import { readFile } from "node:fs/promises"

import { z } from "zod"

import { coins, coinSeedRecordSchema } from "./schema/index.js"
import type { Database } from "./connection.js"

const seedDocumentSchema = z.object({
  coins: z.array(coinSeedRecordSchema),
})

export type CoinSeedDocument = z.infer<typeof seedDocumentSchema>

export async function seedCoins(database: Database, input: unknown) {
  const document = seedDocumentSchema.parse(input)

  await database.orm.transaction(async (transaction) => {
    await transaction.insert(coins).values(document.coins)
  })
}

export async function readCoinSeed(
  path = new URL("../seed/coins.json", import.meta.url)
) {
  return JSON.parse(await readFile(path, "utf8")) as unknown
}
