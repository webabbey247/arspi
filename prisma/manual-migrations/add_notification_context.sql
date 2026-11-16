-- ============================================================
-- Manual migration: add_notification_context
--
-- notifications.context — what an alert is about (a programme, a
-- person, an enquiry subject), shown as "Related to" in the inbox.
-- Notifications now cover enquiries, applications, registrations,
-- enrolments, submissions, marks and certificates, not just programmes.
--
-- Purely additive. Apply BEFORE deploying the code that uses it:
--   npm run db:exec -- prisma/manual-migrations/add_notification_context.sql
--
-- Idempotent. Reversible: ALTER TABLE notifications DROP COLUMN "context";
-- ============================================================

ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "context" TEXT;
