-- ============================================================
-- Manual migration: add_volunteer_career_type
--
-- Adds VOLUNTEER to the CareerType enum (Careers → TYPE).
-- Purely additive; IF NOT EXISTS makes it safe to re-run.
-- Run with: npm run db:exec -- prisma/manual-migrations/add_volunteer_career_type.sql
-- ============================================================

ALTER TYPE "CareerType" ADD VALUE IF NOT EXISTS 'VOLUNTEER';
