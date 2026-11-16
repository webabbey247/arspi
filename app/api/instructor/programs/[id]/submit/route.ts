import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireApiRole } from "@/lib/guard"
import { submitProgramForReview } from "@/services/program-review.service"

type Context = { params: Promise<{ id: string }> }

const bodySchema = z.object({ note: z.string().max(2000).optional() })

/** POST /api/instructor/programs/[id]/submit — the assigned instructor submits
 *  the programme for approval. Admins get an in-app alert and an email. */
export async function POST(req: NextRequest, { params }: Context) {
  try {
    const guard = await requireApiRole("INSTRUCTOR")
    if (!guard.ok) return guard.response
    const { id } = await params
    const parsed = bodySchema.safeParse(await req.json().catch(() => ({})))
    if (!parsed.success) return NextResponse.json({ error: "Keep the note under 2,000 characters." }, { status: 400 })

    const result = await submitProgramForReview(id, guard.session.sub, parsed.data.note)
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status })
    return NextResponse.json(result)
  } catch (error) {
    console.error("[POST /api/instructor/programs/[id]/submit]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
