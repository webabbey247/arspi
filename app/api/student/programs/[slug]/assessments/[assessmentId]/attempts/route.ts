import { NextRequest, NextResponse } from "next/server"
import { requireApiRole } from "@/lib/guard"
import { db } from "@/lib/db"
import { getProgramBySlug } from "@/services/program.service"
import { startAttempt } from "@/services/assessment.service"

type Context = { params: Promise<{ slug: string; assessmentId: string }> }

const BLOCK_MESSAGES: Record<string, string> = {
  "not-enrolled":     "You are not enrolled in this programme.",
  "grading-disabled": "Assessments aren't enabled for this programme.",
  "already-passed":   "You've already passed this assessment.",
  "in-progress":      "You already have an attempt open.",
  "no-attempts-left": "You've used all your attempts. Ask your instructor for another.",
  "cooldown":         "You can retake this shortly — the cooldown hasn't elapsed.",
}

/** POST — open an attempt. The response carries the pinned, answer-stripped
 *  questions; `optionMap` and `correctIndex` stay on the server. */
export async function POST(_req: NextRequest, { params }: Context) {
  try {
    const guard = await requireApiRole("USER")
    if (!guard.ok) return guard.response
    const { session } = guard

    const { slug, assessmentId } = await params
    const program = await getProgramBySlug(slug)
    if (!program) return NextResponse.json({ error: "Program not found." }, { status: 404 })

    // The assessment must belong to the programme in the URL — otherwise the
    // enrolment check below guards the wrong course.
    const assessment = await db.assessment.findUnique({ where: { id: assessmentId } })
    if (!assessment || assessment.courseId !== program.id) {
      return NextResponse.json({ error: "Assessment not found." }, { status: 404 })
    }

    const result = await startAttempt(session.sub, assessmentId)
    if (!result.ok) {
      return NextResponse.json(
        {
          error: BLOCK_MESSAGES[result.blocked.reason] ?? "You can't start this attempt.",
          blocked: result.blocked,
        },
        { status: result.blocked.reason === "not-enrolled" ? 403 : 409 },
      )
    }

    return NextResponse.json({
      attempt: {
        id:        result.attempt.id,
        attemptNo: result.attempt.attemptNo,
        status:    result.attempt.status,
        startedAt: result.attempt.startedAt.toISOString(),
        // Already answer-free: buildAttemptQuestions() never puts the key here.
        questions: result.attempt.servedQuestions ?? null,
      },
      kind: assessment.kind,
    }, { status: 201 })
  } catch (error) {
    console.error("[POST .../assessments/[assessmentId]/attempts]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
