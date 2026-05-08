import { db } from "@/lib/db"
import { ProjectStatus } from "@prisma/client"

export type { ProjectStatus }

// ── Types ─────────────────────────────────────────────────────────────────────

export type TaxonomyRow = {
  id:        string
  name:      string
  slug:      string
  createdAt: Date
  _count:    { projects: number }
}

export type ProjectDivisionRow   = TaxonomyRow
export type ProjectDepartmentRow = TaxonomyRow
export type ProjectServiceRow    = TaxonomyRow

/** Project-scoped person record. Stored as JSON; not a reusable entity. */
export type ProjectPerson = {
  imageUrl?: string | null
  name:      string
  role?:     string | null
}

export type ProjectRow = {
  id:           string
  title:        string
  slug:         string
  excerpt:      string
  description:  string
  coverImage:   string | null
  status:       ProjectStatus
  client:       string
  clientLogo:   string | null
  startDate:    Date | null
  endDate:      Date | null
  displayOrder: number

  divisionId:   string | null
  division:     ProjectDivisionRow | null

  departmentId: string | null
  department:   ProjectDepartmentRow | null

  services:     ProjectServiceRow[]

  investigators: ProjectPerson[]
  members:       ProjectPerson[]

  createdAt:    Date
  updatedAt:    Date
}

export type ProjectInput = {
  title:         string
  slug?:         string
  excerpt:       string
  description:   string
  coverImage?:   string | null
  status?:       ProjectStatus
  client:        string
  clientLogo?:   string | null
  startDate?:    Date | null
  endDate?:      Date | null
  displayOrder?: number
  divisionId?:   string | null
  departmentId?: string | null
  /** Full set of service IDs to associate (replaces any existing on update). */
  serviceIds?:   string[]
  investigators?: ProjectPerson[]
  members?:       ProjectPerson[]
}

export type ProjectServiceResult<T> =
  | { success: true;  data: T }
  | { success: false; error: string }

// ── Helpers ──────────────────────────────────────────────────────────────────

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

const projectInclude = {
  division:   { include: { _count: { select: { projects: true } } } },
  department: { include: { _count: { select: { projects: true } } } },
  services:   { include: { _count: { select: { projects: true } } } },
} as const

/** Coerce the JSON `investigators`/`members` columns into typed arrays. */
function normalizePeople(value: unknown): ProjectPerson[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((v): v is Record<string, unknown> => typeof v === "object" && v !== null)
    .map(v => ({
      imageUrl: typeof v.imageUrl === "string" && v.imageUrl ? v.imageUrl : null,
      name:     typeof v.name     === "string" ? v.name : "",
      role:     typeof v.role     === "string" && v.role ? v.role : null,
    }))
    .filter(p => p.name.trim().length > 0)
}

function normalizeProject(row: unknown): ProjectRow {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = row as any
  return {
    ...r,
    investigators: normalizePeople(r?.investigators),
    members:       normalizePeople(r?.members),
  } as ProjectRow
}

// ── Generic taxonomy CRUD factory ────────────────────────────────────────────
// Avoids repeating the same find/create/update/delete logic across four models.

type TaxonomyDelegate = {
  findMany: (args: unknown) => Promise<unknown>
  findFirst: (args: unknown) => Promise<unknown>
  findUnique: (args: unknown) => Promise<unknown>
  create:   (args: unknown) => Promise<unknown>
  update:   (args: unknown) => Promise<unknown>
  delete:   (args: unknown) => Promise<unknown>
}

function makeTaxonomyService(
  delegate: TaxonomyDelegate,
  noun: string,
) {
  const include = { _count: { select: { projects: true } } } as const

  return {
    list:   async (): Promise<TaxonomyRow[]> => {
      const rows = await delegate.findMany({ orderBy: { name: "asc" }, include })
      return rows as unknown as TaxonomyRow[]
    },
    create: async (name: string): Promise<ProjectServiceResult<TaxonomyRow>> => {
      const slug     = slugify(name)
      const existing = await delegate.findFirst({ where: { OR: [{ name }, { slug }] } })
      if (existing) return { success: false, error: `A ${noun} with this name already exists.` }
      const row = await delegate.create({ data: { name, slug }, include })
      return { success: true, data: row as unknown as TaxonomyRow }
    },
    update: async (id: string, name: string): Promise<ProjectServiceResult<TaxonomyRow>> => {
      const existing = await delegate.findUnique({ where: { id } })
      if (!existing) return { success: false, error: `${capitalize(noun)} not found.` }
      const slug     = slugify(name)
      const conflict = await delegate.findFirst({ where: { OR: [{ name }, { slug }], NOT: { id } } })
      if (conflict) return { success: false, error: `A ${noun} with this name already exists.` }
      const row = await delegate.update({ where: { id }, data: { name, slug }, include })
      return { success: true, data: row as unknown as TaxonomyRow }
    },
    remove: async (id: string): Promise<ProjectServiceResult<null>> => {
      const existing = await delegate.findUnique({ where: { id }, include })
      if (!existing) return { success: false, error: `${capitalize(noun)} not found.` }
      const count = (existing as unknown as TaxonomyRow)._count.projects
      if (count > 0) {
        return {
          success: false,
          error:   `Cannot delete — ${count} project(s) are assigned to this ${noun}.`,
        }
      }
      await delegate.delete({ where: { id } })
      return { success: true, data: null }
    },
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// ── Division CRUD ────────────────────────────────────────────────────────────

const divisionService = makeTaxonomyService(
  db.projectDivision as unknown as TaxonomyDelegate,
  "division"
)
export const getProjectDivisions    = divisionService.list
export const createProjectDivision  = divisionService.create
export const updateProjectDivision  = divisionService.update
export const deleteProjectDivision  = divisionService.remove

// ── Department CRUD ──────────────────────────────────────────────────────────

const departmentService = makeTaxonomyService(
  db.projectDepartment as unknown as TaxonomyDelegate,
  "department"
)
export const getProjectDepartments    = departmentService.list
export const createProjectDepartment  = departmentService.create
export const updateProjectDepartment  = departmentService.update
export const deleteProjectDepartment  = departmentService.remove

// ── Service CRUD ─────────────────────────────────────────────────────────────

const serviceService = makeTaxonomyService(
  db.projectService as unknown as TaxonomyDelegate,
  "service"
)
export const getProjectServiceList   = serviceService.list
export const createProjectService    = serviceService.create
export const updateProjectService    = serviceService.update
export const deleteProjectService    = serviceService.remove

// ── Project CRUD ─────────────────────────────────────────────────────────────

export async function getProjects(filters?: {
  status?:       ProjectStatus
  divisionId?:   string
  departmentId?: string
  serviceId?:    string
}): Promise<ProjectRow[]> {
  const rows = await db.project.findMany({
    where: {
      ...(filters?.status       !== undefined && { status:       filters.status }),
      ...(filters?.divisionId   !== undefined && { divisionId:   filters.divisionId }),
      ...(filters?.departmentId !== undefined && { departmentId: filters.departmentId }),
      ...(filters?.serviceId    !== undefined && { services: { some: { id: filters.serviceId } } }),
    },
    include: projectInclude,
    orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
  })
  return rows.map(normalizeProject)
}

export async function getProjectById(id: string): Promise<ProjectRow | null> {
  const row = await db.project.findUnique({ where: { id }, include: projectInclude })
  return row ? normalizeProject(row) : null
}

export async function getProjectBySlug(slug: string): Promise<ProjectRow | null> {
  const row = await db.project.findUnique({ where: { slug }, include: projectInclude })
  return row ? normalizeProject(row) : null
}

export async function createProject(
  input: ProjectInput
): Promise<ProjectServiceResult<ProjectRow>> {
  const slug     = input.slug ?? slugify(input.title)
  const existing = await db.project.findUnique({ where: { slug } })
  if (existing) return { success: false, error: "A project with this slug already exists." }

  const row = await db.project.create({
    data: {
      title:        input.title,
      slug,
      excerpt:      input.excerpt,
      description:  input.description,
      coverImage:   input.coverImage   ?? null,
      status:       input.status       ?? "ACTIVE",
      client:       input.client,
      clientLogo:   input.clientLogo   ?? null,
      startDate:    input.startDate    ?? null,
      endDate:      input.endDate      ?? null,
      displayOrder: input.displayOrder ?? 0,
      divisionId:   input.divisionId   ?? null,
      departmentId: input.departmentId ?? null,
      ...(input.serviceIds && input.serviceIds.length > 0 && {
        services: { connect: input.serviceIds.map(id => ({ id })) },
      }),
      investigators: (input.investigators ?? []) as never,
      members:       (input.members       ?? []) as never,
    },
    include: projectInclude,
  })
  return { success: true, data: normalizeProject(row) }
}

export async function updateProject(
  id:    string,
  input: Partial<ProjectInput>
): Promise<ProjectServiceResult<ProjectRow>> {
  const existing = await db.project.findUnique({ where: { id } })
  if (!existing) return { success: false, error: "Project not found." }

  if (input.slug && input.slug !== existing.slug) {
    const conflict = await db.project.findUnique({ where: { slug: input.slug } })
    if (conflict) return { success: false, error: "A project with this slug already exists." }
  }

  const row = await db.project.update({
    where: { id },
    data: {
      ...(input.title        !== undefined && { title:        input.title }),
      ...(input.slug         !== undefined && { slug:         input.slug }),
      ...(input.excerpt      !== undefined && { excerpt:      input.excerpt }),
      ...(input.description  !== undefined && { description:  input.description }),
      ...(input.coverImage   !== undefined && { coverImage:   input.coverImage }),
      ...(input.status       !== undefined && { status:       input.status }),
      ...(input.client       !== undefined && { client:       input.client }),
      ...(input.clientLogo   !== undefined && { clientLogo:   input.clientLogo }),
      ...(input.startDate    !== undefined && { startDate:    input.startDate }),
      ...(input.endDate      !== undefined && { endDate:      input.endDate }),
      ...(input.displayOrder !== undefined && { displayOrder: input.displayOrder }),
      ...(input.divisionId   !== undefined && { divisionId:   input.divisionId }),
      ...(input.departmentId !== undefined && { departmentId: input.departmentId }),
      ...(input.serviceIds   !== undefined && {
        services: { set: input.serviceIds.map(sid => ({ id: sid })) },
      }),
      ...(input.investigators !== undefined && { investigators: input.investigators as never }),
      ...(input.members       !== undefined && { members:       input.members       as never }),
    },
    include: projectInclude,
  })
  return { success: true, data: normalizeProject(row) }
}

export async function deleteProject(id: string): Promise<ProjectServiceResult<null>> {
  const existing = await db.project.findUnique({ where: { id } })
  if (!existing) return { success: false, error: "Project not found." }

  await db.project.delete({ where: { id } })
  return { success: true, data: null }
}
