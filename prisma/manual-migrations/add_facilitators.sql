-- ============================================================
-- Manual migration: add_facilitators
--
-- A facilitator directory. Programmes pick facilitators from it
-- (Programs → Facilitators tab, and the Facilitators step of the
-- programme editor). Each programme still stores a snapshot in
-- courses.facilitators, now tagged with "facilitatorId", which is
-- rewritten whenever the directory entry is edited.
--
-- Seeds the institute itself (id 'fac_institute'), the default
-- facilitator on new programmes. It can be edited, not deleted.
--
-- Purely additive. Apply BEFORE deploying the code that uses it:
--   npm run db:exec -- prisma/manual-migrations/add_facilitators.sql
-- Then import the facilitators already on programmes (once):
--   prisma/scripts/backfill-facilitators.ts
--
-- Idempotent. Reversible: DROP TABLE "facilitators";
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS "facilitators" (
  "id"          TEXT         NOT NULL,
  "name"        TEXT         NOT NULL,
  "title"       TEXT         NOT NULL,
  "bio"         TEXT         NOT NULL,
  "imageUrl"    TEXT,
  "credentials" TEXT,
  "isInstitute" BOOLEAN      NOT NULL DEFAULT false,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "facilitators_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "facilitators_name_idx" ON "facilitators"("name");

INSERT INTO "facilitators" ("id", "name", "title", "bio", "isInstitute", "updatedAt")
VALUES (
  'fac_institute',
  'IARPS Institute',
  'Programme Faculty',
  '<p>Delivered by the faculty of IARPS Institute.</p>',
  true,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;

COMMIT;
