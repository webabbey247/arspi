import { db } from "@/lib/db"
import { CourseLevel } from "@prisma/client"

export type { CourseLevel }

// ── Types ────────────────────────────────────────────────────────────────────

export type ProgramCategoryRow = {
  id:        string
  name:      string
  slug:      string
  createdAt: Date
  _count:    { courses: number }
}

export type ProgramRow = {
  id:          string
  title:       string
  slug:        string
  description: string
  thumbnail:   string | null
  price:       number
  level:       CourseLevel
  featured:    boolean
  published:   boolean

  // Extended programme details
  tagline:              string | null
  duration:             string | null
  format:               string | null
  startDate:            string | null
  endDate:              string | null
  cohortSize:           number | null
  rating:               number | null
  reviewCount:          number | null
  enrolledCount:        number | null
  countriesCount:       number | null

  // Rich content
  overview:             string | null
  targetAudience:       unknown | null
  learningObjectives:   unknown | null
  curriculum:           unknown | null
  whatIsIncluded:       unknown | null
  faqs:                 unknown | null

  // Standalone instructor profile
  instructorName:        string | null
  instructorTitle:       string | null
  instructorBio:         string | null
  instructorInitials:    string | null
  instructorCredentials: unknown | null

  instructorId: string
  instructor:  {
    id:      string
    email:   string
    profile: { firstName: string | null; lastName: string | null } | null
  }
  categoryId: string | null
  category:   ProgramCategoryRow | null
  createdAt:  Date
  updatedAt:  Date
  _count:     { enrollments: number }
}

export type ProgramInput = {
  title:        string
  slug?:        string
  description:  string
  thumbnail?:   string | null
  price?:       number
  level?:       CourseLevel
  featured?:    boolean
  published?:   boolean
  categoryId?:  string | null
  instructorId?: string

  // Extended programme details
  tagline?:              string | null
  duration?:             string | null
  format?:               string | null
  startDate?:            string | null
  endDate?:              string | null
  cohortSize?:           number | null
  rating?:               number | null
  reviewCount?:          number | null
  enrolledCount?:        number | null
  countriesCount?:       number | null

  // Rich content (JSON)
  overview?:             string | null
  targetAudience?:       unknown | null
  learningObjectives?:   unknown | null
  curriculum?:           unknown | null
  whatIsIncluded?:       unknown | null
  faqs?:                 unknown | null

  // Standalone instructor
  instructorName?:        string | null
  instructorTitle?:       string | null
  instructorBio?:         string | null
  instructorInitials?:    string | null
  instructorCredentials?: unknown | null
}

export type ProgramServiceResult<T> =
  | { success: true;  data: T }
  | { success: false; error: string }

export type EnrollmentRow = {
  id:          string
  userId:      string
  courseId:    string
  status:      "ACTIVE" | "COMPLETED" | "DROPPED"
  enrolledAt:  Date
  completedAt: Date | null
  user: {
    id:      string
    email:   string
    profile: { firstName: string | null; lastName: string | null } | null
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

const programInclude = {
  instructor: {
    select: {
      id:      true,
      email:   true,
      profile: { select: { firstName: true, lastName: true } },
    },
  },
  category: { include: { _count: { select: { courses: true } } } },
  _count:   { select: { enrollments: true } },
} as const

// ── Category CRUD ────────────────────────────────────────────────────────────

export async function getProgramCategories(): Promise<ProgramCategoryRow[]> {
  const rows = await db.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { courses: true } } },
  })
  return rows as unknown as ProgramCategoryRow[]
}

export async function createProgramCategory(
  name: string
): Promise<ProgramServiceResult<ProgramCategoryRow>> {
  const slug     = slugify(name)
  const existing = await db.category.findFirst({ where: { OR: [{ name }, { slug }] } })
  if (existing) return { success: false, error: "A category with this name already exists." }

  const row = await db.category.create({
    data:    { name, slug },
    include: { _count: { select: { courses: true } } },
  })
  return { success: true, data: row as unknown as ProgramCategoryRow }
}

export async function updateProgramCategory(
  id:   string,
  name: string
): Promise<ProgramServiceResult<ProgramCategoryRow>> {
  const existing = await db.category.findUnique({ where: { id } })
  if (!existing) return { success: false, error: "Category not found." }

  const slug     = slugify(name)
  const conflict = await db.category.findFirst({ where: { OR: [{ name }, { slug }], NOT: { id } } })
  if (conflict) return { success: false, error: "A category with this name already exists." }

  const row = await db.category.update({
    where:   { id },
    data:    { name, slug },
    include: { _count: { select: { courses: true } } },
  })
  return { success: true, data: row as unknown as ProgramCategoryRow }
}

export async function deleteProgramCategory(
  id: string
): Promise<ProgramServiceResult<null>> {
  const existing = await db.category.findUnique({
    where:   { id },
    include: { _count: { select: { courses: true } } },
  })
  if (!existing) return { success: false, error: "Category not found." }

  const count = (existing as unknown as ProgramCategoryRow)._count.courses
  if (count > 0) {
    return {
      success: false,
      error:   `Cannot delete — ${count} program(s) are assigned to this category.`,
    }
  }

  await db.category.delete({ where: { id } })
  return { success: true, data: null }
}

// ── Program CRUD ─────────────────────────────────────────────────────────────

export async function getPrograms(filters?: {
  categoryId?:   string
  level?:        CourseLevel
  published?:    boolean
  featured?:     boolean
  instructorId?: string
}): Promise<ProgramRow[]> {
  const rows = await db.course.findMany({
    where: {
      ...(filters?.categoryId   !== undefined && { categoryId:   filters.categoryId }),
      ...(filters?.level        !== undefined && { level:        filters.level }),
      ...(filters?.published    !== undefined && { published:    filters.published }),
      ...(filters?.featured     !== undefined && { featured:     filters.featured }),
      ...(filters?.instructorId !== undefined && { instructorId: filters.instructorId }),
    },
    include: programInclude,
    orderBy: { createdAt: "desc" },
  })
  return rows as unknown as ProgramRow[]
}

export async function getProgramById(id: string): Promise<ProgramRow | null> {
  const row = await db.course.findUnique({ where: { id }, include: programInclude })
  return row as unknown as ProgramRow | null
}

export async function getProgramBySlug(slug: string): Promise<ProgramRow | null> {
  const row = await db.course.findUnique({ where: { slug }, include: programInclude })
  return row as unknown as ProgramRow | null
}

export async function createProgram(
  input:        ProgramInput,
  instructorId: string
): Promise<ProgramServiceResult<ProgramRow>> {
  const slug     = input.slug ?? slugify(input.title)
  const existing = await db.course.findUnique({ where: { slug } })
  if (existing) return { success: false, error: "A program with this slug already exists." }

  const row = await db.course.create({
    data: {
      title:        input.title,
      slug,
      description:  input.description,
      thumbnail:    input.thumbnail   ?? null,
      price:        input.price       ?? 0,
      level:        input.level       ?? "BEGINNER",
      featured:     input.featured    ?? false,
      published:    input.published   ?? false,
      categoryId:   input.categoryId  ?? null,
      instructorId: input.instructorId ?? instructorId,

      tagline:              input.tagline              ?? null,
      duration:             input.duration             ?? null,
      format:               input.format               ?? null,
      startDate:            input.startDate             ?? null,
      endDate:              input.endDate               ?? null,
      cohortSize:           input.cohortSize            ?? null,
      rating:               input.rating               ?? null,
      reviewCount:          input.reviewCount           ?? null,
      enrolledCount:        input.enrolledCount         ?? null,
      countriesCount:       input.countriesCount        ?? null,
      overview:             input.overview              ?? null,
      targetAudience:       (input.targetAudience        ?? null) as never,
      learningObjectives:   (input.learningObjectives   ?? null) as never,
      curriculum:           (input.curriculum           ?? null) as never,
      whatIsIncluded:       (input.whatIsIncluded       ?? null) as never,
      faqs:                 (input.faqs                 ?? null) as never,
      instructorName:       input.instructorName        ?? null,
      instructorTitle:      input.instructorTitle       ?? null,
      instructorBio:        input.instructorBio         ?? null,
      instructorInitials:   input.instructorInitials    ?? null,
      instructorCredentials:(input.instructorCredentials ?? null) as never,
    },
    include: programInclude,
  })
  return { success: true, data: row as unknown as ProgramRow }
}

export async function updateProgram(
  id:    string,
  input: Partial<ProgramInput>
): Promise<ProgramServiceResult<ProgramRow>> {
  const existing = await db.course.findUnique({ where: { id } })
  if (!existing) return { success: false, error: "Program not found." }

  if (input.slug && input.slug !== existing.slug) {
    const conflict = await db.course.findUnique({ where: { slug: input.slug } })
    if (conflict) return { success: false, error: "A program with this slug already exists." }
  }

  const row = await db.course.update({
    where: { id },
    data: {
      ...(input.title        !== undefined && { title:        input.title }),
      ...(input.slug         !== undefined && { slug:         input.slug }),
      ...(input.description  !== undefined && { description:  input.description }),
      ...(input.thumbnail    !== undefined && { thumbnail:    input.thumbnail }),
      ...(input.price        !== undefined && { price:        input.price }),
      ...(input.level        !== undefined && { level:        input.level }),
      ...(input.featured     !== undefined && { featured:     input.featured }),
      ...(input.published    !== undefined && { published:    input.published }),
      ...(input.categoryId   !== undefined && { categoryId:   input.categoryId }),
      ...(input.instructorId !== undefined && { instructorId: input.instructorId }),

      ...(input.tagline             !== undefined && { tagline:             input.tagline }),
      ...(input.duration            !== undefined && { duration:            input.duration }),
      ...(input.format              !== undefined && { format:              input.format }),
      ...(input.startDate           !== undefined && { startDate:           input.startDate }),
      ...(input.endDate             !== undefined && { endDate:             input.endDate }),
      ...(input.cohortSize          !== undefined && { cohortSize:          input.cohortSize }),
      ...(input.rating              !== undefined && { rating:              input.rating }),
      ...(input.reviewCount         !== undefined && { reviewCount:         input.reviewCount }),
      ...(input.enrolledCount       !== undefined && { enrolledCount:       input.enrolledCount }),
      ...(input.countriesCount      !== undefined && { countriesCount:      input.countriesCount }),
      ...(input.overview            !== undefined && { overview:            input.overview }),
      ...(input.targetAudience      !== undefined && { targetAudience:      input.targetAudience      as never }),
      ...(input.learningObjectives  !== undefined && { learningObjectives:  input.learningObjectives  as never }),
      ...(input.curriculum          !== undefined && { curriculum:          input.curriculum          as never }),
      ...(input.whatIsIncluded      !== undefined && { whatIsIncluded:      input.whatIsIncluded      as never }),
      ...(input.faqs                !== undefined && { faqs:                input.faqs                as never }),
      ...(input.instructorName      !== undefined && { instructorName:      input.instructorName }),
      ...(input.instructorTitle     !== undefined && { instructorTitle:     input.instructorTitle }),
      ...(input.instructorBio       !== undefined && { instructorBio:       input.instructorBio }),
      ...(input.instructorInitials  !== undefined && { instructorInitials:  input.instructorInitials }),
      ...(input.instructorCredentials !== undefined && { instructorCredentials: input.instructorCredentials as never }),
    },
    include: programInclude,
  })
  return { success: true, data: row as unknown as ProgramRow }
}

export async function deleteProgram(id: string): Promise<ProgramServiceResult<null>> {
  const existing = await db.course.findUnique({
    where:   { id },
    include: { _count: { select: { enrollments: true } } },
  })
  if (!existing) return { success: false, error: "Program not found." }

  const enrolled = (existing as unknown as { _count: { enrollments: number } })._count.enrollments
  if (enrolled > 0) {
    return {
      success: false,
      error:   `Cannot delete — ${enrolled} student(s) are enrolled in this program.`,
    }
  }

  await db.course.delete({ where: { id } })
  return { success: true, data: null }
}

// ── Enrollments ──────────────────────────────────────────────────────────────

export async function getProgramEnrollments(programId: string): Promise<EnrollmentRow[]> {
  const rows = await db.enrollment.findMany({
    where: { courseId: programId },
    include: {
      user: {
        select: {
          id:      true,
          email:   true,
          profile: { select: { firstName: true, lastName: true } },
        },
      },
    },
    orderBy: { enrolledAt: "desc" },
  })
  return rows as unknown as EnrollmentRow[]
}

export async function enrollInProgram(
  userId:   string,
  courseId: string
): Promise<ProgramServiceResult<{ id: string }>> {
  const existing = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  })
  if (existing) return { success: false, error: "Already enrolled in this program." }

  const row = await db.enrollment.create({
    data:   { userId, courseId, status: "ACTIVE" },
    select: { id: true },
  })
  return { success: true, data: row }
}
