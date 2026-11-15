import "server-only"
import { Prisma } from "@prisma/client"
import { db } from "@/lib/db"
import { evaluateMarks, type CriterionMark, type RubricMarks, type RubricVersionView } from "@/lib/rubric"
import { findAssignment } from "@/services/assignment.service"
import { applyProjectGrade } from "@/services/assessment.service"
import { getCurrentVersion, getVersionById } from "@/services/rubric.service"

/**
 * Rubric marking for assignment submissions and project attempts.
 *
 * Two steps, as in the build guide:
 *   draft   — the marker's selections are saved to `markingDraft` and the
 *             rubric version is pinned. Nothing changes for the learner.
 *   release — marks are validated in full, written to `rubricMarks`, the
 *             total/band/feedback are set, and the draft is cleared. Only
 *             now can the learner see anything.
 */

export type MarkingInput = {
  action:          "draft" | "release"
  criteria:        CriterionMark[]
  overallComment?: string
  /** Assignments only: send the work back for another attempt on release. */
  allowResubmit?:  boolean
}

/** What's kept in `markingDraft`. */
export type MarkingDraft = RubricMarks & { allowResubmit?: boolean }

/** The version to mark against: the one pinned by an earlier draft or mark,
 *  otherwise the rubric's current version. */
async function resolveVersion(pinnedVersionId: string | null, rubricId: string | null) {
  if (pinnedVersionId) {
    const pinned = await getVersionById(pinnedVersionId)
    if (pinned) return pinned
  }
  return rubricId ? getCurrentVersion(rubricId) : null
}

// ── Assignments ──────────────────────────────────────────────────────────────

/** Rubric context for one assignment submission: which rubric applies and
 *  which version marking would use. `null` rubric means plain review. */
export async function assignmentRubricContext(submissionId: string) {
  const sub = await db.assignmentSubmission.findUnique({
    where:   { id: submissionId },
    include: { course: { select: { curriculum: true, instructorId: true } } },
  })
  if (!sub) return null
  const assignment = findAssignment(sub.course.curriculum, sub.blockId)
  const rubricId = assignment?.rubricId ?? null
  const version = await resolveVersion(sub.rubricVersionId, rubricId)
  return { sub, rubricId, version }
}

export async function markAssignment(graderId: string, submissionId: string, input: MarkingInput) {
  const ctx = await assignmentRubricContext(submissionId)
  if (!ctx) return { ok: false as const, status: 404, error: "Submission not found." }
  const { sub, version } = ctx
  if (!version) {
    return { ok: false as const, status: 409, error: "This assignment has no rubric attached." }
  }

  const evaluated = evaluateMarks(version, input, input.action)
  if (!evaluated.ok) return { ok: false as const, status: 400, error: evaluated.error }
  const marks = evaluated.marks

  if (input.action === "draft") {
    const draft: MarkingDraft = { ...marks, allowResubmit: input.allowResubmit }
    await db.assignmentSubmission.update({
      where: { id: sub.id },
      data:  { markingDraft: draft as unknown as Prisma.InputJsonValue, rubricVersionId: version.id },
    })
    return { ok: true as const, marks, version }
  }

  const allowResubmit = input.allowResubmit ?? marks.total < version.passMark
  const updated = await db.assignmentSubmission.update({
    where: { id: sub.id },
    data: {
      status:          allowResubmit ? "RETURNED" : "ACCEPTED",
      rubricVersionId: version.id,
      rubricMarks:     marks as unknown as Prisma.InputJsonValue,
      gradeBand:       marks.gradeBand,
      points:          marks.total,
      feedback:        marks.overallComment.trim() || null,
      markingDraft:    Prisma.DbNull,
      gradedById:      graderId,
      gradedAt:        new Date(),
    },
  })
  return { ok: true as const, marks, version, submission: updated }
}

// ── Projects ─────────────────────────────────────────────────────────────────

export async function projectRubricContext(attemptId: string) {
  const attempt = await db.assessmentAttempt.findUnique({
    where:   { id: attemptId },
    include: { assessment: { include: { course: true } } },
  })
  if (!attempt) return null
  const version = await resolveVersion(attempt.rubricVersionId, attempt.assessment.rubricId)
  return { attempt, version }
}

export async function markProject(graderId: string, attemptId: string, input: MarkingInput) {
  const ctx = await projectRubricContext(attemptId)
  if (!ctx) return { ok: false as const, status: 404, error: "Submission not found." }
  const { attempt, version } = ctx
  if (attempt.assessment.kind !== "PROJECT") {
    return { ok: false as const, status: 409, error: "Not a project attempt." }
  }
  if (!version) return { ok: false as const, status: 409, error: "This project has no rubric attached." }
  if (attempt.status !== "SUBMITTED") {
    return { ok: false as const, status: 409, error: "This submission isn't awaiting grading." }
  }

  const evaluated = evaluateMarks(version, input, input.action)
  if (!evaluated.ok) return { ok: false as const, status: 400, error: evaluated.error }
  const marks = evaluated.marks

  if (input.action === "draft") {
    await db.assessmentAttempt.update({
      where: { id: attempt.id },
      data:  { markingDraft: marks as unknown as Prisma.InputJsonValue, rubricVersionId: version.id },
    })
    return { ok: true as const, marks, version, released: false as const }
  }

  const graded = await applyProjectGrade(graderId, attempt, {
    score:        marks.total,
    maxScore:     version.totalPoints,
    rubricScores: Object.fromEntries(marks.criteria.map(m => [m.key, m.score])),
    feedback:     marks.overallComment.trim(),
    minScore:     version.passMark,
    extra: {
      rubricVersion: { connect: { id: version.id } },
      rubricMarks:   marks as unknown as Prisma.InputJsonValue,
      gradeBand:     marks.gradeBand,
      markingDraft:  Prisma.DbNull,
    },
  })
  return { ok: true as const, marks, version, released: true as const, graded }
}

// ── Learner-facing views ─────────────────────────────────────────────────────

/** What a learner may see of a rubric before marks are released: the full
 *  rubric, but only if the author allowed it. */
export function learnerPreview(version: RubricVersionView | null): RubricVersionView | null {
  return version && version.visibleToLearners ? version : null
}

/** Released marks only. Drafts never pass through here. */
export function releasedMarks(row: { rubricMarks: unknown }): RubricMarks | null {
  const m = row.rubricMarks as RubricMarks | null
  return m && Array.isArray(m.criteria) ? m : null
}
