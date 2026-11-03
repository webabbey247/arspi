-- ============================================================
-- Manual migration: add_assessments_and_grading
--
-- Adds the graded-assessment layer: chapter quizzes (auto-graded
-- from a server-side answer key) and a course project (graded by
-- an instructor against a rubric), plus attempt history and a
-- cached per-student grade rollup.
--
-- Purely additive. Existing programmes are untouched: grading is
-- opt-in per course via courses."gradingEnabled", which defaults
-- to false, so the current "finish every lesson" certificate rule
-- keeps working until an admin turns grading on.
--
-- Apply with:
--   psql "$DIRECT_URL" -f prisma/manual-migrations/add_assessments_and_grading.sql
-- Then: npx prisma generate
--
-- Idempotent: safe to re-run (IF NOT EXISTS / guarded DO blocks).
-- Reversible: DROP TABLE course_grades, assessment_attempts,
-- assessments; DROP TYPE "AttemptStatus", "AssessmentKind"; and
-- ALTER TABLE courses DROP COLUMN ... for the eight columns below.
-- ============================================================

BEGIN;

-- ─── 1. Enums ───────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "AssessmentKind" AS ENUM ('CHAPTER_QUIZ', 'PROJECT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "AttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'GRADED', 'CHANGES_REQUESTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── 2. Per-course grading policy ───────────────────────────────────────────

ALTER TABLE "courses"
  ADD COLUMN IF NOT EXISTS "gradingEnabled"          BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "quizWeight"              INTEGER NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS "projectWeight"           INTEGER NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS "passMark"                INTEGER NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS "componentPassMark"       INTEGER NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS "maxQuizAttempts"         INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS "attemptCooldownHours"    INTEGER NOT NULL DEFAULT 24,
  ADD COLUMN IF NOT EXISTS "maxProjectResubmissions" INTEGER NOT NULL DEFAULT 2;

-- ─── 3. Assessments ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "assessments" (
  "id"             TEXT NOT NULL,
  "courseId"       TEXT NOT NULL,
  "kind"           "AssessmentKind" NOT NULL,
  "title"          TEXT NOT NULL,
  "instructions"   TEXT,
  "chapterId"      TEXT,
  "questions"      JSONB,
  "rubric"         JSONB,
  "drawCount"      INTEGER,
  "shuffleOptions" BOOLEAN NOT NULL DEFAULT true,
  "orderIndex"     INTEGER NOT NULL DEFAULT 0,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "assessments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "assessments_courseId_idx" ON "assessments"("courseId");

-- ─── 4. Attempts ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "assessment_attempts" (
  "id"              TEXT NOT NULL,
  "assessmentId"    TEXT NOT NULL,
  "userId"          TEXT NOT NULL,
  "attemptNo"       INTEGER NOT NULL,
  "status"          "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
  "voided"          BOOLEAN NOT NULL DEFAULT false,
  "servedQuestions" JSONB,
  "answers"         JSONB,
  "files"           JSONB,
  "note"            TEXT,
  "score"           DOUBLE PRECISION,
  "maxScore"        DOUBLE PRECISION,
  "passed"          BOOLEAN,
  "rubricScores"    JSONB,
  "feedback"        TEXT,
  "gradedById"      TEXT,
  "startedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "submittedAt"     TIMESTAMP(3),
  "gradedAt"        TIMESTAMP(3),
  CONSTRAINT "assessment_attempts_pkey" PRIMARY KEY ("id")
);

-- Added after the table shipped; stated as an ALTER so this file stays
-- idempotent for both fresh databases and ones already migrated.
ALTER TABLE "assessment_attempts"
  ADD COLUMN IF NOT EXISTS "optionMap" JSONB;

CREATE UNIQUE INDEX IF NOT EXISTS "assessment_attempts_assessmentId_userId_attemptNo_key"
  ON "assessment_attempts"("assessmentId", "userId", "attemptNo");
CREATE INDEX IF NOT EXISTS "assessment_attempts_userId_assessmentId_idx"
  ON "assessment_attempts"("userId", "assessmentId");

-- ─── 5. Cached grade rollup ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "course_grades" (
  "id"           TEXT NOT NULL,
  "userId"       TEXT NOT NULL,
  "courseId"     TEXT NOT NULL,
  "quizMarks"    DOUBLE PRECISION NOT NULL DEFAULT 0,
  "projectMarks" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "finalMarks"   DOUBLE PRECISION NOT NULL DEFAULT 0,
  "quizPct"      DOUBLE PRECISION NOT NULL DEFAULT 0,
  "projectPct"   DOUBLE PRECISION NOT NULL DEFAULT 0,
  "passed"       BOOLEAN NOT NULL DEFAULT false,
  "computedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "course_grades_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "course_grades_userId_courseId_key"
  ON "course_grades"("userId", "courseId");

-- ─── 6. Foreign keys ────────────────────────────────────────────────────────

DO $$ BEGIN
  ALTER TABLE "assessments" ADD CONSTRAINT "assessments_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_assessmentId_fkey"
    FOREIGN KEY ("assessmentId") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_gradedById_fkey"
    FOREIGN KEY ("gradedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "course_grades" ADD CONSTRAINT "course_grades_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "course_grades" ADD CONSTRAINT "course_grades_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMIT;
