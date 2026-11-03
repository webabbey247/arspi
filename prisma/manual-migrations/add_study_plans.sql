-- ============================================================
-- Manual migration: add_study_plans
--
-- Adds the self-paced timetable: a StudyPlan per student per
-- programme holding their weekly availability, and the
-- StudySession rows generated from it.
--
-- Purely additive — no existing table or column is touched.
--
-- Apply with:
--   psql "$DIRECT_URL" -f prisma/manual-migrations/add_study_plans.sql
-- Then: npx prisma generate
--
-- Idempotent. Reversible: DROP TABLE study_sessions, study_plans;
-- DROP TYPE "StudySessionStatus";
-- ============================================================

BEGIN;

DO $$ BEGIN
  CREATE TYPE "StudySessionStatus" AS ENUM ('PLANNED', 'DONE', 'MISSED', 'SKIPPED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "study_plans" (
  "id"            TEXT NOT NULL,
  "userId"        TEXT NOT NULL,
  "courseId"      TEXT NOT NULL,
  "availability"  JSONB NOT NULL,
  "timezone"      TEXT NOT NULL DEFAULT 'UTC',
  "startDate"     TIMESTAMP(3) NOT NULL,
  "targetEndDate" TIMESTAMP(3),
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "study_plans_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "study_plans_userId_courseId_key"
  ON "study_plans"("userId", "courseId");

CREATE TABLE IF NOT EXISTS "study_sessions" (
  "id"               TEXT NOT NULL,
  "planId"           TEXT NOT NULL,
  "date"             TIMESTAMP(3) NOT NULL,
  "startMinute"      INTEGER NOT NULL,
  "endMinute"        INTEGER NOT NULL,
  "lessonIds"        JSONB NOT NULL,
  "lessonTitles"     JSONB NOT NULL,
  "chapterTitle"     TEXT,
  "estimatedMinutes" INTEGER NOT NULL DEFAULT 0,
  "status"           "StudySessionStatus" NOT NULL DEFAULT 'PLANNED',
  "completedAt"      TIMESTAMP(3),
  CONSTRAINT "study_sessions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "study_sessions_planId_date_idx"
  ON "study_sessions"("planId", "date");

DO $$ BEGIN
  ALTER TABLE "study_plans" ADD CONSTRAINT "study_plans_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "study_plans" ADD CONSTRAINT "study_plans_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_planId_fkey"
    FOREIGN KEY ("planId") REFERENCES "study_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMIT;
