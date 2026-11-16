import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireApiSession } from "@/lib/guard"
import { listNotifications, markNotificationsRead } from "@/services/notification.service"

/** GET /api/notifications — the signed-in user's latest alerts and unread count. */
export async function GET(req: NextRequest) {
  try {
    const guard = await requireApiSession()
    if (!guard.ok) return guard.response
    // The bell shows the latest 30; the notifications page asks for more.
    const limit = Math.min(Math.max(Number(req.nextUrl.searchParams.get("limit")) || 30, 1), 200)
    return NextResponse.json(await listNotifications(guard.session.sub, limit), { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    console.error("[GET /api/notifications]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

const patchSchema = z.object({ ids: z.array(z.string()).max(100).optional() })

/** PATCH /api/notifications — mark some (`ids`) or all of your alerts read. */
export async function PATCH(req: NextRequest) {
  try {
    const guard = await requireApiSession()
    if (!guard.ok) return guard.response
    const parsed = patchSchema.safeParse(await req.json().catch(() => ({})))
    if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 })
    await markNotificationsRead(guard.session.sub, parsed.data.ids)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[PATCH /api/notifications]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
