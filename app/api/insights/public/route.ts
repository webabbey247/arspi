import { NextRequest, NextResponse } from "next/server"
import { getPublicInsightsPayload } from "@/lib/public-data"

/** GET /api/insights/public — publicly accessible list of published insights.
 *  Cached in lib/public-data, shared with the server-rendered pages. */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const category = searchParams.get("category")?.trim().toLowerCase()
    const featuredRaw = searchParams.get("featured")

    const insights = await getPublicInsightsPayload({
      ...(featuredRaw !== null && { featured: featuredRaw === "true" }),
      ...(category && { categorySlug: category }),
    })

    return NextResponse.json({ insights })
  } catch (error) {
    console.error("[GET /api/insights/public]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
