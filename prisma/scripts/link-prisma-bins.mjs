// Two Prisma CLIs are installed side by side:
//   prisma      → Prisma 8 (the platform CLI)            — `npx prisma …`
//   prisma-orm  → Prisma 7 (generate, db push/execute)   — the db:* npm scripts
// Both packages declare a bin called `prisma`, and npm links the aliased
// Prisma 7 last, so `npx prisma` would silently run Prisma 7. This runs at the
// end of postinstall and points node_modules/.bin/prisma back at Prisma 8.
// Nothing at build time depends on it — the scripts call Prisma 7 by path.
import { existsSync, lstatSync, readlinkSync, rmSync, symlinkSync } from "node:fs"
import { join } from "node:path"

const bin = join("node_modules", ".bin", "prisma")
const target = join("..", "prisma", "dist", "prisma.js")

if (process.platform === "win32") process.exit(0) // npm uses .cmd shims there
if (!existsSync(join("node_modules", "prisma", "dist", "prisma.js"))) process.exit(0)

try {
  if (lstatSync(bin, { throwIfNoEntry: false })?.isSymbolicLink() && readlinkSync(bin) === target) process.exit(0)
  rmSync(bin, { force: true })
  symlinkSync(target, bin)
} catch (e) {
  console.warn(`[link-prisma-bins] could not relink ${bin}: ${e.message}`)
}
