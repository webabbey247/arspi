import { NextRequest, NextResponse } from "next/server"
import { learningInterestsSchema } from "@/lib/validators/onboarding"
import { saveInterests } from "@/services/interests.service"
import { sendVerificationEmail } from "@/services/email-verification.service"
import { enforceRateLimit } from "@/lib/rate-limit"

export async function POST(req: NextRequest) {
  try {
    // Rate-limited primarily because this is what triggers the verification
    // email send below — without a cap, repeated calls (even for the caller's
    // own account) become an unthrottled email-sending loop.
    const limited = enforceRateLimit(req, { name: "learning-interests", limit: 10, windowMs: 60 * 60_000 })
    if (limited) return limited

    const body = await req.json()

    const result = learningInterestsSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
    }

    await saveInterests(result.data)

    // Send email verification link now that onboarding is complete
    sendVerificationEmail(result.data.userId).catch((e) =>
      console.error("[verify email send]", e)
    )

    return NextResponse.json({ message: "Interests saved" })
  } catch (error) {
    console.error("[POST /api/learning-interests]", error)
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
  }
}
