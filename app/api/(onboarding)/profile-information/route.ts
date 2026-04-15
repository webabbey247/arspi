import { NextRequest, NextResponse } from "next/server"
import { profileInfoSchema } from "@/lib/validators/onboarding"
import { updateProfile } from "@/services/profile.service"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const result = profileInfoSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
    }

    await updateProfile(result.data)
    return NextResponse.json({ message: "Profile updated" })
  } catch (error) {
    console.error("[POST /api/profile-information]", error)
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
  }
}
