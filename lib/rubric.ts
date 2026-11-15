/**
 * Rubric model, validation and scoring — shared by the builder, the marking
 * screen, the learner view and the API routes. Kept free of server imports so
 * the browser runs exactly the same checks the server enforces.
 */

export type RubricLevel = { key: string; label: string; order: number }

export type RubricCell = {
  level:      string // RubricLevel.key
  minPoints:  number
  maxPoints:  number
  descriptor: string
}

export type RubricCriterion = {
  key:       string
  title:     string
  maxPoints: number
  cells:     RubricCell[]
}

export type GradeBand = { label: string; min: number; max: number; meaning?: string }

export type RubricStatus = "DRAFT" | "ACTIVE" | "ARCHIVED"

/** The editable content of one rubric version. */
export type RubricContent = {
  title:             string
  description?:      string | null
  type:              "ANALYTIC" | "HOLISTIC"
  totalPoints:       number
  passMark:          number
  levels:            RubricLevel[]
  criteria:          RubricCriterion[]
  gradeBands:        GradeBand[]
  visibleToLearners: boolean
}

/** A stored version, as served to the browser. */
export type RubricVersionView = RubricContent & {
  id:       string // RubricVersion.id
  rubricId: string
  version:  number
}

/** One criterion as marked. */
export type CriterionMark = {
  key:     string // RubricCriterion.key
  level:   string // RubricLevel.key
  score:   number
  comment: string
}

/** What a marker saves, and — once released — what a learner sees. */
export type RubricMarks = {
  criteria:       CriterionMark[]
  overallComment: string
  total:          number
  gradeBand:      string | null
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** The editable content of a stored version (drops id/rubricId/version). */
export function contentOf(v: RubricVersionView): RubricContent {
  return {
    title: v.title, description: v.description ?? "", type: v.type,
    totalPoints: v.totalPoints, passMark: v.passMark,
    levels: v.levels, criteria: v.criteria, gradeBands: v.gradeBands,
    visibleToLearners: v.visibleToLearners,
  }
}

export function makeKey(label: string, taken: string[] = []): string {
  const base = label.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "item"
  let key = base
  let n = 2
  while (taken.includes(key)) key = `${base}_${n++}`
  return key
}

export function sortedLevels(levels: RubricLevel[]): RubricLevel[] {
  return [...levels].sort((a, b) => a.order - b.order)
}

export const round2 = (n: number) => Math.round(n * 100) / 100

export function sumCriteria(criteria: RubricCriterion[]): number {
  return round2(criteria.reduce((s, c) => s + (Number(c.maxPoints) || 0), 0))
}

export function cellFor(criterion: RubricCriterion, levelKey: string): RubricCell | undefined {
  return criterion.cells.find(c => c.level === levelKey)
}

export function gradeBandFor(bands: GradeBand[], total: number): GradeBand | null {
  // Bands are whole-number ranges; a fractional total (e.g. 74.5) belongs to the
  // band whose range it falls inside once rounded down to the band boundary.
  const t = Math.floor(total)
  return bands.find(b => t >= b.min && t <= b.max) ?? null
}

/** Range text as markers and learners see it, e.g. "23 to 25 pts". */
export function rangeLabel(cell: Pick<RubricCell, "minPoints" | "maxPoints">): string {
  return cell.minPoints === cell.maxPoints
    ? `${cell.maxPoints} pts`
    : `${cell.minPoints} to ${cell.maxPoints} pts`
}

// ── Validation ───────────────────────────────────────────────────────────────

/**
 * Checks that a list of whole-number ranges covers 0..max with no gaps or
 * overlaps. Shared by criterion cells and grade bands.
 */
function checkCoverage(
  ranges: { min: number; max: number; name: string }[],
  max: number,
  what: string,
): string | null {
  for (const r of ranges) {
    if (!Number.isInteger(r.min) || !Number.isInteger(r.max)) {
      return `${what}: "${r.name}" must use whole numbers.`
    }
    if (r.min < 0 || r.max < r.min) {
      return `${what}: "${r.name}" has an invalid range (${r.min} to ${r.max}).`
    }
  }
  const sorted = [...ranges].sort((a, b) => a.min - b.min)
  if (sorted.length === 0) return `${what}: no ranges set.`
  if (sorted[0].min !== 0) return `${what}: the lowest range must start at 0.`
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]
    const cur  = sorted[i]
    if (cur.min <= prev.max) return `${what}: "${prev.name}" and "${cur.name}" overlap.`
    if (cur.min > prev.max + 1) return `${what}: there is a gap between ${prev.max} and ${cur.min}.`
  }
  const top = sorted[sorted.length - 1].max
  if (top !== max) return `${what}: the highest range must end at ${max}, not ${top}.`
  return null
}

/**
 * Every rule a rubric must satisfy before it can be saved. Returns a list of
 * problems — empty when the rubric is valid. `requireDescriptors` is relaxed
 * only for drafts, so admins can save work in progress.
 */
export function validateRubric(r: RubricContent, opts: { requireDescriptors?: boolean } = {}): string[] {
  const errors: string[] = []
  const requireDescriptors = opts.requireDescriptors ?? true

  if (!r.title?.trim()) errors.push("Give the rubric a title.")
  if (!(r.totalPoints > 0)) errors.push("Total points must be more than 0.")
  if (r.levels.length < 2) errors.push("Add at least two performance levels.")
  if (r.criteria.length < 1) errors.push("Add at least one criterion.")

  const levelKeys = r.levels.map(l => l.key)
  if (new Set(levelKeys).size !== levelKeys.length) errors.push("Two levels share the same key.")
  r.levels.forEach((l, i) => { if (!l.label.trim()) errors.push(`Level ${i + 1} needs a name.`) })

  const critKeys = r.criteria.map(c => c.key)
  if (new Set(critKeys).size !== critKeys.length) errors.push("Two criteria share the same key.")

  for (const [i, c] of r.criteria.entries()) {
    const name = c.title.trim() || `Criterion ${i + 1}`
    if (!c.title.trim()) errors.push(`Criterion ${i + 1} needs a title.`)
    if (!(c.maxPoints > 0) || !Number.isInteger(c.maxPoints)) {
      errors.push(`${name}: maximum points must be a whole number above 0.`)
      continue
    }
    const cells: RubricCell[] = []
    for (const l of r.levels) {
      const cell = cellFor(c, l.key)
      if (!cell) { errors.push(`${name}: missing a cell for "${l.label}".`); continue }
      if (requireDescriptors && !cell.descriptor.trim()) {
        errors.push(`${name}: describe what "${l.label}" looks like.`)
      }
      cells.push(cell)
    }
    if (cells.length === r.levels.length) {
      const problem = checkCoverage(
        cells.map(cell => ({
          min: cell.minPoints, max: cell.maxPoints,
          name: r.levels.find(l => l.key === cell.level)?.label ?? cell.level,
        })),
        c.maxPoints,
        name,
      )
      if (problem) errors.push(problem)
    }
  }

  const sum = sumCriteria(r.criteria)
  if (r.criteria.length > 0 && sum !== r.totalPoints) {
    errors.push(`Criteria add up to ${sum}, but the rubric total is ${r.totalPoints}.`)
  }

  if (!(r.passMark >= 0 && r.passMark <= r.totalPoints)) {
    errors.push(`The pass mark must be between 0 and ${r.totalPoints}.`)
  }

  if (r.gradeBands.length === 0) {
    errors.push("Add at least one grade band.")
  } else {
    r.gradeBands.forEach((b, i) => { if (!b.label.trim()) errors.push(`Grade band ${i + 1} needs a name.`) })
    const problem = checkCoverage(
      r.gradeBands.map(b => ({ min: b.min, max: b.max, name: b.label || "band" })),
      r.totalPoints,
      "Grade bands",
    )
    if (problem) errors.push(problem)
  }

  return errors
}

/**
 * Checks a marker's selections against a rubric version and returns the
 * normalised marks with total and band filled in. For a draft, incomplete
 * criteria are allowed; for a release, every criterion needs a level and a
 * score inside that level's range.
 */
export function evaluateMarks(
  rubric: Pick<RubricContent, "criteria" | "levels" | "gradeBands">,
  input: { criteria: CriterionMark[]; overallComment?: string },
  mode: "draft" | "release",
): { ok: true; marks: RubricMarks } | { ok: false; error: string } {
  const out: CriterionMark[] = []

  for (const c of rubric.criteria) {
    const m = input.criteria.find(x => x.key === c.key)
    if (!m || !m.level) {
      if (mode === "release") return { ok: false, error: `Choose a level for "${c.title}".` }
      continue
    }
    const cell = cellFor(c, m.level)
    if (!cell) return { ok: false, error: `"${c.title}" has no level "${m.level}".` }
    const score = Number(m.score)
    if (!Number.isFinite(score) || score < cell.minPoints || score > cell.maxPoints) {
      return {
        ok: false,
        error: `"${c.title}": the score must be between ${cell.minPoints} and ${cell.maxPoints} at this level.`,
      }
    }
    out.push({ key: c.key, level: m.level, score: round2(score), comment: (m.comment ?? "").slice(0, 5000) })
  }

  const total = round2(out.reduce((s, m) => s + m.score, 0))
  const complete = out.length === rubric.criteria.length
  return {
    ok: true,
    marks: {
      criteria:       out,
      overallComment: (input.overallComment ?? "").slice(0, 10000),
      total,
      gradeBand:      complete ? gradeBandFor(rubric.gradeBands, total)?.label ?? null : null,
    },
  }
}

/** Default score when a marker picks a level: the top of the range, which
 *  the guidance reserves for a secure match. */
export function defaultScoreFor(cell: RubricCell): number {
  return cell.maxPoints
}

// ── Templates ────────────────────────────────────────────────────────────────

export const DEFAULT_LEVELS: RubricLevel[] = [
  { key: "excellent",         label: "Excellent",         order: 1 },
  { key: "good",              label: "Good",              order: 2 },
  { key: "satisfactory",      label: "Satisfactory",      order: 3 },
  { key: "needs_improvement", label: "Needs improvement", order: 4 },
]

export const DEFAULT_GRADE_BANDS: GradeBand[] = [
  { label: "Distinction",       min: 75, max: 100, meaning: "Strong work across all criteria, with clear analysis and convincing application." },
  { label: "Merit",             min: 65, max: 74,  meaning: "Good, well-supported work with minor weaknesses in one or two criteria." },
  { label: "Pass",              min: 50, max: 64,  meaning: "Meets the basic requirements; analysis or evidence needs development." },
  { label: "Not yet competent", min: 0,  max: 49,  meaning: "Does not yet meet the requirements; the learner may revise and resubmit if allowed." },
]

function crit(
  key: string, title: string, maxPoints: number,
  cells: [number, number, string][],
): RubricCriterion {
  return {
    key, title, maxPoints,
    cells: cells.map(([minPoints, maxP, descriptor], i) => ({
      level: DEFAULT_LEVELS[i].key, minPoints, maxPoints: maxP, descriptor,
    })),
  }
}

/** The generic analytic rubric for a written assignment (ARPS build guide, Part A). */
export const GENERIC_WRITTEN_RUBRIC: RubricContent = {
  title:       "Generic Analytic Rubric for a Written Assignment",
  description: "Five general criteria that work for essays, reports, case analyses and reflective pieces in any programme.",
  type:        "ANALYTIC",
  totalPoints: 100,
  passMark:    50,
  visibleToLearners: true,
  levels:      DEFAULT_LEVELS,
  gradeBands:  DEFAULT_GRADE_BANDS,
  criteria: [
    crit("concepts", "Understanding of key concepts", 25, [
      [23, 25, "Explains all relevant concepts accurately and in own words; shows clear grasp of how they connect."],
      [19, 22, "Explains most concepts accurately; minor gaps or loose wording that do not affect the argument."],
      [15, 18, "Explains the main concepts but with some errors, gaps or heavy reliance on the course text."],
      [0, 14,  "Concepts are missing, misunderstood or only copied without explanation."],
    ]),
    crit("analysis", "Analysis and critical thinking", 25, [
      [23, 25, "Goes beyond description; weighs alternatives, questions assumptions and reaches well-supported judgements."],
      [19, 22, "Some genuine analysis and comparison; judgements are reasonable but not always fully argued."],
      [15, 18, "Mostly descriptive; analysis is brief or uneven and judgements are asserted rather than argued."],
      [0, 14,  "Little or no analysis; work restates information without interpretation."],
    ]),
    crit("evidence", "Use of evidence and sources", 20, [
      [18, 20, "Uses relevant, credible sources well; evidence directly supports each main point; referencing is accurate."],
      [15, 17, "Uses suitable sources that mostly support the points; a few referencing slips."],
      [12, 14, "Limited or partly relevant sources; evidence is loosely linked to points; referencing is inconsistent."],
      [0, 11,  "Few or no sources, or sources are unreliable or unreferenced."],
    ]),
    crit("application", "Application to practice", 15, [
      [14, 15, "Applies ideas convincingly to a real setting, with specific, realistic implications for practice."],
      [11, 13, "Applies ideas to a real setting with sensible implications, though some are general."],
      [9, 10,  "Makes a link to practice, but it is general or only partly worked out."],
      [0, 8,   "No meaningful link to practice or the learner's own context."],
    ]),
    crit("organisation", "Organisation and clarity", 15, [
      [14, 15, "Logical structure, clear headings and paragraphs, fluent writing; meets the word range and brief."],
      [11, 13, "Clear structure with minor lapses in flow or expression; meets the brief."],
      [9, 10,  "Structure is hard to follow in places; frequent writing errors; partly meets the brief."],
      [0, 8,   "Disorganised or unclear; does not follow the brief or is far outside the word range."],
    ]),
  ],
}

/** A blank rubric with the default levels and bands and one empty criterion. */
export function blankRubric(): RubricContent {
  return {
    title: "",
    description: "",
    type: "ANALYTIC",
    totalPoints: 100,
    passMark: 50,
    visibleToLearners: true,
    levels: DEFAULT_LEVELS.map(l => ({ ...l })),
    gradeBands: DEFAULT_GRADE_BANDS.map(b => ({ ...b })),
    criteria: [
      {
        key: "criterion_1", title: "", maxPoints: 100,
        cells: [
          { level: "excellent",         minPoints: 90, maxPoints: 100, descriptor: "" },
          { level: "good",              minPoints: 75, maxPoints: 89,  descriptor: "" },
          { level: "satisfactory",      minPoints: 50, maxPoints: 74,  descriptor: "" },
          { level: "needs_improvement", minPoints: 0,  maxPoints: 49,  descriptor: "" },
        ],
      },
    ],
  }
}

/**
 * Splits 0..max into one contiguous whole-number range per level, best level
 * first, using the same proportions as the generic rubric (top ~10%, then
 * ~15%, ~15%, rest). Used when an admin adds a criterion or changes its
 * maximum, so they start from a valid spread instead of typing every range.
 */
export function suggestRanges(max: number, levelCount: number): { min: number; max: number }[] {
  if (levelCount <= 0) return []
  if (max + 1 < levelCount) {
    // Not enough whole numbers to go round — give the top levels one point each.
    return Array.from({ length: levelCount }, (_, i) => {
      const v = Math.max(max - i, 0)
      return { min: v, max: v }
    })
  }
  // Fractions of the maximum at which each level's range starts, top level first.
  const shares = levelCount === 4 ? [0.9, 0.75, 0.6] : Array.from(
    { length: levelCount - 1 },
    (_, i) => 1 - (i + 1) / levelCount,
  )
  const out: { min: number; max: number }[] = []
  let upper = max
  for (let i = 0; i < levelCount; i++) {
    const remainingLevels = levelCount - i - 1
    let lower = i === levelCount - 1 ? 0 : Math.round(max * shares[i])
    // Leave at least one whole number for every level still to come.
    lower = Math.min(lower, upper)
    lower = Math.max(lower, remainingLevels)
    out.push({ min: lower, max: upper })
    upper = lower - 1
  }
  return out
}
