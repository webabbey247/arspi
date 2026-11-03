import { NextRequest, NextResponse } from "next/server"
import { requireApiRole } from "@/lib/guard"
import { db } from "@/lib/db"
import { getProgramBySlug } from "@/services/program.service"
import { checkCanAttempt, parseQuestions, parseRubric } from "@/services/assessment.service"

type Context = { params: Promise<{ slug: string }> }

/** GET /api/student/programs/[slug]/assessments — the student's assessment
 *  board: what exists, how they've done, and whether they can sit it now.
 *
 *  Deliberately never returns `questions` or `correctIndex`. The only path
 *  that serves question text is starting an attempt, which serves a pinned,
 *  answer-stripped copy. */
export async function GET(_req: NextRequest, { params }: Context) {
  try {
    const guard = await requireApiRole("USER")
    if (!guard.ok) return guard.response
    const { session } = guard

    const { slug } = await params
    const program = await getProgramBySlug(slug)
    if (!program) return NextResponse.json({ error: "Program not found." }, { status: 404 })

    const enrollment = await db.enrollment.findUnique({
      where: { userId_courseId: { userId: session.sub, courseId: program.id } },
    })
    if (!enrollment) return NextResponse.json({ error: "You are not enrolled in this program." }, { status: 403 })

    const [assessments, attempts, grade] = await Promise.all([
      db.assessment.findMany({ where: { courseId: program.id }, orderBy: [{ kind: "asc" }, { orderIndex: "asc" }] }),
      db.assessmentAttempt.findMany({
        where:   { userId: session.sub, assessment: { courseId: program.id } },
        orderBy: { attemptNo: "asc" },
      }),
      db.courseGrade.findUnique({ where: { userId_courseId: { userId: session.sub, courseId: program.id } } }),
    ])

    const rows = await Promise.all(assessments.map(async a => {
      const mine    = attempts.filter(t => t.assessmentId === a.id)
      const counted = mine.filter(t => !t.voided)
      const scored  = counted.filter(t => t.maxScore && t.maxScore > 0)
      const bestPct = scored.length > 0
        ? Math.max(...scored.map(t => ((t.score ?? 0) / (t.maxScore ?? 1)) * 100))
        : null
      const blocked = await checkCanAttempt(session.sub, a.id)

      return {
        id:        a.id,
        kind:      a.kind,
        title:     a.title,
        chapterId: a.chapterId,
        instructions: a.instructions,
        // Counts only — never the questions themselves.
        questionCount: a.kind === "CHAPTER_QUIZ"
          ? (a.drawCount ?? parseQuestions(a.questions).length)
          : null,
        rubric: a.kind === "PROJECT" ? parseRubric(a.rubric) : null,
        attemptsUsed: counted.length,
        bestPct:      bestPct === null ? null : Math.round(bestPct * 100) / 100,
        passed:       counted.some(t => t.passed),
        canAttempt:   blocked === null,
        blocked,
        attempts: mine.map(t => ({
          id: t.id, attemptNo: t.attemptNo, status: t.status, voided: t.voided,
          score: t.score, maxScore: t.maxScore, passed: t.passed, feedback: t.feedback,
          submittedAt: t.submittedAt?.toISOString() ?? null,
          gradedAt:    t.gradedAt?.toISOString() ?? null,
        })),
      }
    }))

    return NextResponse.json({
      gradingEnabled: program.gradingEnabled,
      policy: {
        quizWeight:    program.quizWeight,
        projectWeight: program.projectWeight,
        passMark:      program.passMark,
        componentPassMark:       program.componentPassMark,
        maxQuizAttempts:         program.maxQuizAttempts,
        attemptCooldownHours:    program.attemptCooldownHours,
        maxProjectResubmissions: program.maxProjectResubmissions,
      },
      assessments: rows,
      grade: grade ?? null,
    })
  } catch (error) {
    console.error("[GET /api/student/programs/[slug]/assessments]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
