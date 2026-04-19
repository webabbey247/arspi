-- Add extended programme detail columns to courses table (idempotent)

ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS tagline              TEXT,
  ADD COLUMN IF NOT EXISTS duration             TEXT,
  ADD COLUMN IF NOT EXISTS format               TEXT,
  ADD COLUMN IF NOT EXISTS "startDate"          TEXT,
  ADD COLUMN IF NOT EXISTS "endDate"            TEXT,
  ADD COLUMN IF NOT EXISTS "cohortSize"         INTEGER,
  ADD COLUMN IF NOT EXISTS rating               DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "reviewCount"        INTEGER,
  ADD COLUMN IF NOT EXISTS "enrolledCount"      INTEGER,
  ADD COLUMN IF NOT EXISTS "countriesCount"     INTEGER,
  ADD COLUMN IF NOT EXISTS overview             TEXT,
  ADD COLUMN IF NOT EXISTS "targetAudience"     JSONB,
  ADD COLUMN IF NOT EXISTS "learningObjectives" JSONB,
  ADD COLUMN IF NOT EXISTS curriculum           JSONB,
  ADD COLUMN IF NOT EXISTS "whatIsIncluded"     JSONB,
  ADD COLUMN IF NOT EXISTS faqs                 JSONB,
  ADD COLUMN IF NOT EXISTS "instructorName"     TEXT,
  ADD COLUMN IF NOT EXISTS "instructorTitle"    TEXT,
  ADD COLUMN IF NOT EXISTS "instructorBio"      TEXT,
  ADD COLUMN IF NOT EXISTS "instructorInitials" TEXT,
  ADD COLUMN IF NOT EXISTS "instructorCredentials" JSONB;
