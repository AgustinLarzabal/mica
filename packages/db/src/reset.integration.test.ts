import { execFile } from "node:child_process"
import { fileURLToPath } from "node:url"
import { promisify } from "node:util"

import { Pool } from "pg"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

const execFileAsync = promisify(execFile)
const RESET_DATABASE_NAME = "mica_reset_test"
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

describe("root database reset command", () => {
  it("recreates and seeds only the isolated local integration database", async () => {
    const resetDatabaseUrl = getResetDatabaseUrl()
    const databaseBeforeReset = new Pool({ connectionString: resetDatabaseUrl })
    try {
      await databaseBeforeReset.query("create table reset_marker (id integer)")
    } finally {
      await databaseBeforeReset.end()
    }

    const { stdout } = await execFileAsync("pnpm", ["db:reset"], {
      cwd: repositoryRoot,
      env: { ...process.env, DATABASE_URL: resetDatabaseUrl },
    })

    expect(stdout).toContain(
      `Resetting local database "${RESET_DATABASE_NAME}" before migrating and seeding.`
    )

    const databaseAfterReset = new Pool({ connectionString: resetDatabaseUrl })
    try {
      const marker = await databaseAfterReset.query<{ name: string | null }>(
        "select to_regclass('public.reset_marker')::text as name"
      )
      expect(marker.rows).toEqual([{ name: null }])

      const coins = await databaseAfterReset.query<{
        id: string
        title: string
      }>("select id, title from coins order by id")
      expect(coins.rows).toEqual([
        {
          id: "00000000-0000-4000-8000-000000000001",
          title: "First coin",
        },
      ])
    } finally {
      await databaseAfterReset.end()
    }
  })
})
