import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireApiRole } from "@/lib/guard"
import { db } from "@/lib/db"
import { getProgramBySlug } from "@/services/program.service"
import { getLessonProgress, getQuizProgress, collectLessonIds, stripQuizAnswers } from "@/services/lesson-progress.service"
import { getCertificateForEnrollment } from "@/services/certificate.service"

type Context = { params: Promise<{ slug: string }> }

/** GET /api/student/programs/[slug] — a single enrolled program, with the
 *  student's own lesson progress and certificate (if issued). 403s if the
 *  student isn't enrolled in this program. */
export async function GET(_req: NextRequest, { params }: Context) {
  try {
    const guard = await requireApiRole("USER")
    if (!guard.ok) return guard.response
    const { session } = guard

    const { slug } = await params
    const program = await getProgramBySlug(slug)
    if (!program) {
      return NextResponse.json({ error: "Program not found." }, { status: 404 })
    }

    const enrollment = await db.enrollment.findUnique({
      where: { userId_courseId: { userId: session.sub, courseId: program.id } },
    })
    if (!enrollment) {
      return NextResponse.json({ error: "You are not enrolled in this program." }, { status: 403 })
    }

    const [completedIds, passedQuizIds, certificate] = await Promise.all([
      getLessonProgress(session.sub, program.id),
      getQuizProgress(session.sub, program.id),
      getCertificateForEnrollment(session.sub, program.id),
    ])

    return NextResponse.json({
      // Never send correctIndex to a student — only server-side answer-checking
      // (the quizzes PATCH route) may see it.
      program: { ...program, curriculum: stripQuizAnswers(program.curriculum) },
      enrollment: {
        status:      enrollment.status,
        enrolledAt:  enrollment.enrolledAt.toISOString(),
        completedAt: enrollment.completedAt?.toISOString() ?? null,
      },
      totalLessons: collectLessonIds(program.curriculum).length,
      completedIds,
      passedQuizIds,
      certificate: certificate ? { verifyCode: certificate.verifyCode } : null,
    })
  } catch (error) {
    console.error("[GET /api/student/programs/[slug]]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

const patchSchema = z.object({
  studentRating: z.number().int().min(1).max(5).nullable().optional(),
  favorited:     z.boolean().optional(),
  archived:      z.boolean().optional(),
}).refine(v => v.studentRating !== undefined || v.favorited !== undefined || v.archived !== undefined, {
  message: "Provide at least one field to update.",
})

/** PATCH /api/student/programs/[slug] — update the student's own card state
 *  for an enrolled program: their rating, and favorite/archive flags. */
export async function PATCH(req: NextRequest, { params }: Context) {
  try {
    const guard = await requireApiRole("USER")
    if (!guard.ok) return guard.response
    const { session } = guard

    const { slug } = await params
    const program = await getProgramBySlug(slug)
    if (!program) {
      return NextResponse.json({ error: "Program not found." }, { status: 404 })
    }

    const enrollment = await db.enrollment.findUnique({
      where: { userId_courseId: { userId: session.sub, courseId: program.id } },
    })
    if (!enrollment) {
      return NextResponse.json({ error: "You are not enrolled in this program." }, { status: 403 })
    }

    const parsed = patchSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 })
    }

    const updated = await db.enrollment.update({
      where: { id: enrollment.id },
      data:  parsed.data,
    })

    return NextResponse.json({
      studentRating: updated.studentRating,
      favorited:     updated.favorited,
      archived:      updated.archived,
    })
  } catch (error) {
    console.error("[PATCH /api/student/programs/[slug]]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
