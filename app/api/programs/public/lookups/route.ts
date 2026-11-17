import { NextRequest, NextResponse } from "next/server"
import { getPublicLookupItems } from "@/lib/public-data"

/** GET /api/programs/public/lookups?kind=levels|formats|pricing — public lookup options */
export async function GET(req: NextRequest) {
  try {
    const kind = req.nextUrl.searchParams.get("kind")

    const items = kind ? await getPublicLookupItems(kind) : null
    if (!items) {
      return NextResponse.json({ error: "Invalid 'kind' (expected levels|formats|pricing)." }, { status: 400 })
    }

    return NextResponse.json({ items })
  } catch (error) {
    console.error("[GET /api/programs/public/lookups]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
