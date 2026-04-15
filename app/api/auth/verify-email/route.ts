import { NextRequest, NextResponse } from "next/server"
import { verifyEmailToken } from "@/services/email-verification.service"

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Missing token." }, { status: 400 })
    }

    const result = await verifyEmailToken(token)
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[POST /api/auth/verify-email]", error)
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
  }
}
