import { sql } from "drizzle-orm"
import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"

import * as schema from "./schema.js"

export interface Database {
  checkReadiness: () => Promise<void>
  close: () => Promise<void>
  orm: ReturnType<typeof drizzle<typeof schema>>
}

export function createDatabase(databaseUrl: string): Database {
  const pool = new Pool({ connectionString: databaseUrl })
  const orm = drizzle({ client: pool, schema })

  return {
    async checkReadiness() {
      await orm.execute(sql`select 1`)
    },
    close: () => pool.end(),
    orm,
  }
}
