import "server-only"
import { NextResponse } from "next/server"
import { getSessionAndRefresh } from "@/lib/session"
import { db } from "@/lib/db"
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

/** Allows ADMIN or INSTRUCTOR through. requireApiRole() is an exact match, so
 *  it can't express "either" — assessment authoring and grading are open to
 *  both roles. */
export async function requireStaff(): Promise<GuardResult> {
  const session = await getSessionAndRefresh()
  if (!session || (session.role !== "ADMIN" && session.role !== "INSTRUCTOR")) {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }
  return { ok: true, session }
}

/** Course-scoped editor guard: an ADMIN may edit any programme, an INSTRUCTOR
 *  only the ones they teach. Checked against the row rather than the session
 *  alone, so an instructor can't author or grade against someone else's
 *  course by guessing its id. */
export async function requireCourseEditor(courseId: string): Promise<GuardResult> {
  const guard = await requireStaff()
  if (!guard.ok) return guard
  if (guard.session.role === "ADMIN") return guard

  const course = await db.course.findUnique({
    where:  { id: courseId },
    select: { instructorId: true },
  })
  if (!course || course.instructorId !== guard.session.sub) {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }
  return guard
}
