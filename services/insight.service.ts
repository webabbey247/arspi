import { db } from "@/lib/db"

// ── Types ────────────────────────────────────────────────────────────────────

export type InsightCategoryRow = {
  id: string
  name: string
  slug: string
  createdAt: Date
  _count?: { insights: number }
}

export type InsightAuthorRow = {
  id: string
  name: string
  jobTitle: string | null
  bio: string | null
  avatar: string | null
}

export type InsightRow = {
  id: string
  title: string
  slug: string
  excerpt: string
  body: string
  featured: boolean
  published: boolean
  readTime: string
  coverImage: string | null
  publishedAt: Date | null
  createdAt: Date
  updatedAt: Date
  authorId: string | null
  author: InsightAuthorRow | null
  categoryId: string | null
  category: InsightCategoryRow | null
  createdById: string
}

export type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

// ── Utility ──────────────────────────────────────────────────────────────────

/** Convert a title or name to a URL-safe slug. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

// ── Shared include ────────────────────────────────────────────────────────────

const insightInclude = {
  author:   true,
  category: { include: { _count: { select: { insights: true } } } },
} as const

// ── Category CRUD ─────────────────────────────────────────────────────────────

export async function getInsightCategories(): Promise<InsightCategoryRow[]> {
  return db.insightCategory.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { insights: true } } },
  })
}

export async function createInsightCategory(
  name: string
): Promise<ServiceResult<InsightCategoryRow>> {
  const slug = slugify(name)

  const existing = await db.insightCategory.findFirst({
    where: { OR: [{ name }, { slug }] },
  })
  if (existing) {
    return { success: false, error: "A category with this name already exists." }
  }

  const category = await db.insightCategory.create({
    data: { name, slug },
    include: { _count: { select: { insights: true } } },
  })

  return { success: true, data: category }
}

export async function updateInsightCategory(
  id: string,
  name: string
): Promise<ServiceResult<InsightCategoryRow>> {
  const existing = await db.insightCategory.findUnique({ where: { id } })
  if (!existing) return { success: false, error: "Category not found." }

  const slug     = slugify(name)
  const conflict = await db.insightCategory.findFirst({
    where: { OR: [{ name }, { slug }], NOT: { id } },
  })
  if (conflict) {
    return { success: false, error: "A category with this name already exists." }
  }

  const category = await db.insightCategory.update({
    where: { id },
    data: { name, slug },
    include: { _count: { select: { insights: true } } },
  })

  return { success: true, data: category }
}

export async function deleteInsightCategory(id: string): Promise<ServiceResult<null>> {
  const existing = await db.insightCategory.findUnique({
    where: { id },
    include: { _count: { select: { insights: true } } },
  })
  if (!existing) return { success: false, error: "Category not found." }
  if (existing._count.insights > 0) {
    return {
      success: false,
      error: `Cannot delete — ${existing._count.insights} insight(s) are assigned to this category.`,
    }
  }

  await db.insightCategory.delete({ where: { id } })
  return { success: true, data: null }
}

// ── Insight CRUD ──────────────────────────────────────────────────────────────

export type InsightInput = {
  title: string
  slug?: string
  excerpt: string
  body: string
  authorId?: string | null
  categoryId?: string | null
  featured?: boolean
  published?: boolean
  readTime?: string
  coverImage?: string | null
}

export async function getInsights(filters?: {
  categoryId?: string
  authorId?: string
  published?: boolean
  featured?: boolean
}): Promise<InsightRow[]> {
  return db.insight.findMany({
    where: {
      ...(filters?.categoryId !== undefined && { categoryId: filters.categoryId }),
      ...(filters?.authorId   !== undefined && { authorId:   filters.authorId }),
      ...(filters?.published  !== undefined && { published:  filters.published }),
      ...(filters?.featured   !== undefined && { featured:   filters.featured }),
    },
    include: insightInclude,
    orderBy: { createdAt: "desc" },
  })
}

export async function getInsightById(id: string): Promise<InsightRow | null> {
  return db.insight.findUnique({ where: { id }, include: insightInclude })
}

export async function getInsightBySlug(slug: string): Promise<InsightRow | null> {
  return db.insight.findUnique({ where: { slug }, include: insightInclude })
}

export async function createInsight(
  input: InsightInput,
  createdById: string
): Promise<ServiceResult<InsightRow>> {
  const slug = input.slug ?? slugify(input.title)

  const existing = await db.insight.findUnique({ where: { slug } })
  if (existing) {
    return { success: false, error: "An insight with this slug already exists." }
  }

  const insight = await db.insight.create({
    data: {
      title:      input.title,
      slug,
      excerpt:    input.excerpt,
      body:       input.body,
      featured:   input.featured  ?? false,
      published:  input.published ?? false,
      readTime:   input.readTime  ?? "5 min read",
      coverImage: input.coverImage ?? null,
      publishedAt: input.published ? new Date() : null,
      authorId:   input.authorId   ?? null,
      categoryId: input.categoryId ?? null,
      createdById,
    },
    include: insightInclude,
  })

  return { success: true, data: insight }
}

export async function updateInsight(
  id: string,
  input: Partial<InsightInput>
): Promise<ServiceResult<InsightRow>> {
  const existing = await db.insight.findUnique({ where: { id } })
  if (!existing) return { success: false, error: "Insight not found." }

  if (input.slug && input.slug !== existing.slug) {
    const conflict = await db.insight.findUnique({ where: { slug: input.slug } })
    if (conflict) {
      return { success: false, error: "An insight with this slug already exists." }
    }
  }

  const publishedAt =
    input.published === true  ? (existing.publishedAt ?? new Date()) :
    input.published === false ? null :
    undefined

  const insight = await db.insight.update({
    where: { id },
    data: {
      ...(input.title      !== undefined && { title:      input.title }),
      ...(input.slug       !== undefined && { slug:       input.slug }),
      ...(input.excerpt    !== undefined && { excerpt:    input.excerpt }),
      ...(input.body       !== undefined && { body:       input.body }),
      ...(input.featured   !== undefined && { featured:   input.featured }),
      ...(input.published  !== undefined && { published:  input.published }),
      ...(input.readTime   !== undefined && { readTime:   input.readTime }),
      ...(input.coverImage !== undefined && { coverImage: input.coverImage }),
      ...(input.authorId   !== undefined && { authorId:   input.authorId }),
      ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
      ...(publishedAt      !== undefined && { publishedAt }),
    },
    include: insightInclude,
  })

  return { success: true, data: insight }
}

export async function deleteInsight(id: string): Promise<ServiceResult<null>> {
  const existing = await db.insight.findUnique({ where: { id } })
  if (!existing) return { success: false, error: "Insight not found." }

  await db.insight.delete({ where: { id } })
  return { success: true, data: null }
}
