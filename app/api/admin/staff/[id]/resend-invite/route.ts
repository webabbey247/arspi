import { NextRequest, NextResponse } from "next/server"
import { requireApiRole } from "@/lib/guard"
import { resendInvite } from "@/services/staff.service"

type Context = { params: Promise<{ id: string }> }

/** POST — send a fresh invite to staff who haven't set a password (admin only). */
export async function POST(_req: NextRequest, { params }: Context) {
  try {
    const guard = await requireApiRole("ADMIN")
    if (!guard.ok) return guard.response
    const { id } = await params
    const result = await resendInvite(id)
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 409 })
    return NextResponse.json(result)
  } catch (error) {
    console.error("[POST /api/admin/staff/[id]/resend-invite]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
