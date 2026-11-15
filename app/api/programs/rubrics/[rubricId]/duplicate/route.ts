import { NextRequest, NextResponse } from "next/server"
import { authoriseRubricWrite } from "@/lib/rubric-auth"
import { duplicateRubric } from "@/services/rubric.service"

type Context = { params: Promise<{ rubricId: string }> }

/** POST — copy a rubric's current version (same scope as the original). */
export async function POST(_req: NextRequest, { params }: Context) {
  try {
    const { rubricId } = await params
    const guard = await authoriseRubricWrite(rubricId)
    if (!guard.ok) return guard.response

    const rubric = await duplicateRubric(rubricId, guard.session.sub)
    if (!rubric) return NextResponse.json({ error: "Rubric not found." }, { status: 404 })
    return NextResponse.json({ rubric }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/programs/rubrics/[rubricId]/duplicate]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
