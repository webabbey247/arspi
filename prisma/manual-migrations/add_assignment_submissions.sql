-- ============================================================
-- Manual migration: add_assignment_submissions
--
-- In-lesson assignment blocks advertised a `submissionType`
-- ("text" | "file" | "link") but nothing could accept a
-- submission — no route, no table, and the block rendered
-- read-only. This adds the missing storage.
--
-- Keyed on the curriculum content-block id, the same way
-- lesson_progress and the quiz blocks already work.
--
-- Purely additive. Apply with:
--   npm run db:exec -- prisma/manual-migrations/add_assignment_submissions.sql
--   npx prisma generate
--
-- That runs `prisma db execute`, which takes its connection from
-- prisma.config.ts (DIRECT_URL, the Supabase 5432 direct connection).
-- No psql needed. `prisma migrate deploy` is NOT usable on this database:
-- its _prisma_migrations table has no record of 20260407223201_init, so
-- deploy would try to replay the whole init migration.
--
-- Idempotent. Reversible: DROP TABLE assignment_submissions;
-- DROP TYPE "AssignmentSubmissionStatus";
-- ============================================================

BEGIN;

DO $$ BEGIN
  CREATE TYPE "AssignmentSubmissionStatus" AS ENUM ('SUBMITTED', 'RETURNED', 'ACCEPTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "assignment_submissions" (
  "id"          TEXT NOT NULL,
  "userId"      TEXT NOT NULL,
  "courseId"    TEXT NOT NULL,
  "blockId"     TEXT NOT NULL,
  "lessonId"    TEXT,
  "lessonTitle" TEXT,
  "blockTitle"  TEXT,
  "text"        TEXT,
  "linkUrl"     TEXT,
  "files"       JSONB,
  "status"      "AssignmentSubmissionStatus" NOT NULL DEFAULT 'SUBMITTED',
  "feedback"    TEXT,
  "points"      DOUBLE PRECISION,
  "gradedById"  TEXT,
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "gradedAt"    TIMESTAMP(3),
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "assignment_submissions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "assignment_submissions_userId_blockId_key"
  ON "assignment_submissions"("userId", "blockId");
CREATE INDEX IF NOT EXISTS "assignment_submissions_courseId_blockId_idx"
  ON "assignment_submissions"("courseId", "blockId");
CREATE INDEX IF NOT EXISTS "assignment_submissions_courseId_status_idx"
  ON "assignment_submissions"("courseId", "status");

DO $$ BEGIN
  ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_gradedById_fkey"
    FOREIGN KEY ("gradedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMIT;
