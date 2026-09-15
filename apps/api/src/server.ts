import { serve } from "@hono/node-server"

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
const app = createApp(config)
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

  server.close((error) => {
    if (error) {
      writeEvent(console.error, "error", "server_stop_failed", {
        message: error.message,
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
