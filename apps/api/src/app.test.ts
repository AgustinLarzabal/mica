import { describe, expect, it } from "vitest"

import { createApp } from "./app.js"

const successfulReadinessCheck = async () => {}

describe("API", () => {
  it("reports liveness without external dependencies", async () => {
    const response = await createApp({
      allowedOrigins: ["http://localhost:3000"],
      checkReadiness: successfulReadinessCheck,
    }).request("/health")

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ status: "ok" })
  })

  it("prevents liveness responses from being cached", async () => {
    const response = await createApp({
      allowedOrigins: ["http://localhost:3000"],
      checkReadiness: successfulReadinessCheck,
    }).request("/health")

    expect(response.headers.get("cache-control")).toBe("no-store")
  })

  it("reports readiness after the injected dependency succeeds", async () => {
    const response = await createApp({
      allowedOrigins: ["http://localhost:3000"],
      checkReadiness: async () => {},
    }).request("/ready")

    expect(response.status).toBe(200)
    expect(response.headers.get("cache-control")).toBe("no-store")
    await expect(response.json()).resolves.toEqual({ status: "ok" })
  })

  it("reports safe unavailability while liveness remains healthy", async () => {
    const lines: Array<string> = []
    const app = createApp({
      allowedOrigins: ["http://localhost:3000"],
      checkReadiness: async () => {
        throw new Error("postgresql://operator:secret@database.internal/mica")
      },
      log: (line) => lines.push(line),
    })

    const readiness = await app.request("/ready")
    const liveness = await app.request("/health")
    const readinessBody = await readiness.json()

    expect(readiness.status).toBe(503)
    expect(readiness.headers.get("cache-control")).toBe("no-store")
    expect(readinessBody).toEqual({ status: "unavailable" })
    expect(JSON.stringify(readinessBody)).not.toContain("database.internal")
    expect(lines.some((line) => line.includes("database.internal"))).toBe(true)
    expect(liveness.status).toBe(200)
    await expect(liveness.json()).resolves.toEqual({ status: "ok" })
  })

  it("preserves bounded request IDs and replaces missing or invalid IDs", async () => {
    const app = createApp({
      allowedOrigins: ["http://localhost:3000"],
      checkReadiness: successfulReadinessCheck,
    })
    const validRequestId = "browser.trace_123:child-4"
    const preserved = await app.request("/health", {
      headers: { "x-request-id": validRequestId },
    })
    const missing = await app.request("/health")
    const invalid = await app.request("/health", {
      headers: { "x-request-id": "invalid request id" },
    })

    expect(preserved.headers.get("x-request-id")).toBe(validRequestId)
    expect(missing.headers.get("x-request-id")).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    )
    expect(invalid.headers.get("x-request-id")).not.toBe("invalid request id")
  })

  it("allows only configured browser origins without credentials", async () => {
    const app = createApp({
      allowedOrigins: ["https://mica.example"],
      checkReadiness: successfulReadinessCheck,
    })
    const allowed = await app.request("/health", {
      headers: { origin: "https://mica.example" },
    })
    const unlisted = await app.request("/health", {
      headers: { origin: "https://attacker.example" },
    })
    const preflight = await app.request("/health", {
      method: "OPTIONS",
      headers: {
        origin: "https://mica.example",
        "access-control-request-method": "GET",
      },
    })

    expect(allowed.headers.get("access-control-allow-origin")).toBe(
      "https://mica.example"
    )
    expect(allowed.headers.has("access-control-allow-credentials")).toBe(false)
    expect(unlisted.headers.has("access-control-allow-origin")).toBe(false)
    expect(preflight.headers.get("access-control-allow-origin")).toBe(
      "https://mica.example"
    )
    expect(preflight.headers.has("access-control-allow-credentials")).toBe(
      false
    )
    expect(preflight.headers.get("x-request-id")).toBeTruthy()
  })

  it("returns consistent public JSON errors for unknown routes and failures", async () => {
    const app = createApp({
      allowedOrigins: ["https://mica.example"],
      checkReadiness: successfulReadinessCheck,
    })
    app.get("/unexpected", () => {
      throw new Error("database password leaked")
    })

    const notFound = await app.request("/unknown")
    const unexpected = await app.request("/unexpected")

    expect(notFound.status).toBe(404)
    await expect(notFound.json()).resolves.toEqual({
      error: { code: "not_found", message: "Not found" },
    })
    expect(unexpected.status).toBe(500)
    await expect(unexpected.json()).resolves.toEqual({
      error: { code: "internal_error", message: "Internal server error" },
    })
    expect(unexpected.headers.get("x-request-id")).toBeTruthy()
  })

  it("serves a generated OpenAPI contract for operational endpoints", async () => {
    const response = await createApp({
      allowedOrigins: ["http://localhost:3000"],
      checkReadiness: successfulReadinessCheck,
    }).request("/openapi.json")
    const document = (await response.json()) as {
      components: { schemas: { HealthResponse: unknown } }
      openapi: string
      paths: {
        "/health": {
          get: {
            responses: {
              "200": { headers: Record<string, unknown> }
            }
          }
        }
        "/ready": {
          get: { responses: Record<string, unknown> }
        }
      }
    }

    expect(response.status).toBe(200)
    expect(response.headers.get("cache-control")).toBe("no-store")
    expect(document.openapi).toBe("3.1.0")
    expect(document.paths).toHaveProperty("/health")
    expect(document.paths).toHaveProperty("/ready")
    expect(document.paths["/ready"].get.responses).toEqual(
      expect.objectContaining({
        "200": expect.any(Object),
        "503": expect.any(Object),
      })
    )
    expect(document.paths["/health"].get.responses["200"].headers).toEqual(
      expect.objectContaining({
        "Cache-Control": expect.any(Object),
        "x-request-id": expect.any(Object),
      })
    )
    expect(document.components.schemas.HealthResponse).toEqual({
      type: "object",
      properties: { status: { type: "string", enum: ["ok"] } },
      required: ["status"],
    })
  })

  it("emits one structured JSON request log", async () => {
    const lines: Array<string> = []
    const app = createApp({
      allowedOrigins: ["http://localhost:3000"],
      checkReadiness: successfulReadinessCheck,
      log: (line) => lines.push(line),
    })

    await app.request("/health", {
      headers: { "x-request-id": "test-request-42" },
    })

    expect(lines).toHaveLength(1)
    expect(JSON.parse(lines[0] ?? "")).toMatchObject({
      level: "info",
      requestId: "test-request-42",
      method: "GET",
      path: "/health",
      status: 200,
    })
    expect(JSON.parse(lines[0] ?? "").timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(JSON.parse(lines[0] ?? "").durationMs).toBeGreaterThanOrEqual(0)
  })

  describe("GET /v1/coins/{coinId}", () => {
    const coinId = "00000000-0000-4000-8000-000000000001"
    const coin = {
      id: coinId,
      title: "First coin",
      createdAt: new Date("2026-09-16T10:00:00.000Z"),
      updatedAt: new Date("2026-09-16T11:00:00.000Z"),
    }

    it("returns the Coin contract with UTC timestamps and no caching", async () => {
      const response = await createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
        findCoinById: async () => coin,
      }).request(`/v1/coins/${coinId}`)

      expect(response.status).toBe(200)
      expect(response.headers.get("cache-control")).toBe("no-store")
      await expect(response.json()).resolves.toEqual({
        id: coinId,
        title: "First coin",
        createdAt: "2026-09-16T10:00:00.000Z",
        updatedAt: "2026-09-16T11:00:00.000Z",
      })
    })

    it("rejects malformed IDs before lookup", async () => {
      let lookupCount = 0
      const response = await createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
        findCoinById: async () => {
          lookupCount += 1
          return coin
        },
      }).request("/v1/coins/not-a-uuid")

      expect(response.status).toBe(400)
      expect(response.headers.get("cache-control")).toBe("no-store")
      expect(lookupCount).toBe(0)
      await expect(response.json()).resolves.toEqual({
        error: {
          code: "invalid_coin_id",
          message: "Coin ID must be a valid UUID",
        },
      })
    })

    it("distinguishes a missing Coin", async () => {
      const response = await createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
        findCoinById: async () => null,
      }).request(`/v1/coins/${coinId}`)

      expect(response.status).toBe(404)
      expect(response.headers.get("cache-control")).toBe("no-store")
      await expect(response.json()).resolves.toEqual({
        error: { code: "coin_not_found", message: "Coin not found" },
      })
    })

    it("keeps lookup failures safe and correlated", async () => {
      const response = await createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
        findCoinById: async () => {
          throw new Error("postgresql://operator:secret@database.internal/mica")
        },
      }).request(`/v1/coins/${coinId}`, {
        headers: { "x-request-id": "coin-request-42" },
      })

      expect(response.status).toBe(500)
      expect(response.headers.get("cache-control")).toBe("no-store")
      expect(response.headers.get("x-request-id")).toBe("coin-request-42")
      await expect(response.json()).resolves.toEqual({
        error: {
          code: "internal_error",
          message: "Internal server error",
        },
      })
    })

    it("documents named success and error schemas", async () => {
      const response = await createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
      }).request("/openapi.json")
      const document = (await response.json()) as {
        components: { schemas: Record<string, unknown> }
        paths: {
          "/v1/coins/{coinId}": {
            get: { responses: Record<string, unknown> }
          }
        }
      }

      expect(document.paths["/v1/coins/{coinId}"].get.responses).toEqual(
        expect.objectContaining({
          "200": expect.objectContaining({
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Coin" },
              },
            },
          }),
          "400": expect.objectContaining({
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/InvalidCoinIdError" },
              },
            },
          }),
          "404": expect.objectContaining({
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CoinNotFoundError" },
              },
            },
          }),
          "500": expect.objectContaining({
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/InternalError" },
              },
            },
          }),
        })
      )
      expect(document.components.schemas).toEqual(
        expect.objectContaining({
          Coin: expect.any(Object),
          CoinPathParameters: expect.any(Object),
          InvalidCoinIdError: expect.any(Object),
          CoinNotFoundError: expect.any(Object),
          InternalError: expect.any(Object),
        })
      )
    })
  })

  describe("GET /v1/coins", () => {
    it("returns persisted Coins with UTC timestamps and no caching", async () => {
      const response = await createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
        listCoins: async () => [
          {
            id: "00000000-0000-4000-8000-000000000001",
            title: "First coin",
            createdAt: new Date("2026-09-16T10:00:00.000Z"),
            updatedAt: new Date("2026-09-16T11:00:00.000Z"),
          },
        ],
      }).request("/v1/coins")

      expect(response.status).toBe(200)
      expect(response.headers.get("cache-control")).toBe("no-store")
      await expect(response.json()).resolves.toEqual({
        coins: [
          {
            id: "00000000-0000-4000-8000-000000000001",
            title: "First coin",
            createdAt: "2026-09-16T10:00:00.000Z",
            updatedAt: "2026-09-16T11:00:00.000Z",
          },
        ],
      })
    })

    it("returns an empty catalog", async () => {
      const response = await createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
        listCoins: async () => [],
      }).request("/v1/coins")

      expect(response.status).toBe(200)
      expect(response.headers.get("cache-control")).toBe("no-store")
      await expect(response.json()).resolves.toEqual({ coins: [] })
    })

    it("keeps catalog failures safe and uncacheable", async () => {
      const response = await createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
        listCoins: async () => {
          throw new Error("postgresql://operator:secret@database.internal/mica")
        },
      }).request("/v1/coins")

      expect(response.status).toBe(500)
      expect(response.headers.get("cache-control")).toBe("no-store")
      await expect(response.json()).resolves.toEqual({
        error: {
          code: "internal_error",
          message: "Internal server error",
        },
      })
    })

    it("documents named catalog response schemas", async () => {
      const response = await createApp({
        allowedOrigins: [],
        checkReadiness: successfulReadinessCheck,
      }).request("/openapi.json")
      const document = (await response.json()) as {
        components: { schemas: Record<string, unknown> }
        paths: {
          "/v1/coins": { get: { responses: Record<string, unknown> } }
        }
      }

      expect(document.paths["/v1/coins"].get.responses).toEqual(
        expect.objectContaining({
          "200": expect.objectContaining({
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CoinListResponse" },
              },
            },
          }),
          "500": expect.objectContaining({
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/InternalError" },
              },
            },
          }),
        })
      )
      expect(document.components.schemas).toEqual(
        expect.objectContaining({
          CoinListResponse: expect.any(Object),
          InternalError: expect.any(Object),
        })
      )
    })
  })
})
