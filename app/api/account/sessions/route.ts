import { NextResponse } from "next/server"
import { getSession, getCurrentSessionId } from "@/lib/session"
import {
  listSessions, revokeOtherSessions, pruneDeadSessions, sessionsAvailable,
} from "@/services/session.service"

/** GET /api/account/sessions — the signed-in devices for the current account.
 *  Scoped to the caller: there is no way to ask for anyone else's. */
export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Not an error: the feature needs a migration that may not have been run
  // yet. Saying so plainly beats a 500 the UI has to guess at.
  if (!sessionsAvailable()) {
    return NextResponse.json({ sessions: [], currentId: null, available: false })
  }

  try {
    await pruneDeadSessions(session.sub)
    const currentId = await getCurrentSessionId()
    const sessions = await listSessions(session.sub, currentId)
    return NextResponse.json({ sessions, currentId, available: true })
  } catch (error) {
    console.error("[GET /api/account/sessions]", error)
    return NextResponse.json({ error: "Could not load your sessions." }, { status: 500 })
  }
}

/** DELETE /api/account/sessions — signs out every device except this one.
 *  Revoked devices lose access at their next token refresh, so within the
 *  access token's 15-minute life rather than instantly. */
export async function DELETE() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const currentId = await getCurrentSessionId()
    const revoked = await revokeOtherSessions(session.sub, currentId)
    return NextResponse.json({ revoked })
  } catch (error) {
    console.error("[DELETE /api/account/sessions]", error)
    return NextResponse.json({ error: "Could not sign out the other sessions." }, { status: 500 })
  }
}
