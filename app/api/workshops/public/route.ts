import { NextRequest, NextResponse } from "next/server"
import { getPublicWorkshopsPayload, selectWorkshops } from "@/lib/public-data"

/** GET /api/workshops/public?limit=6&sort=upcoming — published workshops.
 *  `sort=upcoming` returns future workshops soonest first (what the home page
 *  asks for); otherwise newest first. `limit` caps the count (max 50).
 *  Cached in lib/public-data, shared with the server-rendered pages. */
export async function GET(req: NextRequest) {
  try {
    const all = await getPublicWorkshopsPayload()
    const workshops = selectWorkshops(all, {
      sort:  req.nextUrl.searchParams.get("sort"),
      limit: Number(req.nextUrl.searchParams.get("limit")) || 50,
    })
    return NextResponse.json({ workshops })
  } catch (error) {
    console.error("[GET /api/workshops/public]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
