import { randomUUID } from "node:crypto"

import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import {
  coinIdSchema,
  coinListResponseSchema as sharedCoinListResponseSchema,
  coinNotFoundErrorSchema as sharedCoinNotFoundErrorSchema,
  coinResponseSchema,
  internalErrorSchema as sharedInternalErrorSchema,
  invalidCoinIdErrorSchema as sharedInvalidCoinIdErrorSchema,
} from "@workspace/api"
import { cors } from "hono/cors"
import type { CoinListResponse, CoinResponse } from "@workspace/api"
import type { Coin } from "@workspace/db"

export interface AppOptions {
  allowedOrigins: ReadonlyArray<string>
  checkReadiness: () => Promise<void>
  findCoinById?: (coinId: string) => Promise<Coin | null>
  listCoins?: () => Promise<Array<Coin>>
  log?: (line: string) => void
}

const healthResponseSchema = z
  .object({
    status: z.literal("ok"),
  })
  .openapi("HealthResponse")

const operationalResponseHeaders = {
  "Cache-Control": {
    description: "Prevents caching of operational state",
    schema: { type: "string" as const, enum: ["no-store"] },
  },
  "x-request-id": {
    description: "Request correlation identifier",
    schema: { type: "string" as const, minLength: 1, maxLength: 128 },
  },
}

const coinSchema = coinResponseSchema.openapi("Coin")
const coinListResponseSchema =
  sharedCoinListResponseSchema.openapi("CoinListResponse")

const coinPathParametersSchema = z
  .object({
    coinId: coinIdSchema.openapi({
      param: { name: "coinId", in: "path" },
    }),
  })
  .openapi("CoinPathParameters")

const invalidCoinIdErrorSchema =
  sharedInvalidCoinIdErrorSchema.openapi("InvalidCoinIdError")
const coinNotFoundErrorSchema =
  sharedCoinNotFoundErrorSchema.openapi("CoinNotFoundError")
const internalErrorSchema = sharedInternalErrorSchema.openapi("InternalError")

const coinDetailRoute = createRoute({
  method: "get",
  path: "/v1/coins/{coinId}",
  request: { params: coinPathParametersSchema },
  responses: {
    200: {
      content: { "application/json": { schema: coinSchema } },
      description: "The requested Coin",
      headers: operationalResponseHeaders,
    },
    400: {
      content: { "application/json": { schema: invalidCoinIdErrorSchema } },
      description: "The Coin identifier is malformed",
      headers: operationalResponseHeaders,
    },
    404: {
      content: { "application/json": { schema: coinNotFoundErrorSchema } },
      description: "The Coin does not exist",
      headers: operationalResponseHeaders,
    },
    500: {
      content: { "application/json": { schema: internalErrorSchema } },
      description: "The Coin lookup failed unexpectedly",
      headers: operationalResponseHeaders,
    },
  },
})

const coinListRoute = createRoute({
  method: "get",
  path: "/v1/coins",
  responses: {
    200: {
      content: { "application/json": { schema: coinListResponseSchema } },
      description: "The Coin catalog",
      headers: operationalResponseHeaders,
    },
    500: {
      content: { "application/json": { schema: internalErrorSchema } },
      description: "The Coin catalog lookup failed unexpectedly",
      headers: operationalResponseHeaders,
    },
  },
})

const healthRoute = createRoute({
  method: "get",
  path: "/health",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: healthResponseSchema,
        },
      },
      description: "The API process is serving HTTP",
      headers: operationalResponseHeaders,
    },
  },
})

const unavailableResponseSchema = z
  .object({
    status: z.literal("unavailable"),
  })
  .openapi("UnavailableResponse")

const readyRoute = createRoute({
  method: "get",
  path: "/ready",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: healthResponseSchema,
        },
      },
      description: "The API can perform database-backed work",
      headers: operationalResponseHeaders,
    },
    503: {
      content: {
        "application/json": {
          schema: unavailableResponseSchema,
        },
      },
      description: "The API cannot currently perform database-backed work",
      headers: operationalResponseHeaders,
    },
  },
})

const validRequestIdPattern = /^[A-Za-z0-9._:-]{1,128}$/
const noStorePaths = new Set([
  "/health",
  "/openapi.json",
  "/ready",
  "/v1/coins",
])

export function createApp(options: AppOptions) {
  const app = new OpenAPIHono()
  const log = options.log ?? console.log

  app.openAPIRegistry.register("CoinPathParameters", coinPathParametersSchema)

  app.use("*", async (context, next) => {
    const startedAt = performance.now()
    const incomingRequestId = context.req.header("x-request-id")
    const requestId =
      incomingRequestId && validRequestIdPattern.test(incomingRequestId)
        ? incomingRequestId
        : randomUUID()

    await next()
    context.header("x-request-id", requestId)
    log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "info",
        requestId,
        method: context.req.method,
        path: context.req.path,
        status: context.res.status,
        durationMs: Number((performance.now() - startedAt).toFixed(3)),
      })
    )
  })

  app.use("*", async (context, next) => {
    await next()
    if (
      noStorePaths.has(context.req.path) ||
      context.req.path.startsWith("/v1/coins/")
    ) {
      context.header("Cache-Control", "no-store")
    }
  })

  app.use(
    "*",
    cors({
      credentials: false,
      origin: (origin) =>
        options.allowedOrigins.includes(origin) ? origin : undefined,
    })
  )

  app.openapi(healthRoute, (context) => context.json({ status: "ok" }, 200))
  app.openapi(readyRoute, async (context) => {
    try {
      await options.checkReadiness()
      return context.json({ status: "ok" }, 200)
    } catch (error) {
      log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: "error",
          event: "readiness_check_failed",
          error: error instanceof Error ? error.message : String(error),
        })
      )
      return context.json({ status: "unavailable" }, 503)
    }
  })

  app.openapi(coinListRoute, async (context) => {
    const coins = await (options.listCoins ?? (async () => []))()
    const response = {
      coins: coins.map((coin) => ({
        id: coin.id,
        title: coin.title,
        createdAt: coin.createdAt.toISOString(),
        updatedAt: coin.updatedAt.toISOString(),
      })),
    } satisfies CoinListResponse

    return context.json(response, 200)
  })

  app.openapi(
    coinDetailRoute,
    async (context) => {
      const { coinId } = context.req.valid("param")
      const coin = await (options.findCoinById ?? (async () => null))(coinId)

      if (!coin) {
        return context.json(
          {
            error: {
              code: "coin_not_found" as const,
              message: "Coin not found" as const,
            },
          },
          404
        )
      }

      const response = {
        id: coin.id,
        title: coin.title,
        createdAt: coin.createdAt.toISOString(),
        updatedAt: coin.updatedAt.toISOString(),
      } satisfies CoinResponse

      return context.json(response, 200)
    },
    (result, context) => {
      if (!result.success) {
        return context.json(
          {
            error: {
              code: "invalid_coin_id" as const,
              message: "Coin ID must be a valid UUID" as const,
            },
          },
          400
        )
      }
    }
  )

  app.doc("/openapi.json", {
    info: {
      title: "Mica API",
      version: "1.0.0",
    },
    openapi: "3.1.0",
  })

  app.notFound((context) => {
    context.header("Cache-Control", "no-store")
    return context.json(
      { error: { code: "not_found", message: "Not found" } },
      404
    )
  })

  app.onError((_error, context) => {
    context.header("Cache-Control", "no-store")
    return context.json(
      {
        error: {
          code: "internal_error",
          message: "Internal server error",
        },
      },
      500
    )
  })

  return app
}
