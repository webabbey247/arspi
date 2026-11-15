import { NextRequest, NextResponse } from "next/server"
import { requireProgramPreview } from "@/lib/program-preview"
import { findAssignment } from "@/services/assignment.service"
import { getCurrentVersion } from "@/services/rubric.service"
import { learnerPreview } from "@/services/rubric-marking.service"

type Context = { params: Promise<{ slug: string; blockId: string }> }

/** GET — what a learner sees before submitting an assignment: no submission,
 *  and the rubric only if its author lets learners see it. Staff only. */
export async function GET(_req: NextRequest, { params }: Context) {
  try {
    const { slug, blockId } = await params
    const auth = await requireProgramPreview(slug)
    if (!auth.ok) return auth.response

    const assignment = findAssignment(auth.program.curriculum, blockId)
    const rubric = assignment?.rubricId ? learnerPreview(await getCurrentVersion(assignment.rubricId)) : null
    return NextResponse.json({ submission: null, rubric })
  } catch (error) {
    console.error("[GET /api/preview/programs/[slug]/assignments/[blockId]]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
