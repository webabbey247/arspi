import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireStaff } from "@/lib/guard"
import { db } from "@/lib/db"
import { reviewAssignment } from "@/services/assignment.service"

type Context = { params: Promise<{ id: string }> }

const reviewSchema = z.object({
  accept:   z.boolean(),
  feedback: z.string().max(5000).optional(),
  points:   z.number().min(0).max(1000).nullable().optional(),
})

/** PATCH — accept the work, or return it for another attempt. */
export async function PATCH(req: NextRequest, { params }: Context) {
  try {
    const guard = await requireStaff()
    if (!guard.ok) return guard.response
    const { session } = guard

    const { id } = await params
    const existing = await db.assignmentSubmission.findUnique({
      where:   { id },
      include: { course: { select: { instructorId: true } } },
    })
    if (!existing) return NextResponse.json({ error: "Submission not found." }, { status: 404 })

    // An instructor may only review work on programmes they teach.
    if (session.role === "INSTRUCTOR" && existing.course.instructorId !== session.sub) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const parsed = reviewSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 })
    }

    const result = await reviewAssignment(session.sub, id, parsed.data)
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 409 })
    return NextResponse.json({ submission: result.submission })
  } catch (error) {
    console.error("[PATCH /api/instructor/assignment-submissions/[id]]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
