-- ============================================================
-- Manual migration: add_performance_indexes
--
-- Indexes for the WHERE clauses the app runs most. Postgres doesn't index
-- foreign keys by itself, and the existing unique keys on these tables start
-- with userId, so "everything for this programme" queries were full scans:
--   * enrollments(courseId)        — enrolment counts, rosters, grade recompute
--   * lesson_progress(courseId)    — instructor dashboard / students list
--   * course_grades(courseId)      — the same
--   * assessment_attempts(status), (rubricVersionId)  — grading queues, rubric usage
--   * assignment_submissions(rubricVersionId)         — rubric usage / versioning
--   * workshop_registrations(workshopId)              — registration counts
--   * courses(instructorId), (status) — "my programmes", published listings
--   * notifications(userId, createdAt) — the inbox, newest first
--
-- Purely additive and safe to run on a live database (IF NOT EXISTS; each
-- index builds in well under a second at this data size). Apply with:
--   npm run db:exec -- prisma/manual-migrations/add_performance_indexes.sql
-- Reversible: DROP INDEX <name>;
-- ============================================================

CREATE INDEX IF NOT EXISTS "enrollments_courseId_idx"                   ON "enrollments"("courseId");
CREATE INDEX IF NOT EXISTS "lesson_progress_courseId_idx"               ON "lesson_progress"("courseId");
CREATE INDEX IF NOT EXISTS "course_grades_courseId_idx"                 ON "course_grades"("courseId");
CREATE INDEX IF NOT EXISTS "assessment_attempts_status_idx"             ON "assessment_attempts"("status");
CREATE INDEX IF NOT EXISTS "assessment_attempts_rubricVersionId_idx"    ON "assessment_attempts"("rubricVersionId");
CREATE INDEX IF NOT EXISTS "assignment_submissions_rubricVersionId_idx" ON "assignment_submissions"("rubricVersionId");
CREATE INDEX IF NOT EXISTS "workshop_registrations_workshopId_idx"      ON "workshop_registrations"("workshopId");
CREATE INDEX IF NOT EXISTS "courses_instructorId_idx"                   ON "courses"("instructorId");
CREATE INDEX IF NOT EXISTS "courses_status_idx"                         ON "courses"("status");
CREATE INDEX IF NOT EXISTS "notifications_userId_createdAt_idx"         ON "notifications"("userId", "createdAt");
