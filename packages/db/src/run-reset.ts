import { resolveDatabaseUrl } from "./database-url.js"
import { resetLocalDatabase } from "./reset.js"

await resetLocalDatabase(resolveDatabaseUrl(process.env))
