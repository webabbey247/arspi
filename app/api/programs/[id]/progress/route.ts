import { NextRequest, NextResponse } from "next/server"
import { requireCourseEditor } from "@/lib/guard"
import { getProgramProgress } from "@/services/progress.service"

type Context = { params: Promise<{ id: string }> }

/** GET /api/programs/[id]/progress — per-learner progress for one programme.
 *  Course-scoped: an admin sees any programme, an instructor only their own. */
export async function GET(_req: NextRequest, { params }: Context) {
  try {
    const { id } = await params
    const guard = await requireCourseEditor(id)
    if (!guard.ok) return guard.response

    const progress = await getProgramProgress(id)
    if (!progress) return NextResponse.json({ error: "Program not found." }, { status: 404 })

    return NextResponse.json(progress)
  } catch (error) {
    console.error("[GET /api/programs/[id]/progress]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
