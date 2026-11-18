import { NextRequest, NextResponse } from "next/server"
import { requireStaff } from "@/lib/guard"
import { facilitatorBodySchema } from "@/lib/validators/facilitator"
import { createFacilitator, listFacilitators } from "@/services/facilitator.service"

/** GET /api/facilitators?q=&limit= — the directory, with programme counts.
 *  Staff: admins manage it, instructors pick from it in the editor. */
export async function GET(req: NextRequest) {
  const guard = await requireStaff()
  if (!guard.ok) return guard.response
  try {
    const q     = req.nextUrl.searchParams.get("q") ?? undefined
    const limit = Number(req.nextUrl.searchParams.get("limit")) || undefined
    const facilitators = await listFacilitators({ q, take: limit ? Math.min(limit, 200) : undefined })
    return NextResponse.json({ facilitators })
  } catch (error) {
    console.error("[GET /api/facilitators]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

/** POST /api/facilitators — add to the directory. Open to instructors too, so
 *  they can add someone while editing a programme's facilitators. */
export async function POST(req: NextRequest) {
  const guard = await requireStaff()
  if (!guard.ok) return guard.response
  try {
    const parsed = facilitatorBodySchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 })
    }
    const facilitator = await createFacilitator(parsed.data)
    return NextResponse.json({ facilitator: { ...facilitator, programmes: 0 } }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/facilitators]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
