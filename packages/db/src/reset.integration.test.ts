import { fileURLToPath } from "node:url"

import { Pool } from "pg"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { rebuildDatabase } from "./index.js"

const RESET_DATABASE_NAME = "coin_archive_reset_test"
const repositoryRoot = fileURLToPath(new URL("../../..", import.meta.url))

function getIntegrationDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL
  expect(databaseUrl).toBeTruthy()
  return databaseUrl ?? ""
}

function getResetDatabaseUrl() {
  const databaseUrl = new URL(getIntegrationDatabaseUrl())
  databaseUrl.pathname = RESET_DATABASE_NAME
  return databaseUrl.toString()
}

async function recreateResetDatabase() {
  await withAdministrationDatabase(async (database) => {
    await database.query(
      `drop database if exists ${RESET_DATABASE_NAME} with (force)`
    )
    await database.query(`create database ${RESET_DATABASE_NAME}`)
  })
}

async function dropResetDatabase() {
  await withAdministrationDatabase(async (database) => {
    await database.query(
      `drop database if exists ${RESET_DATABASE_NAME} with (force)`
    )
  })
}

async function withAdministrationDatabase(
  operation: (database: Pool) => Promise<void>
) {
  const administrationPool = new Pool({
    connectionString: getIntegrationDatabaseUrl(),
  })

  try {
    await operation(administrationPool)
  } finally {
    await administrationPool.end()
  }
}

beforeAll(recreateResetDatabase)
afterAll(dropResetDatabase)

describe("database rebuild lifecycle", () => {
  it("removes prior state and restores the migrated seed state", async () => {
    const resetDatabaseUrl = getResetDatabaseUrl()
    const databaseBeforeReset = new Pool({ connectionString: resetDatabaseUrl })
    try {
      await databaseBeforeReset.query("create table reset_marker (id integer)")
      await databaseBeforeReset.query("create schema drizzle")
      await databaseBeforeReset.query(
        "create table drizzle.reset_marker (id integer)"
      )
    } finally {
      await databaseBeforeReset.end()
    }

    const initialWorkingDirectory = process.cwd()
    process.chdir(repositoryRoot)
    try {
      await rebuildDatabase(resetDatabaseUrl)
    } finally {
      process.chdir(initialWorkingDirectory)
    }

    const databaseAfterReset = new Pool({ connectionString: resetDatabaseUrl })
    try {
      const marker = await databaseAfterReset.query<{ name: string | null }>(
        "select to_regclass('public.reset_marker')::text as name"
      )
      expect(marker.rows).toEqual([{ name: null }])

      const migrationMarker = await databaseAfterReset.query<{
        name: string | null
      }>("select to_regclass('drizzle.reset_marker')::text as name")
      expect(migrationMarker.rows).toEqual([{ name: null }])

      const coins = await databaseAfterReset.query<{
        id: string
        title: string
      }>("select id, title from coins order by id")
      expect(coins.rows).toHaveLength(30)
      expect(coins.rows[0]).toEqual({
        id: "00000000-0000-4000-8000-000000000001",
        title: "400th Anniversary of the First Edition of Don Quixote",
      })
      expect(coins.rows.at(-1)).toEqual({
        id: "00000000-0000-4000-8000-000000000030",
        title: "Thirtieth coin",
      })

      const issuers = await databaseAfterReset.query<{
        code: string
        coin_count: number
        name: string
      }>(`
        select issuers.name, issuers.code, count(coins.id)::integer as coin_count
        from issuers
        left join coins on coins.issuer_id = issuers.id
        group by issuers.id
      `)
      expect(issuers.rows).toEqual(
        expect.arrayContaining([
          { name: "Spain", code: "ES", coin_count: 25 },
          { name: "Roman Empire", code: "ROMAN", coin_count: 5 },
        ])
      )
      expect(issuers.rows).toHaveLength(2)
    } finally {
      await databaseAfterReset.end()
    }
  })
})
