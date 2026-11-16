-- ============================================================
-- Manual migration: add_program_outline_intro
--
-- courses.outlineIntro — the intro paragraph under "Programme
-- Outline" on the public programme page, editable per programme.
-- Empty falls back to a default sentence built from the module count.
--
-- Purely additive. Apply BEFORE deploying the code that uses it:
--   npm run db:exec -- prisma/manual-migrations/add_program_outline_intro.sql
--
-- Idempotent. Reversible: ALTER TABLE courses DROP COLUMN "outlineIntro";
-- ============================================================

ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "outlineIntro" TEXT;
