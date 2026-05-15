import { NextRequest, NextResponse } from "next/server"
import { resendVerificationEmail } from "@/services/email-verification.service"
import { enforceRateLimit } from "@/lib/rate-limit"

export async function POST(req: NextRequest) {
  try {
    const limited = enforceRateLimit(req, { name: "resend-verification", limit: 5, windowMs: 60 * 60_000 })
    if (limited) return limited

    const { email } = await req.json()

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required." }, { status: 400 })
    }

    // Always 200 — don't leak whether the address exists
    await resendVerificationEmail(email.toLowerCase().trim())
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[POST /api/auth/resend-verification]", error)
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
  }
}
