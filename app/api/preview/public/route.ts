import { NextRequest, NextResponse } from "next/server"
import { draftMode } from "next/headers"
import { requireProgramPreview } from "@/lib/program-preview"

/** GET /api/preview/public?slug=… — turn on Next's Draft Mode for this
 *  browser and open the public programme page. Draft Mode skips the page's
 *  5-minute cache so staff see the latest content, drafts included; the page
 *  itself re-checks that the viewer is staff before showing a draft. */
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug") ?? ""
  const auth = await requireProgramPreview(slug)
  if (!auth.ok) return auth.response

  const draft = await draftMode()
  draft.enable()
  // `?preview=1` tells the programme 404 page this browser has already been
  // through here, so it never bounces back (e.g. if the cookie was blocked).
  return NextResponse.redirect(new URL(`/programs/${encodeURIComponent(slug)}?preview=1`, req.url))
}
