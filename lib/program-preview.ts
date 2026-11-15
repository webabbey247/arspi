import "server-only"
import { NextResponse } from "next/server"
import { requireStaff } from "@/lib/guard"
import { getProgramBySlug } from "@/services/program.service"

export { staffProgramHref } from "@/lib/program-preview-links"

/**
 * Guard for every "preview as…" route. Admins may preview any programme;
 * instructors only the ones they teach. Drafts are allowed — previewing
 * before publishing is the point.
 */
export async function requireProgramPreview(slug: string) {
  const guard = await requireStaff()
  if (!guard.ok) return { ok: false as const, response: guard.response }
  const program = await getProgramBySlug(slug)
  if (!program) {
    return { ok: false as const, response: NextResponse.json({ error: "Program not found." }, { status: 404 }) }
  }
  if (guard.session.role === "INSTRUCTOR" && program.instructorId !== guard.session.sub) {
    return { ok: false as const, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }
  return { ok: true as const, session: guard.session, program }
}
