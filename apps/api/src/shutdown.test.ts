import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { createShutdownHandler } from "./shutdown.js"
import type {
  ShutdownDatabase,
  ShutdownLogWriter,
  ShutdownServer,
} from "./shutdown.js"

const GRACE_PERIOD_MILLIS = 10_000

function createHarness(
  databaseClose: ShutdownDatabase["close"] = vi
    .fn()
    .mockResolvedValue(undefined)
) {
  const closeCallbacks: Array<(error?: Error) => void> = []
  const server: ShutdownServer = {
    close: vi.fn((callback) => {
      closeCallbacks.push(callback)
    }),
    closeAllConnections: vi.fn(),
    closeIdleConnections: vi.fn(),
  }
  const database = { close: databaseClose }
  const log = vi.fn<ShutdownLogWriter>()
  const setExitCode = vi.fn<(code: number) => void>()
  const shutdown = createShutdownHandler({
    database,
    gracePeriodMillis: GRACE_PERIOD_MILLIS,
    log,
    server,
    setExitCode,
  })

  return { closeCallbacks, database, log, server, setExitCode, shutdown }
}

function loggedEvents(log: ReturnType<typeof vi.fn<ShutdownLogWriter>>) {
  return log.mock.calls.map(([, event]) => event)
}

describe("API shutdown", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  it("drains normally, clears the grace timer, and closes the database", async () => {
    const { closeCallbacks, database, log, server, setExitCode, shutdown } =
      createHarness()

    shutdown("SIGTERM")

    expect(server.close).toHaveBeenCalledOnce()
    expect(server.closeIdleConnections).toHaveBeenCalledOnce()
    expect(server.closeAllConnections).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(1)
    expect(log).toHaveBeenCalledWith("info", "server_stopping", {
      signal: "SIGTERM",
    })

    closeCallbacks[0]?.()
    await Promise.resolve()

    expect(vi.getTimerCount()).toBe(0)
    expect(database.close).toHaveBeenCalledOnce()
    expect(loggedEvents(log)).toContain("database_pool_closed")
    expect(setExitCode).not.toHaveBeenCalled()
  })

  it("force-closes connections when the grace period expires", async () => {
    const { closeCallbacks, database, log, server, setExitCode, shutdown } =
      createHarness()

    shutdown("SIGINT")
    await vi.advanceTimersByTimeAsync(GRACE_PERIOD_MILLIS - 1)

    expect(server.closeAllConnections).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)

    expect(server.closeAllConnections).toHaveBeenCalledOnce()
    expect(setExitCode).toHaveBeenCalledWith(1)
    expect(log).toHaveBeenCalledWith("error", "server_stop_timed_out")
    expect(vi.getTimerCount()).toBe(0)

    closeCallbacks[0]?.()
    await Promise.resolve()

    expect(database.close).toHaveBeenCalledOnce()
  })

  it("ignores duplicate signals", async () => {
    const { closeCallbacks, database, log, server, shutdown } = createHarness()

    shutdown("SIGINT")
    shutdown("SIGTERM")

    expect(server.close).toHaveBeenCalledOnce()
    expect(server.closeIdleConnections).toHaveBeenCalledOnce()
    expect(
      loggedEvents(log).filter((event) => event === "server_stopping")
    ).toHaveLength(1)

    closeCallbacks[0]?.()
    await Promise.resolve()

    expect(database.close).toHaveBeenCalledOnce()
    expect(vi.getTimerCount()).toBe(0)
  })

  it("reports a server-close failure without logging exception text", async () => {
    const secretMessage = "server leaked secret details"
    const { closeCallbacks, database, log, setExitCode, shutdown } =
      createHarness()

    shutdown("SIGTERM")
    closeCallbacks[0]?.(new Error(secretMessage))
    await Promise.resolve()

    expect(database.close).toHaveBeenCalledOnce()
    expect(log).toHaveBeenCalledWith("error", "server_stop_failed")
    expect(setExitCode).toHaveBeenCalledWith(1)
    expect(JSON.stringify(log.mock.calls)).not.toContain(secretMessage)
    expect(vi.getTimerCount()).toBe(0)
  })

  it("reports a database-close failure without logging exception text", async () => {
    const secretMessage = "database leaked secret details"
    const databaseClose = vi.fn().mockRejectedValue(new Error(secretMessage))
    const { closeCallbacks, log, setExitCode, shutdown } =
      createHarness(databaseClose)

    shutdown("SIGTERM")
    closeCallbacks[0]?.()
    await Promise.resolve()
    await Promise.resolve()

    expect(databaseClose).toHaveBeenCalledOnce()
    expect(log).toHaveBeenCalledWith("error", "database_pool_close_failed")
    expect(setExitCode).toHaveBeenCalledWith(1)
    expect(JSON.stringify(log.mock.calls)).not.toContain(secretMessage)
    expect(vi.getTimerCount()).toBe(0)
  })

  it("closes the database exactly once when the server callback races", async () => {
    const { closeCallbacks, database, log, shutdown } = createHarness()

    shutdown("SIGTERM")
    closeCallbacks[0]?.()
    closeCallbacks[0]?.(new Error("late callback error"))
    await Promise.resolve()

    expect(database.close).toHaveBeenCalledOnce()
    expect(
      loggedEvents(log).filter((event) => event === "database_pool_closed")
    ).toHaveLength(1)
    expect(loggedEvents(log)).not.toContain("server_stop_failed")
    expect(JSON.stringify(log.mock.calls)).not.toContain("late callback error")
    expect(vi.getTimerCount()).toBe(0)
  })
})
