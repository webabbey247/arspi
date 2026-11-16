-- ============================================================
-- Manual migration: add_assignment_grading
--
-- Lets marked in-lesson assignments count towards the course grade:
--   * courses.assignmentsInCoursework — per-programme switch: marked
--     assignments join chapter quizzes in the coursework half.
--   * assignment_submissions.scorePct / priorBestPct — the released
--     mark as a %, and the best % from earlier attempts, so the
--     highest mark counts across resubmissions.
--
-- Purely additive; off by default, so no existing grade changes.
-- Apply BEFORE deploying the code that uses it:
--   npm run db:exec -- prisma/manual-migrations/add_assignment_grading.sql
--
-- Idempotent. Reversible:
--   ALTER TABLE courses DROP COLUMN "assignmentsInCoursework";
--   ALTER TABLE assignment_submissions DROP COLUMN "scorePct", DROP COLUMN "priorBestPct";
-- ============================================================

BEGIN;

ALTER TABLE "courses"
  ADD COLUMN IF NOT EXISTS "assignmentsInCoursework" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "assignment_submissions"
  ADD COLUMN IF NOT EXISTS "scorePct"     DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "priorBestPct" DOUBLE PRECISION;

COMMIT;
