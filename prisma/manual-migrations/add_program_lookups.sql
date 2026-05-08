-- ============================================================
-- Manual migration: add_program_lookups
--
-- Adds three lookup tables (program_levels / program_formats /
-- program_pricing_options) and three nullable FK columns on
-- the existing "courses" table. Apply with:
--
--   psql "$DATABASE_URL" -f prisma/manual-migrations/add_program_lookups.sql
--
-- Then regenerate the Prisma client:
--
--   npx prisma generate
--
-- Idempotent: re-running this script is safe (uses IF NOT EXISTS).
-- ============================================================

BEGIN;

-- ─── 1. Lookup tables ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "program_levels" (
  "id"        TEXT         NOT NULL,
  "name"      TEXT         NOT NULL,
  "slug"      TEXT         NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "program_levels_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "program_levels_name_key" ON "program_levels"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "program_levels_slug_key" ON "program_levels"("slug");

CREATE TABLE IF NOT EXISTS "program_formats" (
  "id"        TEXT         NOT NULL,
  "name"      TEXT         NOT NULL,
  "slug"      TEXT         NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "program_formats_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "program_formats_name_key" ON "program_formats"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "program_formats_slug_key" ON "program_formats"("slug");

CREATE TABLE IF NOT EXISTS "program_pricing_options" (
  "id"        TEXT         NOT NULL,
  "name"      TEXT         NOT NULL,
  "slug"      TEXT         NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "program_pricing_options_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "program_pricing_options_name_key" ON "program_pricing_options"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "program_pricing_options_slug_key" ON "program_pricing_options"("slug");

-- ─── 2. New nullable FK columns on courses ─────────────────────────────────

ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "programLevelId"   TEXT;
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "programFormatId"  TEXT;
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "programPricingId" TEXT;

-- Drop & re-add FK constraints so re-running the script is safe.
ALTER TABLE "courses" DROP CONSTRAINT IF EXISTS "courses_programLevelId_fkey";
ALTER TABLE "courses" DROP CONSTRAINT IF EXISTS "courses_programFormatId_fkey";
ALTER TABLE "courses" DROP CONSTRAINT IF EXISTS "courses_programPricingId_fkey";

ALTER TABLE "courses"
  ADD CONSTRAINT "courses_programLevelId_fkey"
    FOREIGN KEY ("programLevelId")
    REFERENCES "program_levels"("id")
    ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE "courses"
  ADD CONSTRAINT "courses_programFormatId_fkey"
    FOREIGN KEY ("programFormatId")
    REFERENCES "program_formats"("id")
    ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE "courses"
  ADD CONSTRAINT "courses_programPricingId_fkey"
    FOREIGN KEY ("programPricingId")
    REFERENCES "program_pricing_options"("id")
    ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT;

-- ============================================================
-- OPTIONAL: seed default rows + backfill existing courses
--
-- Comment out the block below if you want to populate via the
-- admin UI instead. Otherwise running it once will:
--   * insert the four legacy levels, five legacy formats, and
--     two legacy pricing buckets,
--   * point each existing course at the matching lookup row.
--
-- Re-running is safe (ON CONFLICT DO NOTHING + idempotent UPDATE).
-- ============================================================

BEGIN;

INSERT INTO "program_levels" ("id", "name", "slug") VALUES
  ('lvl_beginner',     'Beginner',     'beginner'),
  ('lvl_intermediate', 'Intermediate', 'intermediate'),
  ('lvl_advanced',     'Advanced',     'advanced'),
  ('lvl_all',          'All Levels',   'all-levels')
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "program_formats" ("id", "name", "slug") VALUES
  ('fmt_self_paced',   'Self-Paced',   'self-paced'),
  ('fmt_cohort_based', 'Cohort Based', 'cohort-based'),
  ('fmt_live_online',  'Live Online',  'live-online'),
  ('fmt_hybrid',       'Hybrid',       'hybrid'),
  ('fmt_in_person',    'In Person',    'in-person')
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "program_pricing_options" ("id", "name", "slug") VALUES
  ('prc_free', 'Free', 'free'),
  ('prc_paid', 'Paid', 'paid')
ON CONFLICT ("name") DO NOTHING;

-- Backfill courses from legacy enum/string columns.
-- (CourseLevel enum has only BEGINNER/INTERMEDIATE/ADVANCED; "All Levels" is
--  seeded for future use but has nothing to backfill from.)
UPDATE "courses" SET "programLevelId" = 'lvl_beginner'     WHERE "programLevelId" IS NULL AND "level" = 'BEGINNER';
UPDATE "courses" SET "programLevelId" = 'lvl_intermediate' WHERE "programLevelId" IS NULL AND "level" = 'INTERMEDIATE';
UPDATE "courses" SET "programLevelId" = 'lvl_advanced'     WHERE "programLevelId" IS NULL AND "level" = 'ADVANCED';

UPDATE "courses" SET "programFormatId" = 'fmt_self_paced'   WHERE "programFormatId" IS NULL AND "format" = 'Self-Paced';
UPDATE "courses" SET "programFormatId" = 'fmt_cohort_based' WHERE "programFormatId" IS NULL AND "format" = 'Cohort Based';
UPDATE "courses" SET "programFormatId" = 'fmt_live_online'  WHERE "programFormatId" IS NULL AND "format" = 'Live Online';
UPDATE "courses" SET "programFormatId" = 'fmt_hybrid'       WHERE "programFormatId" IS NULL AND "format" = 'Hybrid';
UPDATE "courses" SET "programFormatId" = 'fmt_in_person'    WHERE "programFormatId" IS NULL AND "format" = 'In Person';

UPDATE "courses" SET "programPricingId" = 'prc_free' WHERE "programPricingId" IS NULL AND "pricing" = 'free';
UPDATE "courses" SET "programPricingId" = 'prc_paid' WHERE "programPricingId" IS NULL AND "pricing" = 'paid';

COMMIT;
