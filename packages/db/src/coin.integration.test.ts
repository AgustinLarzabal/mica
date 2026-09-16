import { sql } from "drizzle-orm"
import { drizzle } from "drizzle-orm/node-postgres"
import { migrate } from "drizzle-orm/node-postgres/migrator"
import { Pool } from "pg"
import { beforeEach, describe, expect, it } from "vitest"

import {
  coinRecordSchema,
  createDatabase,
  readCoinSeed,
  seedCoins,
} from "./index.js"

const SEEDED_COIN_ID = "00000000-0000-4000-8000-000000000001"

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL
  expect(databaseUrl).toBeTruthy()
  return databaseUrl ?? ""
}

beforeEach(async () => {
  const pool = new Pool({ connectionString: getDatabaseUrl() })
  try {
    await pool.query(
      "drop schema if exists drizzle cascade; drop schema public cascade; create schema public"
    )
    await migrate(drizzle(pool), { migrationsFolder: "drizzle" })
  } finally {
    await pool.end()
  }
})

describe("Coin persistence", () => {
  it("stores and looks up a Coin with database-owned identity and timestamps", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      const [inserted] = await database.orm
        .insert(database.schema.coins)
        .values({ title: "First coin" })
        .returning()

      expect(inserted).toMatchObject({
        title: "First coin",
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      })
      expect(coinRecordSchema.parse(inserted)).toEqual(inserted)
      expect(inserted.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
      )
      await expect(database.findCoinById(inserted.id)).resolves.toEqual(
        inserted
      )
      await expect(
        database.findCoinById("00000000-0000-4000-8000-000000000099")
      ).resolves.toBeNull()
    } finally {
      await database.close()
    }
  })

  it("uses timezone-aware, non-null timestamp columns and non-unique titles", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      await database.orm
        .insert(database.schema.coins)
        .values([{ title: "Shared title" }, { title: "Shared title" }])

      const result = await database.orm.execute<{
        column_name: string
        data_type: string
        is_nullable: string
      }>(sql`
        select column_name, data_type, is_nullable
        from information_schema.columns
        where table_name = 'coins'
          and column_name in ('created_at', 'updated_at')
        order by column_name
      `)

      expect(result.rows).toEqual([
        {
          column_name: "created_at",
          data_type: "timestamp with time zone",
          is_nullable: "NO",
        },
        {
          column_name: "updated_at",
          data_type: "timestamp with time zone",
          is_nullable: "NO",
        },
      ])
    } finally {
      await database.close()
    }
  })

  it.each([
    "",
    " ",
    " padded",
    "padded ",
    "\tpadded",
    "padded\t",
    "\n",
    "x".repeat(201),
  ])("rejects the invalid title %j at the database boundary", async (title) => {
    const database = createDatabase(getDatabaseUrl())
    try {
      await expect(
        database.orm.insert(database.schema.coins).values({ title })
      ).rejects.toThrow()
    } finally {
      await database.close()
    }
  })

  it("automatically advances the modification timestamp on changes", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      const [inserted] = await database.orm
        .insert(database.schema.coins)
        .values({ title: "Before" })
        .returning()
      await database.orm.execute(sql`
        update coins
        set title = 'After', updated_at = created_at
        where id = ${inserted.id}
      `)

      const updated = await database.findCoinById(inserted.id)
      expect(updated?.updatedAt.getTime()).toBeGreaterThan(
        inserted.updatedAt.getTime()
      )
    } finally {
      await database.close()
    }
  })
})

describe("Coin seed", () => {
  const validSeed = {
    coins: [{ id: SEEDED_COIN_ID, title: "First coin" }],
  }

  it("inserts the complete validated seed document", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      await seedCoins(database, await readCoinSeed())
      await expect(
        database.findCoinById(SEEDED_COIN_ID)
      ).resolves.toMatchObject({
        id: SEEDED_COIN_ID,
        title: "First coin",
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      })
    } finally {
      await database.close()
    }
  })

  it("validates the complete document before writing any records", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      await expect(
        seedCoins(database, {
          coins: [validSeed.coins[0], { id: "not-a-uuid", title: "Invalid" }],
        })
      ).rejects.toThrow()
      await expect(database.findCoinById(SEEDED_COIN_ID)).resolves.toBeNull()
    } finally {
      await database.close()
    }
  })

  it("rolls back all records when any insert fails", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      const duplicateId = "00000000-0000-4000-8000-000000000002"
      await database.orm
        .insert(database.schema.coins)
        .values({ id: duplicateId, title: "Existing" })

      await expect(
        seedCoins(database, {
          coins: [validSeed.coins[0], { id: duplicateId, title: "Duplicate" }],
        })
      ).rejects.toThrow()
      await expect(database.findCoinById(SEEDED_COIN_ID)).resolves.toBeNull()
    } finally {
      await database.close()
    }
  })

  it("rejects reseeding without changing the existing Coin", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      await seedCoins(database, validSeed)
      const before = await database.findCoinById(SEEDED_COIN_ID)

      await expect(seedCoins(database, validSeed)).rejects.toThrow()
      await expect(database.findCoinById(SEEDED_COIN_ID)).resolves.toEqual(
        before
      )
    } finally {
      await database.close()
    }
  })
})
