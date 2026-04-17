import { NextRequest, NextResponse } from "next/server"
import type Stripe from "stripe"
import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db"

/** POST /api/webhooks/stripe
 *  Listens for Stripe events and confirms/cancels workshop registrations.
 *  Must be added to the Stripe dashboard: https://dashboard.stripe.com/webhooks
 *
 *  Events handled:
 *   - checkout.session.completed  → mark registration CONFIRMED, increment workshop.registered
 *   - checkout.session.expired    → mark registration CANCELLED
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const sig     = req.headers.get("stripe-signature")

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error("[Stripe webhook] Signature verification failed:", err)
    return NextResponse.json({ error: "Webhook signature verification failed." }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.metadata?.type === "program") {
          // ── Program payment ───────────────────────────────────────────────
          const { paymentId, courseId, userId } = session.metadata ?? {}
          if (!paymentId || !courseId || !userId) break

          // Mark payment as succeeded
          await db.payment.update({
            where: { id: paymentId },
            data:  { status: "SUCCEEDED", stripePaymentId: session.id },
          })

          // Create enrollment (skip if somehow already enrolled)
          const existing = await db.enrollment.findUnique({
            where: { userId_courseId: { userId, courseId } },
          })
          if (!existing) {
            await db.enrollment.create({
              data: { userId, courseId, status: "ACTIVE" },
            })
          }
        } else {
          // ── Workshop payment ──────────────────────────────────────────────
          const registrationId = session.metadata?.registrationId
          const workshopId     = session.metadata?.workshopId

          if (!registrationId) break

          await db.workshopRegistration.update({
            where: { id: registrationId },
            data:  {
              status:                  "CONFIRMED",
              stripeCheckoutSessionId: session.id,
            },
          })

          if (workshopId) {
            await db.workshop.update({
              where: { id: workshopId },
              data:  { registered: { increment: 1 } },
            })
          }
        }
        break
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.metadata?.type === "program") {
          // Mark pending payment as failed
          const { paymentId } = session.metadata ?? {}
          if (paymentId) {
            await db.payment.update({
              where: { id: paymentId },
              data:  { status: "FAILED" },
            })
          }
        } else {
          const registrationId = session.metadata?.registrationId
          if (!registrationId) break

          await db.workshopRegistration.update({
            where: { id: registrationId },
            data:  { status: "CANCELLED" },
          })
        }
        break
      }

      default:
        // Ignore unhandled event types
        break
    }
  } catch (err) {
    console.error("[Stripe webhook] Handler error:", err)
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
