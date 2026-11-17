import { NextRequest, NextResponse } from "next/server"
import { basicInfoSchema } from "@/lib/validators/onboarding"
import { createUser } from "@/services/auth.service"
import { enforceRateLimit } from "@/lib/rate-limit"
import { setOnboardingCookie } from "@/lib/onboarding-auth"

export async function POST(req: NextRequest) {
  try {
    const limited = enforceRateLimit(req, { name: "register", limit: 10, windowMs: 60 * 60_000 })
    if (limited) return limited

    const body = await req.json()

    const result = basicInfoSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
    }

    const outcome = await createUser(result.data)
    if (!outcome.success) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      )
    }

    // Lets this browser — and only this browser — finish steps 2 and 3 for
    // the new account before it can sign in.
    const res = NextResponse.json({ userId: outcome.userId }, { status: 201 })
    setOnboardingCookie(res, outcome.userId)
    return res
  } catch (error) {
    console.error("[POST /api/basic-information]", error)
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
  }
}
