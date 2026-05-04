import { db } from "@/lib/db"
import { CareerType, ExperienceLevel, CareerStatus } from "@prisma/client"

export type { CareerType, ExperienceLevel, CareerStatus }

// ── Department types ──────────────────────────────────────────────────────────

export type DepartmentRow = {
  id:        string
  name:      string
  createdAt: Date
  updatedAt: Date
  _count:    { careers: number }
}

type ServiceResult<T> = { success: true; data: T } | { success: false; error: string }

// ── Department CRUD ───────────────────────────────────────────────────────────

export async function getCareerDepartments(): Promise<DepartmentRow[]> {
  const rows = await db.careerDepartment.findMany({
    orderBy: { name: "asc" },
  })
  return rows.map(r => ({ ...r, _count: { careers: 0 } }))
}

export async function createCareerDepartment(
  name: string
): Promise<ServiceResult<DepartmentRow>> {
  const existing = await db.careerDepartment.findFirst({ where: { name } })
  if (existing) return { success: false, error: "A department with this name already exists." }

  const row = await db.careerDepartment.create({ data: { name } })
  return { success: true, data: { ...row, _count: { careers: 0 } } }
}

export async function updateCareerDepartment(
  id:   string,
  name: string
): Promise<ServiceResult<DepartmentRow>> {
  const existing = await db.careerDepartment.findUnique({ where: { id } })
  if (!existing) return { success: false, error: "Department not found." }

  const conflict = await db.careerDepartment.findFirst({ where: { name, NOT: { id } } })
  if (conflict) return { success: false, error: "A department with this name already exists." }

  const row = await db.careerDepartment.update({ where: { id }, data: { name } })
  const careersCount = await db.career.count({ where: { department: name } })
  return { success: true, data: { ...row, _count: { careers: careersCount } } }
}

export async function deleteCareerDepartment(
  id: string
): Promise<ServiceResult<null>> {
  const existing = await db.careerDepartment.findUnique({ where: { id } })
  if (!existing) return { success: false, error: "Department not found." }

  const inUse = await db.career.count({ where: { department: existing.name } })
  if (inUse > 0) {
    return { success: false, error: `Cannot delete — ${inUse} posting(s) use this department.` }
  }

  await db.careerDepartment.delete({ where: { id } })
  return { success: true, data: null }
}

export type CareerRow = {
  id:              string
  title:           string
  slug:            string
  department:      string
  type:            CareerType
  experienceLevel: ExperienceLevel
  location:        string
  remote:          boolean
  salaryMin:       number | null
  salaryMax:       number | null
  currency:        string
  description:     string
  responsibilities: unknown | null
  requirements:    unknown | null
  benefits:        unknown | null
  applyEmail:      string | null
  status:          CareerStatus
  views:           number
  applications:    number
  closingDate:     Date | null
  createdAt:       Date
  updatedAt:       Date
}

export type CareerInput = {
  title:           string
  slug?:           string
  department:      string
  type?:           CareerType
  experienceLevel?: ExperienceLevel
  location:        string
  remote?:         boolean
  salaryMin?:      number | null
  salaryMax?:      number | null
  currency?:       string
  description:     string
  responsibilities?: unknown | null
  requirements?:    unknown | null
  benefits?:        unknown | null
  applyEmail?:     string | null
  status?:         CareerStatus
  closingDate?:    string | null
}

export type CareerServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export async function getCareers(filters?: {
  status?:          CareerStatus
  department?:      string
  type?:            CareerType
  experienceLevel?: ExperienceLevel
  location?:        string
}): Promise<CareerRow[]> {
  return db.career.findMany({
    where: {
      ...(filters?.status          !== undefined && { status:          filters.status }),
      ...(filters?.department      !== undefined && { department:      filters.department }),
      ...(filters?.type            !== undefined && { type:            filters.type }),
      ...(filters?.experienceLevel !== undefined && { experienceLevel: filters.experienceLevel }),
      ...(filters?.location        !== undefined && { location:        filters.location }),
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function getCareerById(id: string): Promise<CareerRow | null> {
  return db.career.findUnique({ where: { id } })
}

export async function getCareerBySlug(slug: string): Promise<CareerRow | null> {
  return db.career.findUnique({ where: { slug } })
}

export async function createCareer(
  input: CareerInput
): Promise<CareerServiceResult<CareerRow>> {
  const slug = input.slug ?? slugify(input.title)

  const existing = await db.career.findUnique({ where: { slug } })
  if (existing) {
    return { success: false, error: "A career posting with this slug already exists." }
  }

  const career = await db.career.create({
    data: {
      title:           input.title,
      slug,
      department:      input.department,
      type:            input.type            ?? "FULL_TIME",
      experienceLevel: input.experienceLevel ?? "MID",
      location:        input.location,
      remote:          input.remote          ?? false,
      salaryMin:       input.salaryMin       ?? null,
      salaryMax:       input.salaryMax       ?? null,
      currency:        input.currency        ?? "USD",
      description:     input.description,
      responsibilities: (input.responsibilities ?? null) as never,
      requirements:    (input.requirements    ?? null) as never,
      benefits:        (input.benefits        ?? null) as never,
      applyEmail:      input.applyEmail      ?? null,
      status:          input.status          ?? "PUBLISHED",
      closingDate:     input.closingDate ? new Date(input.closingDate) : null,
    },
  })

  return { success: true, data: career }
}

export async function updateCareer(
  id: string,
  input: Partial<CareerInput>
): Promise<CareerServiceResult<CareerRow>> {
  const existing = await db.career.findUnique({ where: { id } })
  if (!existing) return { success: false, error: "Career posting not found." }

  if (input.slug && input.slug !== existing.slug) {
    const conflict = await db.career.findUnique({ where: { slug: input.slug } })
    if (conflict) {
      return { success: false, error: "A career posting with this slug already exists." }
    }
  }

  const career = await db.career.update({
    where: { id },
    data: {
      ...(input.title           !== undefined && { title:           input.title }),
      ...(input.slug            !== undefined && { slug:            input.slug }),
      ...(input.department      !== undefined && { department:      input.department }),
      ...(input.type            !== undefined && { type:            input.type }),
      ...(input.experienceLevel !== undefined && { experienceLevel: input.experienceLevel }),
      ...(input.location        !== undefined && { location:        input.location }),
      ...(input.remote          !== undefined && { remote:          input.remote }),
      ...(input.salaryMin       !== undefined && { salaryMin:       input.salaryMin }),
      ...(input.salaryMax       !== undefined && { salaryMax:       input.salaryMax }),
      ...(input.currency        !== undefined && { currency:        input.currency }),
      ...(input.description     !== undefined && { description:     input.description }),
      ...(input.responsibilities !== undefined && { responsibilities: input.responsibilities as never }),
      ...(input.requirements    !== undefined && { requirements:    input.requirements as never }),
      ...(input.benefits        !== undefined && { benefits:        input.benefits as never }),
      ...(input.applyEmail      !== undefined && { applyEmail:      input.applyEmail }),
      ...(input.status          !== undefined && { status:          input.status }),
      ...(input.closingDate     !== undefined && { closingDate:     input.closingDate ? new Date(input.closingDate) : null }),
    },
  })

  return { success: true, data: career }
}

export async function deleteCareer(id: string): Promise<CareerServiceResult<null>> {
  const existing = await db.career.findUnique({ where: { id } })
  if (!existing) return { success: false, error: "Career posting not found." }

  await db.career.delete({ where: { id } })
  return { success: true, data: null }
}

export async function toggleCareerStatus(
  id: string
): Promise<CareerServiceResult<CareerRow>> {
  const existing = await db.career.findUnique({ where: { id } })
  if (!existing) return { success: false, error: "Career posting not found." }

  const career = await db.career.update({
    where: { id },
    data: { status: existing.status === "PUBLISHED" ? "ARCHIVED" : "PUBLISHED" },
  })

  return { success: true, data: career }
}
