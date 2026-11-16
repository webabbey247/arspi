import { NextResponse } from "next/server"
import { requireApiRole } from "@/lib/guard"
import { db } from "@/lib/db"
import { collectLessonIds } from "@/services/lesson-progress.service"

/** GET /api/instructor/students — every learner enrolled in a programme
 *  assigned to the signed-in instructor, one row per enrolment, with lesson
 *  progress, the course grade (if graded), and how much of their work is
 *  waiting to be marked. Scoped to the instructor's own programmes only. */
export async function GET() {
  try {
    const guard = await requireApiRole("INSTRUCTOR")
    if (!guard.ok) return guard.response
    const me = guard.session.sub

    const courses = await db.course.findMany({
      where:  { instructorId: me },
      select: { id: true, title: true, slug: true, curriculum: true, gradingEnabled: true },
    })
    if (courses.length === 0) return NextResponse.json({ students: [], programmes: [] })
    const courseIds = courses.map(c => c.id)
    const lessonTotals = new Map(courses.map(c => [c.id, collectLessonIds(c.curriculum).length]))

    // Four queries for the whole list, rather than several per learner.
    const [enrollments, progress, grades, pendingAssignments, pendingProjects] = await Promise.all([
      db.enrollment.findMany({
        where:   { courseId: { in: courseIds } },
        include: { user: { select: { id: true, email: true, profile: { select: { firstName: true, lastName: true, avatar: true } } } } },
        orderBy: { enrolledAt: "desc" },
      }),
      db.lessonProgress.findMany({ where: { courseId: { in: courseIds } }, select: { userId: true, courseId: true, completedIds: true } }),
      db.courseGrade.findMany({ where: { courseId: { in: courseIds } }, select: { userId: true, courseId: true, finalMarks: true, passed: true } }),
      db.assignmentSubmission.groupBy({
        by: ["userId", "courseId"], where: { courseId: { in: courseIds }, status: "SUBMITTED" }, _count: { _all: true },
      }),
      db.assessmentAttempt.findMany({
        where:  { status: "SUBMITTED", voided: false, assessment: { courseId: { in: courseIds }, kind: "PROJECT" } },
        select: { userId: true, assessment: { select: { courseId: true } } },
      }),
    ])

    const key = (u: string, c: string) => `${u}:${c}`
    const done = new Map(progress.map(p => [key(p.userId, p.courseId), Array.isArray(p.completedIds) ? (p.completedIds as unknown[]).length : 0]))
    const gradeBy = new Map(grades.map(g => [key(g.userId, g.courseId), g]))
    const pending = new Map<string, number>()
    for (const a of pendingAssignments) pending.set(key(a.userId, a.courseId), a._count._all)
    for (const p of pendingProjects) {
      const k = key(p.userId, p.assessment.courseId)
      pending.set(k, (pending.get(k) ?? 0) + 1)
    }
    const courseById = new Map(courses.map(c => [c.id, c]))

    return NextResponse.json({
      programmes: courses.map(c => ({ id: c.id, title: c.title })),
      students: enrollments.map(e => {
        const k = key(e.userId, e.courseId)
        const total = lessonTotals.get(e.courseId) ?? 0
        const completed = Math.min(done.get(k) ?? 0, total)
        const course = courseById.get(e.courseId)!
        const grade = gradeBy.get(k)
        return {
          enrollmentId: e.id,
          status: e.status,
          enrolledAt: e.enrolledAt.toISOString(),
          completedAt: e.completedAt?.toISOString() ?? null,
          progressPct: e.status === "COMPLETED" ? 100 : total > 0 ? Math.round((completed / total) * 100) : 0,
          lessonsDone: completed,
          lessonsTotal: total,
          grade: course.gradingEnabled && grade ? { finalMarks: grade.finalMarks, passed: grade.passed } : null,
          pendingMarking: pending.get(k) ?? 0,
          programme: { id: course.id, title: course.title, slug: course.slug },
          student: {
            id: e.user.id,
            email: e.user.email,
            name: [e.user.profile?.firstName, e.user.profile?.lastName].filter(Boolean).join(" ") || e.user.email,
            avatar: e.user.profile?.avatar ?? null,
          },
        }
      }),
    })
  } catch (error) {
    console.error("[GET /api/instructor/students]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
