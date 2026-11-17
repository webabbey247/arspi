import { NextResponse } from "next/server"
import { requireApiRole } from "@/lib/guard"
import { db } from "@/lib/db"

/**
 * GET /api/admin/dashboard — the admin home's numbers and recent items.
 *
 * The dashboard used to download every programme, insight (with full body
 * text), workshop and project just to count them and show five of each.
 * This returns grouped counts plus the five newest of each, narrow columns
 * only — the same wire shapes the page already renders.
 */
export async function GET() {
  try {
    const guard = await requireApiRole("ADMIN")
    if (!guard.ok) return guard.response
    const now = new Date()

    const [
      programStatus, insightStatus, workshopPublished, workshopUpcoming, workshopTotal, projectStatus,
      programs, insights, workshops, projects,
    ] = await Promise.all([
      db.course.groupBy({ by: ["status"], _count: { _all: true } }),
      db.insight.groupBy({ by: ["published"], _count: { _all: true } }),
      db.workshop.count({ where: { published: true } }),
      db.workshop.count({ where: { date: { gte: now } } }),
      db.workshop.count(),
      db.project.groupBy({ by: ["status"], _count: { _all: true } }),
      db.course.findMany({
        orderBy: { createdAt: "desc" }, take: 5,
        select: { id: true, title: true, slug: true, status: true, createdAt: true },
      }),
      db.insight.findMany({
        orderBy: { createdAt: "desc" }, take: 5,
        select: { id: true, title: true, slug: true, published: true, createdAt: true, publishedAt: true },
      }),
      db.workshop.findMany({
        where: { date: { gte: now } }, orderBy: { date: "asc" }, take: 5,
        select: { id: true, title: true, slug: true, published: true, date: true, createdAt: true, registered: true },
      }),
      db.project.findMany({
        orderBy: { createdAt: "desc" }, take: 5,
        select: { id: true, title: true, slug: true, status: true, client: true, createdAt: true },
      }),
    ])

    const count = <T extends string | boolean>(rows: { _count: { _all: number } }[], key: (r: never) => T, match: T) =>
      rows.filter(r => key(r as never) === match).reduce((n, r) => n + r._count._all, 0)
    const total = (rows: { _count: { _all: number } }[]) => rows.reduce((n, r) => n + r._count._all, 0)

    return NextResponse.json({
      counts: {
        programs:  { total: total(programStatus), published: count(programStatus, (r: { status: string }) => r.status, "PUBLISHED") },
        insights:  { total: total(insightStatus), published: count(insightStatus, (r: { published: boolean }) => r.published, true) },
        workshops: { total: workshopTotal, published: workshopPublished, upcoming: workshopUpcoming },
        projects:  { total: total(projectStatus), active: count(projectStatus, (r: { status: string }) => r.status, "ACTIVE") },
      },
      programs, insights, projects,
      workshops: workshops.map(w => ({ ...w, date: w.date?.toISOString() ?? null })),
    })
  } catch (error) {
    console.error("[GET /api/admin/dashboard]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
