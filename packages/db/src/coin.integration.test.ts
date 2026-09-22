import { sql } from "drizzle-orm"
import { drizzle } from "drizzle-orm/node-postgres"
import { migrate } from "drizzle-orm/node-postgres/migrator"
import { Pool } from "pg"
import { beforeEach, describe, expect, it } from "vitest"

import {
  coinRecordSchema,
  createDatabase,
  issuerRecordSchema,
  readCoinSeed,
  seedCoins,
} from "./index.js"

const SEEDED_COIN_ID = "00000000-0000-4000-8000-000000000001"

async function insertArgentina(database: ReturnType<typeof createDatabase>) {
  const [issuer] = await database.orm
    .insert(database.schema.issuers)
    .values({ name: "Argentina", code: "AR" })
    .returning()
  return issuer
}

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
  it("lists Coins newest-first with UUID order as the deterministic tie-breaker", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      const issuer = await insertArgentina(database)
      const olderId = "00000000-0000-4000-8000-000000000003"
      const firstTiedId = "00000000-0000-4000-8000-000000000001"
      const secondTiedId = "00000000-0000-4000-8000-000000000002"

      await database.orm.insert(database.schema.coins).values([
        {
          id: olderId,
          title: "Older coin",
          issuerId: issuer.id,
          createdAt: new Date("2026-09-15T10:00:00.000Z"),
        },
        {
          id: secondTiedId,
          title: "Second tied coin",
          issuerId: issuer.id,
          createdAt: new Date("2026-09-16T10:00:00.000Z"),
        },
        {
          id: firstTiedId,
          title: "First tied coin",
          issuerId: issuer.id,
          createdAt: new Date("2026-09-16T10:00:00.000Z"),
        },
      ])

      await expect(database.listCoins()).resolves.toEqual([
        expect.objectContaining({ id: firstTiedId }),
        expect.objectContaining({ id: secondTiedId }),
        expect.objectContaining({ id: olderId }),
      ])
    } finally {
      await database.close()
    }
  })

  it("lists no Coins from an empty archive", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      await expect(database.listCoins()).resolves.toEqual([])
    } finally {
      await database.close()
    }
  })

  it("stores and looks up a Coin with database-owned identity and timestamps", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      const issuer = await insertArgentina(database)
      const [inserted] = await database.orm
        .insert(database.schema.coins)
        .values({ title: "First coin", issuerId: issuer.id })
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
      await expect(database.findCoinById(inserted.id)).resolves.toEqual({
        ...inserted,
        issuer,
      })
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
      const issuer = await insertArgentina(database)
      await database.orm.insert(database.schema.coins).values([
        { title: "Shared title", issuerId: issuer.id },
        { title: "Shared title", issuerId: issuer.id },
      ])

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
      const issuer = await insertArgentina(database)
      await expect(
        database.orm
          .insert(database.schema.coins)
          .values({ title, issuerId: issuer.id })
      ).rejects.toThrow()
    } finally {
      await database.close()
    }
  })

  it("automatically advances the modification timestamp on changes", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      const issuer = await insertArgentina(database)
      const [inserted] = await database.orm
        .insert(database.schema.coins)
        .values({ title: "Before", issuerId: issuer.id })
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

describe("Issuer persistence", () => {
  it("stores reusable Issuers with database-owned identity and timestamps", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      const argentina = await insertArgentina(database)
      const [duplicateName] = await database.orm
        .insert(database.schema.issuers)
        .values({ name: "Argentina", code: "ARG-HIST" })
        .returning()

      expect(issuerRecordSchema.parse(argentina)).toEqual(argentina)
      expect(argentina).toMatchObject({
        name: "Argentina",
        code: "AR",
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      })
      expect(argentina.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
      )
      expect(duplicateName.name).toBe("Argentina")
    } finally {
      await database.close()
    }
  })

  it.each(["", " ", " padded", "padded ", "x".repeat(201)])(
    "rejects the invalid Issuer name %j at the database boundary",
    async (name) => {
      const database = createDatabase(getDatabaseUrl())
      try {
        await expect(
          database.orm
            .insert(database.schema.issuers)
            .values({ name, code: "AR" })
        ).rejects.toThrow()
      } finally {
        await database.close()
      }
    }
  )

  it.each(["", " ", "ar", " AR", "AR ", "A", "ABC_123", "ABCDEFGHIJKLM"])(
    "rejects the invalid Issuer Code %j at the database boundary",
    async (code) => {
      const database = createDatabase(getDatabaseUrl())
      try {
        await expect(
          database.orm
            .insert(database.schema.issuers)
            .values({ name: "Invalid code", code })
        ).rejects.toThrow()
      } finally {
        await database.close()
      }
    }
  )

  it("requires unique Issuer Codes and prevents deleting an Issuer in use", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      const issuer = await insertArgentina(database)
      await expect(
        database.orm
          .insert(database.schema.issuers)
          .values({ name: "Duplicate code", code: "AR" })
      ).rejects.toThrow()

      await database.orm
        .insert(database.schema.coins)
        .values({ title: "First coin", issuerId: issuer.id })
      await expect(
        database.orm
          .delete(database.schema.issuers)
          .where(sql`${database.schema.issuers.id} = ${issuer.id}`)
      ).rejects.toThrow()
    } finally {
      await database.close()
    }
  })

  it("automatically advances the modification timestamp on changes", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      const issuer = await insertArgentina(database)
      await database.orm.execute(sql`
        update issuers
        set name = 'Argentine Republic', updated_at = created_at
        where id = ${issuer.id}
      `)
      const [updated] = await database.orm
        .select()
        .from(database.schema.issuers)

      expect(updated.updatedAt.getTime()).toBeGreaterThan(
        issuer.updatedAt.getTime()
      )
    } finally {
      await database.close()
    }
  })
})

describe("Coin seed", () => {
  const validSeed = {
    issuers: [{ name: "Argentina", code: "AR" }],
    coins: [{ id: SEEDED_COIN_ID, title: "First coin", issuerCode: "AR" }],
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
        issuer: expect.objectContaining({ name: "Argentina", code: "AR" }),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      })
      await expect(
        database.findCoinById("00000000-0000-4000-8000-000000000030")
      ).resolves.toMatchObject({
        id: "00000000-0000-4000-8000-000000000030",
        issuer: expect.objectContaining({
          name: "Roman Empire",
          code: "ROMAN",
        }),
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
          issuers: validSeed.issuers,
          coins: [
            validSeed.coins[0],
            { id: "not-a-uuid", title: "Invalid", issuerCode: "AR" },
          ],
        })
      ).rejects.toThrow()
      await expect(database.findCoinById(SEEDED_COIN_ID)).resolves.toBeNull()
    } finally {
      await database.close()
    }
  })

  it.each(["ar", " AR", "AR ", "", "ABC_123", "ABCDEFGHIJKLM"])(
    "rejects the invalid Issuer Code %j before writing any records",
    async (code) => {
      const database = createDatabase(getDatabaseUrl())
      try {
        await expect(
          seedCoins(database, {
            issuers: [{ name: "Argentina", code }],
            coins: [{ ...validSeed.coins[0], issuerCode: code }],
          })
        ).rejects.toThrow()
        await expect(database.listCoins()).resolves.toEqual([])
      } finally {
        await database.close()
      }
    }
  )

  it.each(["", " Argentina", "Argentina ", "x".repeat(201)])(
    "rejects the invalid Issuer name %j before writing any records",
    async (name) => {
      const database = createDatabase(getDatabaseUrl())
      try {
        await expect(
          seedCoins(database, {
            issuers: [{ name, code: "AR" }],
            coins: validSeed.coins,
          })
        ).rejects.toThrow()
        await expect(database.listCoins()).resolves.toEqual([])
      } finally {
        await database.close()
      }
    }
  )

  it("rolls back all records when any insert fails", async () => {
    const database = createDatabase(getDatabaseUrl())
    try {
      const duplicateId = "00000000-0000-4000-8000-000000000002"
      await database.orm.insert(database.schema.coins).values({
        id: duplicateId,
        title: "Existing",
        issuerId: (await insertArgentina(database)).id,
      })

      await expect(
        seedCoins(database, {
          issuers: [{ name: "Uruguay", code: "UY" }],
          coins: [
            { ...validSeed.coins[0], issuerCode: "UY" },
            { id: duplicateId, title: "Duplicate", issuerCode: "UY" },
          ],
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
