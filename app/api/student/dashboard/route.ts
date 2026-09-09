import { NextResponse } from "next/server"
import { requireApiRole } from "@/lib/guard"
import { db } from "@/lib/db"
import { collectLessonIds } from "@/services/lesson-progress.service"

/** GET /api/student/dashboard — everything the student dashboard overview needs
 *  in one round-trip: stat counts, a "continue learning" prompt, recent
 *  programs, recent/upcoming workshops, and this month's registered workshops
 *  for the calendar widget. */
export async function GET() {
  try {
    const guard = await requireApiRole("USER")
    if (!guard.ok) return guard.response
    const { session } = guard

    const [enrollments, registrations, certificatesCount] = await Promise.all([
      db.enrollment.findMany({
        where:   { userId: session.sub },
        include: {
          course: {
            select: {
              id: true, title: true, slug: true, thumbnail: true, tagline: true,
              level: true, curriculum: true,
            },
          },
        },
        orderBy: { enrolledAt: "desc" },
      }),
      db.workshopRegistration.findMany({
        where:   { email: { equals: session.email, mode: "insensitive" }, status: { not: "CANCELLED" } },
        include: {
          workshop: {
            select: { id: true, title: true, slug: true, date: true, startTime: true, endTime: true, coverImage: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      db.certificate.count({ where: { userId: session.sub } }),
    ])

    const courseIds = enrollments.map(e => e.courseId)
    const progressRows = await db.lessonProgress.findMany({
      where: { userId: session.sub, courseId: { in: courseIds } },
    })
    const progressByCourse = new Map(progressRows.map(p => [p.courseId, { ids: (p.completedIds as string[]) ?? [], updatedAt: p.updatedAt }]))

    const programs = enrollments.map(e => {
      const allLessonIds   = collectLessonIds(e.course.curriculum)
      const progress       = progressByCourse.get(e.courseId)
      const completedCount = allLessonIds.filter(id => progress?.ids.includes(id)).length
      return {
        enrollmentId: e.id,
        status:       e.status,
        enrolledAt:   e.enrolledAt,
        course: {
          id: e.course.id, title: e.course.title, slug: e.course.slug,
          thumbnail: e.course.thumbnail, tagline: e.course.tagline, level: e.course.level,
        },
        totalLessons:     allLessonIds.length,
        completedLessons: completedCount,
        lastTouchedAt:    progress?.updatedAt ?? e.enrolledAt,
      }
    })

    // "Continue learning" — prefer the ACTIVE (not completed) program most
    // recently touched (a lesson marked complete). Many programs don't have
    // lesson-level curriculum yet (totalLessons === 0), so fall back to the
    // most-recently-enrolled ACTIVE program in that case — still worth a
    // "pick up where you left off" prompt, just without a progress bar.
    const active = programs.filter(p => p.status === "ACTIVE")
    const withLessons = active
      .filter(p => p.totalLessons > 0)
      .sort((a, b) => b.lastTouchedAt.getTime() - a.lastTouchedAt.getTime())
    const withoutLessons = active
      .filter(p => p.totalLessons === 0)
      .sort((a, b) => b.enrolledAt.getTime() - a.enrolledAt.getTime())
    const continueLearning = withLessons[0] ?? withoutLessons[0] ?? null

    const now = new Date()
    const upcomingRegs = registrations.filter(r => r.workshop?.date && new Date(r.workshop.date) >= now)
    const pastRegs      = registrations.filter(r => !r.workshop?.date || new Date(r.workshop.date) < now)

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const calendarWorkshops = registrations
      .filter(r => r.workshop?.date)
      .filter(r => {
        const d = new Date(r.workshop!.date!)
        return d >= monthStart && d < monthEnd
      })
      .map(r => ({
        id: r.workshop!.id, title: r.workshop!.title, slug: r.workshop!.slug,
        date: r.workshop!.date!.toISOString(),
      }))

    return NextResponse.json({
      stats: {
        programs:     { total: programs.length, active: programs.filter(p => p.status === "ACTIVE").length, completed: programs.filter(p => p.status === "COMPLETED").length },
        workshops:    { total: registrations.length, upcoming: upcomingRegs.length, past: pastRegs.length },
        certificates: { total: certificatesCount },
      },
      continueLearning: continueLearning ? {
        courseId: continueLearning.course.id, title: continueLearning.course.title, slug: continueLearning.course.slug,
        thumbnail: continueLearning.course.thumbnail,
        completedLessons: continueLearning.completedLessons, totalLessons: continueLearning.totalLessons,
      } : null,
      recentPrograms: programs.slice(0, 5).map(p => ({
        id: p.enrollmentId, title: p.course.title, slug: p.course.slug, thumbnail: p.course.thumbnail,
        level: p.course.level, status: p.status, enrolledAt: p.enrolledAt.toISOString(),
        completedLessons: p.completedLessons, totalLessons: p.totalLessons,
      })),
      recentWorkshops: pastRegs.slice(0, 5).map(r => ({
        id: r.id, title: r.workshop?.title ?? r.workshopTitle, slug: r.workshop?.slug ?? null,
        date: r.workshop?.date?.toISOString() ?? null, status: r.status,
      })),
      upcomingWorkshops: upcomingRegs
        .sort((a, b) => new Date(a.workshop!.date!).getTime() - new Date(b.workshop!.date!).getTime())
        .slice(0, 5)
        .map(r => ({
          id: r.id, title: r.workshop?.title ?? r.workshopTitle, slug: r.workshop?.slug ?? null,
          date: r.workshop?.date?.toISOString() ?? null, startTime: r.workshop?.startTime ?? null, status: r.status,
        })),
      calendarWorkshops,
    })
  } catch (error) {
    console.error("[GET /api/student/dashboard]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
