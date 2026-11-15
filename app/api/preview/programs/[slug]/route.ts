import { NextRequest, NextResponse } from "next/server"
import { requireProgramPreview } from "@/lib/program-preview"
import { collectLessonIds, stripQuizAnswers } from "@/services/lesson-progress.service"

type Context = { params: Promise<{ slug: string }> }

/** GET /api/preview/programs/[slug] — the student player's payload for a
 *  staff preview: same shape as /api/student/programs/[slug], as a learner who
 *  has just enrolled (no progress, no certificate). Staff only. */
export async function GET(_req: NextRequest, { params }: Context) {
  try {
    const { slug } = await params
    const auth = await requireProgramPreview(slug)
    if (!auth.ok) return auth.response
    const { program } = auth

    return NextResponse.json({
      // Stripped exactly as for a learner, so the preview is faithful and the
      // answer key stays server-side.
      program: { ...program, curriculum: stripQuizAnswers(program.curriculum) },
      enrollment: { status: "ACTIVE", enrolledAt: new Date().toISOString(), completedAt: null },
      totalLessons: collectLessonIds(program.curriculum).length,
      completedIds: [],
      passedQuizIds: [],
      certificate: null,
    })
  } catch (error) {
    console.error("[GET /api/preview/programs/[slug]]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
