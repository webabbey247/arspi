import { NextRequest, NextResponse } from "next/server"
import { requireApiSession } from "@/lib/guard"
import { db } from "@/lib/db"

/** GET /api/instructor/submissions — the project grading queue.
 *
 *  requireApiRole() is an exact role match, so it can't express
 *  "instructor OR admin". Checked inline instead. An instructor sees only
 *  their own programmes; an admin sees everything. */
export async function GET(req: NextRequest) {
  try {
    const guard = await requireApiSession()
    if (!guard.ok) return guard.response
    const { session } = guard
    if (session.role !== "INSTRUCTOR" && session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const status = req.nextUrl.searchParams.get("status")
    const statuses = status === "all"
      ? (["SUBMITTED", "GRADED", "CHANGES_REQUESTED"] as const)
      : (["SUBMITTED"] as const)

    const submissions = await db.assessmentAttempt.findMany({
      where: {
        voided: false,
        status: { in: [...statuses] },
        assessment: {
          kind: "PROJECT",
          ...(session.role === "INSTRUCTOR" && { course: { instructorId: session.sub } }),
        },
      },
      include: {
        assessment: { select: { id: true, title: true, rubric: true, course: { select: { id: true, title: true, slug: true, componentPassMark: true } } } },
        user:       { select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { submittedAt: "asc" },
      take: 100,
    })

    return NextResponse.json({
      submissions: submissions.map(s => ({
        id: s.id, attemptNo: s.attemptNo, status: s.status,
        files: s.files, note: s.note,
        score: s.score, maxScore: s.maxScore, passed: s.passed,
        rubricScores: s.rubricScores, feedback: s.feedback,
        submittedAt: s.submittedAt?.toISOString() ?? null,
        gradedAt:    s.gradedAt?.toISOString() ?? null,
        assessment:  s.assessment,
        student: {
          id: s.user.id,
          name: [s.user.profile?.firstName, s.user.profile?.lastName].filter(Boolean).join(" ") || s.user.email,
          email: s.user.email,
        },
      })),
    })
  } catch (error) {
    console.error("[GET /api/instructor/submissions]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
