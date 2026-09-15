import { migrate } from "drizzle-orm/node-postgres/migrator"

import { createDatabase } from "./connection.js"

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to apply migrations")
}

const database = createDatabase(databaseUrl)

try {
  await migrate(database.orm, { migrationsFolder: "drizzle" })
} finally {
  await database.close()
}
