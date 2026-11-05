-- ============================================================
-- Manual migration: add_user_sessions
--
-- Auth was entirely stateless (access/refresh/session JWTs), so
-- nothing recorded that a sign-in had happened on a device.
-- That made "active sessions" impossible to list and remote
-- sign-out impossible to perform.
--
-- Each row is one sign-in on one device. The refresh token
-- carries the row id as its `sid` claim; revoking the row makes
-- the next refresh fail, so the device is out within the access
-- token's 15-minute life at worst.
--
-- Purely additive. Apply with:
--   npm run db:exec -- prisma/manual-migrations/add_user_sessions.sql
--   npx prisma generate
--
-- Idempotent. Reversible: DROP TABLE user_sessions;
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS "user_sessions" (
  "id"         TEXT NOT NULL,
  "userId"     TEXT NOT NULL,
  "userAgent"  TEXT,
  "ipAddress"  TEXT,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt"  TIMESTAMP(3) NOT NULL,
  "revokedAt"  TIMESTAMP(3),
  CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "user_sessions_userId_revokedAt_idx"
  ON "user_sessions"("userId", "revokedAt");

DO $$ BEGIN
  ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMIT;
