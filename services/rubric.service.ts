import "server-only"
import { db } from "@/lib/db"
import type { Prisma, RubricStatus, RubricVersion } from "@prisma/client"
import {
  contentOf, GENERIC_WRITTEN_RUBRIC,
  type GradeBand, type RubricContent, type RubricCriterion, type RubricLevel, type RubricVersionView,
} from "@/lib/rubric"

// ── Shape conversion ─────────────────────────────────────────────────────────

/** A stored version in the shape the browser and lib/rubric.ts work with. */
export function toVersionView(v: RubricVersion): RubricVersionView {
  return {
    id:                v.id,
    rubricId:          v.rubricId,
    version:           v.version,
    title:             v.title,
    description:       v.description,
    type:              v.type,
    totalPoints:       v.totalPoints,
    passMark:          v.passMark,
    levels:            (v.levels as RubricLevel[]) ?? [],
    criteria:          (v.criteria as RubricCriterion[]) ?? [],
    gradeBands:        (v.gradeBands as GradeBand[]) ?? [],
    visibleToLearners: v.visibleToLearners,
  }
}

function contentData(c: RubricContent) {
  return {
    title:             c.title.trim(),
    description:       c.description?.trim() || null,
    type:              c.type,
    totalPoints:       c.totalPoints,
    passMark:          c.passMark,
    levels:            c.levels as unknown as Prisma.InputJsonValue,
    criteria:          c.criteria as unknown as Prisma.InputJsonValue,
    gradeBands:        c.gradeBands as unknown as Prisma.InputJsonValue,
    visibleToLearners: c.visibleToLearners,
  }
}

// ── Reads ────────────────────────────────────────────────────────────────────

async function currentVersionRow(rubricId: string) {
  const rubric = await db.rubric.findUnique({ where: { id: rubricId } })
  if (!rubric) return null
  const version = await db.rubricVersion.findUnique({
    where: { rubricId_version: { rubricId, version: rubric.currentVersion } },
  })
  return version ? { rubric, version } : null
}

/** The version new marking should use for this rubric. */
export async function getCurrentVersion(rubricId: string): Promise<RubricVersionView | null> {
  const found = await currentVersionRow(rubricId)
  return found ? toVersionView(found.version) : null
}

export async function getVersionById(versionId: string): Promise<RubricVersionView | null> {
  const v = await db.rubricVersion.findUnique({ where: { id: versionId } })
  return v ? toVersionView(v) : null
}

/** Loads several versions at once, keyed by id — for queues that show many
 *  submissions marked against a handful of rubrics. */
export async function getVersionsById(ids: string[]): Promise<Record<string, RubricVersionView>> {
  const unique = [...new Set(ids.filter(Boolean))]
  if (unique.length === 0) return {}
  const rows = await db.rubricVersion.findMany({ where: { id: { in: unique } } })
  return Object.fromEntries(rows.map(r => [r.id, toVersionView(r)]))
}

/** Current versions for several rubric ids, keyed by rubric id. */
export async function getCurrentVersions(rubricIds: string[]): Promise<Record<string, RubricVersionView>> {
  const unique = [...new Set(rubricIds.filter(Boolean))]
  if (unique.length === 0) return {}
  const rubrics = await db.rubric.findMany({ where: { id: { in: unique } } })
  const versions = await db.rubricVersion.findMany({
    where: { OR: rubrics.map(r => ({ rubricId: r.id, version: r.currentVersion })) },
  })
  return Object.fromEntries(versions.map(v => [v.rubricId, toVersionView(v)]))
}

/** How many marked (or draft-marked) pieces of work point at a version. */
async function marksOnVersion(versionId: string) {
  const [subs, attempts] = await Promise.all([
    db.assignmentSubmission.count({ where: { rubricVersionId: versionId } }),
    db.assessmentAttempt.count({ where: { rubricVersionId: versionId } }),
  ])
  return subs + attempts
}

export type RubricListItem = {
  id:             string
  title:          string
  /** Set when the rubric is a copy customised for one programme. */
  courseId:       string | null
  isDefault:      boolean
  status:         RubricStatus
  currentVersion: number
  totalPoints:    number
  passMark:       number
  criteriaCount:  number
  levelCount:     number
  visibleToLearners: boolean
  projectCount:   number
  markedCount:    number
  updatedAt:      string
}

/**
 * Lists rubrics.
 *  - no `courseId`: the shared library only (programme copies excluded)
 *  - `courseId`:    the library plus that programme's own copies
 * Programme copies are always included regardless of `status`, since they're
 * only ever used by their own programme.
 */
export async function listRubrics(
  filter: { status?: RubricStatus[]; courseId?: string } = {},
): Promise<RubricListItem[]> {
  await ensureDefaultRubric()
  const library: Prisma.RubricWhereInput = {
    courseId: null,
    ...(filter.status && { status: { in: filter.status } }),
  }
  const rubrics = await db.rubric.findMany({
    where:   filter.courseId ? { OR: [library, { courseId: filter.courseId }] } : library,
    orderBy: [{ isDefault: "desc" }, { status: "asc" }, { updatedAt: "desc" }],
    include: { _count: { select: { assessments: true } } },
  })
  if (rubrics.length === 0) return []

  const versions = await db.rubricVersion.findMany({
    where: { OR: rubrics.map(r => ({ rubricId: r.id, version: r.currentVersion })) },
  })
  const byRubric = new Map(versions.map(v => [v.rubricId, v]))

  // Marked work across every version of each rubric — the library shows how
  // much depends on a rubric before someone archives it.
  const allVersions = await db.rubricVersion.findMany({
    where:  { rubricId: { in: rubrics.map(r => r.id) } },
    select: { id: true, rubricId: true, _count: { select: { assignmentSubmissions: true, assessmentAttempts: true } } },
  })
  const marked = new Map<string, number>()
  for (const v of allVersions) {
    marked.set(v.rubricId, (marked.get(v.rubricId) ?? 0) + v._count.assignmentSubmissions + v._count.assessmentAttempts)
  }

  return rubrics.flatMap(r => {
    const v = byRubric.get(r.id)
    if (!v) return []
    return [{
      id:             r.id,
      title:          r.title,
      courseId:       r.courseId,
      isDefault:      r.isDefault,
      status:         r.status,
      currentVersion: r.currentVersion,
      totalPoints:    v.totalPoints,
      passMark:       v.passMark,
      criteriaCount:  ((v.criteria as unknown[]) ?? []).length,
      levelCount:     ((v.levels as unknown[]) ?? []).length,
      visibleToLearners: v.visibleToLearners,
      projectCount:   r._count.assessments,
      markedCount:    marked.get(r.id) ?? 0,
      updatedAt:      r.updatedAt.toISOString(),
    }]
  })
}

/** A rubric with its current version and the history of versions. */
export async function getRubricDetail(rubricId: string) {
  const found = await currentVersionRow(rubricId)
  if (!found) return null
  const history = await db.rubricVersion.findMany({
    where:   { rubricId },
    orderBy: { version: "desc" },
    select:  { id: true, version: true, createdAt: true },
  })
  return {
    id:        found.rubric.id,
    status:    found.rubric.status,
    courseId:  found.rubric.courseId,
    isDefault: found.rubric.isDefault,
    current: toVersionView(found.version),
    history: history.map(h => ({ ...h, createdAt: h.createdAt.toISOString() })),
  }
}

// ── Writes ───────────────────────────────────────────────────────────────────

export async function createRubric(
  content: RubricContent,
  status: RubricStatus,
  createdById: string | null,
  opts: { courseId?: string | null; id?: string; isDefault?: boolean } = {},
) {
  return db.$transaction(async tx => {
    const rubric = await tx.rubric.create({
      data: {
        ...(opts.id && { id: opts.id }),
        title: content.title.trim(), status, currentVersion: 1, createdById,
        courseId: opts.courseId ?? null,
        isDefault: opts.isDefault ?? false,
      },
    })
    await tx.rubricVersion.create({ data: { rubricId: rubric.id, version: 1, ...contentData(content) } })
    return rubric
  })
}

/**
 * Saves new content for a rubric. If the current version has already been
 * used to mark work (released or still in draft), the edit becomes a new
 * version and those marks keep pointing at the version they were made with.
 * Otherwise the current version is updated in place, so a rubric still being
 * set up doesn't pile up empty versions.
 */
export async function updateRubric(rubricId: string, content: RubricContent, status?: RubricStatus) {
  const found = await currentVersionRow(rubricId)
  if (!found) return { ok: false as const, error: "Rubric not found." }

  const used = await marksOnVersion(found.version.id)
  const versioned = used > 0

  await db.$transaction(async tx => {
    if (versioned) {
      const next = found.rubric.currentVersion + 1
      await tx.rubricVersion.create({ data: { rubricId, version: next, ...contentData(content) } })
      await tx.rubric.update({
        where: { id: rubricId },
        data:  { title: content.title.trim(), currentVersion: next, ...(status && { status }) },
      })
    } else {
      await tx.rubricVersion.update({ where: { id: found.version.id }, data: contentData(content) })
      await tx.rubric.update({
        where: { id: rubricId },
        data:  { title: content.title.trim(), ...(status && { status }) },
      })
    }
  })

  return { ok: true as const, versioned, version: versioned ? found.rubric.currentVersion + 1 : found.rubric.currentVersion }
}

export async function setRubricStatus(rubricId: string, status: RubricStatus) {
  const rubric = await db.rubric.findUnique({ where: { id: rubricId } })
  if (!rubric) return null
  return db.rubric.update({ where: { id: rubricId }, data: { status } })
}

/** Copies the current version into a new rubric in the same scope: a library
 *  rubric copies to a library draft, a programme copy stays with its programme. */
export async function duplicateRubric(rubricId: string, createdById: string) {
  const [rubric, current] = await Promise.all([
    db.rubric.findUnique({ where: { id: rubricId } }),
    getCurrentVersion(rubricId),
  ])
  if (!rubric || !current) return null
  const content = contentOf(current)
  return createRubric(
    { ...content, title: `${content.title} (copy)` },
    rubric.courseId ? "ACTIVE" : "DRAFT",
    createdById,
    { courseId: rubric.courseId },
  )
}

// ── Default rubric ───────────────────────────────────────────────────────────

/** Fixed id so creating the default is idempotent across concurrent requests
 *  and deploys — the generic written-assignment rubric from the build guide. */
export const DEFAULT_RUBRIC_ID = "rubric_generic_written"

/**
 * Makes sure the default rubric exists. Runs on every library listing, which
 * is cheap (one indexed lookup) and means no seed step to forget. If an admin
 * archives or edits the default it's left alone — this only ever creates it.
 */
export async function ensureDefaultRubric() {
  const existing = await db.rubric.findUnique({ where: { id: DEFAULT_RUBRIC_ID }, select: { id: true } })
  if (existing) return
  try {
    await createRubric(GENERIC_WRITTEN_RUBRIC, "ACTIVE", null, { id: DEFAULT_RUBRIC_ID, isDefault: true })
  } catch (e) {
    // Another request created it first.
    if ((e as { code?: string }).code !== "P2002") throw e
  }
}

/** The rubric a programme may attach: any library rubric, or its own copy. */
export async function rubricUsableBy(rubricId: string, courseId: string) {
  const r = await db.rubric.findUnique({ where: { id: rubricId }, select: { courseId: true, status: true } })
  if (!r) return { ok: false as const, error: "That rubric doesn't exist." }
  if (r.courseId && r.courseId !== courseId) return { ok: false as const, error: "That rubric belongs to another programme." }
  if (r.status === "ARCHIVED") return { ok: false as const, error: "That rubric is archived." }
  return { ok: true as const }
}
