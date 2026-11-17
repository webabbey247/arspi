import { NextRequest, NextResponse } from "next/server"
import { profileInfoSchema } from "@/lib/validators/onboarding"
import { updateProfile } from "@/services/profile.service"
import { canOnboard } from "@/lib/onboarding-auth"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const result = profileInfoSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
    }

    // The body's userId is only trusted if this caller registered that
    // account (onboarding cookie) or is signed in as it.
    if (!(await canOnboard(req, result.data.userId))) {
      return NextResponse.json({ error: "Your registration session has expired. Please sign in to continue." }, { status: 403 })
    }

    await updateProfile(result.data)
    return NextResponse.json({ message: "Profile updated" })
  } catch (error) {
    console.error("[POST /api/profile-information]", error)
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
  }
}
