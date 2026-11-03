import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireApiRole } from "@/lib/guard"
import { db } from "@/lib/db"
import { getProgramBySlug } from "@/services/program.service"
import { getLessonProgress } from "@/services/lesson-progress.service"
import {
  parseSlots, weeklyCapacity, requiredWeeklyMinutes, schedulableLessons,
} from "@/lib/study-scheduler"
import { regeneratePlanSessions, markMissedSessions } from "@/services/study-plan.service"

type Context = { params: Promise<{ slug: string }> }

const slotSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  start:   z.string().regex(/^\d{2}:\d{2}$/),
  end:     z.string().regex(/^\d{2}:\d{2}$/),
})

const upsertSchema = z.object({
  availability: z.array(slotSchema).min(1).max(21),
  timezone:     z.string().min(1).max(64).default("UTC"),
  startDate:    z.string().datetime().optional(),
  targetEndDate: z.string().datetime().nullable().optional(),
})

async function enrolledProgram(slug: string, userId: string) {
  const program = await getProgramBySlug(slug)
  if (!program) return { error: NextResponse.json({ error: "Program not found." }, { status: 404 }) }
  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: program.id } },
  })
  if (!enrollment) return { error: NextResponse.json({ error: "You are not enrolled in this program." }, { status: 403 }) }
  return { program }
}

/** GET — the student's plan for this programme, its sessions, and the pacing
 *  maths the UI needs to explain whether the plan actually works. */
export async function GET(_req: NextRequest, { params }: Context) {
  try {
    const guard = await requireApiRole("USER")
    if (!guard.ok) return guard.response
    const { session } = guard

    const { slug } = await params
    const found = await enrolledProgram(slug, session.sub)
    if ("error" in found) return found.error
    const { program } = found

    const completedIds = await getLessonProgress(session.sub, program.id)
    const remaining = schedulableLessons(program.curriculum, new Set(completedIds))
    const remainingMinutes = remaining.reduce((s, l) => s + l.minutes, 0)

    const plan = await db.studyPlan.findUnique({
      where: { userId_courseId: { userId: session.sub, courseId: program.id } },
    })

    if (!plan) {
      return NextResponse.json({
        plan: null,
        sessions: [],
        remaining: { lessons: remaining.length, minutes: remainingMinutes },
      })
    }

    // Keep the view honest before returning it: a sitting that is in the past
    // and never ticked off is missed, not still planned.
    await markMissedSessions(plan.id)

    const sessions = await db.studySession.findMany({
      where:   { planId: plan.id },
      orderBy: [{ date: "asc" }, { startMinute: "asc" }],
    })

    const slots = parseSlots(plan.availability)
    return NextResponse.json({
      plan: {
        id: plan.id,
        availability: slots,
        timezone: plan.timezone,
        startDate: plan.startDate.toISOString(),
        targetEndDate: plan.targetEndDate?.toISOString() ?? null,
        weeklyMinutes: weeklyCapacity(slots),
      },
      sessions: sessions.map(s => ({
        id: s.id,
        date: s.date.toISOString(),
        startMinute: s.startMinute,
        endMinute: s.endMinute,
        lessonIds: s.lessonIds,
        lessonTitles: s.lessonTitles,
        chapterTitle: s.chapterTitle,
        estimatedMinutes: s.estimatedMinutes,
        status: s.status,
      })),
      remaining: { lessons: remaining.length, minutes: remainingMinutes },
    })
  } catch (error) {
    console.error("[GET /api/student/programs/[slug]/study-plan]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

/** PUT — create or replace the plan, then generate its sessions. */
export async function PUT(req: NextRequest, { params }: Context) {
  try {
    const guard = await requireApiRole("USER")
    if (!guard.ok) return guard.response
    const { session } = guard

    const { slug } = await params
    const found = await enrolledProgram(slug, session.sub)
    if ("error" in found) return found.error
    const { program } = found

    const parsed = upsertSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 })
    }
    const d = parsed.data

    const slots = parseSlots(d.availability)
    if (slots.length === 0) {
      return NextResponse.json({ error: "Each slot needs a weekday and an end time after its start." }, { status: 400 })
    }

    const startDate = d.startDate ? new Date(d.startDate) : new Date()

    const plan = await db.studyPlan.upsert({
      where:  { userId_courseId: { userId: session.sub, courseId: program.id } },
      create: {
        userId: session.sub, courseId: program.id,
        availability: slots, timezone: d.timezone, startDate,
        targetEndDate: d.targetEndDate ? new Date(d.targetEndDate) : null,
      },
      update: {
        availability: slots, timezone: d.timezone, startDate,
        targetEndDate: d.targetEndDate ? new Date(d.targetEndDate) : null,
      },
    })

    const result = await regeneratePlanSessions(plan.id)

    return NextResponse.json({
      planId: plan.id,
      weeklyMinutes: weeklyCapacity(slots),
      ...result,
      finishesOn: result?.finishesOn?.toISOString() ?? null,
      /** Non-null when the student asked for a deadline — lets the UI say
       *  "you'd need N minutes a week" rather than silently missing it. */
      neededWeeklyMinutes: d.targetEndDate
        ? requiredWeeklyMinutes(result?.totalMinutes ?? 0, startDate, new Date(d.targetEndDate))
        : null,
    })
  } catch (error) {
    console.error("[PUT /api/student/programs/[slug]/study-plan]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

/** POST — re-flow the remaining sessions without changing the availability.
 *  What a student presses after falling behind. */
export async function POST(_req: NextRequest, { params }: Context) {
  try {
    const guard = await requireApiRole("USER")
    if (!guard.ok) return guard.response
    const { session } = guard

    const { slug } = await params
    const found = await enrolledProgram(slug, session.sub)
    if ("error" in found) return found.error

    const plan = await db.studyPlan.findUnique({
      where: { userId_courseId: { userId: session.sub, courseId: found.program.id } },
    })
    if (!plan) return NextResponse.json({ error: "No plan to re-flow." }, { status: 404 })

    await markMissedSessions(plan.id)
    const result = await regeneratePlanSessions(plan.id)
    return NextResponse.json({ ...result, finishesOn: result?.finishesOn?.toISOString() ?? null })
  } catch (error) {
    console.error("[POST /api/student/programs/[slug]/study-plan]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Context) {
  try {
    const guard = await requireApiRole("USER")
    if (!guard.ok) return guard.response
    const { session } = guard

    const { slug } = await params
    const found = await enrolledProgram(slug, session.sub)
    if ("error" in found) return found.error

    await db.studyPlan.deleteMany({
      where: { userId: session.sub, courseId: found.program.id },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/student/programs/[slug]/study-plan]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
