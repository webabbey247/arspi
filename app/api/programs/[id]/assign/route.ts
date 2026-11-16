import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireApiRole } from "@/lib/guard"
import { assignProgram } from "@/services/program-review.service"

type Context = { params: Promise<{ id: string }> }

const bodySchema = z.object({ instructorId: z.string().min(1) })

/** PATCH /api/programs/[id]/assign — hand a programme to an instructor for
 *  review and grading (admin only). Notifies them in-app and by email. */
export async function PATCH(req: NextRequest, { params }: Context) {
  try {
    const guard = await requireApiRole("ADMIN")
    if (!guard.ok) return guard.response
    const { id } = await params
    const parsed = bodySchema.safeParse(await req.json())
    if (!parsed.success) return NextResponse.json({ error: "Choose an instructor." }, { status: 400 })

    const result = await assignProgram(id, parsed.data.instructorId)
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status })
    return NextResponse.json(result)
  } catch (error) {
    console.error("[PATCH /api/programs/[id]/assign]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
