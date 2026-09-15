import { readdir, readFile } from "node:fs/promises"
import path from "node:path"

const serverOnlyPackage = "@workspace/db"
const trustedConsumers = new Set(["@workspace/db", "api"])
const dependencyFields = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
]

async function workspacePackagePaths(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(directory, entry.name, "package.json"))
}

const packagePaths = [
  ...(await workspacePackagePaths("apps")),
  ...(await workspacePackagePaths("packages")),
]

for (const packagePath of packagePaths) {
  const manifest = JSON.parse(await readFile(packagePath, "utf8"))
  if (trustedConsumers.has(manifest.name)) continue

  const dependsOnDatabase = dependencyFields.some(
    (field) => manifest[field]?.[serverOnlyPackage] !== undefined
  )

  if (dependsOnDatabase) {
    throw new Error(
      `${manifest.name} cannot depend on server-only package ${serverOnlyPackage}`
    )
  }
}
