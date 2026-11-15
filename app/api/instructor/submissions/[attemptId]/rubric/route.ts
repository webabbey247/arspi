import { NextRequest, NextResponse } from "next/server"
import { requireStaff } from "@/lib/guard"
import { markingBodySchema } from "@/lib/marking-schema"
import { markProject, projectRubricContext } from "@/services/rubric-marking.service"
import { syncCourseCompletion } from "@/services/course-completion.service"

type Context = { params: Promise<{ attemptId: string }> }

/** PUT — save a draft of, or release, rubric marks for a project attempt.
 *  Release grades the attempt exactly like the legacy rubric does: pass or
 *  return for resubmission, then roll the course grade forward. */
export async function PUT(req: NextRequest, { params }: Context) {
  try {
    const guard = await requireStaff()
    if (!guard.ok) return guard.response
    const { session } = guard

    const { attemptId } = await params
    const ctx = await projectRubricContext(attemptId)
    if (!ctx) return NextResponse.json({ error: "Submission not found." }, { status: 404 })
    if (session.role === "INSTRUCTOR" && ctx.attempt.assessment.course.instructorId !== session.sub) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const parsed = markingBodySchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 })
    }

    const result = await markProject(session.sub, attemptId, parsed.data)
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status })
    if (!result.released) return NextResponse.json({ marks: result.marks, released: false })

    // Passing the project can be the last thing between the learner and
    // their certificate.
    const completion = await syncCourseCompletion(ctx.attempt.userId, ctx.attempt.assessment.course.id)
    const g = result.graded
    return NextResponse.json({
      marks: result.marks, released: true,
      score: g.score, maxScore: g.maxScore, pct: Math.round(g.pct * 100) / 100,
      passed: g.passed, mayResubmit: g.mayResubmit,
      courseCompleted: completion.completed,
    })
  } catch (error) {
    console.error("[PUT /api/instructor/submissions/[attemptId]/rubric]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
