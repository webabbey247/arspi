// Prisma 8 config — read by the `prisma` CLI (Prisma 8, the Prisma Developer
// Platform CLI: auth, project, postgres, deploy, …).
//
// It deliberately declares no `orm` section: Prisma 8's ORM commands
// (contract / db / migration) target its new contract-based client, which
// this app doesn't use yet. The app's database tooling runs on Prisma 7 —
// see prisma.orm.config.ts and the db:* npm scripts.
import { definePrismaConfig } from "prisma/config";

export default definePrismaConfig({});
