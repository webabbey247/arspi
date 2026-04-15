import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { adminSetPassword } from "@/services/user.service"
import { z } from "zod"

const schema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
})

type Context = { params: Promise<{ id: string }> }

/** POST /api/admin/users/[id]/password — set a new password for a user (admin only) */
export async function POST(req: NextRequest, { params }: Context) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const body   = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      )
    }

    const result = await adminSetPassword(id, parsed.data.newPassword)
    if (!result.success) {
      const status = result.error === "User not found." ? 404 : 400
      return NextResponse.json({ error: result.error }, { status })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[POST /api/admin/users/[id]/password]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
