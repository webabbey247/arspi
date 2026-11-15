-- ============================================================
-- Manual migration: add_rubrics
--
-- Reusable marking rubrics (see the ARPS "Generic Assessment
-- Rubric" build guide). Adds:
--   * rubrics / rubric_versions — a rubric is stored once and
--     versioned, so editing one that has already marked work
--     never rewrites those past marks.
--   * assessments.rubricId — a project can use a library rubric.
--   * rubric marking columns on assignment_submissions and
--     assessment_attempts: the pinned version, the released
--     marks, the grade band, and a staff-only marking draft.
--
-- Purely additive. Apply with:
--   npm run db:exec -- prisma/manual-migrations/add_rubrics.sql
--   npx prisma generate
--
-- Idempotent. Reversible:
--   ALTER TABLE assignment_submissions DROP COLUMN "rubricVersionId",
--     DROP COLUMN "rubricMarks", DROP COLUMN "gradeBand", DROP COLUMN "markingDraft";
--   ALTER TABLE assessment_attempts DROP COLUMN "rubricVersionId",
--     DROP COLUMN "rubricMarks", DROP COLUMN "gradeBand", DROP COLUMN "markingDraft";
--   ALTER TABLE assessments DROP COLUMN "rubricId";
--   DROP TABLE rubric_versions; DROP TABLE rubrics;  (also drops courseId/isDefault)
--   DROP TYPE "RubricStatus"; DROP TYPE "RubricType";
-- ============================================================

BEGIN;

DO $$ BEGIN
  CREATE TYPE "RubricStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "RubricType" AS ENUM ('ANALYTIC', 'HOLISTIC');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "rubrics" (
  "id"             TEXT NOT NULL,
  "title"          TEXT NOT NULL,
  "status"         "RubricStatus" NOT NULL DEFAULT 'DRAFT',
  "currentVersion" INTEGER NOT NULL DEFAULT 1,
  "createdById"    TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "rubrics_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "rubrics_status_idx" ON "rubrics"("status");

-- Programme-specific copies and the default rubric. Added as ALTERs so this
-- file is correct whether or not an earlier version of it was already run.
ALTER TABLE "rubrics"
  ADD COLUMN IF NOT EXISTS "courseId"  TEXT,
  ADD COLUMN IF NOT EXISTS "isDefault" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "rubrics_courseId_idx" ON "rubrics"("courseId");

DO $$ BEGIN
  ALTER TABLE "rubrics" ADD CONSTRAINT "rubrics_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "rubric_versions" (
  "id"                TEXT NOT NULL,
  "rubricId"          TEXT NOT NULL,
  "version"           INTEGER NOT NULL,
  "title"             TEXT NOT NULL,
  "description"       TEXT,
  "type"              "RubricType" NOT NULL DEFAULT 'ANALYTIC',
  "totalPoints"       DOUBLE PRECISION NOT NULL,
  "passMark"          DOUBLE PRECISION NOT NULL,
  "levels"            JSONB NOT NULL,
  "criteria"          JSONB NOT NULL,
  "gradeBands"        JSONB NOT NULL,
  "visibleToLearners" BOOLEAN NOT NULL DEFAULT true,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "rubric_versions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "rubric_versions_rubricId_version_key"
  ON "rubric_versions"("rubricId", "version");

DO $$ BEGIN
  ALTER TABLE "rubric_versions" ADD CONSTRAINT "rubric_versions_rubricId_fkey"
    FOREIGN KEY ("rubricId") REFERENCES "rubrics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "assessments" ADD COLUMN IF NOT EXISTS "rubricId" TEXT;

DO $$ BEGIN
  ALTER TABLE "assessments" ADD CONSTRAINT "assessments_rubricId_fkey"
    FOREIGN KEY ("rubricId") REFERENCES "rubrics"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "assessment_attempts"
  ADD COLUMN IF NOT EXISTS "rubricVersionId" TEXT,
  ADD COLUMN IF NOT EXISTS "rubricMarks"     JSONB,
  ADD COLUMN IF NOT EXISTS "gradeBand"       TEXT,
  ADD COLUMN IF NOT EXISTS "markingDraft"    JSONB;

DO $$ BEGIN
  ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_rubricVersionId_fkey"
    FOREIGN KEY ("rubricVersionId") REFERENCES "rubric_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "assignment_submissions"
  ADD COLUMN IF NOT EXISTS "rubricVersionId" TEXT,
  ADD COLUMN IF NOT EXISTS "rubricMarks"     JSONB,
  ADD COLUMN IF NOT EXISTS "gradeBand"       TEXT,
  ADD COLUMN IF NOT EXISTS "markingDraft"    JSONB;

DO $$ BEGIN
  ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_rubricVersionId_fkey"
    FOREIGN KEY ("rubricVersionId") REFERENCES "rubric_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMIT;
