import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireApiRole } from "@/lib/guard"
import { db } from "@/lib/db"
import { getProgramBySlug } from "@/services/program.service"
import { submitQuizAttempt, submitProjectAttempt } from "@/services/assessment.service"
import { syncCourseCompletion } from "@/services/course-completion.service"

type Context = { params: Promise<{ slug: string; attemptId: string }> }

const submitSchema = z.union([
  z.object({
    kind:    z.literal("quiz"),
    /** { [questionId]: selectedIndex } — a claim about which option was
     *  picked, never about whether it was right. */
    answers: z.record(z.string(), z.number().int().min(0)),
  }),
  z.object({
    kind:  z.literal("project"),
    files: z.array(z.object({
      url:  z.string().url(),
      name: z.string().min(1).max(255),
      size: z.number().int().min(0).optional(),
    })).min(1).max(10),
    note:  z.string().max(5000).optional(),
  }),
])

/** PATCH — submit an open attempt. Quizzes score immediately; projects go to
 *  the instructor queue. Either way the course-completion check re-runs,
 *  because this may be the event that finally earns the certificate. */
export async function PATCH(req: NextRequest, { params }: Context) {
  try {
    const guard = await requireApiRole("USER")
    if (!guard.ok) return guard.response
    const { session } = guard

    const { slug, attemptId } = await params
    const program = await getProgramBySlug(slug)
    if (!program) return NextResponse.json({ error: "Program not found." }, { status: 404 })

    const attempt = await db.assessmentAttempt.findUnique({
      where:   { id: attemptId },
      include: { assessment: true },
    })
    if (!attempt || attempt.userId !== session.sub || attempt.assessment.courseId !== program.id) {
      return NextResponse.json({ error: "Attempt not found." }, { status: 404 })
    }

    const parsed = submitSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 })
    }
    const body = parsed.data

    if (body.kind === "quiz") {
      const result = await submitQuizAttempt(session.sub, attemptId, body.answers)
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 409 })

      const completion = await syncCourseCompletion(session.sub, program.id)
      return NextResponse.json({
        kind: "quiz",
        score: result.score, maxScore: result.maxScore,
        pct: Math.round(result.pct * 100) / 100,
        passed: result.passed,
        grade: result.grade,
        certificate: completion.certificate,
      })
    }

    const result = await submitProjectAttempt(session.sub, attemptId, body.files, body.note)
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 409 })

    return NextResponse.json({
      kind: "project",
      status: result.attempt.status,
      submittedAt: result.attempt.submittedAt?.toISOString() ?? null,
    })
  } catch (error) {
    console.error("[PATCH /api/student/programs/[slug]/attempts/[attemptId]]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
