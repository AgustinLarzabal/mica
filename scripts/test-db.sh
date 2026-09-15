#!/bin/sh

set -eu

service="postgres-test"

stop_database() {
  docker compose --profile integration-test stop "$service"
}

trap stop_database EXIT INT TERM

docker compose --profile integration-test up -d --wait "$service"
DATABASE_URL="postgresql://mica_test@127.0.0.1:5433/mica_test" \
  pnpm --filter @workspace/db test:integration
