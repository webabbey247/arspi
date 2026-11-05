import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { revokeSession, sessionsAvailable } from "@/services/session.service"

type Context = { params: Promise<{ id: string }> }

/** DELETE /api/account/sessions/[id] — signs one device out.
 *
 *  The revoke is scoped by the caller's user id, so knowing a session id is
 *  not enough to end someone else's session. A device loses access at its
 *  next token refresh, within the access token's 15-minute life. */
export async function DELETE(_req: NextRequest, { params }: Context) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  if (!sessionsAvailable()) {
    return NextResponse.json({ error: "Session tracking is not set up yet." }, { status: 503 })
  }

  try {
    const { id } = await params
    const ok = await revokeSession(session.sub, id)
    if (!ok) {
      return NextResponse.json({ error: "That session was not found." }, { status: 404 })
    }
    return NextResponse.json({ revoked: 1 })
  } catch (error) {
    console.error("[DELETE /api/account/sessions/[id]]", error)
    return NextResponse.json({ error: "Could not sign that session out." }, { status: 500 })
  }
}
