import { readFile } from "node:fs/promises"

import { z } from "zod"

import {
  coins,
  coinSeedRecordSchema,
  issuers,
  issuerSeedRecordSchema,
} from "./schema/index.js"
import type { Database } from "./connection.js"

const seedDocumentSchema = z
  .object({
    issuers: z.array(issuerSeedRecordSchema),
    coins: z.array(coinSeedRecordSchema),
  })
  .strict()

export type CoinSeedDocument = z.infer<typeof seedDocumentSchema>

export async function seedCoins(database: Database, input: unknown) {
  const document = seedDocumentSchema.parse(input)

  await database.orm.transaction(async (transaction) => {
    const insertedIssuers = await transaction
      .insert(issuers)
      .values(document.issuers)
      .returning({ id: issuers.id, code: issuers.code })
    const issuerIdsByCode = new Map(
      insertedIssuers.map((issuer) => [issuer.code, issuer.id])
    )

    await transaction.insert(coins).values(
      document.coins.map(({ issuerCode, ...coin }) => {
        const issuerId = issuerIdsByCode.get(issuerCode)
        if (!issuerId) {
          throw new Error(`Coin references unknown Issuer Code: ${issuerCode}`)
        }
        return { ...coin, issuerId }
      })
    )
  })
}

export async function readCoinSeed(
  path = new URL("../seed/coins.json", import.meta.url)
) {
  return JSON.parse(await readFile(path, "utf8")) as unknown
}
