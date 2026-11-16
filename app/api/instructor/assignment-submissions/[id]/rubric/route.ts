import { NextRequest, NextResponse } from "next/server"
import { requireStaff } from "@/lib/guard"
import { markingBodySchema } from "@/lib/marking-schema"
import { assignmentRubricContext, markAssignment } from "@/services/rubric-marking.service"
import { recomputeCourseGrade } from "@/services/assessment.service"
import { syncCourseCompletion } from "@/services/course-completion.service"

type Context = { params: Promise<{ id: string }> }

/** PUT — save a draft of, or release, rubric marks for an assignment
 *  submission. Learners see nothing until `action: "release"`. */
export async function PUT(req: NextRequest, { params }: Context) {
  try {
    const guard = await requireStaff()
    if (!guard.ok) return guard.response
    const { session } = guard

    const { id } = await params
    const ctx = await assignmentRubricContext(id)
    if (!ctx) return NextResponse.json({ error: "Submission not found." }, { status: 404 })
    if (session.role === "INSTRUCTOR" && ctx.sub.course.instructorId !== session.sub) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const parsed = markingBodySchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 })
    }

    const result = await markAssignment(session.sub, id, parsed.data)
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status })

    // A released mark can move the course grade (module assignments in
    // coursework, or the final project) — and with it the certificate.
    if (parsed.data.action === "release") {
      await recomputeCourseGrade(ctx.sub.userId, ctx.sub.courseId)
      await syncCourseCompletion(ctx.sub.userId, ctx.sub.courseId)
    }
    return NextResponse.json({
      marks:     result.marks,
      released:  parsed.data.action === "release",
      status:    result.submission?.status ?? null,
    })
  } catch (error) {
    console.error("[PUT /api/instructor/assignment-submissions/[id]/rubric]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
