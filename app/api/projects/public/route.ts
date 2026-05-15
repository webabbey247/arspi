import { NextRequest, NextResponse } from "next/server"
import { unstable_cache } from "next/cache"
import {
  getProjectsForListing,
  getProjectDivisions,
  getProjectDepartments,
  getProjectServiceList,
  PROJECTS_PUBLIC_TAG,
  ProjectStatus,
} from "@/services/project.service"

type PublicProjectsPayload = {
  projects:    Array<Record<string, unknown>>
  divisions:   Array<{ id: string; name: string; slug: string; count: number }>
  departments: Array<{ id: string; name: string; slug: string; count: number }>
  services:    Array<{ id: string; name: string; slug: string; count: number }>
}

/** Cached payload, 60s revalidate. Invalidated on project / taxonomy mutations. */
const getCachedProjectsPayload = unstable_cache(
  async (filters: {
    status?:       ProjectStatus
    divisionId?:   string
    departmentId?: string
    serviceId?:    string
  }): Promise<PublicProjectsPayload> => {
    const [projects, divisions, departments, services] = await Promise.all([
      getProjectsForListing(filters),
      getProjectDivisions(),
      getProjectDepartments(),
      getProjectServiceList(),
    ])

    const payload = projects.map(p => ({
      id:           p.id,
      title:        p.title,
      slug:         p.slug,
      excerpt:      p.excerpt,
      description:  p.description,
      coverImage:   p.coverImage,
      status:       p.status,
      client:       p.client,
      clientLogo:   p.clientLogo,
      startDate:    p.startDate?.toISOString() ?? null,
      endDate:      p.endDate?.toISOString()   ?? null,
      division:     p.division   ? { id: p.division.id,   name: p.division.name,   slug: p.division.slug }   : null,
      department:   p.department ? { id: p.department.id, name: p.department.name, slug: p.department.slug } : null,
      services:     p.services.map(s => ({ id: s.id, name: s.name, slug: s.slug })),
      investigators: p.investigators,
      members:       p.members,
      createdAt:    p.createdAt.toISOString(),
    }))

    const tax = (rows: { id: string; name: string; slug: string; _count: { projects: number } }[]) =>
      rows.map(r => ({ id: r.id, name: r.name, slug: r.slug, count: r._count.projects }))

    return {
      projects:    payload,
      divisions:   tax(divisions),
      departments: tax(departments),
      services:    tax(services),
    }
  },
  ["projects:public:v1"],
  { tags: [PROJECTS_PUBLIC_TAG], revalidate: 60 },
)

/** GET /api/projects/public — public list of projects + taxonomy lists for filters */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const statusRaw    = searchParams.get("status")       ?? undefined
    const divisionId   = searchParams.get("divisionId")   ?? undefined
    const departmentId = searchParams.get("departmentId") ?? undefined
    const serviceId    = searchParams.get("serviceId")    ?? undefined

    const payload = await getCachedProjectsPayload({
      ...(statusRaw    && { status: statusRaw as ProjectStatus }),
      ...(divisionId   && { divisionId }),
      ...(departmentId && { departmentId }),
      ...(serviceId    && { serviceId }),
    })

    return NextResponse.json(payload)
  } catch (error) {
    console.error("[GET /api/projects/public]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
