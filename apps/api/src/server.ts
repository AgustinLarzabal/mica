import { serve } from "@hono/node-server"

import { createApp } from "./app.js"
import { loadConfig } from "./config.js"

const config = loadConfig(process.env)
const app = createApp(config)
const server = serve(
  {
    fetch: app.fetch,
    port: config.port,
  },
  ({ port }) => {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "info",
        event: "server_started",
        port,
      })
    )
  }
)

let shuttingDown = false

function shutdown(signal: NodeJS.Signals) {
  if (shuttingDown) return
  shuttingDown = true

  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "info",
      event: "server_stopping",
      signal,
    })
  )

  server.close((error) => {
    if (error) {
      console.error(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: "error",
          event: "server_stop_failed",
          message: error.message,
        })
      )
      process.exitCode = 1
    }
  })

  if ("closeIdleConnections" in server) {
    server.closeIdleConnections()
  }
}

process.once("SIGINT", shutdown)
process.once("SIGTERM", shutdown)
