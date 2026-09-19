# TanStack data loading for coin routes

Research date: 2026-09-16

## Question

For Mica's coin list and coin detail pages, should data be fetched by route
loaders, by feature components using `useQuery`, or by route loaders that
populate TanStack Query and components that read the same query?

## Recommendation

Use **loader-prefetched TanStack Query data** for both routes:

1. Define one shared `queryOptions` object for the coin list and one
   parameterized options factory for a coin detail. Include the coin UUID in
   the detail key, for example `['coins', 'detail', coinId]`.
2. Await `context.queryClient.query(options)` in each route loader because the
   list is the home page's primary content and the detail record determines
   whether the detail page exists.
3. Read the same options with `useSuspenseQuery` in the rendered feature
   component.
4. Use route `pendingComponent` and `errorComponent` boundaries for the agreed
   loading, invalid-ID, not-found, and request-failure states.

This follows the current TanStack Start guidance: Router loaders coordinate
navigation while Query owns fetched data, freshness, and mutation state. The
guide explicitly recommends sharing query options between loader and component
and awaiting data that determines a page's main content, title, or existence.
It also says a parameterized resource's identity belongs in its query key.
([TanStack Start: TanStack Query](https://tanstack.com/start/latest/docs/framework/react/guide/tanstack-query))

The loader should currently use `queryClient.query`, not
`ensureQueryData`. Mica has TanStack Query 5.102.8, and the current Start guide
targets 5.102 or newer and demonstrates `query`. The general Query prefetching
guide says `query` replaces the now-deprecated `prefetchQuery` and
`ensureQueryData` APIs for the next major version.
([TanStack Query: Prefetching and router integration](https://tanstack.com/query/latest/docs/framework/react/guides/prefetching))

## Required integration shape

Mica's `getRouter()` currently creates no `QueryClient` and exposes no router
context. Instead, `RootDocument` creates a client and wraps only the rendered
children in `QueryClientProvider`. A route loader therefore cannot access that
client, and this setup does not opt into Query's Start SSR dehydration and
hydration support.

Move creation of the `QueryClient` into `getRouter()`, pass it as router
context, type the root route with `createRootRouteWithContext`, and call
`setupRouterSsrQueryIntegration` from the separately installed
`@tanstack/react-router-ssr-query` package. Let that integration provide
`QueryClientProvider`, removing the second client/provider from
`RootDocument`. TanStack says the client should be created per router so each
SSR request has an isolated cache; the integration supplies the provider and
handles dehydration, hydration, and streaming. It warns against adding a
second client. ([TanStack Start: install and create a QueryClient per router](https://tanstack.com/start/latest/docs/framework/react/guide/tanstack-query#install-and-create-a-queryclient-per-router))

Mica already sets `defaultPreloadStaleTime: 0`, which is the recommended value
when Query is the external cache, because it lets Query decide freshness.
Choose a small, explicit Query `staleTime` (the Start example uses 30 seconds,
but calls that a product decision) so freshly hydrated data does not
immediately refetch. This in-memory freshness setting is independent of the
agreed `Cache-Control: no-store` HTTP response policy.
([TanStack Router: passing loader events to an external cache](https://tanstack.com/router/latest/docs/guide/data-loading#passing-all-loader-events-to-an-external-cache),
[TanStack Start: QueryClient setup](https://tanstack.com/start/latest/docs/framework/react/guide/tanstack-query#install-and-create-a-queryclient-per-router))

The query functions may call Mica's standalone HTTP API from both server and
browser runtimes. They should continue using the configured absolute API base
URL and runtime-validate responses. A normal loader can run in the browser
during navigation, so it must not contain credentials or direct database
access. ([TanStack Start: share query options](https://tanstack.com/start/latest/docs/framework/react/guide/tanstack-query#share-query-options-between-the-loader-and-component))

## Why not the alternatives?

### Feature components with plain `useQuery`

This makes loading states local, but it is the wrong default for primary route
content. With the official SSR integration, plain `useQuery` does not execute
on the server and fetches
only after hydration. TanStack recommends preloading critical data in the route
loader to avoid loading flashes and waterfalls and to make it available to
search engines. `useSuspenseQuery`, by contrast, participates in SSR and can
read the cache populated by the loader.
([TanStack Router Query integration](https://tanstack.com/router/latest/docs/integrations/query#using-usesuspensequery-vs-usequery),
[TanStack Router: external data loading](https://tanstack.com/router/latest/docs/guide/external-data-loading#using-loaders-to-ensure-data-is-loaded))

Plain `useQuery` remains appropriate for client-only, non-critical data.

### Router loaders as the sole data owner

Returning the API result directly from a loader and reading it with
`Route.useLoaderData()` is viable and simpler if Mica chooses Router as its only
cache. Router's cache includes preloading, stale-while-revalidate, deduping, and
SSR. Its tradeoffs are coarse invalidation, no cache sharing/deduplication
between routes, and no built-in mutation or optimistic-update APIs.
([TanStack Router: Router cache tradeoffs](https://tanstack.com/router/latest/docs/guide/data-loading#to-router-cache-or-not-to-router-cache))

Mica already depends on and uses TanStack Query, and coin data will plausibly
need cache invalidation after later catalog mutations. Making Router the data
owner for coins while Query owns other remote state would introduce two cache
models without a benefit for this slice.

### Non-blocking loader prefetch

Starting the query in a loader without awaiting it is useful for secondary
content that may stream after the page shell. TanStack recommends awaiting
critical data and only streaming secondary data. The coin list and requested
coin are the defining content of their pages, so neither is secondary.
([TanStack Start: await critical data and stream secondary data](https://tanstack.com/start/latest/docs/framework/react/guide/tanstack-query#await-critical-data-and-stream-secondary-data))

## Error and loading implications

Awaiting the loader query deliberately moves failures into Router's route error
boundary. It also means initial SSR waits for the critical data, while client
navigations can display the route's pending component. TanStack recommends
allowing awaited critical-query errors to reach router error handling rather
than swallowing them.
([TanStack Query: router integration](https://tanstack.com/query/latest/docs/framework/react/guides/prefetching#router-integration))

For the detail page, validate the UUID before issuing the request, preserve a
distinct not-found error for an API `404`, and preserve a generic request error
for transport/server failures. The route boundary can then render the agreed
messages without treating all failures as a missing coin.

## Decision summary

| Choice | Decision |
| --- | --- |
| Fetch coordination | Route loaders |
| Cache/data owner | TanStack Query |
| Critical list and detail fetch | Await in loader |
| Component read | `useSuspenseQuery` with shared options |
| Loader Query API | `queryClient.query` |
| SSR integration | `@tanstack/react-router-ssr-query` |
| QueryClient lifetime | One per router / SSR request |
| Loading and errors | Route pending/error boundaries |
