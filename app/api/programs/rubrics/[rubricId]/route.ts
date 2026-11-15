import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { authoriseRubricRead, authoriseRubricWrite } from "@/lib/rubric-auth"
import { parseRubricBody } from "@/lib/rubric-schema"
import { getRubricDetail, getVersionById, setRubricStatus, updateRubric } from "@/services/rubric.service"

type Context = { params: Promise<{ rubricId: string }> }

/** GET — the current version (or `?versionId=` for a past one), plus the
 *  version history. Staff only — used by the builder and the preview panel. */
export async function GET(req: NextRequest, { params }: Context) {
  try {
    const { rubricId } = await params
    const guard = await authoriseRubricRead(rubricId)
    if (!guard.ok) return guard.response

    const detail = await getRubricDetail(rubricId)
    if (!detail) return NextResponse.json({ error: "Rubric not found." }, { status: 404 })

    const versionId = req.nextUrl.searchParams.get("versionId")
    if (versionId) {
      const version = await getVersionById(versionId)
      if (!version || version.rubricId !== rubricId) {
        return NextResponse.json({ error: "Version not found." }, { status: 404 })
      }
      return NextResponse.json({ rubric: { ...detail, current: version } })
    }
    return NextResponse.json({ rubric: detail })
  } catch (error) {
    console.error("[GET /api/programs/rubrics/[rubricId]]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

/** PUT — save new content. Becomes a new version when the current one has
 *  already been used for marking. Library rubrics: admin only; a programme's
 *  copy: that programme's editors. */
export async function PUT(req: NextRequest, { params }: Context) {
  try {
    const { rubricId } = await params
    const guard = await authoriseRubricWrite(rubricId)
    if (!guard.ok) return guard.response

    const parsed = parseRubricBody(await req.json())
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })

    const result = await updateRubric(rubricId, parsed.content, parsed.status)
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 404 })
    return NextResponse.json({ versioned: result.versioned, version: result.version })
  } catch (error) {
    console.error("[PUT /api/programs/rubrics/[rubricId]]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

const statusSchema = z.object({ status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]) })

/** PATCH — change status only: activate, archive or restore.
 *  Archiving never detaches a rubric from assignments already using it; it
 *  only stops it being offered for new ones. */
export async function PATCH(req: NextRequest, { params }: Context) {
  try {
    const { rubricId } = await params
    const guard = await authoriseRubricWrite(rubricId)
    if (!guard.ok) return guard.response

    const parsed = statusSchema.safeParse(await req.json())
    if (!parsed.success) return NextResponse.json({ error: "Invalid status." }, { status: 400 })

    const rubric = await setRubricStatus(rubricId, parsed.data.status)
    if (!rubric) return NextResponse.json({ error: "Rubric not found." }, { status: 404 })
    return NextResponse.json({ rubric })
  } catch (error) {
    console.error("[PATCH /api/programs/rubrics/[rubricId]]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
