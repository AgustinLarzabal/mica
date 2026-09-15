import { randomUUID } from "node:crypto"

import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { cors } from "hono/cors"

export interface AppOptions {
  allowedOrigins: ReadonlyArray<string>
  log?: (line: string) => void
}

const healthResponseSchema = z
  .object({
    status: z.literal("ok"),
  })
  .openapi("HealthResponse")

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
      headers: {
        "Cache-Control": {
          description: "Prevents caching of operational state",
          schema: { type: "string", enum: ["no-store"] },
        },
        "x-request-id": {
          description: "Request correlation identifier",
          schema: { type: "string", minLength: 1, maxLength: 128 },
        },
      },
    },
  },
})

const validRequestIdPattern = /^[A-Za-z0-9._:-]{1,128}$/
const noStorePaths = new Set(["/health", "/openapi.json"])

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
