import { resolveDatabaseUrl } from "../database-url.js"
import { rebuildDatabase } from "../reset.js"

await rebuildDatabase(resolveDatabaseUrl(process.env))
