import { NextResponse } from "next/server"
import { requireApiRole } from "@/lib/guard"
import { db } from "@/lib/db"
import { collectLessonIds } from "@/services/lesson-progress.service"

/** GET /api/student/programs — list the logged-in student's enrolled programs, with progress. */
export async function GET() {
  try {
    const guard = await requireApiRole("USER")
    if (!guard.ok) return guard.response
    const { session } = guard

    const enrollments = await db.enrollment.findMany({
      where:   { userId: session.sub },
      include: {
        course: {
          select: {
            id: true, title: true, slug: true, thumbnail: true, tagline: true,
            excerpt: true, level: true, curriculum: true,
            instructor: { select: { email: true, profile: { select: { firstName: true, lastName: true } } } },
          },
        },
      },
      orderBy: { enrolledAt: "desc" },
    })

    const courseIds = enrollments.map(e => e.courseId)
    const [progressRows, certificates] = await Promise.all([
      db.lessonProgress.findMany({ where: { userId: session.sub, courseId: { in: courseIds } } }),
      db.certificate.findMany({ where: { userId: session.sub, courseId: { in: courseIds } }, select: { courseId: true, verifyCode: true } }),
    ])
    const progressByCourse = new Map(progressRows.map(p => [p.courseId, (p.completedIds as string[]) ?? []]))
    const certByCourse = new Map(certificates.map(c => [c.courseId, c.verifyCode]))

    const programs = enrollments.map(e => {
      const allLessonIds  = collectLessonIds(e.course.curriculum)
      const completedIds  = progressByCourse.get(e.courseId) ?? []
      const completedCount = allLessonIds.filter(id => completedIds.includes(id)).length
      return {
        enrollmentId:  e.id,
        status:        e.status,
        enrolledAt:    e.enrolledAt.toISOString(),
        completedAt:   e.completedAt?.toISOString() ?? null,
        studentRating: e.studentRating,
        favorited:     e.favorited,
        archived:      e.archived,
        course: {
          id: e.course.id, title: e.course.title, slug: e.course.slug,
          thumbnail: e.course.thumbnail, tagline: e.course.tagline, excerpt: e.course.excerpt,
          level: e.course.level,
          instructor: {
            name: [e.course.instructor.profile?.firstName, e.course.instructor.profile?.lastName]
              .filter(Boolean).join(" ") || e.course.instructor.email,
          },
        },
        totalLessons:     allLessonIds.length,
        completedLessons: completedCount,
        certificateCode:  certByCourse.get(e.courseId) ?? null,
      }
    })

    return NextResponse.json({ programs })
  } catch (error) {
    console.error("[GET /api/student/programs]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
