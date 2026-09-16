# shadcn/ui monorepo template

This is a TanStack Start monorepo template with shadcn/ui.

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

Copy `apps/api/.env.example` to `apps/api/.env.local`, then run the standalone
Node API from the repository root:

```bash
pnpm --filter api dev
```

The API defaults to port 3001. Its liveness contract is available at
`GET /health`, PostgreSQL-backed readiness is available at `GET /ready`, and
its generated contract is available at `GET /openapi.json`.

## Database

Copy `.env.example` to `.env.local` and replace the example password. Start or
stop the persistent local PostgreSQL service from the repository root:

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

The real Drizzle/`pg` readiness path has a separate integration command. It
starts and stops its own local Compose service while retaining its volume:

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
