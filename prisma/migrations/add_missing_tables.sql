-- Add all tables that are in schema.prisma but absent from the initial migration.
-- Safe to re-run: every statement uses IF NOT EXISTS / DO $$ blocks.

-- ── Enums ────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "WorkshopType" AS ENUM ('FREE', 'PAID');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "WorkshopCategory" AS ENUM (
    'SHORT_COURSE', 'WEBINAR', 'MASTERCLASS', 'CONFERENCE', 'WORKSHOP'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "WorkshopPaymentMethod" AS ENUM ('CARD', 'PAYPAL', 'BANK_TRANSFER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "WorkshopRegistrationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ContactSubject" AS ENUM (
    'ENQUIRY', 'PROGRAMS', 'PARTNERSHIPS', 'MEDIA', 'OTHER'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ContactStatus" AS ENUM ('NEW', 'READ', 'REPLIED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'UNSUBSCRIBED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Workshops ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "workshops" (
  "id"             TEXT              NOT NULL,
  "title"          TEXT              NOT NULL,
  "slug"           TEXT              NOT NULL,
  "description"    TEXT              NOT NULL,
  "type"           "WorkshopType"    NOT NULL DEFAULT 'FREE',
  "category"       "WorkshopCategory" NOT NULL DEFAULT 'WORKSHOP',
  "fee"            DOUBLE PRECISION  NOT NULL DEFAULT 0,
  "featured"       BOOLEAN           NOT NULL DEFAULT false,
  "published"      BOOLEAN           NOT NULL DEFAULT false,
  "date"           TIMESTAMP(3),
  "startTime"      TEXT              NOT NULL DEFAULT '',
  "endTime"        TEXT              NOT NULL DEFAULT '',
  "timezone"       TEXT              NOT NULL DEFAULT 'UTC',
  "duration"       INTEGER           NOT NULL DEFAULT 2,
  "level"          TEXT              NOT NULL DEFAULT 'BEGINNER',
  "facilitator"    TEXT              NOT NULL DEFAULT '',
  "facilitators"   JSONB,
  "medium"         TEXT              NOT NULL DEFAULT 'ONLINE',
  "onlinePlatform" TEXT,
  "onlineLink"     TEXT,
  "venueAddress"   TEXT,
  "venueCity"      TEXT,
  "venueState"     TEXT,
  "venueCountry"   TEXT,
  "capacity"       INTEGER           NOT NULL DEFAULT 100,
  "registered"     INTEGER           NOT NULL DEFAULT 0,
  "coverImage"     TEXT,
  "instructorId"   TEXT,
  "createdAt"      TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "workshops_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "workshops_slug_key" ON "workshops"("slug");

ALTER TABLE "workshops"
  DROP CONSTRAINT IF EXISTS "workshops_instructorId_fkey";
ALTER TABLE "workshops"
  ADD CONSTRAINT "workshops_instructorId_fkey"
    FOREIGN KEY ("instructorId") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ── Workshop Registrations ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "workshop_registrations" (
  "id"                      TEXT                         NOT NULL,
  "firstName"               TEXT                         NOT NULL,
  "lastName"                TEXT                         NOT NULL,
  "email"                   TEXT                         NOT NULL,
  "organisation"            TEXT,
  "workshopTitle"           TEXT                         NOT NULL,
  "workshopDate"            TEXT                         NOT NULL,
  "workshopTime"            TEXT                         NOT NULL,
  "fee"                     DOUBLE PRECISION             NOT NULL,
  "paymentMethod"           "WorkshopPaymentMethod",
  "status"                  "WorkshopRegistrationStatus" NOT NULL DEFAULT 'PENDING',
  "stripeCheckoutSessionId" TEXT,
  "workshopId"              TEXT,
  "createdAt"               TIMESTAMP(3)                 NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "workshop_registrations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "workshop_registrations_stripeCheckoutSessionId_key"
  ON "workshop_registrations"("stripeCheckoutSessionId")
  WHERE "stripeCheckoutSessionId" IS NOT NULL;

ALTER TABLE "workshop_registrations"
  DROP CONSTRAINT IF EXISTS "workshop_registrations_workshopId_fkey";
ALTER TABLE "workshop_registrations"
  ADD CONSTRAINT "workshop_registrations_workshopId_fkey"
    FOREIGN KEY ("workshopId") REFERENCES "workshops"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ── Insight Categories ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "insight_categories" (
  "id"        TEXT         NOT NULL,
  "name"      TEXT         NOT NULL,
  "slug"      TEXT         NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "insight_categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "insight_categories_name_key" ON "insight_categories"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "insight_categories_slug_key" ON "insight_categories"("slug");

-- ── Authors ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "authors" (
  "id"        TEXT         NOT NULL,
  "name"      TEXT         NOT NULL,
  "jobTitle"  TEXT,
  "bio"       TEXT,
  "avatar"    TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "authors_pkey" PRIMARY KEY ("id")
);

-- ── Insights ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "insights" (
  "id"          TEXT         NOT NULL,
  "title"       TEXT         NOT NULL,
  "slug"        TEXT         NOT NULL,
  "excerpt"     TEXT         NOT NULL,
  "body"        TEXT         NOT NULL,
  "featured"    BOOLEAN      NOT NULL DEFAULT false,
  "published"   BOOLEAN      NOT NULL DEFAULT false,
  "readTime"    TEXT         NOT NULL DEFAULT '5 min read',
  "coverImage"  TEXT,
  "publishedAt" TIMESTAMP(3),
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "authorId"    TEXT,
  "categoryId"  TEXT,
  "createdById" TEXT         NOT NULL,

  CONSTRAINT "insights_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "insights_slug_key" ON "insights"("slug");

ALTER TABLE "insights"
  DROP CONSTRAINT IF EXISTS "insights_authorId_fkey";
ALTER TABLE "insights"
  ADD CONSTRAINT "insights_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "authors"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "insights"
  DROP CONSTRAINT IF EXISTS "insights_categoryId_fkey";
ALTER TABLE "insights"
  ADD CONSTRAINT "insights_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "insight_categories"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "insights"
  DROP CONSTRAINT IF EXISTS "insights_createdById_fkey";
ALTER TABLE "insights"
  ADD CONSTRAINT "insights_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- ── Contact Messages ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "contact_messages" (
  "id"        TEXT             NOT NULL,
  "firstName" TEXT             NOT NULL,
  "lastName"  TEXT             NOT NULL,
  "email"     TEXT             NOT NULL,
  "phone"     TEXT,
  "subject"   "ContactSubject" NOT NULL DEFAULT 'ENQUIRY',
  "message"   TEXT             NOT NULL,
  "status"    "ContactStatus"  NOT NULL DEFAULT 'NEW',
  "createdAt" TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);

-- ── Newsletter Subscribers ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "newsletter_subscribers" (
  "id"               TEXT                 NOT NULL,
  "email"            TEXT                 NOT NULL,
  "status"           "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
  "subscribedAt"     TIMESTAMP(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "unsubscribedAt"   TIMESTAMP(3),

  CONSTRAINT "newsletter_subscribers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "newsletter_subscribers_email_key"
  ON "newsletter_subscribers"("email");

-- ── Password Reset Tokens ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
  "id"        TEXT         NOT NULL,
  "userId"    TEXT         NOT NULL,
  "token"     TEXT         NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "used"      BOOLEAN      NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "password_reset_tokens_token_key"
  ON "password_reset_tokens"("token");

ALTER TABLE "password_reset_tokens"
  DROP CONSTRAINT IF EXISTS "password_reset_tokens_userId_fkey";
ALTER TABLE "password_reset_tokens"
  ADD CONSTRAINT "password_reset_tokens_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
