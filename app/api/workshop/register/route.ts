import { NextRequest, NextResponse } from "next/server"
import { workshopSchema } from "@/lib/validators/workshop"
import { registerForWorkshop, getWorkshopById, computeDurationHours, normalizeFacilitators } from "@/services/workshop.service"
import type { WorkshopRegistrationPayload } from "@/lib/validators/workshop"
import { sendWorkshopConfirmationEmail } from "@/lib/email"
import { getSession } from "@/lib/session"
import { enforceRateLimit } from "@/lib/rate-limit"
import { isStaffRole, STAFF_REGISTRATION_MESSAGE } from "@/lib/enrolment"
import { fmtWorkshopDate, fmtWorkshopTime } from "@/lib/workshop-format"

export async function POST(req: NextRequest) {
  try {
    // Public, unauthenticated, and it sends an email: cap it per client.
    const limited = enforceRateLimit(req, { name: "workshop-register", limit: 10, windowMs: 60 * 60_000 })
    if (limited) return limited

    // The form itself is public — a visitor needs no account — so this only
    // catches the case of a signed-in staff member using it.
    const session = await getSession()
    if (session && isStaffRole(session.role)) {
      return NextResponse.json({ error: STAFF_REGISTRATION_MESSAGE }, { status: 403 })
    }

    const body = await req.json()

    // Only the workshop id is taken from the client. The fee, title, date and
    // time come from the database — trusting the browser's `fee` let anyone
    // book a paid workshop as free (and put arbitrary text into the email).
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { workshopId, workshopTitle: _t, workshopDate: _d, workshopTime: _tm, fee: _f, ...userFields } = body
    if (!workshopId || typeof workshopId !== "string") {
      return NextResponse.json({ error: "Invalid workshop." }, { status: 400 })
    }
    const workshop = await getWorkshopById(workshopId)
    if (!workshop || !workshop.published) {
      return NextResponse.json({ error: "This workshop isn't open for registration." }, { status: 404 })
    }
    if (workshop.capacity != null && workshop.registered >= workshop.capacity) {
      return NextResponse.json({ error: "This workshop is full." }, { status: 409 })
    }
    const fee            = workshop.type === "FREE" ? 0 : workshop.fee
    const workshopTitle  = workshop.title
    const workshopDate   = fmtWorkshopDate(workshop.date)
    const workshopTime   = fmtWorkshopTime(workshop.startTime, workshop.endTime, workshop.timezone)

    const requirePayment = fee > 0

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
      workshopId:    workshop.id,
      workshopTitle,
      workshopDate,
      workshopTime,
      fee,
    }

    const result = await registerForWorkshop(payload)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    // Send confirmation email (non-blocking — don't fail the request if email fails)
    sendWorkshopConfirmationEmail(validated.email, {
      firstName:      validated.firstName,
      workshopTitle,
      workshopDate,
      workshopTime,
      fee,
      isConfirmed:    !requirePayment,
      category:       workshop?.category,
      level:          workshop?.level,
      duration:       computeDurationHours(workshop?.startTime, workshop?.endTime) ?? undefined,
      facilitators:   normalizeFacilitators(workshop?.facilitators).map(f => f.fullName),
      medium:         workshop?.medium,
      onlinePlatform: workshop?.onlinePlatform,
      onlineLink:     workshop?.onlineLink,
      venueAddress:   workshop?.venueAddress,
      venueCity:      workshop?.venueCity,
      venueCountry:   workshop?.venueCountry,
    }).catch(err => console.error("[workshop-confirmation-email]", err))

    return NextResponse.json(
      { message: requirePayment ? "Registration submitted! Proceed to payment." : "You're registered! Check your email for confirmation." },
      { status: 201 }
    )
  } catch (error) {
    console.error("[POST /api/workshop/register]", error)
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
  }
}
