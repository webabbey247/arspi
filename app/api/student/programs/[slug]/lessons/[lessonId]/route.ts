import { NextRequest, NextResponse } from "next/server"
import { requireApiRole } from "@/lib/guard"
import { db } from "@/lib/db"
import { getProgramBySlug } from "@/services/program.service"
import {
  collectLessonIds, setLessonCompletion, findLessonById, lessonRequiresQuiz,
  isLessonUnlocked, getLessonProgress, getQuizProgress,
} from "@/services/lesson-progress.service"
import { z } from "zod"

const patchSchema = z.object({ completed: z.boolean() })

type Context = { params: Promise<{ slug: string; lessonId: string }> }

/** PATCH /api/student/programs/[slug]/lessons/[lessonId] — mark a curriculum
 *  lesson complete/incomplete. Auto-completes the enrollment (and issues a
 *  certificate) once every lesson in the program is marked complete. */
export async function PATCH(req: NextRequest, { params }: Context) {
  try {
    const guard = await requireApiRole("USER")
    if (!guard.ok) return guard.response
    const { session } = guard

    const { slug, lessonId } = await params
    const body   = await req.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      )
    }

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

    const allLessonIds = collectLessonIds(program.curriculum)
    if (!allLessonIds.includes(lessonId)) {
      return NextResponse.json({ error: "Lesson not found in this program." }, { status: 404 })
    }

    // Only enforced when advancing (completed: true) — un-checking is always
    // allowed, it doesn't skip ahead of anything.
    if (parsed.data.completed) {
      const lesson = findLessonById(program.curriculum, lessonId)
      if (lessonRequiresQuiz(lesson)) {
        return NextResponse.json(
          { error: "This lesson is completed automatically by passing its quiz." },
          { status: 400 }
        )
      }

      const [completedIds, passedQuizIds] = await Promise.all([
        getLessonProgress(session.sub, program.id),
        getQuizProgress(session.sub, program.id),
      ])
      if (!isLessonUnlocked(program.curriculum, lessonId, new Set(completedIds), new Set(passedQuizIds))) {
        return NextResponse.json(
          { error: "Complete the previous chapter before continuing." },
          { status: 403 }
        )
      }
    }

    const result = await setLessonCompletion(
      session.sub, program.id, lessonId, parsed.data.completed, allLessonIds
    )

    const updatedEnrollment = result.courseCompleted
      ? await db.enrollment.findUnique({ where: { id: enrollment.id } })
      : enrollment

    return NextResponse.json({
      completedIds: result.completedIds,
      certificate:  result.certificate,
      enrollment: {
        status:      updatedEnrollment!.status,
        completedAt: updatedEnrollment!.completedAt?.toISOString() ?? null,
      },
    })
  } catch (error) {
    console.error("[PATCH /api/student/programs/[slug]/lessons/[lessonId]]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
