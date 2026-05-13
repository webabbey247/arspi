-- Add address, date of birth, and preference columns to profiles table (idempotent)

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS "addressLine1" TEXT,
  ADD COLUMN IF NOT EXISTS "addressLine2" TEXT,
  ADD COLUMN IF NOT EXISTS city           TEXT,
  ADD COLUMN IF NOT EXISTS state          TEXT,
  ADD COLUMN IF NOT EXISTS "postalCode"   TEXT,
  ADD COLUMN IF NOT EXISTS "dateOfBirth"  TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS language       TEXT,
  ADD COLUMN IF NOT EXISTS timezone       TEXT;
