import { describe, expect, it } from "vitest"

import { parseLocalResetTarget } from "./reset.js"

describe("local database reset safety", () => {
  it.each(["localhost", "127.0.0.1"])(
    "permits the exact local host %s",
    (host) => {
      expect(
        parseLocalResetTarget(
          `postgresql://mica:secret@${host}:5432/mica_reset_test`
        )
      ).toEqual({
        databaseName: "mica_reset_test",
        databaseUrl: `postgresql://mica:secret@${host}:5432/mica_reset_test`,
      })
    }
  )

  it.each([
    "database.internal",
    "10.0.0.12",
    "192.168.1.12",
    "localhost.example.com",
    "[::1]",
  ])("rejects the non-permitted host %s", (host) => {
    expect(() =>
      parseLocalResetTarget(
        `postgresql://mica:secret@${host}:5432/mica_reset_test`
      )
    ).toThrow("Database reset is permitted only for localhost or 127.0.0.1")
  })

  it("rejects a query parameter that makes pg override the parsed host", () => {
    expect(() =>
      parseLocalResetTarget(
        "postgresql://mica:secret@localhost:5432/mica_reset_test?host=database.internal"
      )
    ).toThrow("Database reset is permitted only for localhost or 127.0.0.1")
  })

  it.each([
    undefined,
    "",
    "not a database URL",
    "https://localhost/mica_reset_test",
    "postgresql://localhost",
  ])("rejects the missing or malformed database URL %j", (databaseUrl) => {
    expect(() => parseLocalResetTarget(databaseUrl)).toThrow(
      "A valid local PostgreSQL DATABASE_URL with a database name is required"
    )
  })

  it("decodes the database name used in the reset warning", () => {
    expect(
      parseLocalResetTarget("postgresql://mica@localhost/mica%5Freset")
    ).toMatchObject({ databaseName: "mica_reset" })
  })
})
