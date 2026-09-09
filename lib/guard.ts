import "server-only"
import { NextResponse } from "next/server"
import { getSessionAndRefresh } from "@/lib/session"
import type { SessionPayload } from "@/types/session"

/** API-route guard. Every route re-checks here rather than trusting that the
 *  UI hid the control — the sidebar is a rendering aid, not a gate.
 *
 *  Mirrors the `if (!session || session.role !== "X") return 403` check
 *  already inlined across the route handlers, so adopting it changes nothing
 *  about the response shape or status code — just removes the duplication.
 *  Uses `getSessionAndRefresh()` (only legal from a Route Handler / Server
 *  Action, which is all this is ever called from) so an expired access token
 *  transparently refreshes here instead of forcing a re-login every 15 min. */
export type GuardResult =
  | { ok: true; session: SessionPayload }
  | { ok: false; response: NextResponse }

export async function requireApiSession(): Promise<GuardResult> {
  const session = await getSessionAndRefresh()
  if (!session) {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }
  return { ok: true, session }
}

export async function requireApiRole(role: SessionPayload["role"]): Promise<GuardResult> {
  const session = await getSessionAndRefresh()
  if (!session || session.role !== role) {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }
  return { ok: true, session }
}
