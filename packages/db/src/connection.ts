import { sql } from "drizzle-orm"
import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"

import * as schema from "./schema.js"

export interface Database {
  checkReadiness: () => Promise<void>
  close: () => Promise<void>
  orm: ReturnType<typeof drizzle<typeof schema>>
}

export interface DatabaseOptions {
  onPoolError?: (error: Error) => void
}

export function createDatabase(
  databaseUrl: string,
  options: DatabaseOptions = {}
): Database {
  const pool = new Pool({ connectionString: databaseUrl })
  pool.on("error", options.onPoolError ?? ((error) => console.error(error)))
  const orm = drizzle({ client: pool, schema })

  return {
    async checkReadiness() {
      await orm.execute(sql`select 1`)
    },
    close: () => pool.end(),
    orm,
  }
}
