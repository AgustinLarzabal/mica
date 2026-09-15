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
})
