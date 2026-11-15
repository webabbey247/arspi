import "server-only"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireApiRole, requireCourseEditor, requireStaff, type GuardResult } from "@/lib/guard"

const notFound = (): GuardResult => ({
  ok: false, response: NextResponse.json({ error: "Rubric not found." }, { status: 404 }),
})

/**
 * Who may change a rubric depends on its scope:
 *  - library rubric   → admins only (it's shared by every programme)
 *  - programme copy   → that programme's editors (admin, or its instructor)
 */
export async function authoriseRubricWrite(rubricId: string): Promise<GuardResult> {
  const rubric = await db.rubric.findUnique({ where: { id: rubricId }, select: { courseId: true } })
  if (!rubric) return notFound()
  return rubric.courseId ? requireCourseEditor(rubric.courseId) : requireApiRole("ADMIN")
}

/** Reading: any staff for library rubrics; a programme copy only for that
 *  programme's editors. */
export async function authoriseRubricRead(rubricId: string): Promise<GuardResult> {
  const rubric = await db.rubric.findUnique({ where: { id: rubricId }, select: { courseId: true } })
  if (!rubric) return notFound()
  return rubric.courseId ? requireCourseEditor(rubric.courseId) : requireStaff()
}
