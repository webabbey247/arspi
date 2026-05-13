import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getSession } from "@/lib/session"
import { changeOwnPassword } from "@/services/profile.service"

const schema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword:     z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body   = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      )
    }

    const result = await changeOwnPassword(
      session.sub,
      parsed.data.currentPassword,
      parsed.data.newPassword,
    )
    if (!result.success) {
      const status = result.error === "User not found." ? 404 : 400
      return NextResponse.json({ error: result.error }, { status })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[POST /api/account/password]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
