import { db } from "@/lib/db"
import { collectAssignments, isMarkedAssignment } from "@/services/assignment.service"
import type { AssessmentKind, AttemptStatus, Prisma } from "@prisma/client"
import { notifySafely } from "@/services/notification.service"
import { notifyMarked, notifySubmission } from "@/services/notification-events.service"

/** Authoring shape for a quiz question. `correctIndex` is the answer key and
 *  must never reach a browser — everything that leaves this module for a
 *  student goes through `stripAnswers()`. */
export type QuizQuestion = {
  id:           string
  prompt:       string
  options:      string[]
  correctIndex: number
  points:       number
}

/** A question as served to a student: same shape, answer key removed, and the
 *  options possibly reordered (so `correctIndex` would be meaningless anyway). */
export type ServedQuestion = {
  id:      string
  prompt:  string
  options: string[]
  points:  number
}

export type RubricCriterion = {
  id:        string
  criterion: string
  maxPoints: number
}

export type AttemptFile = { url: string; name: string; size?: number }

/** Why a student can't start an attempt right now. `null` means they can. */
export type AttemptBlock =
  | { reason: "not-enrolled" }
  | { reason: "grading-disabled" }
  | { reason: "already-passed" }
  | { reason: "in-progress"; attemptId: string }
  | { reason: "no-attempts-left"; used: number; max: number }
  | { reason: "cooldown"; availableAt: Date }

// ── Question handling ────────────────────────────────────────────────────────

export function parseQuestions(value: unknown): QuizQuestion[] {
  if (!Array.isArray(value)) return []
  return (value as QuizQuestion[]).filter(
    q => q && typeof q.id === "string" && Array.isArray(q.options) && q.options.length >= 2,
  )
}

export function parseRubric(value: unknown): RubricCriterion[] {
  if (!Array.isArray(value)) return []
  return (value as RubricCriterion[]).filter(
    c => c && typeof c.id === "string" && typeof c.maxPoints === "number",
  )
}

/** Drops the answer key. Every student-facing path must call this. */
export function stripAnswers(questions: QuizQuestion[]): ServedQuestion[] {
  return questions.map(({ id, prompt, options, points }) => ({ id, prompt, options, points }))
}

function shuffle<T>(items: T[]): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** Builds the question set for one attempt. Drawing a subset of a larger pool
 *  and reordering the options is what stops a retake from being a memory test
 *  of the previous attempt rather than of the material. */
export function buildAttemptQuestions(
  pool: QuizQuestion[],
  drawCount: number | null,
  shuffleOptions: boolean,
): {
  served: ServedQuestion[]
  key: Map<string, { correct: number; points: number }>
  /** { [questionId]: number[] } — served option index → authored option index. */
  optionMap: Record<string, number[]>
} {
  const picked = drawCount && drawCount > 0 && drawCount < pool.length
    ? shuffle(pool).slice(0, drawCount)
    : pool

  const served: ServedQuestion[] = []
  const key = new Map<string, { correct: number; points: number }>()
  const optionMap: Record<string, number[]> = {}

  for (const q of picked) {
    const points = Number(q.points) > 0 ? Number(q.points) : 1
    if (!shuffleOptions) {
      served.push({ id: q.id, prompt: q.prompt, options: q.options, points })
      key.set(q.id, { correct: q.correctIndex, points })
      optionMap[q.id] = q.options.map((_, i) => i)
      continue
    }
    // Reorder the options, then record where the right answer ended up and
    // how every served position maps back to the authored one.
    const pairs = shuffle(q.options.map((opt, i) => ({ opt, i })))
    served.push({ id: q.id, prompt: q.prompt, options: pairs.map(p => p.opt), points })
    key.set(q.id, { correct: pairs.findIndex(p => p.i === q.correctIndex), points })
    optionMap[q.id] = pairs.map(p => p.i)
  }

  return { served, key, optionMap }
}

// ── Attempt lifecycle ────────────────────────────────────────────────────────

/** Policy gate for starting a new attempt. Returns `null` when allowed. */
export async function checkCanAttempt(
  userId: string,
  assessmentId: string,
): Promise<AttemptBlock | null> {
  const assessment = await db.assessment.findUnique({
    where:   { id: assessmentId },
    include: { course: true },
  })
  if (!assessment) return { reason: "not-enrolled" }
  if (!assessment.course.gradingEnabled) return { reason: "grading-disabled" }

  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: assessment.courseId } },
  })
  if (!enrollment) return { reason: "not-enrolled" }

  // Voided attempts stay in the history but don't consume the allowance.
  const attempts = await db.assessmentAttempt.findMany({
    where:   { assessmentId, userId, voided: false },
    orderBy: { attemptNo: "desc" },
  })

  const open = attempts.find(a => a.status === "IN_PROGRESS")
  if (open) return { reason: "in-progress", attemptId: open.id }

  // Passing closes the instrument — no grinding for a better mark.
  if (attempts.some(a => a.passed)) return { reason: "already-passed" }

  const max = assessment.kind === "PROJECT"
    ? assessment.course.maxProjectResubmissions + 1
    : assessment.course.maxQuizAttempts
  if (attempts.length >= max) {
    return { reason: "no-attempts-left", used: attempts.length, max }
  }

  // Cooldown applies to quizzes only — a project resubmission is gated by the
  // instructor returning it, which is a slower loop already.
  if (assessment.kind === "CHAPTER_QUIZ" && attempts.length > 0) {
    const last = attempts[0]
    const since = last.submittedAt ?? last.startedAt
    const availableAt = new Date(since.getTime() + assessment.course.attemptCooldownHours * 3_600_000)
    if (availableAt > new Date()) return { reason: "cooldown", availableAt }
  }

  return null
}

/** Opens an attempt and pins its questions. Pinning matters: without it, an
 *  admin editing the assessment mid-attempt would change the paper underneath
 *  the student and invalidate their answers. */
export async function startAttempt(userId: string, assessmentId: string) {
  const blocked = await checkCanAttempt(userId, assessmentId)
  if (blocked) return { ok: false as const, blocked }

  const assessment = await db.assessment.findUniqueOrThrow({ where: { id: assessmentId } })
  // Numbering counts voided attempts too, so attemptNo stays unique per student.
  const used = await db.assessmentAttempt.count({ where: { assessmentId, userId } })

  const built = assessment.kind === "CHAPTER_QUIZ"
    ? buildAttemptQuestions(
        parseQuestions(assessment.questions),
        assessment.drawCount,
        assessment.shuffleOptions,
      )
    : null

  const attempt = await db.assessmentAttempt.create({
    data: {
      assessmentId, userId,
      attemptNo:       used + 1,
      status:          "IN_PROGRESS",
      servedQuestions: built?.served ?? undefined,
      optionMap:       built?.optionMap ?? undefined,
    },
  })

  return { ok: true as const, attempt }
}

/** Scores a quiz attempt server-side and rolls the course grade forward.
 *  The answer key is re-derived here from the stored curriculum — the client
 *  sends only `{ questionId: selectedIndex }`. */
export async function submitQuizAttempt(
  userId: string,
  attemptId: string,
  answers: Record<string, number>,
) {
  const attempt = await db.assessmentAttempt.findUnique({
    where:   { id: attemptId },
    include: { assessment: { include: { course: true } } },
  })
  if (!attempt || attempt.userId !== userId) return { ok: false as const, error: "Attempt not found." }
  if (attempt.status !== "IN_PROGRESS")      return { ok: false as const, error: "This attempt has already been submitted." }
  if (attempt.assessment.kind !== "CHAPTER_QUIZ") return { ok: false as const, error: "Not a quiz attempt." }

  const served = (attempt.servedQuestions ?? []) as ServedQuestion[]
  const pool   = parseQuestions(attempt.assessment.questions)

  // Grade through the stored permutation. Comparing option TEXT instead would
  // mis-grade any question with two identically-worded options — a student
  // picking the wrong duplicate would be marked correct.
  const optionMap = (attempt.optionMap ?? {}) as Record<string, number[]>
  let score = 0
  let maxScore = 0
  for (const q of served) {
    const source = pool.find(p => p.id === q.id)
    if (!source) continue
    const points = Number(q.points) > 0 ? Number(q.points) : 1
    maxScore += points

    const chosenIndex = answers[q.id]
    if (typeof chosenIndex !== "number") continue
    const map = optionMap[q.id]
    // Fall back to the served order for attempts started before optionMap existed.
    const authoredIndex = Array.isArray(map) ? map[chosenIndex] : chosenIndex
    if (authoredIndex === source.correctIndex) score += points
  }

  const pct    = maxScore > 0 ? (score / maxScore) * 100 : 0
  const passed = pct >= attempt.assessment.course.componentPassMark

  await db.assessmentAttempt.update({
    where: { id: attemptId },
    data: {
      status: "GRADED", answers, score, maxScore, passed,
      submittedAt: new Date(), gradedAt: new Date(),
    },
  })

  const grade = await recomputeCourseGrade(userId, attempt.assessment.courseId)
  return { ok: true as const, score, maxScore, pct, passed, grade }
}

/** Files in, awaiting a human. Projects are never auto-scored. */
export async function submitProjectAttempt(
  userId: string,
  attemptId: string,
  files: AttemptFile[],
  note?: string,
) {
  const attempt = await db.assessmentAttempt.findUnique({
    where:   { id: attemptId },
    include: { assessment: true },
  })
  if (!attempt || attempt.userId !== userId) return { ok: false as const, error: "Attempt not found." }
  if (attempt.status !== "IN_PROGRESS")      return { ok: false as const, error: "This attempt has already been submitted." }
  if (attempt.assessment.kind !== "PROJECT") return { ok: false as const, error: "Not a project attempt." }
  if (files.length === 0)                    return { ok: false as const, error: "Attach at least one file." }

  const updated = await db.assessmentAttempt.update({
    where: { id: attemptId },
    data:  { status: "SUBMITTED", files, note, submittedAt: new Date() },
  })
  notifySafely(() => notifySubmission({
    userId, courseId: attempt.assessment.courseId, itemTitle: attempt.assessment.title,
    kind: "project", resubmitted: attempt.attemptNo > 1,
  }))
  return { ok: true as const, attempt: updated }
}

/** Instructor grading. `pass` false returns the work for resubmission rather
 *  than burning the attempt outright, as long as resubmissions remain. */
export async function gradeProjectAttempt(
  graderId: string,
  attemptId: string,
  rubricScores: Record<string, number>,
  feedback: string,
) {
  const attempt = await db.assessmentAttempt.findUnique({
    where:   { id: attemptId },
    include: { assessment: { include: { course: true } } },
  })
  if (!attempt) return { ok: false as const, error: "Attempt not found." }
  if (attempt.assessment.kind !== "PROJECT") return { ok: false as const, error: "Not a project attempt." }

  const rubric = parseRubric(attempt.assessment.rubric)
  let score = 0
  let maxScore = 0
  for (const c of rubric) {
    maxScore += c.maxPoints
    score += Math.min(Math.max(rubricScores[c.id] ?? 0, 0), c.maxPoints)
  }

  return applyProjectGrade(graderId, attempt, { score, maxScore, rubricScores, feedback })
}

type AttemptWithCourse = Prisma.AssessmentAttemptGetPayload<{
  include: { assessment: { include: { course: true } } }
}>

/** Records a project grade and rolls the course grade forward. Shared by the
 *  legacy inline rubric and library rubrics so both follow the same pass,
 *  resubmission and certificate rules.
 *
 *  `minScore` lets a library rubric add its own pass mark on top of the
 *  course's componentPassMark: the work must clear both. */
export async function applyProjectGrade(
  graderId: string,
  attempt: AttemptWithCourse,
  input: {
    score: number
    maxScore: number
    rubricScores: Record<string, number>
    feedback: string
    minScore?: number
    extra?: Prisma.AssessmentAttemptUpdateInput
  },
) {
  const { score, maxScore, rubricScores, feedback } = input
  const pct    = maxScore > 0 ? (score / maxScore) * 100 : 0
  const passed = pct >= attempt.assessment.course.componentPassMark &&
    (input.minScore === undefined || score >= input.minScore)

  const used      = await db.assessmentAttempt.count({ where: { assessmentId: attempt.assessmentId, userId: attempt.userId, voided: false } })
  const mayResubmit = !passed && used <= attempt.assessment.course.maxProjectResubmissions

  await db.assessmentAttempt.update({
    where: { id: attempt.id },
    data: {
      ...input.extra,
      status: mayResubmit ? "CHANGES_REQUESTED" : "GRADED",
      rubricScores, feedback, score, maxScore, passed,
      gradedBy: { connect: { id: graderId } },
      gradedAt: new Date(),
    },
  })

  const grade = await recomputeCourseGrade(attempt.userId, attempt.assessment.courseId)
  notifySafely(() => notifyMarked({
    userId: attempt.userId, courseId: attempt.assessment.courseId, itemTitle: attempt.assessment.title,
    outcome: passed ? "passed" : mayResubmit ? "returned" : "graded",
    scoreText: `${Math.round(pct)}%`,
  }))
  return { ok: true as const, score, maxScore, pct, passed, mayResubmit, grade }
}

// ── Grade rollup ─────────────────────────────────────────────────────────────

/** Recomputes and caches a student's marks for one course.
 *
 *  Coursework (quiz) half = the average, item by item, of
 *    - each chapter quiz (best attempt), and
 *    - each marked module assignment, when the programme turns on
 *      `assignmentsInCoursework` (its highest released mark)
 *  Project half = the average of
 *    - each PROJECT assessment (best attempt), and
 *    - each assignment block flagged as the final project (highest mark)
 *  Final = the two halves scaled to quizWeight / projectWeight, out of 100.
 *
 *  Highest-counts rewards mastery: a learner who revises and retakes isn't
 *  punished for the attempt that prompted the revision. Anything not yet
 *  attempted or not yet marked counts as zero, so the mark reflects the whole
 *  course rather than only the parts someone chose to do. */
export async function recomputeCourseGrade(userId: string, courseId: string) {
  const course = await db.course.findUnique({ where: { id: courseId } })
  if (!course) return null

  const [assessments, attempts, submissions] = await Promise.all([
    db.assessment.findMany({ where: { courseId } }),
    db.assessmentAttempt.findMany({
      where: { userId, assessment: { courseId }, voided: false, status: { in: ["GRADED", "CHANGES_REQUESTED"] } },
    }),
    db.assignmentSubmission.findMany({
      where:  { userId, courseId },
      select: { blockId: true, scorePct: true, priorBestPct: true },
    }),
  ])

  const bestPct = (assessmentId: string): number => {
    const mine = attempts.filter(a => a.assessmentId === assessmentId && a.maxScore && a.maxScore > 0)
    if (mine.length === 0) return 0
    return Math.max(...mine.map(a => ((a.score ?? 0) / (a.maxScore ?? 1)) * 100))
  }
  const subByBlock = new Map(submissions.map(s => [s.blockId, s]))
  const assignmentPct = (blockId: string): number => {
    const sub = subByBlock.get(blockId)
    return sub ? Math.min(100, Math.max(sub.scorePct ?? 0, sub.priorBestPct ?? 0)) : 0
  }

  const marked = collectAssignments(course.curriculum).filter(isMarkedAssignment)
  const finalProjects = marked.filter(a => a.isFinalProject)
  const moduleAssignments = course.assignmentsInCoursework ? marked.filter(a => !a.isFinalProject) : []

  const courseworkItems = [
    ...assessments.filter(a => a.kind === "CHAPTER_QUIZ").map(a => bestPct(a.id)),
    ...moduleAssignments.map(a => assignmentPct(a.blockId)),
  ]
  const projectItems = [
    ...assessments.filter(a => a.kind === "PROJECT").map(a => bestPct(a.id)),
    ...finalProjects.map(a => assignmentPct(a.blockId)),
  ]
  const mean = (xs: number[]) => (xs.length > 0 ? xs.reduce((s, x) => s + x, 0) / xs.length : 0)

  const quizPct    = mean(courseworkItems)
  const projectPct = mean(projectItems)

  const quizMarks    = (quizPct / 100) * course.quizWeight
  const projectMarks = (projectPct / 100) * course.projectWeight
  const finalMarks   = quizMarks + projectMarks

  // Both halves must clear componentPassMark independently — otherwise a
  // perfect coursework score and no project at all would pass on the average.
  const passed =
    finalMarks >= course.passMark &&
    (courseworkItems.length === 0 || quizPct    >= course.componentPassMark) &&
    (projectItems.length    === 0 || projectPct >= course.componentPassMark)

  const round = (n: number) => Math.round(n * 100) / 100

  return db.courseGrade.upsert({
    where:  { userId_courseId: { userId, courseId } },
    create: {
      userId, courseId,
      quizMarks: round(quizMarks), projectMarks: round(projectMarks), finalMarks: round(finalMarks),
      quizPct: round(quizPct), projectPct: round(projectPct), passed,
    },
    update: {
      quizMarks: round(quizMarks), projectMarks: round(projectMarks), finalMarks: round(finalMarks),
      quizPct: round(quizPct), projectPct: round(projectPct), passed,
    },
  })
}

/** Rebuilds every enrolled learner's cached grade — after a change to how the
 *  programme is graded (policy, final-project flag, assignments added). */
export async function recomputeCourseGradesForAll(courseId: string) {
  const enrolled = await db.enrollment.findMany({ where: { courseId }, select: { userId: true } })
  for (const e of enrolled) await recomputeCourseGrade(e.userId, courseId)
  return enrolled.length
}

/** The certificate gate. Courses with grading off keep the original rule
 *  (every lesson complete) so nothing already live changes behaviour. */
export async function hasPassedCourse(userId: string, courseId: string): Promise<boolean> {
  const course = await db.course.findUnique({ where: { id: courseId } })
  if (!course?.gradingEnabled) return true

  const grade = await db.courseGrade.findUnique({
    where: { userId_courseId: { userId, courseId } },
  })
  return grade?.passed ?? false
}

/** Lets an instructor hand back one more try when a student has exhausted the
 *  cap — without this, exhausting `maxQuizAttempts` is a permanent dead end.
 *  Voids the earliest failed attempt rather than renumbering: history and
 *  attempt numbers stay intact, and the allowance frees up by one. */
export async function grantExtraAttempt(assessmentId: string, userId: string) {
  const earliestFailed = await db.assessmentAttempt.findFirst({
    where:   { assessmentId, userId, voided: false, passed: false },
    orderBy: { attemptNo: "asc" },
  })
  if (!earliestFailed) return null

  const voided = await db.assessmentAttempt.update({
    where: { id: earliestFailed.id },
    data:  { voided: true },
  })
  // A voided attempt no longer counts towards the best-of, so the cached
  // grade has to be rebuilt.
  const assessment = await db.assessment.findUnique({ where: { id: assessmentId } })
  if (assessment) await recomputeCourseGrade(userId, assessment.courseId)
  return voided
}

export type { AssessmentKind, AttemptStatus }
