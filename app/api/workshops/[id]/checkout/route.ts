import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getSession } from "@/lib/session"
import { getWorkshopById } from "@/services/workshop.service"
import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db"

const bodySchema = z.object({
  firstName:    z.string().min(1, "First name is required"),
  lastName:     z.string().min(1, "Last name is required"),
  email:        z.string().email("Invalid email address"),
  organisation: z.string().optional(),
})

type Context = { params: Promise<{ id: string }> }

/** POST /api/workshops/[id]/checkout
 *  Creates a Stripe Checkout Session for a paid workshop.
 *  Returns { url } — the hosted Stripe checkout URL.
 */
export async function POST(req: NextRequest, { params }: Context) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Sign in to register for this workshop." }, { status: 401 })
    }

    const { id } = await params

    const body   = await req.json()
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      )
    }

    const workshop = await getWorkshopById(id)
    if (!workshop) {
      return NextResponse.json({ error: "Workshop not found." }, { status: 404 })
    }
    if (!workshop.published) {
      return NextResponse.json({ error: "This workshop is not available." }, { status: 400 })
    }
    if (workshop.fee === 0 || workshop.type !== "PAID") {
      return NextResponse.json(
        { error: "This is a free workshop — use the standard registration form." },
        { status: 400 }
      )
    }
    if (workshop.registered >= workshop.capacity) {
      return NextResponse.json({ error: "This workshop is fully booked." }, { status: 400 })
    }

    const { firstName, lastName, email, organisation } = parsed.data

    // Prevent duplicate registrations
    const existing = await db.workshopRegistration.findFirst({
      where: { workshopId: id, email },
    })
    if (existing) {
      return NextResponse.json(
        { error: "This email is already registered for this workshop." },
        { status: 409 }
      )
    }

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "")

    // Create PENDING registration — confirmed by webhook on payment success
    const registration = await db.workshopRegistration.create({
      data: {
        firstName,
        lastName,
        email,
        organisation:  organisation ?? null,
        workshopTitle: workshop.title,
        workshopDate:  workshop.date ? workshop.date.toISOString().slice(0, 10) : "",
        workshopTime:  workshop.startTime,
        fee:           workshop.fee,
        paymentMethod: "CARD",
        status:        "PENDING",
        workshopId:    id,
      },
      select: { id: true },
    })

    // Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode:           "payment",
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency:     "usd",
            unit_amount:  Math.round(workshop.fee * 100), // cents
            product_data: {
              name:        workshop.title,
              description: workshop.description.slice(0, 200),
              ...(workshop.coverImage ? { images: [workshop.coverImage] } : {}),
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        registrationId: registration.id,
        workshopId:     id,
      },
      success_url: `${appUrl}/workshop/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${appUrl}/workshops`,
    })

    // Persist checkout session ID so the webhook can look up this registration
    await db.workshopRegistration.update({
      where: { id: registration.id },
      data:  { stripeCheckoutSessionId: checkoutSession.id },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error("[POST /api/workshops/[id]/checkout]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
