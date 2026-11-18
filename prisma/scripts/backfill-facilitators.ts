/**
 * One-off: builds the facilitator directory from the facilitators already
 * typed onto programmes, and tags each programme's snapshot with the new
 * facilitatorId. Run after prisma/manual-migrations/add_facilitators.sql.
 *
 *   npx tsx --env-file=.env.local prisma/scripts/backfill-facilitators.ts          # dry run
 *   npx tsx --env-file=.env.local prisma/scripts/backfill-facilitators.ts --apply  # write
 *
 * (lib/db imports "server-only"; outside Next, point NODE_PATH at a stub
 *  package of that name that exports nothing.)
 *
 * People are matched by name (case, dots and spacing ignored). Where the same
 * person was typed with different titles or bios, the directory entry takes
 * the most common version. Programme snapshots keep their text exactly as is,
 * so public pages don't change — they only gain the facilitatorId link.
 * Idempotent: items already linked are left alone; re-runs reuse entries.
 */
import { db } from "@/lib/db"
import type { Prisma } from "@prisma/client"

type Item = {
  facilitatorId?: string
  name?: string; title?: string; bio?: string
  imageUrl?: string | null; credentials?: string | null
}

const apply = process.argv.includes("--apply")
const keyOf = (name: string) => name.toLowerCase().replace(/[.\s]+/g, " ").trim()
const variantOf = (i: Item) => JSON.stringify([i.name, i.title, i.bio, i.imageUrl ?? null, i.credentials ?? null])

async function main() {
  const courses = await db.course.findMany({ select: { id: true, title: true, facilitators: true } })

  // Group unlinked items by person, counting each distinct variant.
  const groups = new Map<string, Map<string, { item: Item; n: number }>>()
  for (const c of courses) {
    for (const item of (Array.isArray(c.facilitators) ? c.facilitators : []) as Item[]) {
      if (item.facilitatorId || !item.name?.trim()) continue
      const key = keyOf(item.name)
      const variants = groups.get(key) ?? new Map()
      const v = variantOf(item)
      const entry = variants.get(v)
      if (entry) entry.n++
      else variants.set(v, { item, n: 1 })
      groups.set(key, variants)
    }
  }

  // Reuse directory entries from an earlier run (matched the same way).
  const existing = await db.facilitator.findMany()
  const idByKey = new Map(existing.map(f => [keyOf(f.name), f.id]))

  let created = 0
  for (const [key, variants] of groups) {
    if (idByKey.has(key)) continue
    const best = [...variants.values()].sort((a, b) => b.n - a.n)[0].item
    const total = [...variants.values()].reduce((s, v) => s + v.n, 0)
    console.log(`${apply ? "create" : "would create"}: ${best.name} — ${best.title} (${total} listing${total === 1 ? "" : "s"}, ${variants.size} variant${variants.size === 1 ? "" : "s"})`)
    if (!apply) { idByKey.set(key, "(new)"); created++; continue }
    const row = await db.facilitator.create({
      data: {
        name:        best.name!.trim(),
        title:       (best.title ?? "").trim() || "Facilitator",
        bio:         best.bio?.trim() || "<p></p>",
        imageUrl:    best.imageUrl || null,
        credentials: best.credentials?.trim() || null,
      },
    })
    idByKey.set(key, row.id)
    created++
  }

  let coursesUpdated = 0
  for (const c of courses) {
    const list = (Array.isArray(c.facilitators) ? c.facilitators : []) as Item[]
    let changed = false
    const next = list.map(item => {
      if (item.facilitatorId || !item.name?.trim()) return item
      const id = idByKey.get(keyOf(item.name))
      if (!id) return item
      changed = true
      return { facilitatorId: id, ...item }
    })
    if (!changed) continue
    coursesUpdated++
    if (apply) {
      await db.course.update({ where: { id: c.id }, data: { facilitators: next as unknown as Prisma.InputJsonValue } })
    }
  }

  console.log(`\n${apply ? "Done" : "Dry run"}: ${created} new directory entr${created === 1 ? "y" : "ies"}, ${coursesUpdated} programme${coursesUpdated === 1 ? "" : "s"} ${apply ? "linked" : "to link"}.`)
  process.exit(0)
}

main().catch(err => { console.error(err); process.exit(1) })
