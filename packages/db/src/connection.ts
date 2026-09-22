import { asc, desc, eq, sql } from "drizzle-orm"
import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"

import * as schema from "./schema/index.js"

export interface Database {
  checkReadiness: () => Promise<void>
  close: () => Promise<void>
  findCoinById: (coinId: string) => Promise<Coin | null>
  listCoins: () => Promise<Array<Coin>>
  orm: ReturnType<typeof drizzle<typeof schema>>
  schema: typeof schema
}

export type Coin = schema.CoinRecord & { issuer: schema.IssuerRecord }

export interface DatabaseOptions {
  connectionTimeoutMillis?: number
  onPoolError?: (error: Error) => void
  statementTimeoutMillis?: number
}

export function createDatabase(
  databaseUrl: string,
  options: DatabaseOptions = {}
): Database {
  const pool = new Pool({
    connectionString: databaseUrl,
    connectionTimeoutMillis: options.connectionTimeoutMillis ?? 5_000,
    statement_timeout: options.statementTimeoutMillis ?? 10_000,
  })
  pool.on("error", options.onPoolError ?? ((error) => console.error(error)))
  const orm = drizzle({ client: pool, schema })

  return {
    async checkReadiness() {
      await orm.execute(sql`select 1`)
    },
    close: () => pool.end(),
    async findCoinById(coinId) {
      const rows = await orm
        .select({ coin: schema.coins, issuer: schema.issuers })
        .from(schema.coins)
        .innerJoin(schema.issuers, eq(schema.coins.issuerId, schema.issuers.id))
        .where(eq(schema.coins.id, coinId))
        .limit(1)
      const row = rows.at(0)
      return row ? { ...row.coin, issuer: row.issuer } : null
    },
    async listCoins() {
      const rows = await orm
        .select({ coin: schema.coins, issuer: schema.issuers })
        .from(schema.coins)
        .innerJoin(schema.issuers, eq(schema.coins.issuerId, schema.issuers.id))
        .orderBy(desc(schema.coins.createdAt), asc(schema.coins.id))
      return rows.map(({ coin, issuer }) => ({ ...coin, issuer }))
    },
    orm,
    schema,
  }
}
