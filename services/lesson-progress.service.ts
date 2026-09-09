import { db } from "@/lib/db"
import { issueCertificate } from "@/services/certificate.service"

// ── Curriculum shape (mirrors the JSON stored on Course.curriculum) ────────────

export type CurriculumLesson = { id?: string; title: string; description?: string | null }
export type CurriculumChapter = { id?: string; title: string; lessons?: CurriculumLesson[] | null }

/** Flattens every lesson id present in a course's curriculum JSON. Chapters/lessons
 *  created before the id-stamping change may not have one yet — those are simply
 *  excluded (they can't be marked complete until the program is re-saved). */
export function collectLessonIds(curriculum: unknown): string[] {
  if (!Array.isArray(curriculum)) return []
  const ids: string[] = []
  for (const chapter of curriculum as CurriculumChapter[]) {
    if (!Array.isArray(chapter?.lessons)) continue
    for (const lesson of chapter.lessons) {
      if (lesson?.id) ids.push(lesson.id)
    }
  }
  return ids
}

// ── Reads ────────────────────────────────────────────────────────────────────

export async function getLessonProgress(userId: string, courseId: string): Promise<string[]> {
  const row = await db.lessonProgress.findUnique({ where: { userId_courseId: { userId, courseId } } })
  return Array.isArray(row?.completedIds) ? (row.completedIds as string[]) : []
}

// ── Writes ───────────────────────────────────────────────────────────────────

export type SetLessonCompletionResult = {
  completedIds:    string[]
  courseCompleted: boolean
  certificate:     { id: string; verifyCode: string } | null
}

/** Marks a curriculum lesson complete/incomplete for a student, then checks
 *  whether every lesson in the course is now complete — if so (and the
 *  enrollment isn't already marked COMPLETED), flips the enrollment and issues
 *  a certificate. Unmarking a lesson never reverts an already-completed
 *  enrollment — that stays admin-controlled, same as the manual override path. */
export async function setLessonCompletion(
  userId:      string,
  courseId:    string,
  lessonId:    string,
  completed:   boolean,
  allLessonIds: string[],
): Promise<SetLessonCompletionResult> {
  const existing = await getLessonProgress(userId, courseId)
  const next = completed
    ? Array.from(new Set([...existing, lessonId]))
    : existing.filter(id => id !== lessonId)

  await db.lessonProgress.upsert({
    where:  { userId_courseId: { userId, courseId } },
    create: { userId, courseId, completedIds: next },
    update: { completedIds: next },
  })

  const courseCompleted = allLessonIds.length > 0 && allLessonIds.every(id => next.includes(id))

  let certificate: SetLessonCompletionResult["certificate"] = null
  if (courseCompleted) {
    const enrollment = await db.enrollment.findUnique({ where: { userId_courseId: { userId, courseId } } })
    if (enrollment && enrollment.status !== "COMPLETED") {
      await db.enrollment.update({
        where: { id: enrollment.id },
        data:  { status: "COMPLETED", completedAt: new Date() },
      })
    }
    const result = await issueCertificate(userId, courseId)
    if (result.success) certificate = { id: result.data.id, verifyCode: result.data.verifyCode }
  }

  return { completedIds: next, courseCompleted, certificate }
}
