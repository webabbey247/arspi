import "server-only"
import { db } from "@/lib/db"
import { Prisma } from "@prisma/client"
import { sanitizeHtml } from "@/lib/sanitize"
import { bumpProgramDetailCache, bumpProgramsPublicCache } from "@/services/program.service"

/**
 * The facilitator directory. Programmes keep a snapshot of their facilitators
 * in Course.facilitators (JSON, each item tagged with facilitatorId) so the
 * public pages and the student player read one row, exactly as before. This
 * service keeps those snapshots in step: editing an entry rewrites it on every
 * programme that lists it; deleting one removes it from them.
 */

export const INSTITUTE_FACILITATOR_ID = "fac_institute"

export type FacilitatorInput = {
  name:        string
  title:       string
  bio:         string
  imageUrl?:   string | null
  credentials?: string | null
}

/** The shape stored in Course.facilitators. */
export type FacilitatorSnapshot = {
  facilitatorId?: string
  name:        string
  imageUrl:    string | null
  title:       string
  bio:         string
  credentials: string | null
}

type FacilitatorRow = Awaited<ReturnType<typeof db.facilitator.findFirstOrThrow>>

export function toSnapshot(f: FacilitatorRow): FacilitatorSnapshot {
  return {
    facilitatorId: f.id,
    name:          f.name,
    imageUrl:      f.imageUrl,
    title:         f.title,
    bio:           f.bio,
    credentials:   f.credentials,
  }
}

function clean(input: FacilitatorInput) {
  return {
    name:        input.name.trim(),
    title:       input.title.trim(),
    bio:         sanitizeHtml(input.bio),
    imageUrl:    input.imageUrl?.trim() || null,
    credentials: input.credentials?.trim() || null,
  }
}

/** Number of programmes listing each facilitator, by id. */
async function usageCounts(): Promise<Map<string, number>> {
  const rows = await db.$queryRaw<{ id: string; n: bigint }[]>`
    SELECT f->>'facilitatorId' AS id, COUNT(DISTINCT c.id) AS n
    FROM "courses" c, jsonb_array_elements(
      CASE WHEN jsonb_typeof(c."facilitators") = 'array' THEN c."facilitators" ELSE '[]'::jsonb END
    ) f
    WHERE f ? 'facilitatorId'
    GROUP BY 1`
  return new Map(rows.map(r => [r.id, Number(r.n)]))
}

/** Programmes whose snapshot lists this facilitator. */
function coursesListing(id: string) {
  return db.course.findMany({
    where:  { facilitators: { array_contains: [{ facilitatorId: id }] } },
    select: { id: true, slug: true, facilitators: true },
  })
}

export async function listFacilitators(opts: { q?: string; take?: number } = {}) {
  const q = opts.q?.trim()
  const [rows, counts] = await Promise.all([
    db.facilitator.findMany({
      where: q ? {
        OR: [
          { name:  { contains: q, mode: "insensitive" } },
          { title: { contains: q, mode: "insensitive" } },
        ],
      } : undefined,
      // The institute first, then alphabetical.
      orderBy: [{ isInstitute: "desc" }, { name: "asc" }],
      ...(opts.take ? { take: opts.take } : {}),
    }),
    usageCounts(),
  ])
  return rows.map(f => ({ ...f, programmes: counts.get(f.id) ?? 0 }))
}

export function getFacilitator(id: string) {
  return db.facilitator.findUnique({ where: { id } })
}

export async function createFacilitator(input: FacilitatorInput) {
  return db.facilitator.create({ data: clean(input) })
}

/** Rewrites every programme snapshot of this facilitator after an edit. */
export async function updateFacilitator(id: string, input: FacilitatorInput) {
  const updated = await db.facilitator.update({ where: { id }, data: clean(input) })
  const snapshot = toSnapshot(updated)
  const courses = await coursesListing(id)
  for (const c of courses) {
    const list = (c.facilitators as FacilitatorSnapshot[]).map(f => (f.facilitatorId === id ? snapshot : f))
    await db.course.update({ where: { id: c.id }, data: { facilitators: list as unknown as Prisma.InputJsonValue } })
    bumpProgramDetailCache(c.slug)
  }
  if (courses.length) bumpProgramsPublicCache()
  return { facilitator: updated, programmesUpdated: courses.length }
}

export type DeleteResult =
  | { ok: true; programmesUpdated: number }
  | { ok: false; status: number; error: string }

/** Removes the entry and takes it off every programme. A programme left with
 *  nobody falls back to the institute, so no page ends up uncredited. */
export async function deleteFacilitator(id: string): Promise<DeleteResult> {
  const existing = await db.facilitator.findUnique({ where: { id } })
  if (!existing) return { ok: false, status: 404, error: "Facilitator not found." }
  if (existing.isInstitute) {
    return { ok: false, status: 400, error: "The institute is the default facilitator and can't be deleted. You can edit it instead." }
  }

  const courses = await coursesListing(id)
  const institute = courses.length ? await db.facilitator.findUnique({ where: { id: INSTITUTE_FACILITATOR_ID } }) : null
  for (const c of courses) {
    let list = (c.facilitators as FacilitatorSnapshot[]).filter(f => f.facilitatorId !== id)
    if (!list.length && institute) list = [toSnapshot(institute)]
    await db.course.update({ where: { id: c.id }, data: { facilitators: list as unknown as Prisma.InputJsonValue } })
    bumpProgramDetailCache(c.slug)
  }
  await db.facilitator.delete({ where: { id } })
  if (courses.length) bumpProgramsPublicCache()
  return { ok: true, programmesUpdated: courses.length }
}

/**
 * A programme save's facilitator list → what gets stored. Items picked from
 * the directory are refreshed from it (the client's copy may be stale, and
 * can't be trusted to match); unknown ids are dropped. Legacy items without
 * an id pass through as typed. Duplicates are removed, order kept.
 */
export async function resolveFacilitatorSelection<T extends (Partial<FacilitatorSnapshot> & { name: string })[] | null | undefined>(
  items: T,
): Promise<FacilitatorSnapshot[] | null | Extract<T, undefined>> {
  // Omitted stays omitted (an update that doesn't touch facilitators).
  if (items === undefined) return undefined as Extract<T, undefined>
  if (items === null) return null
  const ids = [...new Set(items.map(i => i.facilitatorId).filter((x): x is string => !!x))]
  const rows = ids.length ? await db.facilitator.findMany({ where: { id: { in: ids } } }) : []
  const byId = new Map(rows.map(r => [r.id, r]))

  const out: FacilitatorSnapshot[] = []
  const seen = new Set<string>()
  for (const item of items) {
    if (item.facilitatorId) {
      const row = byId.get(item.facilitatorId)
      if (!row || seen.has(row.id)) continue
      seen.add(row.id)
      out.push(toSnapshot(row))
    } else if (item.name?.trim()) {
      out.push({
        name:        item.name.trim(),
        imageUrl:    item.imageUrl ?? null,
        title:       item.title ?? "",
        bio:         item.bio ?? "",
        credentials: item.credentials ?? null,
      })
    }
  }
  return out.length ? out : null
}
