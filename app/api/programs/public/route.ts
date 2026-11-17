import { NextRequest, NextResponse } from "next/server"
import { CourseLevel } from "@/services/program.service"
import { getPublicProgramsPayload } from "@/lib/public-data"

/** GET /api/programs/public — publicly accessible listing of programs.
 *  Returns only fields the public card consumes (services/public-program.service.ts).
 *  Detail-only fields (overview, curriculum, faqs, etc.) are served by /api/programs/[id].
 *  Cached in lib/public-data, shared with the server-rendered pages. */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const levelRaw    = searchParams.get("level")    ?? undefined
    const featuredRaw = searchParams.get("featured") ?? undefined
    const categoryId  = searchParams.get("categoryId") ?? undefined

    const payload = await getPublicProgramsPayload({
      ...(levelRaw    && { level:    levelRaw    as CourseLevel }),
      ...(featuredRaw && { featured: featuredRaw === "true" }),
      ...(categoryId  && { categoryId }),
    })

    return NextResponse.json({ programs: payload })
  } catch (error) {
    console.error("[GET /api/programs/public]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
