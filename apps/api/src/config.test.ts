import { describe, expect, it } from "vitest"

import { loadConfig } from "./config.js"

describe("API configuration", () => {
  it("defaults the port and parses explicit allowed origins", () => {
    expect(
      loadConfig({
        API_ALLOWED_ORIGINS:
          "http://localhost:3000, https://preview.mica.example",
        DATABASE_URL: "postgresql://mica:secret@localhost:5432/mica",
      })
    ).toEqual({
      allowedOrigins: ["http://localhost:3000", "https://preview.mica.example"],
      databaseUrl: "postgresql://mica:secret@localhost:5432/mica",
      port: 3001,
    })
  })

  it("rejects invalid ports and wildcard origins with readable diagnostics", () => {
    expect(() =>
      loadConfig({
        API_ALLOWED_ORIGINS: "*",
        API_PORT: "not-a-port",
        DATABASE_URL: "mysql://localhost/mica",
      })
    ).toThrow(/API_PORT.*API_ALLOWED_ORIGINS/s)
  })

  it("requires a PostgreSQL connection URL without printing its value", () => {
    const databaseUrl = "postgresql://operator:secret@database.internal/mica"

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
