import { NextRequest, NextResponse } from "next/server"
import { getInsights } from "@/services/insight.service"

type PublicInsight = {
  id: string
  title: string
  slug: string
  excerpt: string
  featured: boolean
  readTime: string
  author: string
  authorInitials: string
  category: string
  date: string
  publishedAt: string | null
  coverImage: string | null
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

function mapInsightToPublicPayload(insight: Awaited<ReturnType<typeof getInsights>>[number]): PublicInsight {
  const authorName = insight.author?.name ?? "ARPS Institute"

  return {
    id: insight.id,
    title: insight.title,
    slug: insight.slug,
    excerpt: insight.excerpt,
    featured: insight.featured,
    readTime: insight.readTime || "5 min read",
    author: authorName,
    authorInitials: toInitials(authorName),
    category: insight.category?.name ?? "Uncategorized",
    date: formatDate(insight.publishedAt, insight.createdAt),
    publishedAt: insight.publishedAt ? insight.publishedAt.toISOString() : null,
    coverImage: insight.coverImage,
  }
}

/** GET /api/insights/public — publicly accessible list of published insights */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const category = searchParams.get("category")?.trim().toLowerCase()
    const featuredRaw = searchParams.get("featured")

    const rows = await getInsights({
      published: true,
      ...(featuredRaw !== null && { featured: featuredRaw === "true" }),
    })

    const filtered = category
      ? rows.filter((row) => {
          const categoryName = row.category?.name?.toLowerCase() ?? ""
          const categorySlug = row.category?.slug?.toLowerCase() ?? ""
          return categoryName === category || categorySlug === category
        })
      : rows

    const insights = filtered.map(mapInsightToPublicPayload)
    return NextResponse.json({ insights })
  } catch (error) {
    console.error("[GET /api/insights/public]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}