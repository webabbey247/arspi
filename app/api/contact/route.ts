import { NextRequest, NextResponse } from "next/server"
import { contactSchema } from "@/lib/validators/contact"
import { saveContactMessage } from "@/services/contact.service"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    let validated: Awaited<ReturnType<typeof contactSchema.validate>>
    try {
      validated = await contactSchema.validate(body, { abortEarly: true, stripUnknown: true })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Invalid input"
      return NextResponse.json({ error: message }, { status: 400 })
    }

    const result = await saveContactMessage(validated)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json(
      { message: "Message sent successfully! We'll be in touch soon." },
      { status: 201 }
    )
  } catch (error) {
    console.error("[POST /api/contact]", error)
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
  }
}
