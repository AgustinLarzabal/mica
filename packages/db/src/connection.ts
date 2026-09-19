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

export type Coin = schema.Coin

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
      const coin = await orm.query.coins.findFirst({
        where: eq(schema.coins.id, coinId),
      })
      return coin ?? null
    },
    listCoins: () =>
      orm.query.coins.findMany({
        orderBy: [desc(schema.coins.createdAt), asc(schema.coins.id)],
      }),
    orm,
    schema,
  }
}
