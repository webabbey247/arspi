import { NextRequest, NextResponse } from "next/server"
import { requireApiRole } from "@/lib/guard"
import { db } from "@/lib/db"
import { getProgramBySlug } from "@/services/program.service"
import { setQuizAnswer, findQuizBlock, isLessonUnlocked, getLessonProgress, getQuizProgress } from "@/services/lesson-progress.service"
import { z } from "zod"

const patchSchema = z.object({ selectedIndex: z.number().int().min(0) })

type Context = { params: Promise<{ slug: string; blockId: string }> }

/** PATCH /api/student/programs/[slug]/quizzes/[blockId] — submit an answer to
 *  a quiz content-block. Correctness is decided server-side from the
 *  curriculum's stored `correctIndex`; a correct answer can complete the
 *  lesson (and, in turn, the course). */
export async function PATCH(req: NextRequest, { params }: Context) {
  try {
    const guard = await requireApiRole("USER")
    if (!guard.ok) return guard.response
    const { session } = guard

    const { slug, blockId } = await params
    const parsed = patchSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 })
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

    const found = findQuizBlock(program.curriculum, blockId)
    if (!found) {
      return NextResponse.json({ error: "Quiz not found in this program." }, { status: 404 })
    }

    const [completedIds, passedQuizIds] = await Promise.all([
      getLessonProgress(session.sub, program.id),
      getQuizProgress(session.sub, program.id),
    ])
    if (!isLessonUnlocked(program.curriculum, found.lessonId, new Set(completedIds), new Set(passedQuizIds))) {
      return NextResponse.json({ error: "Complete the previous chapter before continuing." }, { status: 403 })
    }

    const result = await setQuizAnswer(session.sub, program.id, program.curriculum, blockId, parsed.data.selectedIndex)
    if (!result) {
      return NextResponse.json({ error: "Quiz not found in this program." }, { status: 404 })
    }

    const updatedEnrollment = result.courseCompleted
      ? await db.enrollment.findUnique({ where: { id: enrollment.id } })
      : enrollment

    return NextResponse.json({
      correct:       result.correct,
      passedQuizIds: result.passedQuizIds,
      completedIds:  result.completedIds,
      certificate:   result.certificate,
      enrollment: {
        status:      updatedEnrollment!.status,
        completedAt: updatedEnrollment!.completedAt?.toISOString() ?? null,
      },
    })
  } catch (error) {
    console.error("[PATCH /api/student/programs/[slug]/quizzes/[blockId]]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
