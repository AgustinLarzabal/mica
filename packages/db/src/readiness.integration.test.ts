import { sql } from "drizzle-orm"
import { describe, expect, it } from "vitest"

import { createDatabase } from "./index.js"

describe("PostgreSQL readiness", () => {
  it("succeeds through the real Drizzle and node-postgres boundary", async () => {
    const databaseUrl = process.env.DATABASE_URL
    expect(databaseUrl).toBeTruthy()

    const database = createDatabase(databaseUrl ?? "")
    try {
      await expect(database.checkReadiness()).resolves.toBeUndefined()
    } finally {
      await database.close()
    }
  })

  it("cancels statements that exceed the configured timeout", async () => {
    const databaseUrl = process.env.DATABASE_URL
    expect(databaseUrl).toBeTruthy()

    const database = createDatabase(databaseUrl ?? "", {
      statementTimeoutMillis: 25,
    })
    try {
      await expect(
        database.orm.execute(sql`select pg_sleep(0.25)`)
      ).rejects.toMatchObject({
        cause: {
          code: "57014",
          message: "canceling statement due to statement timeout",
        },
      })
    } finally {
      await database.close()
    }
  })
})
