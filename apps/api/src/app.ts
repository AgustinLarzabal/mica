import { randomUUID } from "node:crypto"

import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { cors } from "hono/cors"

export interface AppOptions {
  allowedOrigins: ReadonlyArray<string>
  checkReadiness: () => Promise<void>
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
const noStorePaths = new Set(["/health", "/openapi.json", "/ready"])

export function createApp(options: AppOptions) {
  const app = new OpenAPIHono()
  const log = options.log ?? console.log

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
    if (noStorePaths.has(context.req.path)) {
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
