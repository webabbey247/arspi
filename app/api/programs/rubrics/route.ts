import { NextRequest, NextResponse } from "next/server"
import { requireApiRole, requireCourseEditor, requireStaff } from "@/lib/guard"
import { parseRubricBody } from "@/lib/rubric-schema"
import { createRubric, listRubrics } from "@/services/rubric.service"

/** GET /api/programs/rubrics — the rubric library.
 *  Staff only: instructors need the list to attach a rubric to their own
 *  assignments and projects. `?status=active` returns only rubrics that can be
 *  attached. `?courseId=` adds that programme's own customised copies (its
 *  editors only). The default rubric is created on first use. */
export async function GET(req: NextRequest) {
  try {
    const courseId = req.nextUrl.searchParams.get("courseId") ?? undefined
    const guard = courseId ? await requireCourseEditor(courseId) : await requireStaff()
    if (!guard.ok) return guard.response

    const scope = req.nextUrl.searchParams.get("status")
    const rubrics = await listRubrics({
      ...(scope === "active" && { status: ["ACTIVE"] }),
      courseId,
    })
    return NextResponse.json({ rubrics })
  } catch (error) {
    console.error("[GET /api/programs/rubrics]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

/** POST /api/programs/rubrics — create a rubric.
 *  Library rubric: admin only. With `courseId`: a copy customised for that
 *  programme, which its instructor may create too; it's always active, since
 *  it exists only to be used by that programme. */
export async function POST(req: NextRequest) {
  try {
    const raw = await req.json()
    const courseId = typeof raw?.courseId === "string" && raw.courseId ? raw.courseId as string : null
    const guard = courseId ? await requireCourseEditor(courseId) : await requireApiRole("ADMIN")
    if (!guard.ok) return guard.response

    const parsed = parseRubricBody(raw)
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })

    const rubric = await createRubric(
      parsed.content,
      courseId ? "ACTIVE" : parsed.status ?? "DRAFT",
      guard.session.sub,
      { courseId },
    )
    return NextResponse.json({ rubric }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/programs/rubrics]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
