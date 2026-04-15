import { NextRequest, NextResponse } from "next/server"
import { learningInterestsSchema } from "@/lib/validators/onboarding"
import { saveInterests } from "@/services/interests.service"
import { sendVerificationEmail } from "@/services/email-verification.service"

export async function POST(req: NextRequest) {
  try {
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
