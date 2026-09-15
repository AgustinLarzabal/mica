import { describe, expect, it } from "vitest"

import { loadConfig } from "./config.js"

describe("API configuration", () => {
  it("defaults the port and parses explicit allowed origins", () => {
    expect(
      loadConfig({
        API_ALLOWED_ORIGINS:
          "http://localhost:3000, https://preview.mica.example",
      })
    ).toEqual({
      allowedOrigins: ["http://localhost:3000", "https://preview.mica.example"],
      port: 3001,
    })
  })

  it("rejects invalid ports and wildcard origins with readable diagnostics", () => {
    expect(() =>
      loadConfig({ API_ALLOWED_ORIGINS: "*", API_PORT: "not-a-port" })
    ).toThrow(/API_PORT.*API_ALLOWED_ORIGINS/s)
  })
})
