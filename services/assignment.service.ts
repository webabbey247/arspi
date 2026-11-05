import "server-only"
import { db } from "@/lib/db"

export type SubmissionFile = { url: string; name: string; size?: number }

/** The shape an assignment block takes inside Course.curriculum. */
export type AssignmentBlockShape = {
  id?: string
  type?: string
  title?: string
  instructions?: string
  submissionType?: "text" | "file" | "link" | "none"
  dueInDays?: string
  points?: string
}

export type LocatedAssignment = {
  blockId:     string
  blockTitle:  string
  lessonId:    string
  lessonTitle: string
  chapterTitle: string
  submissionType: "text" | "file" | "link" | "none"
  points: number | null
}

/** Walks the curriculum JSON and returns every assignment block in order.
 *
 *  Assignments live inside the lesson blocks array, so there is no table to
 *  join — anything that needs to know "which assignments does this course
 *  have" has to read the JSON, and this is the one place that does it. */
export function collectAssignments(curriculum: unknown): LocatedAssignment[] {
  if (!Array.isArray(curriculum)) return []
  const out: LocatedAssignment[] = []

  for (const rawChapter of curriculum) {
    const chapter = rawChapter as { title?: string; lessons?: unknown[] }
    for (const rawLesson of chapter?.lessons ?? []) {
      const lesson = rawLesson as { id?: string; title?: string; blocks?: unknown[] }
      for (const rawBlock of lesson?.blocks ?? []) {
        const b = rawBlock as AssignmentBlockShape
        if (b?.type !== "assignment" || !b.id) continue
        const pts = Number(b.points)
        out.push({
          blockId:        b.id,
          blockTitle:     b.title?.trim() || "Untitled assignment",
          lessonId:       lesson?.id ?? "",
          lessonTitle:    lesson?.title ?? "Untitled lesson",
          chapterTitle:   chapter?.title ?? "Untitled chapter",
          submissionType: b.submissionType ?? "none",
          points:         Number.isFinite(pts) && pts > 0 ? pts : null,
        })
      }
    }
  }
  return out
}

export function findAssignment(curriculum: unknown, blockId: string): LocatedAssignment | null {
  return collectAssignments(curriculum).find(a => a.blockId === blockId) ?? null
}

/** Validates a submission against what the block actually asks for.
 *  Returns an error string, or null when it is acceptable. */
export function validateSubmission(
  assignment: LocatedAssignment,
  body: { text?: string; linkUrl?: string; files?: SubmissionFile[] },
): string | null {
  switch (assignment.submissionType) {
    case "none":
      // Nothing to hand in — the block is instructions only.
      return "This assignment doesn't take a submission."
    case "text":
      return body.text?.trim() ? null : "Write your response before submitting."
    case "link":
      if (!body.linkUrl?.trim()) return "Add the link to your work."
      try {
        const u = new URL(body.linkUrl.trim())
        return u.protocol === "http:" || u.protocol === "https:" ? null : "That link needs to start with http:// or https://."
      } catch {
        return "That doesn't look like a valid link."
      }
    case "file":
      return body.files && body.files.length > 0 ? null : "Attach at least one file."
    default:
      return "Unknown submission type."
  }
}

/** Creates or replaces a student's submission for one assignment block.
 *
 *  Upserts rather than appending: an assignment has one current answer, and a
 *  resubmission after feedback replaces it. Resubmitting moves the row back to
 *  SUBMITTED so it re-enters the reviewer's queue, and clears the previous
 *  grade — stale marks beside new work would be misleading. */
export async function submitAssignment(
  userId: string,
  courseId: string,
  assignment: LocatedAssignment,
  body: { text?: string; linkUrl?: string; files?: SubmissionFile[] },
) {
  const existing = await db.assignmentSubmission.findUnique({
    where: { userId_blockId: { userId, blockId: assignment.blockId } },
  })
  if (existing?.status === "ACCEPTED") {
    return { ok: false as const, error: "This assignment has already been accepted." }
  }

  const data = {
    lessonId:    assignment.lessonId || null,
    lessonTitle: assignment.lessonTitle,
    blockTitle:  assignment.blockTitle,
    text:        body.text?.trim() || null,
    linkUrl:     body.linkUrl?.trim() || null,
    files:       body.files && body.files.length > 0 ? body.files : undefined,
    status:      "SUBMITTED" as const,
    feedback:    null,
    points:      null,
    gradedById:  null,
    gradedAt:    null,
    submittedAt: new Date(),
  }

  const submission = await db.assignmentSubmission.upsert({
    where:  { userId_blockId: { userId, blockId: assignment.blockId } },
    create: { userId, courseId, blockId: assignment.blockId, ...data },
    update: data,
  })
  return { ok: true as const, submission }
}

/** Reviewer decision. `accept` closes it; otherwise it goes back for another go. */
export async function reviewAssignment(
  graderId: string,
  submissionId: string,
  input: { accept: boolean; feedback?: string; points?: number | null },
) {
  const existing = await db.assignmentSubmission.findUnique({ where: { id: submissionId } })
  if (!existing) return { ok: false as const, error: "Submission not found." }

  const submission = await db.assignmentSubmission.update({
    where: { id: submissionId },
    data: {
      status:     input.accept ? "ACCEPTED" : "RETURNED",
      feedback:   input.feedback?.trim() || null,
      points:     input.points ?? null,
      gradedById: graderId,
      gradedAt:   new Date(),
    },
  })
  return { ok: true as const, submission }
}

/** Every submission a student has made in one course, keyed by block id. */
export async function getSubmissionsForStudent(userId: string, courseId: string) {
  const rows = await db.assignmentSubmission.findMany({ where: { userId, courseId } })
  return new Map(rows.map(r => [r.blockId, r]))
}
