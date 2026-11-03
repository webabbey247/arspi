import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireApiSession } from "@/lib/guard"
import { db } from "@/lib/db"
import { gradeProjectAttempt, grantExtraAttempt } from "@/services/assessment.service"
import { syncCourseCompletion } from "@/services/course-completion.service"

type Context = { params: Promise<{ attemptId: string }> }

const gradeSchema = z.object({
  /** { [criterionId]: points } — clamped to each criterion's max server-side. */
  rubricScores: z.record(z.string(), z.number().min(0)),
  feedback:     z.string().max(5000).default(""),
})

/** Instructors may only touch attempts on programmes they teach. */
async function authorise(attemptId: string) {
  const guard = await requireApiSession()
  if (!guard.ok) return { ok: false as const, response: guard.response }
  const { session } = guard
  if (session.role !== "INSTRUCTOR" && session.role !== "ADMIN") {
    return { ok: false as const, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }

  const attempt = await db.assessmentAttempt.findUnique({
    where:   { id: attemptId },
    include: { assessment: { include: { course: { select: { id: true, instructorId: true } } } } },
  })
  if (!attempt) {
    return { ok: false as const, response: NextResponse.json({ error: "Submission not found." }, { status: 404 }) }
  }
  if (session.role === "INSTRUCTOR" && attempt.assessment.course.instructorId !== session.sub) {
    return { ok: false as const, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }
  return { ok: true as const, session, attempt }
}

/** PATCH — grade a project submission against its rubric. */
export async function PATCH(req: NextRequest, { params }: Context) {
  try {
    const { attemptId } = await params
    const auth = await authorise(attemptId)
    if (!auth.ok) return auth.response

    if (auth.attempt.status !== "SUBMITTED") {
      return NextResponse.json({ error: "This submission isn't awaiting grading." }, { status: 409 })
    }

    const parsed = gradeSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 })
    }

    const result = await gradeProjectAttempt(
      auth.session.sub, attemptId, parsed.data.rubricScores, parsed.data.feedback,
    )
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 409 })

    // Passing the project can be the last thing standing between the student
    // and their certificate, so re-run the completion check here too.
    const completion = await syncCourseCompletion(auth.attempt.userId, auth.attempt.assessment.course.id)

    return NextResponse.json({
      score: result.score, maxScore: result.maxScore,
      pct: Math.round(result.pct * 100) / 100,
      passed: result.passed, mayResubmit: result.mayResubmit,
      grade: result.grade,
      courseCompleted: completion.completed,
    })
  } catch (error) {
    console.error("[PATCH /api/instructor/submissions/[attemptId]]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

/** POST — hand the student one more attempt by voiding their earliest failed
 *  one. Without this, exhausting the cap is a permanent dead end. */
export async function POST(_req: NextRequest, { params }: Context) {
  try {
    const { attemptId } = await params
    const auth = await authorise(attemptId)
    if (!auth.ok) return auth.response

    const voided = await grantExtraAttempt(auth.attempt.assessmentId, auth.attempt.userId)
    if (!voided) {
      return NextResponse.json({ error: "There's no failed attempt to void." }, { status: 409 })
    }
    return NextResponse.json({ success: true, voidedAttemptNo: voided.attemptNo })
  } catch (error) {
    console.error("[POST /api/instructor/submissions/[attemptId]]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
