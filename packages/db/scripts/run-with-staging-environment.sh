#!/bin/sh

set -eu

unset DATABASE_URL POSTGRES_DB POSTGRES_PASSWORD POSTGRES_PORT POSTGRES_USER

exec node --env-file=../../.env.staging.local --import tsx "$@"
