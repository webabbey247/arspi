/** Pure scheduling logic for study timetables.
 *
 *  Deliberately free of `server-only` and of any database import: the packer
 *  is the part most worth testing in isolation, and it cannot be exercised
 *  outside Next.js if it drags the server runtime in with it.
 */
import { estimateLessonMinutes, type DurationLesson } from "@/lib/lesson-duration"

export type Slot = {
  /** 0 = Sunday … 6 = Saturday, matching Date#getDay(). */
  weekday: number
  /** "HH:MM", local to the plan's timezone. */
  start: string
  end: string
}

export type PlannedSession = {
  date: Date
  startMinute: number
  endMinute: number
  lessonIds: string[]
  lessonTitles: string[]
  chapterTitle: string | null
  estimatedMinutes: number
}

type SchedulableLesson = {
  id: string
  title: string
  chapterTitle: string
  minutes: number
}

/** Hard ceiling on how far ahead we will generate. A student with one 30-minute
 *  slot a week and a 40-hour course would otherwise schedule into the 2030s;
 *  better to stop and tell them the pace doesn't fit. */
const MAX_WEEKS = 78

export function parseSlots(value: unknown): Slot[] {
  if (!Array.isArray(value)) return []
  return (value as Slot[])
    .filter(s =>
      s && Number.isInteger(s.weekday) && s.weekday >= 0 && s.weekday <= 6 &&
      /^\d{2}:\d{2}$/.test(s.start) && /^\d{2}:\d{2}$/.test(s.end) &&
      toMinutes(s.end) > toMinutes(s.start))
    .sort((a, b) => a.weekday - b.weekday || toMinutes(a.start) - toMinutes(b.start))
}

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number)
  return h * 60 + m
}

export function fromMinutes(total: number): string {
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

/** Flattens a curriculum into the ordered lesson list the packer walks.
 *  Lessons already completed are dropped — a plan should schedule what is
 *  left, not replay what the student has done. */
export function schedulableLessons(
  curriculum: unknown,
  completedIds: Set<string>,
): SchedulableLesson[] {
  if (!Array.isArray(curriculum)) return []
  const out: SchedulableLesson[] = []

  for (const rawChapter of curriculum) {
    const chapter = rawChapter as { title?: string; lessons?: unknown[] }
    for (const rawLesson of chapter?.lessons ?? []) {
      const lesson = rawLesson as DurationLesson & { id?: string; title?: string }
      if (!lesson?.id || completedIds.has(lesson.id)) continue
      out.push({
        id:           lesson.id,
        title:        lesson.title ?? "Untitled lesson",
        chapterTitle: chapter?.title ?? "Untitled chapter",
        minutes:      estimateLessonMinutes(lesson),
      })
    }
  }
  return out
}

/** Walks forward from `startDate`, filling each available slot with as many
 *  whole lessons as fit.
 *
 *  Lessons are never split across sittings: a half-finished lesson isn't
 *  progress, and a plan that says "finish lesson 4" is more useful than one
 *  that says "do 12 more minutes of it". The cost is that a lesson longer than
 *  its slot gets a sitting of its own and overruns — flagged via `overruns` so
 *  the UI can say so rather than quietly lying about the end time.
 */
export function packSessions(
  lessons: SchedulableLesson[],
  slots: Slot[],
  startDate: Date,
): { sessions: PlannedSession[]; unscheduled: SchedulableLesson[]; overruns: number } {
  const sessions: PlannedSession[] = []
  if (slots.length === 0 || lessons.length === 0) {
    return { sessions, unscheduled: lessons, overruns: 0 }
  }

  const queue = [...lessons]
  let overruns = 0

  // Start from the plan's start date at local midnight.
  const cursor = new Date(startDate)
  cursor.setHours(0, 0, 0, 0)

  const lastDay = new Date(cursor)
  lastDay.setDate(lastDay.getDate() + MAX_WEEKS * 7)

  while (queue.length > 0 && cursor <= lastDay) {
    const todaysSlots = slots.filter(s => s.weekday === cursor.getDay())

    for (const slot of todaysSlots) {
      if (queue.length === 0) break

      const slotStart = toMinutes(slot.start)
      const capacity  = toMinutes(slot.end) - slotStart

      const picked: SchedulableLesson[] = []
      let used = 0

      while (queue.length > 0) {
        const next = queue[0]
        const fits = used + next.minutes <= capacity
        // A lesson bigger than the whole slot can never fit anywhere; give it
        // the sitting to itself and accept the overrun rather than loop forever.
        const unschedulableAnywhere = picked.length === 0 && next.minutes > capacity
        if (!fits && !unschedulableAnywhere) break

        picked.push(next)
        used += next.minutes
        queue.shift()
        if (unschedulableAnywhere) { overruns++; break }
      }

      if (picked.length === 0) continue

      sessions.push({
        date:             new Date(Date.UTC(cursor.getFullYear(), cursor.getMonth(), cursor.getDate())),
        startMinute:      slotStart,
        endMinute:        slotStart + Math.min(used, capacity),
        lessonIds:        picked.map(l => l.id),
        lessonTitles:     picked.map(l => l.title),
        // Label the sitting by the chapter it spends most of its time in.
        chapterTitle:     dominantChapter(picked),
        estimatedMinutes: used,
      })
    }

    cursor.setDate(cursor.getDate() + 1)
  }

  return { sessions, unscheduled: queue, overruns }
}

function dominantChapter(lessons: SchedulableLesson[]): string | null {
  if (lessons.length === 0) return null
  const totals = new Map<string, number>()
  for (const l of lessons) totals.set(l.chapterTitle, (totals.get(l.chapterTitle) ?? 0) + l.minutes)
  return [...totals.entries()].sort((a, b) => b[1] - a[1])[0][0]
}

/** Minutes of availability in one week — the input to "can this pace work?" */
export function weeklyCapacity(slots: Slot[]): number {
  return slots.reduce((sum, s) => sum + (toMinutes(s.end) - toMinutes(s.start)), 0)
}

/** Backward planning: the weekly hours needed to finish by a date. Returned as
 *  advice rather than applied automatically — the student still chooses the
 *  slots, because only they know which evenings are actually free. */
export function requiredWeeklyMinutes(totalMinutes: number, startDate: Date, deadline: Date): number | null {
  const ms = deadline.getTime() - startDate.getTime()
  if (ms <= 0) return null
  const weeks = Math.max(1, ms / (7 * 24 * 3_600_000))
  return Math.ceil(totalMinutes / weeks)
}
