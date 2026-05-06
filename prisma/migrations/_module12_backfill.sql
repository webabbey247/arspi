-- Module 12 backfill: copy existing description -> new excerpt column
-- so prisma db push can drop description without violating NOT NULL.
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "excerpt" text;
UPDATE "courses" SET "excerpt" = "description" WHERE "excerpt" IS NULL;
ALTER TABLE "courses" ALTER COLUMN "excerpt" SET NOT NULL;
