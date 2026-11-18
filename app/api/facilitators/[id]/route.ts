import { NextRequest, NextResponse } from "next/server"
import { requireApiRole } from "@/lib/guard"
import { deleteFacilitator, updateFacilitator, getFacilitator } from "@/services/facilitator.service"
import { facilitatorBodySchema } from "@/lib/validators/facilitator"

type Context = { params: Promise<{ id: string }> }

/** PATCH /api/facilitators/[id] — admin only: an edit is rewritten onto every
 *  programme that lists this facilitator. */
export async function PATCH(req: NextRequest, { params }: Context) {
  const guard = await requireApiRole("ADMIN")
  if (!guard.ok) return guard.response
  try {
    const { id } = await params
    if (!(await getFacilitator(id))) {
      return NextResponse.json({ error: "Facilitator not found." }, { status: 404 })
    }
    const parsed = facilitatorBodySchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 })
    }
    const { facilitator, programmesUpdated } = await updateFacilitator(id, parsed.data)
    return NextResponse.json({ facilitator, programmesUpdated })
  } catch (error) {
    console.error("[PATCH /api/facilitators/[id]]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

/** DELETE /api/facilitators/[id] — admin only; also removes them from every
 *  programme. The institute entry can't be deleted. */
export async function DELETE(_req: NextRequest, { params }: Context) {
  const guard = await requireApiRole("ADMIN")
  if (!guard.ok) return guard.response
  try {
    const { id } = await params
    const result = await deleteFacilitator(id)
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status })
    return NextResponse.json({ programmesUpdated: result.programmesUpdated })
  } catch (error) {
    console.error("[DELETE /api/facilitators/[id]]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
