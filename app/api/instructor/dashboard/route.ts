import { NextResponse } from "next/server"
import { requireApiRole } from "@/lib/guard"
import { db } from "@/lib/db"
import { collectLessonIds } from "@/services/lesson-progress.service"
import { listNotifications } from "@/services/notification.service"

const nameOf = (u: { email: string; profile: { firstName: string | null; lastName: string | null } | null }) =>
  [u.profile?.firstName, u.profile?.lastName].filter(Boolean).join(" ") || u.email

/**
 * GET /api/instructor/dashboard — everything the instructor's home screen
 * shows, in one round trip, scoped to the signed-in instructor:
 * their assigned programmes (status, learners, completion, work to mark),
 * the marking queue, recent enrolments, upcoming workshops and recent alerts.
 */
export async function GET() {
  try {
    const guard = await requireApiRole("INSTRUCTOR")
    if (!guard.ok) return guard.response
    const me = guard.session.sub

    const courses = await db.course.findMany({
      where:   { instructorId: me },
      select:  { id: true, title: true, slug: true, status: true, thumbnail: true, submittedForReviewAt: true, curriculum: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    })
    const courseIds = courses.map(c => c.id)
    const now = new Date()

    const [enrollments, progress, pendingAssignments, pendingProjects, workshops, alerts] = await Promise.all([
      courseIds.length
        ? db.enrollment.findMany({
            where:   { courseId: { in: courseIds } },
            select:  { id: true, userId: true, courseId: true, status: true, enrolledAt: true,
                       user: { select: { email: true, profile: { select: { firstName: true, lastName: true } } } } },
            orderBy: { enrolledAt: "desc" },
          })
        : Promise.resolve([]),
      courseIds.length
        ? db.lessonProgress.findMany({ where: { courseId: { in: courseIds } }, select: { userId: true, courseId: true, completedIds: true } })
        : Promise.resolve([]),
      courseIds.length
        ? db.assignmentSubmission.findMany({
            where:   { courseId: { in: courseIds }, status: "SUBMITTED" },
            select:  { id: true, courseId: true, blockTitle: true, submittedAt: true,
                       user: { select: { email: true, profile: { select: { firstName: true, lastName: true } } } } },
            orderBy: { submittedAt: "asc" },
          })
        : Promise.resolve([]),
      courseIds.length
        ? db.assessmentAttempt.findMany({
            where:   { status: "SUBMITTED", voided: false, assessment: { courseId: { in: courseIds }, kind: "PROJECT" } },
            select:  { id: true, submittedAt: true, assessment: { select: { title: true, courseId: true } },
                       user: { select: { email: true, profile: { select: { firstName: true, lastName: true } } } } },
            orderBy: { submittedAt: "asc" },
          })
        : Promise.resolve([]),
      db.workshop.findMany({
        where:   { instructorId: me, date: { gte: new Date(now.getTime() - 86_400_000) } },
        select:  { id: true, title: true, date: true, startTime: true, medium: true, registered: true, published: true },
        orderBy: { date: "asc" },
        take:    4,
      }),
      listNotifications(me, 6),
    ])

    // Completion per enrolment: lessons done ÷ lessons in the programme.
    const lessonTotals = new Map(courses.map(c => [c.id, collectLessonIds(c.curriculum).length]))
    const done = new Map(progress.map(p => [`${p.userId}:${p.courseId}`, Array.isArray(p.completedIds) ? (p.completedIds as unknown[]).length : 0]))
    const pctFor = (e: { userId: string; courseId: string; status: string }) => {
      if (e.status === "COMPLETED") return 100
      const total = lessonTotals.get(e.courseId) ?? 0
      return total > 0 ? Math.min(100, Math.round(((done.get(`${e.userId}:${e.courseId}`) ?? 0) / total) * 100)) : 0
    }

    const toMarkBy = new Map<string, number>()
    for (const a of pendingAssignments) toMarkBy.set(a.courseId, (toMarkBy.get(a.courseId) ?? 0) + 1)
    for (const p of pendingProjects) toMarkBy.set(p.assessment.courseId, (toMarkBy.get(p.assessment.courseId) ?? 0) + 1)
    const titleOf = new Map(courses.map(c => [c.id, c.title]))

    const active = enrollments.filter(e => e.status !== "DROPPED")
    const programmes = courses.map(c => {
      const mine = active.filter(e => e.courseId === c.id)
      const avg = mine.length ? Math.round(mine.reduce((s, e) => s + pctFor(e), 0) / mine.length) : null
      return {
        id: c.id, title: c.title, slug: c.slug, thumbnail: c.thumbnail,
        state: c.submittedForReviewAt ? "awaiting" : c.status === "PUBLISHED" ? "live" : "draft",
        learners: mine.length,
        avgCompletion: avg,
        toMark: toMarkBy.get(c.id) ?? 0,
        updatedAt: c.updatedAt.toISOString(),
      }
    })

    const queue = [
      ...pendingAssignments.map(a => ({
        id: a.id, kind: "assignment" as const, title: a.blockTitle ?? "Assignment",
        programme: titleOf.get(a.courseId) ?? "", learner: nameOf(a.user), submittedAt: a.submittedAt.toISOString(),
      })),
      ...pendingProjects.map(p => ({
        id: p.id, kind: "project" as const, title: p.assessment.title,
        programme: titleOf.get(p.assessment.courseId) ?? "", learner: nameOf(p.user), submittedAt: p.submittedAt?.toISOString() ?? now.toISOString(),
      })),
    ].sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))

    const avgAll = active.length ? Math.round(active.reduce((s, e) => s + pctFor(e), 0) / active.length) : null

    return NextResponse.json({
      stats: {
        programmes: {
          total: courses.length,
          live: programmes.filter(p => p.state === "live").length,
          draft: programmes.filter(p => p.state === "draft").length,
          awaiting: programmes.filter(p => p.state === "awaiting").length,
        },
        learners: {
          total: new Set(active.map(e => e.userId)).size,
          active: active.filter(e => e.status === "ACTIVE").length,
          completed: active.filter(e => e.status === "COMPLETED").length,
        },
        toMark: { total: queue.length, assignments: pendingAssignments.length, projects: pendingProjects.length },
        avgCompletion: avgAll,
      },
      programmes,
      queue: queue.slice(0, 6),
      recentEnrolments: enrollments.slice(0, 5).map(e => ({
        id: e.id, learner: nameOf(e.user), programme: titleOf.get(e.courseId) ?? "", enrolledAt: e.enrolledAt.toISOString(), progress: pctFor(e),
      })),
      workshops: workshops.map(w => ({ ...w, date: w.date?.toISOString() ?? null })),
      activity: alerts.items,
    })
  } catch (error) {
    console.error("[GET /api/instructor/dashboard]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
