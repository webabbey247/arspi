import { NextRequest, NextResponse } from "next/server"
import { workshopSchema } from "@/lib/validators/workshop"
import { registerForWorkshop } from "@/services/workshop.service"
import type { WorkshopRegistrationPayload } from "@/lib/validators/workshop"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const { workshopTitle, workshopDate, workshopTime, fee, ...userFields } = body

    // Validate event metadata presence
    if (!workshopTitle || !workshopDate || !workshopTime || fee === undefined) {
      return NextResponse.json({ error: "Invalid workshop data." }, { status: 400 })
    }

    const requirePayment = Number(fee) > 0

    let validated: Awaited<ReturnType<ReturnType<typeof workshopSchema>["validate"]>>
    try {
      validated = await workshopSchema(requirePayment).validate(userFields, {
        abortEarly: true,
        stripUnknown: true,
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Invalid input"
      return NextResponse.json({ error: message }, { status: 400 })
    }

    // Extra server-side guard: paid workshop must have a payment method
    if (requirePayment && !validated.paymentMethod) {
      return NextResponse.json({ error: "Payment method is required." }, { status: 400 })
    }

    const payload: WorkshopRegistrationPayload = {
      ...validated,
      workshopTitle: String(workshopTitle),
      workshopDate:  String(workshopDate),
      workshopTime:  String(workshopTime),
      fee:           Number(fee),
    }

    const result = await registerForWorkshop(payload)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json(
      { message: requirePayment ? "Registration submitted! Proceed to payment." : "You're registered! Check your email for confirmation." },
      { status: 201 }
    )
  } catch (error) {
    console.error("[POST /api/workshop/register]", error)
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
  }
}
