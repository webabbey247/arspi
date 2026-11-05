import "server-only"
import { db } from "@/lib/db"
import { collectLessonIds, collectQuizBlocksByLesson } from "@/services/lesson-progress.service"
import { collectAssignments } from "@/services/assignment.service"

export type LearnerProgress = {
  userId: string
  name: string
  email: string
  status: "ACTIVE" | "COMPLETED" | "DROPPED"
  enrolledAt: string
  completedAt: string | null
  lessons:     { done: number; total: number; pct: number }
  quizzes:     { passed: number; total: number }
  assignments: { submitted: number; accepted: number; total: number }
  assessments: { attempted: number; passed: number; total: number }
  grade:       { finalMarks: number; quizPct: number; projectPct: number; passed: boolean } | null
  certificate: string | null
  lastActiveAt: string | null
}

export type ProgramProgress = {
  totals: {
    enrolled: number
    completed: number
    lessons: number
    quizzes: number
    assignments: number
    /** Mean lesson completion across every enrolment, 0–100. */
    avgCompletion: number
    awaitingReview: number
  }
  learners: LearnerProgress[]
}

/**
 * Per-student progress for one programme.
 *
 * Everything here is reconstructed from JSON-backed records: lesson ids,
 * quiz block ids and assignment blocks all live inside `Course.curriculum`,
 * and a student's progress is a set of ids on `LessonProgress`. There is no
 * join to do, so the curriculum is walked once up front and each learner is
 * measured against it.
 */
export async function getProgramProgress(courseId: string): Promise<ProgramProgress | null> {
  const course = await db.course.findUnique({ where: { id: courseId } })
  if (!course) return null

  const lessonIds   = collectLessonIds(course.curriculum)
  const quizByLes   = collectQuizBlocksByLesson(course.curriculum)
  const quizIds     = [...quizByLes.values()].flat()
  const assignments = collectAssignments(course.curriculum)
  // Instruction-only blocks can't be submitted, so they shouldn't count
  // against anyone's totals.
  const submittable = assignments.filter(a => a.submissionType !== "none")

  const [enrollments, progressRows, submissions, assessments, attempts, grades, certificates] =
    await Promise.all([
      db.enrollment.findMany({
        where:   { courseId },
        include: { user: { select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } } } },
        orderBy: { enrolledAt: "desc" },
      }),
      db.lessonProgress.findMany({ where: { courseId } }),
      db.assignmentSubmission.findMany({ where: { courseId } }),
      db.assessment.findMany({ where: { courseId }, select: { id: true } }),
      db.assessmentAttempt.findMany({
        where:  { assessment: { courseId }, voided: false },
        select: { userId: true, assessmentId: true, passed: true, status: true },
      }),
      db.courseGrade.findMany({ where: { courseId } }),
      db.certificate.findMany({ where: { courseId }, select: { userId: true, verifyCode: true } }),
    ])

  const progressBy = new Map(progressRows.map(p => [p.userId, p]))
  const gradeBy    = new Map(grades.map(g => [g.userId, g]))
  const certBy     = new Map(certificates.map(c => [c.userId, c.verifyCode]))

  const learners: LearnerProgress[] = enrollments.map(e => {
    const prog        = progressBy.get(e.userId)
    const completed   = new Set((prog?.completedIds as string[]) ?? [])
    const passedQuiz  = new Set((prog?.passedQuizIds as string[]) ?? [])
    const mySubs      = submissions.filter(s => s.userId === e.userId)
    const myAttempts  = attempts.filter(a => a.userId === e.userId)

    const lessonsDone = lessonIds.filter(id => completed.has(id)).length
    const grade       = gradeBy.get(e.userId)

    return {
      userId: e.userId,
      name:   [e.user.profile?.firstName, e.user.profile?.lastName].filter(Boolean).join(" ") || e.user.email,
      email:  e.user.email,
      status: e.status,
      enrolledAt:  e.enrolledAt.toISOString(),
      completedAt: e.completedAt?.toISOString() ?? null,
      lessons: {
        done:  lessonsDone,
        total: lessonIds.length,
        pct:   lessonIds.length > 0 ? Math.round((lessonsDone / lessonIds.length) * 100) : 0,
      },
      quizzes: {
        passed: quizIds.filter(id => passedQuiz.has(id)).length,
        total:  quizIds.length,
      },
      assignments: {
        submitted: mySubs.length,
        accepted:  mySubs.filter(s => s.status === "ACCEPTED").length,
        total:     submittable.length,
      },
      assessments: {
        attempted: new Set(myAttempts.map(a => a.assessmentId)).size,
        passed:    new Set(myAttempts.filter(a => a.passed).map(a => a.assessmentId)).size,
        total:     assessments.length,
      },
      grade: grade
        ? {
            finalMarks: grade.finalMarks,
            quizPct:    grade.quizPct,
            projectPct: grade.projectPct,
            passed:     grade.passed,
          }
        : null,
      certificate: certBy.get(e.userId) ?? null,
      // LessonProgress keeps one updatedAt for the whole course, so this is
      // the last time they touched *anything* — not per-lesson activity.
      lastActiveAt: prog?.updatedAt?.toISOString() ?? null,
    }
  })

  const avg = learners.length > 0
    ? Math.round(learners.reduce((sum, l) => sum + l.lessons.pct, 0) / learners.length)
    : 0

  return {
    totals: {
      enrolled:    learners.length,
      completed:   learners.filter(l => l.status === "COMPLETED").length,
      lessons:     lessonIds.length,
      quizzes:     quizIds.length,
      assignments: submittable.length,
      avgCompletion: avg,
      awaitingReview: submissions.filter(s => s.status === "SUBMITTED").length,
    },
    learners,
  }
}
