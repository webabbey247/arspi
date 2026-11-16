-- ============================================================
-- Manual migration: add_staff_review_notifications
--
--   * users.invitedAt — staff invited/imported by an admin; with a
--     null password it means "invite not accepted yet".
--   * courses.submittedForReviewAt / submittedById / submissionNote —
--     an assigned instructor submits a programme for approval.
--   * notifications — in-app alerts shown under the workspace bell.
--
-- Purely additive. Apply BEFORE deploying the code that uses it
-- (the app reads these columns on every user and course query):
--   npm run db:exec -- prisma/manual-migrations/add_staff_review_notifications.sql
--   npx prisma generate
--
-- Idempotent. Reversible:
--   DROP TABLE notifications;
--   ALTER TABLE courses DROP COLUMN "submittedForReviewAt",
--     DROP COLUMN "submittedById", DROP COLUMN "submissionNote";
--   ALTER TABLE users DROP COLUMN "invitedAt";
-- ============================================================

BEGIN;

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "invitedAt" TIMESTAMP(3);

ALTER TABLE "courses"
  ADD COLUMN IF NOT EXISTS "submittedForReviewAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "submittedById"        TEXT,
  ADD COLUMN IF NOT EXISTS "submissionNote"       TEXT;

DO $$ BEGIN
  ALTER TABLE "courses" ADD CONSTRAINT "courses_submittedById_fkey"
    FOREIGN KEY ("submittedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "notifications" (
  "id"        TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "type"      TEXT NOT NULL,
  "title"     TEXT NOT NULL,
  "body"      TEXT,
  "link"      TEXT,
  "readAt"    TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "notifications_userId_readAt_idx" ON "notifications"("userId", "readAt");

DO $$ BEGIN
  ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMIT;
