import { NextRequest, NextResponse } from "next/server"
import { requireStaff } from "@/lib/guard"
import { db } from "@/lib/db"

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

    return NextResponse.json({
      submissions: submissions.map(s => ({
        id: s.id, blockId: s.blockId,
        blockTitle: s.blockTitle, lessonTitle: s.lessonTitle,
        text: s.text, linkUrl: s.linkUrl, files: s.files,
        status: s.status, feedback: s.feedback, points: s.points,
        submittedAt: s.submittedAt.toISOString(),
        gradedAt: s.gradedAt?.toISOString() ?? null,
        course: s.course,
        student: {
          id: s.user.id,
          name: [s.user.profile?.firstName, s.user.profile?.lastName].filter(Boolean).join(" ") || s.user.email,
          email: s.user.email,
        },
      })),
    })
  } catch (error) {
    console.error("[GET /api/instructor/assignment-submissions]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
