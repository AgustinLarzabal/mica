# Neon staging workflow

The Staging Database is the personal Neon project's default branch. The web
application and API still run locally: only the API's PostgreSQL target changes.
Ordinary `pnpm dev` and the local database commands continue to use the existing
local environment files and PostgreSQL service.

## Setup

In the [Neon Console](https://console.neon.tech), create a project dedicated to
disposable Coin Archive staging data. Use the project's automatically created
default branch; do not create a feature or test branch for this workflow. Neon
creates a primary read-write compute and database for that branch.

Open the project's connection details, select its default branch and database,
and copy both forms of the connection string for the same role:

- With connection pooling disabled, copy the direct URL. Its hostname does not
  contain `-pooler`.
- With connection pooling enabled, copy the pooled URL. Its hostname contains
  `-pooler`.

See Neon's documentation for its
[project and branch model](https://neon.com/docs/get-started/workflow-primer)
and [connection pooling](https://neon.com/docs/connect/connection-pooling) if
the Console labels change.

Create the two private staging environment files from their committed examples:

```bash
cp .env.staging.example .env.staging.local
cp apps/api/.env.staging.example apps/api/.env.staging.local
```

In `.env.staging.local`, put Neon's **direct (unpooled)** URL. The maintenance
commands use this URL for migrations, seeding, and schema replacement.

In `apps/api/.env.staging.local`, put Neon's **pooled** application URL. Its
hostname normally contains `-pooler`. This file also holds staging-only API
timeout overrides when they are needed; the committed values retain the normal
5-second connection timeout and 10-second statement timeout.

Both private `*.local` files are ignored by Git. Never put either Neon URL in
`apps/web`: the browser continues to call the local API at
`http://localhost:3001` and must not receive a database credential.

## Commands

Apply checked-in migrations to an empty or existing Staging Database, then load
the committed Issuer and Coin seed data:

```bash
pnpm db:migrate:staging
pnpm db:seed:staging
```

Seeding is transactional and non-idempotent. It fails rather than overwriting
conflicting committed or manually added data.

Start the ordinary local web application together with a local API connected to
Neon:

```bash
pnpm dev:staging
```

API startup only starts the server. It never migrates, seeds, or resets the
Staging Database.

## Manual dummy Coin data

Until the application exposes a Coin-writing workflow, add disposable records
with the Neon SQL Editor. This example associates a new Coin with the seeded
Spain Issuer and returns the new identifier:

```sql
INSERT INTO coins (title, issuer_id)
SELECT 'Manual Neon staging Coin', id
FROM issuers
WHERE code = 'ES'
RETURNING id, title;
```

Refresh the Archive at `http://localhost:3000` to see the Coin. Stopping and
restarting `pnpm dev:staging` does not remove it.

## Recovery

To restore the Staging Database to the checked-in migrations and seed data:

```bash
pnpm db:reset:staging
```

> **Destructive reset warning:** this command immediately drops the configured
> database's `public` application schema and Drizzle migration-history schema.
> It does not prompt, validate the hostname, or verify the Neon branch. Inspect
> the direct URL in `.env.staging.local` before every reset. An incorrect URL can
> destroy the wrong database.

## Manual smoke test

This test intentionally uses private Neon credentials and is not part of the
automated suite.

1. Verify that the root staging file contains the direct URL and the API staging
   file contains the pooled URL for the same Neon default branch.
2. Prepare the database with `pnpm db:migrate:staging` followed by
   `pnpm db:seed:staging`, or recover it with `pnpm db:reset:staging` after
   checking the destructive target.
3. Run `pnpm dev:staging` and wait for both local processes to start.
4. Check liveness with `curl --fail http://localhost:3001/health`.
5. Check database-backed readiness with
   `curl --fail http://localhost:3001/ready`. A successful response confirms
   that the local API can reach Neon.
6. Browse the Archive at `http://localhost:3000` and confirm that the seeded
   Coins load through the local API.
7. Add the dummy Coin above in the Neon SQL Editor, refresh the Archive, and
   confirm it appears.
8. Stop and restart `pnpm dev:staging`, then confirm the dummy Coin remains in
   the Archive. Use `pnpm db:reset:staging` only when that manual data should be
   discarded.
