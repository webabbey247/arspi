import { NextRequest, NextResponse } from "next/server"
import type Stripe from "stripe"
import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db"
import { sendWorkshopConfirmationEmail } from "@/lib/email"
import { computeDurationHours, normalizeFacilitators } from "@/lib/workshop-helpers"
import { notifySafely } from "@/services/notification.service"
import { notifyEnrolment, notifyWorkshopRegistration } from "@/services/notification-events.service"

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
      // "completed" fires as soon as checkout finishes — for delayed payment
      // methods that's before the money arrives, so act only when Stripe says
      // it's paid; those methods confirm later with async_payment_succeeded.
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.payment_status !== "paid") break

        if (session.metadata?.type === "program") {
          // ── Program payment ───────────────────────────────────────────────
          const { paymentId, courseId, userId } = session.metadata ?? {}
          if (!paymentId || !courseId || !userId) break

          // Mark payment as succeeded. Stripe retries and re-delivers events,
          // so only the first delivery for a still-pending payment does work.
          const marked = await db.payment.updateMany({
            where: { id: paymentId, status: { in: ["PENDING", "FAILED"] } },
            data:  { status: "SUCCEEDED", stripePaymentId: session.id },
          })
          if (marked.count === 0) break

          // Create enrollment (skip if somehow already enrolled)
          const existing = await db.enrollment.findUnique({
            where: { userId_courseId: { userId, courseId } },
          })
          if (!existing) {
            await db.enrollment.create({
              data: { userId, courseId, status: "ACTIVE" },
            })
            notifySafely(() => notifyEnrolment({ userId, courseId, paid: true }))
          }
        } else {
          // ── Workshop payment ──────────────────────────────────────────────
          const registrationId = session.metadata?.registrationId
          const workshopId     = session.metadata?.workshopId

          if (!registrationId) break

          // Idempotent: confirm only a still-pending registration. A re-delivered
          // event finds nothing to update and stops here, so the seat count and
          // confirmation email aren't repeated.
          const confirmed = await db.workshopRegistration.updateMany({
            where: { id: registrationId, status: "PENDING" },
            data:  {
              status:                  "CONFIRMED",
              stripeCheckoutSessionId: session.id,
            },
          })
          if (confirmed.count === 0) break
          const registration = await db.workshopRegistration.findUniqueOrThrow({ where: { id: registrationId } })

          if (workshopId) {
            await db.workshop.update({
              where: { id: workshopId },
              data:  { registered: { increment: 1 } },
            })
          }

          notifySafely(() => notifyWorkshopRegistration({
            workshopId: workshopId ?? null, workshopTitle: registration.workshopTitle,
            firstName: registration.firstName, lastName: registration.lastName,
            email: registration.email, paid: true,
          }))

          // Send confirmation email — non-blocking, errors are logged only
          const workshop = workshopId
            ? await db.workshop.findUnique({ where: { id: workshopId } }).catch(() => null)
            : null

          sendWorkshopConfirmationEmail(registration.email, {
            firstName:      registration.firstName,
            workshopTitle:  registration.workshopTitle,
            workshopDate:   registration.workshopDate,
            workshopTime:   registration.workshopTime,
            fee:            registration.fee,
            isConfirmed:    true,
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
          }).catch(err => console.error("[stripe webhook] workshop confirmation email failed:", err))
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
