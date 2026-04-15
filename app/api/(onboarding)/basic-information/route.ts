import { NextRequest, NextResponse } from "next/server"
import { basicInfoSchema } from "@/lib/validators/onboarding"
import { createUser } from "@/services/auth.service"

export async function POST(req: NextRequest) {
  try {
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

    return NextResponse.json({ userId: outcome.userId }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/basic-information]", error)
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
  }
}
