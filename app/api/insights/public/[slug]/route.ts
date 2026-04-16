import { NextRequest, NextResponse } from "next/server"
import { getInsights, getInsightBySlug } from "@/services/insight.service"

type PublicInsight = {
  id: string
  title: string
  slug: string
  excerpt: string
  body: string
  featured: boolean
  readTime: string
  author: string
  authorInitials: string
  authorJobTitle: string | null
  authorBio: string | null
  category: string
  date: string
  publishedAt: string | null
  coverImage: string | null
}

type InsightCard = {
  slug: string
  title: string
  category: string
  date: string
  readTime: string
  author: string
}

function toInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

function formatDate(publishedAt: Date | null, createdAt: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(publishedAt ?? createdAt)
}

function toPublicInsight(insight: NonNullable<Awaited<ReturnType<typeof getInsightBySlug>>>) {
  const authorName = insight.author?.name ?? "ARPS Institute"

  const payload: PublicInsight = {
    id: insight.id,
    title: insight.title,
    slug: insight.slug,
    excerpt: insight.excerpt,
    body: insight.body,
    featured: insight.featured,
    readTime: insight.readTime || "5 min read",
    author: authorName,
    authorInitials: toInitials(authorName),
    authorJobTitle: insight.author?.jobTitle ?? null,
    authorBio: insight.author?.bio ?? null,
    category: insight.category?.name ?? "Uncategorized",
    date: formatDate(insight.publishedAt, insight.createdAt),
    publishedAt: insight.publishedAt ? insight.publishedAt.toISOString() : null,
    coverImage: insight.coverImage,
  }

  return payload
}

function toCard(insight: Awaited<ReturnType<typeof getInsights>>[number]): InsightCard {
  return {
    slug: insight.slug,
    title: insight.title,
    category: insight.category?.name ?? "Uncategorized",
    date: formatDate(insight.publishedAt, insight.createdAt),
    readTime: insight.readTime || "5 min read",
    author: insight.author?.name ?? "ARPS Institute",
  }
}

type Context = { params: Promise<{ slug: string }> }

/** GET /api/insights/public/[slug] — public published insight detail by slug */
export async function GET(_req: NextRequest, { params }: Context) {
  try {
    const { slug } = await params
    const insight = await getInsightBySlug(slug)

    if (!insight || !insight.published) {
      return NextResponse.json({ error: "Insight not found." }, { status: 404 })
    }

    const list = await getInsights({ published: true })
    const ordered = list.sort((a, b) => {
      const aTime = a.publishedAt?.getTime() ?? a.createdAt.getTime()
      const bTime = b.publishedAt?.getTime() ?? b.createdAt.getTime()
      return bTime - aTime
    })

    const index = ordered.findIndex((row) => row.id === insight.id)
    const prev = index >= 0 ? ordered[index + 1] ?? null : null
    const next = index > 0 ? ordered[index - 1] ?? null : null

    const related = ordered
      .filter((row) => row.id !== insight.id && row.categoryId === insight.categoryId)
      .slice(0, 3)

    return NextResponse.json({
      insight: toPublicInsight(insight),
      prev: prev ? toCard(prev) : null,
      next: next ? toCard(next) : null,
      related: related.map(toCard),
    })
  } catch (error) {
    console.error("[GET /api/insights/public/[slug]]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}