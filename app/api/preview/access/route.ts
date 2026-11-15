import { NextRequest, NextResponse } from "next/server"
import { requireProgramPreview } from "@/lib/program-preview"

/** GET /api/preview/access?slug=… — can the signed-in user preview this
 *  programme? Lets the programme 404 page send an admin (or the programme's
 *  instructor) into the draft preview instead of a dead end. Answers only
 *  yes/no, so it reveals nothing to anyone else. */
export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get("slug") ?? ""
    if (!slug) return NextResponse.json({ allowed: false })
    const auth = await requireProgramPreview(slug)
    return NextResponse.json({ allowed: auth.ok }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    console.error("[GET /api/preview/access]", error)
    return NextResponse.json({ allowed: false })
  }
}
