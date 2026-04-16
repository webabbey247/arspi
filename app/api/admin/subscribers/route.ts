import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { getNewsletterSubscribers, SubscriptionStatus } from "@/services/subscription.service"

/** GET /api/admin/subscribers — list all newsletter subscribers (admin only) */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = req.nextUrl
    const status = searchParams.get("status") as SubscriptionStatus | null
    const search = searchParams.get("search") ?? undefined

    const subscribers = await getNewsletterSubscribers({
      status: status ?? undefined,
      search,
    })

    return NextResponse.json(
      subscribers.map((subscriber) => ({
        ...subscriber,
        subscribedAt: subscriber.subscribedAt.toISOString(),
        unsubscribedAt: subscriber.unsubscribedAt?.toISOString() ?? null,
      }))
    )
  } catch (error) {
    console.error("[GET /api/admin/subscribers]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}