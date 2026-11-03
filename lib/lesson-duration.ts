/** Lesson time estimation, shared by the course player's rail and the study
 *  scheduler so both quote the same number.
 *
 *  Nothing in the schema records how long a lesson actually takes — there is no
 *  playback tracking and no authored runtime — so a time here is modelled from
 *  the content: reading speed for prose, a flat allowance per video, quiz or
 *  assignment. Always present these as estimates ("~"), never as measured
 *  durations, and prefer an author's own figure when one exists.
 */

export type DurationBlock = {
  type: string
  content?: string | null
  questions?: unknown[] | null
}

export type DurationLesson = {
  description?: string | null
  blocks?: DurationBlock[] | null
  /** Author's override, in minutes. Set in the curriculum editor; when present
   *  it wins outright, because a human who knows the material beats a model of
   *  it built from word counts. */
  estimatedMinutes?: number | null
}

/** Words per minute assumed for prose. Deliberately conservative — learners
 *  read teaching material more slowly than they read a novel. */
const READING_WPM = 200

const BLOCK_MINUTES: Record<string, number> = {
  video:      5,
  quiz:       0.75,
  assignment: 10,
  pdf:        3,
  document:   3,
  survey:     2,
  image:      0.5,
  diagram:    0.5,
}

export function wordCount(html?: string | null): number {
  if (!html) return 0
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .split(/\s+/)
    .filter(Boolean).length
}

/** Minutes for one lesson. Returns at least 1 — a lesson that takes no time
 *  would vanish from a schedule, which is worse than being slightly wrong. */
export function estimateLessonMinutes(lesson: DurationLesson): number {
  const authored = Number(lesson.estimatedMinutes)
  if (Number.isFinite(authored) && authored > 0) return Math.round(authored)

  let mins = wordCount(lesson.description) / READING_WPM

  for (const b of lesson.blocks ?? []) {
    if (b.type === "text") {
      mins += wordCount(b.content) / READING_WPM
    } else if (b.type === "questionnaire") {
      mins += (b.questions?.length ?? 0) * 0.5
    } else {
      mins += BLOCK_MINUTES[b.type] ?? 0.5
    }
  }

  return Math.max(1, Math.round(mins))
}

/** True when the figure came from an author rather than from the content
 *  model — lets the UI drop the "~" where it would be misleading. */
export function isAuthoredDuration(lesson: DurationLesson): boolean {
  const authored = Number(lesson.estimatedMinutes)
  return Number.isFinite(authored) && authored > 0
}

export function fmtMins(total: number): string {
  if (total < 60) return `${total}min`
  const h = Math.floor(total / 60)
  const m = total % 60
  return m === 0 ? `${h}hr` : `${h}hr ${m}min`
}
