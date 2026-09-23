# Coin Archive

Coin Archive is a digital archive of coins.

## Getting started

You need Node.js `^22.22.2 || ^24.15.0 || >=26.0.0`, pnpm `10.33.4` through
Corepack, and Docker for local PostgreSQL and integration tests.

Install dependencies from the repository root:

```bash
pnpm install
```

Create the three local environment files and replace example-only values. Do
not commit real credentials:

```bash
cp .env.example .env.local
cp apps/api/.env.example apps/api/.env.local
cp apps/web/.env.example apps/web/.env.local
```

Start and initialize the local database:

```bash
pnpm db:start
pnpm db:migrate
pnpm db:seed
```

Start both development tasks with:

```bash
pnpm dev
```

The web application runs on port 3000 and the standalone API runs on port 3001. Browser clients use the API rather than connecting to the database
package directly. See [ADR 0001](docs/adr/0001-standalone-api-boundary.md)
for the boundary between client runtimes, the API, and persistence.

To run the same local processes while the API connects to the personal Neon
Staging Database, follow the [Neon staging workflow](docs/neon-staging.md) and
use `pnpm dev:staging`.

## Testing

Run the deterministic test suite from the repository root:

```bash
pnpm test
```

For an interactive watch session or a coverage report, target the web workspace:

```bash
pnpm --filter web test:watch
pnpm --filter web test:coverage
```

See the [testing guide](docs/testing.md) for workspace-specific commands,
conventions, and coverage policy.

## API

The first-run setup above creates `apps/api/.env.local`. To run only the
standalone Node API from the repository root:

```bash
pnpm --filter api dev
```

The API defaults to port 3001. Its liveness contract is available at
`GET /health`, PostgreSQL-backed readiness is available at `GET /ready`, and
its generated contract is available at `GET /openapi.json`.

## Database

The first-run setup above creates `.env.local`. Replace its example password,
then start or stop the persistent local PostgreSQL service from the repository
root:

```bash
pnpm db:start
pnpm db:stop
```

Database schemas live in the private `@workspace/db` package. Generate and
commit SQL migrations after changing its schema, then apply migrations
explicitly. API startup never applies migrations. The migration command loads
the root `.env.local` file and builds its connection URL from the same
`POSTGRES_*` values used by Compose. An exported `DATABASE_URL` takes
precedence when targeting another environment.

```bash
DATABASE_URL=postgresql://... pnpm db:generate
pnpm db:migrate
```

To return the local database to its committed migrated and seeded state without
recreating the container or volume, run the explicit reset command:

```bash
pnpm db:reset
```

This permanently removes the existing application schema and prints the target
database name before doing so. It accepts only database URLs whose parsed host
is exactly `localhost` or `127.0.0.1`; there is no remote-reset override. The API
never resets, migrates, or seeds a database during startup.

### Neon staging database maintenance

See the [complete Neon staging workflow](docs/neon-staging.md) for initial
setup, pooled-versus-direct URL placement, local staging development, manual
dummy Coin data, recovery, and the manual smoke test.

The personal staging database is the Neon project's default branch. Create its
private root environment file from the committed example, then replace the
placeholder with the branch's **direct (unpooled)** connection string from
Neon. The pooled application connection string does not belong in this file.

```bash
cp .env.staging.example .env.staging.local
```

The private `.env.staging.local` file is ignored by Git. Apply all checked-in
migrations and transactionally load the committed Issuer and Coin seed data
with the dedicated commands:

```bash
pnpm db:migrate:staging
pnpm db:seed:staging
```

Staging seed is intentionally non-idempotent and is meant for an empty,
migrated database. If committed or manually entered records conflict, it fails
and rolls back instead of updating or overwriting them.

To completely rebuild the configured database from the checked-in migrations
and seed data, run:

```bash
pnpm db:reset:staging
```

**Warning:** this command immediately drops the configured `public` application
schema and Drizzle migration-history schema. It does not prompt, require a
confirmation token, validate the hostname, or verify that the URL identifies a
Neon default branch. Manually inspect the direct URL in `.env.staging.local`
before every destructive reset; an incorrect URL can destroy the wrong
database. Ordinary `db:migrate`, `db:seed`, and loopback-only `db:reset`
continue to use `.env.local`.

The real Drizzle/`pg` readiness path has a separate integration command. It
starts and stops its own local Compose service while retaining its volume. The
suite also exercises the complete reset lifecycle against a separate
`coin_archive_reset_test` database:

```bash
pnpm test:db
```

## Adding components

To add components to your app, run the following command at the root of your `web` app:

```bash
pnpm dlx shadcn@latest add button -c apps/web
```

This will place the ui components in the `packages/ui/src/components` directory.

## Using components

To use the components in your app, import them from the `ui` package.

```tsx
import { Button } from "@workspace/ui/components/button"
```
