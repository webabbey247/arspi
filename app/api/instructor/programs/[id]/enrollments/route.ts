import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { getProgramById, getProgramBySlug, getProgramEnrollments } from "@/services/program.service"

type Context = { params: Promise<{ id: string }> }

/** GET /api/instructor/programs/[id]/enrollments
 *  Returns enrollments for a program owned by the logged-in instructor.
 */
export async function GET(_req: NextRequest, { params }: Context) {
  try {
    const session = await getSession()
    if (!session || session.role !== "INSTRUCTOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params

    // Verify ownership (accept slug or id)
    const program = await getProgramBySlug(id) ?? await getProgramById(id)
    if (!program) {
      return NextResponse.json({ error: "Program not found." }, { status: 404 })
    }
    if (program.instructorId !== session.sub) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const enrollments = await getProgramEnrollments(program.id)

    return NextResponse.json({
      enrollments: enrollments.map(e => ({
        ...e,
        enrolledAt:  e.enrolledAt.toISOString(),
        completedAt: e.completedAt?.toISOString() ?? null,
      })),
    })
  } catch (error) {
    console.error("[GET /api/instructor/programs/[id]/enrollments]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
