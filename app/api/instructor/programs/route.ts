import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { getPrograms, CourseLevel } from "@/services/program.service"

/** GET /api/instructor/programs — list programs belonging to the logged-in instructor */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "INSTRUCTOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = req.nextUrl
    const levelRaw    = searchParams.get("level")    ?? undefined
    const featuredRaw = searchParams.get("featured")

    const programs = await getPrograms({
      instructorId: session.sub,
      ...(levelRaw             && { level: levelRaw as CourseLevel }),
      ...(featuredRaw !== null && { featured: featuredRaw === "true" }),
    })

    return NextResponse.json({ programs })
  } catch (error) {
    console.error("[GET /api/instructor/programs]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

/** POST /api/instructor/programs — disabled. Instructors don't create
 *  programmes for now: an admin creates one and assigns it to them for review.
 *  Refused here as well as hidden in the UI. */
export async function POST() {
  return NextResponse.json(
    { error: "Instructors can't create programmes. An administrator assigns programmes to you." },
    { status: 403 },
  )
}
