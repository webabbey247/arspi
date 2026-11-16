import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { getWorkshops, WorkshopCategory, WorkshopType } from "@/services/workshop.service"


/** GET /api/instructor/workshops — list workshops belonging to the logged-in instructor */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "INSTRUCTOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = req.nextUrl
    const typeRaw      = searchParams.get("type")
    const categoryRaw  = searchParams.get("category")
    const publishedRaw = searchParams.get("published")
    const featuredRaw  = searchParams.get("featured")

    const workshops = await getWorkshops({
      instructorId: session.sub,
      ...(typeRaw      && { type:      typeRaw     as WorkshopType }),
      ...(categoryRaw  && { category:  categoryRaw as WorkshopCategory }),
      ...(publishedRaw !== null && { published: publishedRaw === "true" }),
      ...(featuredRaw  !== null && { featured:  featuredRaw  === "true" }),
    })

    return NextResponse.json({ workshops })
  } catch (error) {
    console.error("[GET /api/instructor/workshops]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

/** POST /api/instructor/workshops — disabled. Instructors can't create
 *  workshops for now; refused here as well as hidden in the UI. */
export async function POST() {
  return NextResponse.json({ error: "Instructors can't create workshops." }, { status: 403 })
}
