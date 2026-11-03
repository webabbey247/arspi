import "server-only"
import { db } from "@/lib/db"
import { issueCertificate } from "@/services/certificate.service"
import { collectLessonIds, getLessonProgress } from "@/services/lesson-progress.service"
import { hasPassedCourse } from "@/services/assessment.service"

/** Re-evaluates whether a student has finished a course and issues the
 *  certificate if so.
 *
 *  Lives in its own module rather than inside either service because it needs
 *  both of them: lesson-progress already imports assessment (for the pass
 *  check), so putting this there would close an import cycle. Nothing else
 *  imports this file — only route handlers do.
 *
 *  Call it after an assessment is graded: a student can finish every lesson
 *  first and only pass the project weeks later, and that later pass is what
 *  completes the course. */
export async function syncCourseCompletion(userId: string, courseId: string) {
  const course = await db.course.findUnique({ where: { id: courseId } })
  if (!course) return { completed: false as const, certificate: null }

  const allLessonIds = collectLessonIds(course.curriculum)
  const completedIds = await getLessonProgress(userId, courseId)
  const lessonsDone  = allLessonIds.length > 0 && allLessonIds.every(id => completedIds.includes(id))
  if (!lessonsDone) return { completed: false as const, certificate: null }

  const passed = await hasPassedCourse(userId, courseId)
  if (!passed) return { completed: false as const, certificate: null }

  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  })
  if (!enrollment) return { completed: false as const, certificate: null }

  if (enrollment.status !== "COMPLETED") {
    await db.enrollment.update({
      where: { id: enrollment.id },
      data:  { status: "COMPLETED", completedAt: new Date() },
    })
  }

  const result = await issueCertificate(userId, courseId)
  return {
    completed: true as const,
    certificate: result.success ? { id: result.data.id, verifyCode: result.data.verifyCode } : null,
  }
}
