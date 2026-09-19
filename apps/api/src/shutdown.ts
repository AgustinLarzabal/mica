type ShutdownEventDetails = Record<string, number | string>

export type ShutdownLogWriter = (
  level: "error" | "info",
  event: string,
  details?: ShutdownEventDetails
) => void

export interface ShutdownServer {
  close: (callback: (error?: Error) => void) => void
  closeAllConnections: () => void
  closeIdleConnections: () => void
}

export interface ShutdownDatabase {
  close: () => Promise<void>
}

interface CreateShutdownHandlerOptions {
  database: ShutdownDatabase
  gracePeriodMillis: number
  log: ShutdownLogWriter
  server: ShutdownServer
  setExitCode: (code: number) => void
}

export function createShutdownHandler({
  database,
  gracePeriodMillis,
  log,
  server,
  setExitCode,
}: CreateShutdownHandlerOptions): (signal: NodeJS.Signals) => void {
  let databaseCloseStarted = false
  let serverCloseHandled = false
  let shutdownStarted = false
  let graceTimer: NodeJS.Timeout | undefined

  const closeDatabase = async () => {
    if (databaseCloseStarted) return
    databaseCloseStarted = true

    try {
      await database.close()
      log("info", "database_pool_closed")
    } catch {
      log("error", "database_pool_close_failed")
      setExitCode(1)
    }
  }

  return (signal) => {
    if (shutdownStarted) return
    shutdownStarted = true

    log("info", "server_stopping", { signal })

    server.close((error) => {
      if (serverCloseHandled) return
      serverCloseHandled = true

      if (graceTimer) {
        clearTimeout(graceTimer)
        graceTimer = undefined
      }

      if (error) {
        log("error", "server_stop_failed")
        setExitCode(1)
      }

      void closeDatabase()
    })

    server.closeIdleConnections()

    if (!serverCloseHandled) {
      graceTimer = setTimeout(() => {
        graceTimer = undefined
        log("error", "server_stop_timed_out")
        setExitCode(1)
        server.closeAllConnections()
      }, gracePeriodMillis)
      graceTimer.unref()
    }
  }
}
