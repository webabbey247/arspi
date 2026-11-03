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

    const [enrollments, registrations, certificates] = await Promise.all([
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
      db.certificate.findMany({
        where:   { userId: session.sub },
        include: { course: { select: { title: true, slug: true } } },
        orderBy: { issuedAt: "desc" },
      }),
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
        completedAt:  e.completedAt,
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

    const lessonsTotal     = programs.reduce((sum, p) => sum + p.totalLessons, 0)
    const lessonsCompleted = programs.reduce((sum, p) => sum + p.completedLessons, 0)

    /** Every event here carries a real timestamp. Note there is no per-lesson
     *  completion history to draw on — the player stores progress as a JSON
     *  array on LessonProgress with a single updatedAt — so "picked up again"
     *  is one event per programme, not one per lesson, and no per-day
     *  activity series is possible without a schema change. */
    const activity = [
      ...programs.flatMap(p => {
        const href = `/student/programs/${p.course.slug}`
        const rows: { id: string; kind: "enrolled" | "completed" | "progress"; title: string; href: string; at: string }[] = [{
          id: `enrol-${p.enrollmentId}`, kind: "enrolled" as const,
          title: p.course.title, href, at: p.enrolledAt.toISOString(),
        }]
        if (p.completedAt) {
          rows.push({
            id: `done-${p.enrollmentId}`, kind: "completed" as const,
            title: p.course.title, href, at: p.completedAt.toISOString(),
          })
        }
        if (p.completedLessons > 0 && p.lastTouchedAt > p.enrolledAt) {
          rows.push({
            id: `touch-${p.enrollmentId}`, kind: "progress" as const,
            title: p.course.title, href, at: p.lastTouchedAt.toISOString(),
          })
        }
        return rows
      }),
      ...certificates.map(c => ({
        id: `cert-${c.id}`, kind: "certificate" as const,
        title: c.course.title, href: `/verify/${c.verifyCode}`, at: c.issuedAt.toISOString(),
      })),
      ...registrations.map(r => ({
        id: `reg-${r.id}`, kind: "workshop" as const,
        title: r.workshop?.title ?? r.workshopTitle,
        href: r.workshop?.slug ? `/workshop/${r.workshop.slug}` : null,
        at: r.createdAt.toISOString(),
      })),
    ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 10)

    return NextResponse.json({
      student: {
        firstName: session.firstName,
        name: [session.firstName, session.lastName].filter(Boolean).join(" ") || session.email,
      },
      activity,
      lessons: { completed: lessonsCompleted, total: lessonsTotal },
      programProgress: programs
        .filter(p => p.status !== "DROPPED" && p.totalLessons > 0)
        .map(p => ({
          id: p.enrollmentId, title: p.course.title, slug: p.course.slug,
          completedLessons: p.completedLessons, totalLessons: p.totalLessons,
          status: p.status, lastTouchedAt: p.lastTouchedAt.toISOString(),
        }))
        .sort((a, b) => (b.completedLessons / b.totalLessons) - (a.completedLessons / a.totalLessons))
        .slice(0, 6),
      stats: {
        programs: {
          total:     programs.length,
          active:    programs.filter(p => p.status === "ACTIVE").length,
          completed: programs.filter(p => p.status === "COMPLETED").length,
          thisMonth: programs.filter(p => p.enrolledAt >= monthStart).length,
        },
        workshops:    { total: registrations.length, upcoming: upcomingRegs.length, past: pastRegs.length },
        certificates: {
          total:     certificates.length,
          thisMonth: certificates.filter(c => c.issuedAt >= monthStart).length,
        },
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
