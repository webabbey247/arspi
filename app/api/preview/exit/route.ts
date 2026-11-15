import { NextRequest, NextResponse } from "next/server"
import { draftMode } from "next/headers"
import { getSession } from "@/lib/session"
import { staffProgramHref } from "@/lib/program-preview"

/** GET /api/preview/exit?slug=… — leave the public-page preview and go back to
 *  the programme's dashboard page (or the public page for anyone else). */
export async function GET(req: NextRequest) {
  const draft = await draftMode()
  draft.disable()

  const slug = req.nextUrl.searchParams.get("slug") ?? ""
  const session = await getSession()
  const staff = session && (session.role === "ADMIN" || session.role === "INSTRUCTOR")
  const target = !slug ? "/" : staff ? staffProgramHref(session.role, slug) : `/programs/${encodeURIComponent(slug)}`
  return NextResponse.redirect(new URL(target, req.url))
}
