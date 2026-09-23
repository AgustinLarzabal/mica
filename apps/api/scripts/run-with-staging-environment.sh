#!/bin/sh

set -eu

unset API_ALLOWED_ORIGINS API_DATABASE_CONNECTION_TIMEOUT_MS
unset API_DATABASE_STATEMENT_TIMEOUT_MS API_PORT DATABASE_URL

exec node --env-file=.env.staging.local --import tsx --watch src/server.ts
