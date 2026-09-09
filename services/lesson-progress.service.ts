import { db } from "@/lib/db"
import { issueCertificate } from "@/services/certificate.service"

// ── Curriculum shape (mirrors the JSON stored on Course.curriculum) ────────────

export type CurriculumBlock  = { id?: string; type?: string; correctIndex?: number }
export type CurriculumLesson = { id?: string; title: string; description?: string | null; blocks?: CurriculumBlock[] | null }
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

/** Every quiz content-block id in a lesson, keyed by lesson id. Lessons with no
 *  quiz block are omitted — a lesson only "requires a quiz" if this map has it. */
export function collectQuizBlocksByLesson(curriculum: unknown): Map<string, string[]> {
  const map = new Map<string, string[]>()
  if (!Array.isArray(curriculum)) return map
  for (const chapter of curriculum as CurriculumChapter[]) {
    if (!Array.isArray(chapter?.lessons)) continue
    for (const lesson of chapter.lessons) {
      if (!lesson?.id || !Array.isArray(lesson.blocks)) continue
      const quizIds = lesson.blocks.filter(b => b?.type === "quiz" && b.id).map(b => b!.id!)
      if (quizIds.length > 0) map.set(lesson.id, quizIds)
    }
  }
  return map
}

/** Finds a quiz content-block by id anywhere in the curriculum and returns which
 *  lesson it belongs to plus its correct-answer index (server-side source of
 *  truth — never trust a client-submitted "this was correct" claim). */
export function findQuizBlock(curriculum: unknown, blockId: string): { lessonId: string; correctIndex: number } | null {
  if (!Array.isArray(curriculum)) return null
  for (const chapter of curriculum as CurriculumChapter[]) {
    if (!Array.isArray(chapter?.lessons)) continue
    for (const lesson of chapter.lessons) {
      if (!lesson?.id || !Array.isArray(lesson.blocks)) continue
      const block = lesson.blocks.find(b => b?.id === blockId && b?.type === "quiz")
      if (block) return { lessonId: lesson.id, correctIndex: block.correctIndex ?? -1 }
    }
  }
  return null
}

/** True if a lesson has a quiz block — such a lesson can only be completed by
 *  answering that quiz correctly (setQuizAnswer), never through the plain
 *  lesson-completion PATCH. */
export function lessonRequiresQuiz(lesson: CurriculumLesson | null): boolean {
  return !!lesson?.blocks?.some(b => b?.type === "quiz" && b?.id)
}

/** A lesson is "complete": for a quiz-bearing lesson, every quiz block in it
 *  has been answered correctly; otherwise, it's in completedIds. Mirrors the
 *  client's isLessonDone() — kept here so server-side gating checks use the
 *  exact same definition instead of a second, potentially-drifting copy. */
export function isLessonComplete(lesson: CurriculumLesson, completedIds: Set<string>, passedQuizIds: Set<string>): boolean {
  if (!lesson.id) return false
  const quizIds = (lesson.blocks ?? []).filter(b => b?.type === "quiz" && b.id).map(b => b!.id!)
  if (quizIds.length > 0) return quizIds.every(id => passedQuizIds.has(id))
  return completedIds.has(lesson.id)
}

export function isChapterComplete(chapter: CurriculumChapter, completedIds: Set<string>, passedQuizIds: Set<string>): boolean {
  const lessons = chapter.lessons ?? []
  return lessons.length === 0 || lessons.every(l => isLessonComplete(l, completedIds, passedQuizIds))
}

/** Finds the lesson object with the given id anywhere in the curriculum. */
export function findLessonById(curriculum: unknown, lessonId: string): CurriculumLesson | null {
  if (!Array.isArray(curriculum)) return null
  for (const chapter of curriculum as CurriculumChapter[]) {
    const found = chapter?.lessons?.find(l => l?.id === lessonId)
    if (found) return found
  }
  return null
}

/** True if every chapter before the one containing `lessonId` is fully
 *  complete — the sequential-unlock rule enforced server-side, not just in
 *  the UI. False if the lesson isn't found in the curriculum at all. */
export function isLessonUnlocked(curriculum: unknown, lessonId: string, completedIds: Set<string>, passedQuizIds: Set<string>): boolean {
  if (!Array.isArray(curriculum)) return false
  const chapters = curriculum as CurriculumChapter[]
  for (let ci = 0; ci < chapters.length; ci++) {
    if (chapters[ci]?.lessons?.some(l => l?.id === lessonId)) {
      return chapters.slice(0, ci).every(c => isChapterComplete(c, completedIds, passedQuizIds))
    }
  }
  return false
}

/** Deep-clones curriculum with every quiz block's correctIndex removed. Used
 *  before sending curriculum to a student client (GET /api/student/programs/
 *  [slug]) — the correct answer must never cross the network to the student,
 *  regardless of chapter/lesson lock state; only server-side answer-checking
 *  (setQuizAnswer, via findQuizBlock) may see it. */
export function stripQuizAnswers(curriculum: unknown): unknown {
  if (!Array.isArray(curriculum)) return curriculum
  return (curriculum as Record<string, unknown>[]).map(chapter => {
    const lessons = (chapter as { lessons?: unknown }).lessons
    if (!Array.isArray(lessons)) return chapter
    return {
      ...chapter,
      lessons: lessons.map((lesson: Record<string, unknown>) => {
        const blocks = lesson?.blocks
        if (!Array.isArray(blocks)) return lesson
        return {
          ...lesson,
          blocks: blocks.map((block: Record<string, unknown>) =>
            block?.type === "quiz" ? { ...block, correctIndex: undefined } : block
          ),
        }
      }),
    }
  })
}

// ── Reads ────────────────────────────────────────────────────────────────────

export async function getLessonProgress(userId: string, courseId: string): Promise<string[]> {
  const row = await db.lessonProgress.findUnique({ where: { userId_courseId: { userId, courseId } } })
  return Array.isArray(row?.completedIds) ? (row.completedIds as string[]) : []
}

export async function getQuizProgress(userId: string, courseId: string): Promise<string[]> {
  const row = await db.lessonProgress.findUnique({ where: { userId_courseId: { userId, courseId } } })
  return Array.isArray(row?.passedQuizIds) ? (row.passedQuizIds as string[]) : []
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

export type SetQuizAnswerResult = SetLessonCompletionResult & {
  correct:       boolean
  passedQuizIds: string[]
}

/** Records a student's answer to a quiz content-block. The correct index is
 *  looked up from the curriculum server-side — a client can only ever claim
 *  "I picked option N", never "I was right". A wrong answer changes nothing
 *  and can be retried. A correct answer persists the pass and, once every quiz
 *  in that lesson has been passed, marks the lesson complete (cascading into
 *  the same course-completion/certificate check as a manually-ticked lesson). */
export async function setQuizAnswer(
  userId:        string,
  courseId:      string,
  curriculum:    unknown,
  blockId:       string,
  selectedIndex: number,
): Promise<SetQuizAnswerResult | null> {
  const found = findQuizBlock(curriculum, blockId)
  if (!found) return null

  const correct = found.correctIndex === selectedIndex
  const existingQuizIds = await getQuizProgress(userId, courseId)

  if (!correct) {
    const completedIds = await getLessonProgress(userId, courseId)
    return { correct: false, passedQuizIds: existingQuizIds, completedIds, courseCompleted: false, certificate: null }
  }

  const nextQuizIds = Array.from(new Set([...existingQuizIds, blockId]))
  await db.lessonProgress.upsert({
    where:  { userId_courseId: { userId, courseId } },
    create: { userId, courseId, completedIds: [], passedQuizIds: nextQuizIds },
    update: { passedQuizIds: nextQuizIds },
  })

  // If every quiz block in this lesson is now passed, the lesson itself is done.
  const quizzesByLesson = collectQuizBlocksByLesson(curriculum)
  const lessonQuizIds   = quizzesByLesson.get(found.lessonId) ?? []
  const lessonNowDone   = lessonQuizIds.length > 0 && lessonQuizIds.every(id => nextQuizIds.includes(id))

  if (lessonNowDone) {
    const allLessonIds = collectLessonIds(curriculum)
    const result = await setLessonCompletion(userId, courseId, found.lessonId, true, allLessonIds)
    return { correct: true, passedQuizIds: nextQuizIds, ...result }
  }

  const completedIds = await getLessonProgress(userId, courseId)
  return { correct: true, passedQuizIds: nextQuizIds, completedIds, courseCompleted: false, certificate: null }
}
