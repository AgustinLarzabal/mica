import { createServer } from "node:http"

import { serve } from "@hono/node-server"
import { createDatabase } from "@workspace/db"

import { createApp } from "./app.js"
import { loadConfig } from "./config.js"
import { createShutdownHandler } from "./shutdown.js"

const SHUTDOWN_GRACE_PERIOD_MILLIS = 10_000

type LogWriter = (message: string) => void

function writeEvent(
  write: LogWriter,
  level: "error" | "info",
  event: string,
  details: Record<string, number | string> = {}
) {
  write(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      event,
      ...details,
    })
  )
}

const config = loadConfig(process.env)
const database = createDatabase(config.databaseUrl, {
  connectionTimeoutMillis: config.databaseConnectionTimeoutMillis,
  onPoolError: () => {
    writeEvent(console.error, "error", "database_pool_error")
  },
  statementTimeoutMillis: config.databaseStatementTimeoutMillis,
})
const app = createApp({
  allowedOrigins: config.allowedOrigins,
  checkReadiness: database.checkReadiness,
  findCoinById: database.findCoinById,
  listCoins: database.listCoins,
})
const server = serve(
  {
    createServer,
    fetch: app.fetch,
    port: config.port,
  },
  ({ port }) => {
    writeEvent(console.log, "info", "server_started", { port })
  }
) as ReturnType<typeof createServer>

const shutdown = createShutdownHandler({
  database,
  gracePeriodMillis: SHUTDOWN_GRACE_PERIOD_MILLIS,
  log: (level, event, details) => {
    writeEvent(
      level === "error" ? console.error : console.log,
      level,
      event,
      details
    )
  },
  server,
  setExitCode: (code) => {
    process.exitCode = code
  },
})

process.once("SIGINT", shutdown)
process.once("SIGTERM", shutdown)
