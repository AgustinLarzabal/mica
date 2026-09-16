import { describe, expect, it } from "vitest"

import { resolveDatabaseUrl } from "./database-url.js"

describe("database URL resolution", () => {
  it("prefers an explicit DATABASE_URL", () => {
    expect(
      resolveDatabaseUrl({
        DATABASE_URL: "postgresql://operator:secret@database.internal/mica",
        POSTGRES_PASSWORD: "ignored",
      })
    ).toBe("postgresql://operator:secret@database.internal/mica")
  })

  it("builds a local URL from the Docker Compose environment", () => {
    expect(
      resolveDatabaseUrl({
        POSTGRES_DB: "mica_dev",
        POSTGRES_PASSWORD: "p@ss:word",
        POSTGRES_PORT: "5434",
        POSTGRES_USER: "developer",
      })
    ).toBe("postgresql://developer:p%40ss%3Aword@127.0.0.1:5434/mica_dev")
  })

  it("uses the same defaults as Docker Compose", () => {
    expect(resolveDatabaseUrl({ POSTGRES_PASSWORD: "secret" })).toBe(
      "postgresql://mica:secret@127.0.0.1:5432/mica"
    )
  })

  it("reports missing configuration without exposing credentials", () => {
    expect(() => resolveDatabaseUrl({})).toThrow(
      "DATABASE_URL or POSTGRES_PASSWORD is required"
    )
  })
})
