import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { getProgramEnrollments } from "@/services/program.service"

type Context = { params: Promise<{ id: string }> }

/** GET /api/programs/[id]/enrollments — list enrollments for a program (admin only) */
export async function GET(_req: NextRequest, { params }: Context) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id }      = await params
    const enrollments = await getProgramEnrollments(id)

    return NextResponse.json({
      enrollments: enrollments.map(e => ({
        ...e,
        enrolledAt:  e.enrolledAt.toISOString(),
        completedAt: e.completedAt?.toISOString() ?? null,
      })),
    })
  } catch (error) {
    console.error("[GET /api/programs/[id]/enrollments]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
