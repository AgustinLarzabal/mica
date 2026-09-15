import { serve } from "@hono/node-server"
import { createDatabase } from "@workspace/db"

import { createApp } from "./app.js"
import { loadConfig } from "./config.js"

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
  onPoolError: (error) => {
    writeEvent(console.error, "error", "database_pool_error", {
      message: error.message,
    })
  },
})
const app = createApp({
  allowedOrigins: config.allowedOrigins,
  checkReadiness: database.checkReadiness,
})
const server = serve(
  {
    fetch: app.fetch,
    port: config.port,
  },
  ({ port }) => {
    writeEvent(console.log, "info", "server_started", { port })
  }
)

let shuttingDown = false

function shutdown(signal: NodeJS.Signals) {
  if (shuttingDown) return
  shuttingDown = true

  writeEvent(console.log, "info", "server_stopping", { signal })

  server.close(async (error) => {
    if (error) {
      writeEvent(console.error, "error", "server_stop_failed", {
        message: error.message,
      })
      process.exitCode = 1
    }

    try {
      await database.close()
      writeEvent(console.log, "info", "database_pool_closed")
    } catch (poolError) {
      writeEvent(console.error, "error", "database_pool_close_failed", {
        message:
          poolError instanceof Error ? poolError.message : String(poolError),
      })
      process.exitCode = 1
    }
  })

  if ("closeIdleConnections" in server) {
    server.closeIdleConnections()
  }
}

process.once("SIGINT", shutdown)
process.once("SIGTERM", shutdown)
