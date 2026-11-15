import { NextRequest, NextResponse } from "next/server"
import { requireStaff } from "@/lib/guard"
import { db } from "@/lib/db"
import { collectAssignments } from "@/services/assignment.service"
import { getCurrentVersions, getVersionsById } from "@/services/rubric.service"

/** GET /api/instructor/assignment-submissions — the in-lesson assignment
 *  review queue. An instructor sees only their own programmes; an admin sees
 *  everything. Defaults to work that still needs a decision. */
export async function GET(req: NextRequest) {
  try {
    const guard = await requireStaff()
    if (!guard.ok) return guard.response
    const { session } = guard

    const scope    = req.nextUrl.searchParams.get("status")
    const courseId = req.nextUrl.searchParams.get("courseId")
    const statuses = scope === "all"
      ? (["SUBMITTED", "RETURNED", "ACCEPTED"] as const)
      : (["SUBMITTED"] as const)

    const submissions = await db.assignmentSubmission.findMany({
      where: {
        status: { in: [...statuses] },
        ...(courseId ? { courseId } : {}),
        ...(session.role === "INSTRUCTOR" && { course: { instructorId: session.sub } }),
      },
      include: {
        course: { select: { id: true, title: true, slug: true } },
        user:   { select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { submittedAt: "asc" },
      take: 200,
    })

    // Which rubric each assignment block uses lives in the curriculum JSON, so
    // read each programme's curriculum once rather than per row.
    const courseIds = [...new Set(submissions.map(s => s.courseId))]
    const courses = await db.course.findMany({
      where:  { id: { in: courseIds } },
      select: { id: true, curriculum: true },
    })
    const blockInfo = new Map<string, { rubricId: string | null; submissionType: string; points: number | null }>()
    for (const c of courses) {
      for (const a of collectAssignments(c.curriculum)) {
        blockInfo.set(`${c.id}:${a.blockId}`, { rubricId: a.rubricId, submissionType: a.submissionType, points: a.points })
      }
    }

    // A row marks against its pinned version if it has one, else the
    // rubric's current version. Ship each version once, keyed by id.
    const current = await getCurrentVersions(
      [...blockInfo.values()].map(b => b.rubricId).filter((x): x is string => !!x),
    )
    const pinned = await getVersionsById(
      submissions.map(s => s.rubricVersionId).filter((x): x is string => !!x),
    )
    const rubrics = { ...pinned, ...Object.fromEntries(Object.values(current).map(v => [v.id, v])) }

    return NextResponse.json({
      rubrics,
      submissions: submissions.map(s => {
        const info = blockInfo.get(`${s.courseId}:${s.blockId}`)
        const rubricVersionId = s.rubricVersionId ?? (info?.rubricId ? current[info.rubricId]?.id ?? null : null)
        return {
        id: s.id, blockId: s.blockId,
        blockTitle: s.blockTitle, lessonTitle: s.lessonTitle,
        text: s.text, linkUrl: s.linkUrl, files: s.files,
        status: s.status, feedback: s.feedback, points: s.points,
        maxPoints: info?.points ?? null,
        submittedAt: s.submittedAt.toISOString(),
        gradedAt: s.gradedAt?.toISOString() ?? null,
        course: s.course,
        rubricVersionId,
        rubricMarks:  s.rubricMarks,
        gradeBand:    s.gradeBand,
        markingDraft: s.markingDraft,
        student: {
          id: s.user.id,
          name: [s.user.profile?.firstName, s.user.profile?.lastName].filter(Boolean).join(" ") || s.user.email,
          email: s.user.email,
        },
      }}),
    })
  } catch (error) {
    console.error("[GET /api/instructor/assignment-submissions]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
