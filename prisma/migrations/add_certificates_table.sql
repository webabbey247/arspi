CREATE TABLE IF NOT EXISTS "certificates" (
  "id"          TEXT          NOT NULL,
  "userId"      TEXT          NOT NULL,
  "courseId"    TEXT          NOT NULL,
  "verifyCode"  TEXT          NOT NULL,
  "pdfUrl"      TEXT,
  "issuedAt"    TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt"   TIMESTAMP(3),

  CONSTRAINT "certificates_pkey"               PRIMARY KEY ("id"),
  CONSTRAINT "certificates_userId_courseId_key" UNIQUE ("userId","courseId"),
  CONSTRAINT "certificates_verifyCode_key"      UNIQUE ("verifyCode"),
  CONSTRAINT "certificates_userId_fkey"         FOREIGN KEY ("userId")   REFERENCES "users"("id")   ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "certificates_courseId_fkey"       FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
