import { NextRequest, NextResponse } from "next/server"
import { resetPasswordSchema } from "@/lib/validators/auth"
import { resetPassword } from "@/services/password.service"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const result = resetPasswordSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
    }

    const outcome = await resetPassword(result.data.token, result.data.password)

    if (!outcome.success) {
      const message =
        outcome.reason === "expired_token"
          ? "This reset link has expired. Please request a new one."
          : "Invalid or already-used reset link."
      return NextResponse.json({ error: message }, { status: 400 })
    }

    return NextResponse.json({ message: "Password updated successfully." })
  } catch (error) {
    console.error("[POST /api/auth/reset-password]", error)
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
  }
}
