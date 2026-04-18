import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

/**
 * GET /api/workshop/check-registration?email=...&workshopId=...
 *
 * Returns the registration state for a given email + workshop combination:
 *   { status: "none" }
 *   { status: "confirmed" }
 *   { status: "pending", invoiceId: string, paymentDate: string }
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const email      = searchParams.get("email")?.trim().toLowerCase()
  const workshopId = searchParams.get("workshopId")?.trim()

  if (!email || !workshopId) {
    return NextResponse.json(
      { error: "email and workshopId are required." },
      { status: 400 },
    )
  }

  try {
    const registration = await db.workshopRegistration.findFirst({
      where: {
        email:      { equals: email, mode: "insensitive" },
        workshopId,
      },
      select: {
        id:        true,
        status:    true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    })

    if (!registration) {
      return NextResponse.json({ status: "none" })
    }

    if (registration.status === "CONFIRMED") {
      return NextResponse.json({ status: "confirmed" })
    }

    // PENDING (or any other non-confirmed state)
    return NextResponse.json({
      status:      "pending",
      invoiceId:   registration.id,
      paymentDate: registration.createdAt.toISOString(),
    })
  } catch (error) {
    console.error("[GET /api/workshop/check-registration]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
