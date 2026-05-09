-- Add predefinedAnalytics flag to courses table (idempotent)
-- When true, public program page renders the Metrics + Social Proof sections.

ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS "predefinedAnalytics" BOOLEAN NOT NULL DEFAULT FALSE;
