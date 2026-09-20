interface DatabaseEnvironment {
  DATABASE_URL?: string
  POSTGRES_DB?: string
  POSTGRES_PASSWORD?: string
  POSTGRES_PORT?: string
  POSTGRES_USER?: string
}

export function resolveDatabaseUrl(environment: DatabaseEnvironment): string {
  if (environment.DATABASE_URL) {
    return environment.DATABASE_URL
  }

  if (!environment.POSTGRES_PASSWORD) {
    throw new Error(
      "DATABASE_URL or POSTGRES_PASSWORD is required to apply migrations"
    )
  }

  const databaseUrl = new URL("postgresql://127.0.0.1")
  databaseUrl.username = environment.POSTGRES_USER ?? "coin_archive"
  databaseUrl.password = environment.POSTGRES_PASSWORD
  databaseUrl.port = environment.POSTGRES_PORT ?? "5432"
  databaseUrl.pathname = environment.POSTGRES_DB ?? "coin_archive"

  return databaseUrl.toString()
}
