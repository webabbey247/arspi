import { NextRequest, NextResponse } from "next/server"
import { subscriptionSchema } from "@/lib/validators/subscription"
import { subscribeEmail } from "@/services/subscription.service"
import { enforceRateLimit } from "@/lib/rate-limit"

export async function POST(req: NextRequest) {
  try {
    const limited = enforceRateLimit(req, { name: "newsletter", limit: 10, windowMs: 60 * 60_000 })
    if (limited) return limited

    const body = await req.json()

    let validated: { email: string }
    try {
      validated = await subscriptionSchema.validate(body, { abortEarly: true, stripUnknown: true })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Invalid input"
      return NextResponse.json({ error: message }, { status: 400 })
    }

    const result = await subscribeEmail(validated.email)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    if (result.alreadySubscribed) {
      return NextResponse.json(
        { message: "You are already subscribed." },
        { status: 200 }
      )
    }

    return NextResponse.json(
      { message: "Successfully subscribed!" },
      { status: 201 }
    )
  } catch (error) {
    console.error("[POST /api/newsletter/subscribe]", error)
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
  }
}
