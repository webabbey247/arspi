import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireApiRole } from "@/lib/guard"
import { db } from "@/lib/db"
import { getProgramBySlug } from "@/services/program.service"
import { findAssignment, validateSubmission, submitAssignment } from "@/services/assignment.service"

type Context = { params: Promise<{ slug: string; blockId: string }> }

const bodySchema = z.object({
  text:    z.string().max(20000).optional(),
  linkUrl: z.string().max(2000).optional(),
  files:   z.array(z.object({
    url:  z.string().url(),
    name: z.string().min(1).max(255),
    size: z.number().int().min(0).optional(),
  })).max(10).optional(),
})

async function enrolled(slug: string, userId: string) {
  const program = await getProgramBySlug(slug)
  if (!program) return { error: NextResponse.json({ error: "Program not found." }, { status: 404 }) }
  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: program.id } },
  })
  if (!enrollment) return { error: NextResponse.json({ error: "You are not enrolled in this program." }, { status: 403 }) }
  return { program }
}

/** GET — the student's own submission for this assignment, if any. */
export async function GET(_req: NextRequest, { params }: Context) {
  try {
    const guard = await requireApiRole("USER")
    if (!guard.ok) return guard.response
    const { session } = guard

    const { slug, blockId } = await params
    const found = await enrolled(slug, session.sub)
    if ("error" in found) return found.error

    const submission = await db.assignmentSubmission.findUnique({
      where: { userId_blockId: { userId: session.sub, blockId } },
    })
    return NextResponse.json({ submission })
  } catch (error) {
    console.error("[GET .../assignments/[blockId]]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

/** PUT — submit or resubmit. The block's own `submissionType` decides what is
 *  acceptable, read from the stored curriculum rather than from the client. */
export async function PUT(req: NextRequest, { params }: Context) {
  try {
    const guard = await requireApiRole("USER")
    if (!guard.ok) return guard.response
    const { session } = guard

    const { slug, blockId } = await params
    const found = await enrolled(slug, session.sub)
    if ("error" in found) return found.error
    const { program } = found

    const assignment = findAssignment(program.curriculum, blockId)
    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found in this programme." }, { status: 404 })
    }

    const parsed = bodySchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 })
    }

    const invalid = validateSubmission(assignment, parsed.data)
    if (invalid) return NextResponse.json({ error: invalid }, { status: 400 })

    const result = await submitAssignment(session.sub, program.id, assignment, parsed.data)
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 409 })

    return NextResponse.json({ submission: result.submission })
  } catch (error) {
    console.error("[PUT .../assignments/[blockId]]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
