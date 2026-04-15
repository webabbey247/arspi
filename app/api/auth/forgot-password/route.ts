import { NextRequest, NextResponse } from "next/server"
import { forgotPasswordSchema } from "@/lib/validators/auth"
import { requestPasswordReset } from "@/services/password.service"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const result = forgotPasswordSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
    }

    // Always returns 200 — never reveal whether the email exists
    await requestPasswordReset(result.data.email)

    return NextResponse.json({ message: "If an account exists, a reset link has been sent." })
  } catch (error) {
    console.error("[POST /api/auth/forgot-password]", error)
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
  }
}
