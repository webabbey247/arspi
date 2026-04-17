import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { getProgramById, enrollInProgram } from "@/services/program.service"
import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db"
import { z } from "zod"

const bodySchema = z.object({
  // Optional override — if not provided, we use session name/email
  firstName: z.string().min(1).optional(),
  lastName:  z.string().min(1).optional(),
})

type Context = { params: Promise<{ id: string }> }

/**
 * POST /api/programs/[id]/checkout
 *
 * - Free programs  → enroll the user immediately, return { enrolled: true }
 * - Paid programs  → create a Stripe Checkout Session, return { url }
 *
 * Requires an authenticated session.
 */
export async function POST(req: NextRequest, { params }: Context) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Sign in to enroll in this program." }, { status: 401 })
    }

    const { id }  = await params
    const body    = await req.json().catch(() => ({}))
    const parsed  = bodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      )
    }

    const program = await getProgramById(id)
    if (!program) {
      return NextResponse.json({ error: "Program not found." }, { status: 404 })
    }
    if (!program.published) {
      return NextResponse.json({ error: "This program is not available." }, { status: 400 })
    }

    // Check for existing enrollment
    const existing = await db.enrollment.findUnique({
      where: { userId_courseId: { userId: session.sub, courseId: id } },
    })
    if (existing) {
      return NextResponse.json({ error: "You are already enrolled in this program." }, { status: 409 })
    }

    // ── Free program — enroll directly ────────────────────────────────────────
    if (program.price === 0) {
      const result = await enrollInProgram(session.sub, id)
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 409 })
      }
      return NextResponse.json({ enrolled: true })
    }

    // ── Paid program — create Stripe Checkout Session ─────────────────────────
    // Prevent duplicate pending payments
    const pendingPayment = await db.payment.findFirst({
      where: { userId: session.sub, courseId: id, status: "PENDING" },
    })
    if (pendingPayment) {
      return NextResponse.json(
        { error: "A pending payment already exists for this program. Complete or cancel it first." },
        { status: 409 }
      )
    }

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "")

    // Create a PENDING payment record — confirmed by the webhook on payment success
    const payment = await db.payment.create({
      data: {
        userId:   session.sub,
        courseId: id,
        amount:   program.price,
        currency: "usd",
        status:   "PENDING",
      },
      select: { id: true },
    })

    const checkoutSession = await stripe.checkout.sessions.create({
      mode:           "payment",
      customer_email: session.email,
      line_items: [
        {
          price_data: {
            currency:     "usd",
            unit_amount:  Math.round(program.price * 100), // cents
            product_data: {
              name:        program.title,
              description: program.description.slice(0, 200),
              ...(program.thumbnail ? { images: [program.thumbnail] } : {}),
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        type:      "program",
        paymentId: payment.id,
        courseId:  id,
        userId:    session.sub,
      },
      success_url: `${appUrl}/programs/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${appUrl}/programs`,
    })

    // Store the checkout session ID so the webhook can look up this payment
    await db.payment.update({
      where: { id: payment.id },
      data:  { stripePaymentId: checkoutSession.id },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error("[POST /api/programs/[id]/checkout]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
