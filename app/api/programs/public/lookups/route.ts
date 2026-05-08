import { NextRequest, NextResponse } from "next/server"
import {
  getProgramLevels,
  getProgramFormats,
  getProgramPricings,
} from "@/services/program-lookup.service"

/** GET /api/programs/public/lookups?kind=levels|formats|pricing — public lookup options */
export async function GET(req: NextRequest) {
  try {
    const kind = req.nextUrl.searchParams.get("kind")

    const rows =
      kind === "levels"  ? await getProgramLevels()  :
      kind === "formats" ? await getProgramFormats() :
      kind === "pricing" ? await getProgramPricings() :
      null

    if (!rows) {
      return NextResponse.json({ error: "Invalid 'kind' (expected levels|formats|pricing)." }, { status: 400 })
    }

    const items = rows.map(r => ({ id: r.id, name: r.name, slug: r.slug }))
    return NextResponse.json({ items })
  } catch (error) {
    console.error("[GET /api/programs/public/lookups]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
