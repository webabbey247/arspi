-- ============================================================
-- Manual migration: make_program_instructor_optional
--
-- Programmes no longer get a default instructor (previously the
-- admin who created them). courses.instructorId becomes nullable;
-- an admin assigns — and can reassign — an instructor with
-- "Assign for review". If an instructor account is deleted, their
-- programmes become unassigned instead of blocking the delete.
--
-- Apply BEFORE deploying the code that uses it:
--   npm run db:exec -- prisma/manual-migrations/make_program_instructor_optional.sql
-- (db:exec runs Prisma 7's `db execute` — see prisma.orm.config.ts)
--
-- Idempotent. Reversible only if no programme is unassigned:
--   ALTER TABLE courses ALTER COLUMN "instructorId" SET NOT NULL;
-- ============================================================

BEGIN;

ALTER TABLE "courses" ALTER COLUMN "instructorId" DROP NOT NULL;

ALTER TABLE "courses" DROP CONSTRAINT IF EXISTS "courses_instructorId_fkey";
ALTER TABLE "courses" ADD CONSTRAINT "courses_instructorId_fkey"
  FOREIGN KEY ("instructorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT;

-- ------------------------------------------------------------
-- OPTIONAL, run separately if wanted: existing programmes created
-- by an admin were automatically "owned" by that admin. To make
-- them unassigned (so they show as needing assignment), run:
--
--   UPDATE "courses" c SET "instructorId" = NULL
--   FROM "users" u
--   WHERE c."instructorId" = u.id AND u.role = 'ADMIN';
-- ------------------------------------------------------------
