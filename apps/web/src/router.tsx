import { QueryClient } from "@tanstack/react-query"
import { createRouter as createTanStackRouter } from "@tanstack/react-router"
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query"
import { routeTree } from "./routeTree.gen"
import type { RouterHistory } from "@tanstack/react-router"

export interface RouterContext {
  queryClient: QueryClient
}

// Tune both thresholds together when production navigation traces are available.
const ROUTE_PENDING_FEEDBACK_MS = 200
const BROWSER_QUERY_RETENTION_MS = 30 * 60 * 1_000

export function getRouter(options: { history?: RouterHistory } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        gcTime:
          typeof window === "undefined"
            ? Infinity
            : BROWSER_QUERY_RETENTION_MS,
        retry: false,
      },
    },
  })
  const router = createTanStackRouter({
    context: { queryClient },
    history: options.history,
    routeTree,

    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
    defaultPendingMs: ROUTE_PENDING_FEEDBACK_MS,
    defaultPendingMinMs: ROUTE_PENDING_FEEDBACK_MS,
    defaultViewTransition: true,
  })

  setupRouterSsrQueryIntegration({ queryClient, router })

  return router
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
