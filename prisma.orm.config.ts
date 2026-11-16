// Prisma 7 ORM config — used by the `prisma-orm` CLI (Prisma 7, installed
// under that alias) for everything the app's database layer needs: generating
// the client, `db push`, `db execute` for the manual migrations, and seeding.
//
// Why two Prisma CLIs: `prisma` is Prisma 8 (the platform CLI), which no
// longer has `generate` or `db execute` and ships a different, contract-based
// client. This app is built on the Prisma 7 client, so the ORM tasks stay on
// Prisma 7 until the codebase is migrated. Run them through the npm scripts
// (db:push, db:exec, db:seed, postinstall) — they pass `--config` for you.
import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma-orm/config";

// The Prisma CLI is not Next.js: it does not read .env.local on its own, and
// this project keeps its connection strings there (there is no .env at all).
// Load in Next's precedence order — dotenv never overwrites a variable that is
// already set, so the first file to define a key wins, and a real shell
// environment (CI, Vercel) still beats both files.
loadEnv({ path: ".env.local" });
loadEnv();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // DIRECT_URL is the Supabase direct connection (port 5432). DDL must not go
    // through the 6543 transaction pooler, which cannot run it.
    // Falls back to DATABASE_URL so `prisma generate` works in CI without it.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
    shadowDatabaseUrl: process.env.DATABASE_URL
  },
});
