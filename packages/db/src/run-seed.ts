import { createDatabase } from "./connection.js"
import { resolveDatabaseUrl } from "./database-url.js"
import { readCoinSeed, seedCoins } from "./seed.js"

const database = createDatabase(resolveDatabaseUrl(process.env))

try {
  await seedCoins(database, await readCoinSeed())
} finally {
  await database.close()
}
