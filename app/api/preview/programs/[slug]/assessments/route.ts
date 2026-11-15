import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireProgramPreview } from "@/lib/program-preview"
import { parseQuestions, parseRubric } from "@/services/assessment.service"
import { getCurrentVersions } from "@/services/rubric.service"
import { learnerPreview } from "@/services/rubric-marking.service"

type Context = { params: Promise<{ slug: string }> }

/** GET — the learner's assessment board as a new learner would see it: every
 *  assessment, no attempts, no grade. Mirrors /api/student/programs/[slug]/
 *  assessments and, like it, never returns questions. Staff only. */
export async function GET(_req: NextRequest, { params }: Context) {
  try {
    const { slug } = await params
    const auth = await requireProgramPreview(slug)
    if (!auth.ok) return auth.response
    const { program } = auth

    const assessments = await db.assessment.findMany({
      where: { courseId: program.id }, orderBy: [{ kind: "asc" }, { orderIndex: "asc" }],
    })
    const rubrics = await getCurrentVersions(
      assessments.map(a => a.rubricId).filter((x): x is string => !!x),
    )

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
      assessments: assessments.map(a => ({
        id: a.id, kind: a.kind, title: a.title, chapterId: a.chapterId, instructions: a.instructions,
        questionCount: a.kind === "CHAPTER_QUIZ" ? (a.drawCount ?? parseQuestions(a.questions).length) : null,
        rubric: a.kind === "PROJECT" && !a.rubricId ? parseRubric(a.rubric) : null,
        rubricDetail: a.kind === "PROJECT" && a.rubricId ? learnerPreview(rubrics[a.rubricId] ?? null) : null,
        attemptsUsed: 0, bestPct: null, passed: false,
        canAttempt: true, blocked: null, attempts: [],
      })),
      rubricVersions: {},
      grade: null,
    })
  } catch (error) {
    console.error("[GET /api/preview/programs/[slug]/assessments]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
