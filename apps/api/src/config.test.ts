import { describe, expect, it } from "vitest"

import { loadConfig } from "./config.js"

describe("API configuration", () => {
  it("defaults the port and database timeouts and parses explicit allowed origins", () => {
    expect(
      loadConfig({
        API_ALLOWED_ORIGINS:
          "http://localhost:3000, https://preview.coin-archive.example",
        DATABASE_URL:
          "postgresql://coin_archive:secret@localhost:5432/coin_archive",
      })
    ).toEqual({
      allowedOrigins: [
        "http://localhost:3000",
        "https://preview.coin-archive.example",
      ],
      databaseConnectionTimeoutMillis: 5_000,
      databaseStatementTimeoutMillis: 10_000,
      databaseUrl:
        "postgresql://coin_archive:secret@localhost:5432/coin_archive",
      port: 3001,
    })
  })

  it("accepts explicit database timeouts", () => {
    expect(
      loadConfig({
        API_ALLOWED_ORIGINS: "http://localhost:3000",
        API_DATABASE_CONNECTION_TIMEOUT_MS: "2500",
        API_DATABASE_STATEMENT_TIMEOUT_MS: "7500",
        DATABASE_URL:
          "postgresql://coin_archive:secret@localhost:5432/coin_archive",
      })
    ).toMatchObject({
      databaseConnectionTimeoutMillis: 2_500,
      databaseStatementTimeoutMillis: 7_500,
    })
  })

  it.each([
    ["API_DATABASE_CONNECTION_TIMEOUT_MS", "0"],
    ["API_DATABASE_CONNECTION_TIMEOUT_MS", "-1"],
    ["API_DATABASE_CONNECTION_TIMEOUT_MS", "not-a-number"],
    ["API_DATABASE_CONNECTION_TIMEOUT_MS", "120001"],
    ["API_DATABASE_STATEMENT_TIMEOUT_MS", "0"],
    ["API_DATABASE_STATEMENT_TIMEOUT_MS", "-1"],
    ["API_DATABASE_STATEMENT_TIMEOUT_MS", "not-a-number"],
    ["API_DATABASE_STATEMENT_TIMEOUT_MS", "120001"],
  ])("rejects invalid %s values", (name, value) => {
    expect(() =>
      loadConfig({
        API_ALLOWED_ORIGINS: "http://localhost:3000",
        DATABASE_URL:
          "postgresql://coin_archive:secret@localhost:5432/coin_archive",
        [name]: value,
      })
    ).toThrow(new RegExp(name))

    try {
      loadConfig({
        API_ALLOWED_ORIGINS: "http://localhost:3000",
        DATABASE_URL:
          "postgresql://coin_archive:secret@localhost:5432/coin_archive",
        [name]: value,
      })
    } catch (error) {
      expect(String(error)).not.toContain(value)
    }
  })

  it("rejects invalid ports and wildcard origins with readable diagnostics", () => {
    expect(() =>
      loadConfig({
        API_ALLOWED_ORIGINS: "*",
        API_PORT: "not-a-port",
        DATABASE_URL: "mysql://localhost/coin_archive",
      })
    ).toThrow(/API_PORT.*API_ALLOWED_ORIGINS/s)
  })

  it("requires a PostgreSQL connection URL without printing its value", () => {
    const databaseUrl =
      "postgresql://operator:secret@database.internal/coin_archive"

    expect(() =>
      loadConfig({
        API_ALLOWED_ORIGINS: "http://localhost:3000",
        DATABASE_URL: databaseUrl.replace("postgresql", "https"),
      })
    ).toThrow(/DATABASE_URL/)

    try {
      loadConfig({
        API_ALLOWED_ORIGINS: "http://localhost:3000",
        DATABASE_URL: databaseUrl.replace("postgresql", "https"),
      })
    } catch (error) {
      expect(String(error)).not.toContain("secret")
      expect(String(error)).not.toContain("database.internal")
    }
  })
})
