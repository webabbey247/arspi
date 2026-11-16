import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireApiRole } from "@/lib/guard"
import { inviteInstructor } from "@/services/staff.service"

const bodySchema = z.object({
  email:     z.string().trim().email("Enter a valid email address.").max(254),
  firstName: z.string().trim().max(80).optional(),
  lastName:  z.string().trim().max(80).optional(),
})

/** POST /api/admin/staff/invite — invite one instructor by email (admin only).
 *  Creates the account and emails a link to set a password. */
export async function POST(req: NextRequest) {
  try {
    const guard = await requireApiRole("ADMIN")
    if (!guard.ok) return guard.response

    const parsed = bodySchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 })
    }
    const result = await inviteInstructor(parsed.data)
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 409 })
    return NextResponse.json(result, { status: result.outcome === "invited" ? 201 : 200 })
  } catch (error) {
    console.error("[POST /api/admin/staff/invite]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
