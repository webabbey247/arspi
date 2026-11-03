import "server-only"
import { db } from "@/lib/db"
import {
  parseSlots, packSessions, schedulableLessons,
} from "@/lib/study-scheduler"

/** Builds (or rebuilds) a plan's sessions from its current availability.
 *
 *  Replaces every future PLANNED session and leaves the past alone: re-flowing
 *  a plan must not rewrite history a student has already ticked off. */
export async function regeneratePlanSessions(planId: string) {
  const plan = await db.studyPlan.findUnique({
    where:   { id: planId },
    include: { course: { select: { curriculum: true } } },
  })
  if (!plan) return null

  const progress = await db.lessonProgress.findUnique({
    where: { userId_courseId: { userId: plan.userId, courseId: plan.courseId } },
  })
  const completed = new Set<string>((progress?.completedIds as string[]) ?? [])

  // Anything already locked into a past or finished sitting stays put.
  const keep = await db.studySession.findMany({
    where: { planId, OR: [{ status: { not: "PLANNED" } }, { date: { lt: startOfToday() } }] },
  })
  const spokenFor = new Set(keep.flatMap(s => (s.lessonIds as string[]) ?? []))

  const lessons = schedulableLessons(plan.course.curriculum, completed)
    .filter(l => !spokenFor.has(l.id))

  const slots = parseSlots(plan.availability)
  const from  = maxDate(new Date(plan.startDate), startOfToday())
  const { sessions, unscheduled, overruns } = packSessions(lessons, slots, from)

  await db.$transaction([
    db.studySession.deleteMany({
      where: { planId, status: "PLANNED", date: { gte: startOfToday() } },
    }),
    db.studySession.createMany({
      data: sessions.map(s => ({
        planId,
        date:             s.date,
        startMinute:      s.startMinute,
        endMinute:        s.endMinute,
        lessonIds:        s.lessonIds,
        lessonTitles:     s.lessonTitles,
        chapterTitle:     s.chapterTitle,
        estimatedMinutes: s.estimatedMinutes,
      })),
    }),
  ])

  return {
    created:     sessions.length,
    unscheduled: unscheduled.length,
    overruns,
    finishesOn:  sessions.at(-1)?.date ?? null,
    totalMinutes: lessons.reduce((sum, l) => sum + l.minutes, 0),
  }
}

/** Marks sittings in the past that were never completed, so the plan tells the
 *  truth about where a student is rather than showing a wall of PLANNED. */
export async function markMissedSessions(planId: string) {
  return db.studySession.updateMany({
    where: { planId, status: "PLANNED", date: { lt: startOfToday() } },
    data:  { status: "MISSED" },
  })
}

function startOfToday(): Date {
  const d = new Date()
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
}

function maxDate(a: Date, b: Date): Date {
  return a.getTime() >= b.getTime() ? a : b
}
