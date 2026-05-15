import { NextRequest, NextResponse } from "next/server"
import { unstable_cache } from "next/cache"
import {
  getInsightsForListing,
  INSIGHTS_PUBLIC_TAG,
  type InsightListingRow,
} from "@/services/insight.service"

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

function mapInsightToPublicPayload(insight: InsightListingRow): PublicInsight {
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

/** Cached listing payload, 60s revalidate. Invalidated on insight mutations
 *  via revalidateTag(INSIGHTS_PUBLIC_TAG). */
const getCachedInsightsPayload = unstable_cache(
  async (filters: { featured?: boolean; categorySlug?: string }): Promise<PublicInsight[]> => {
    const rows = await getInsightsForListing({ published: true, ...filters })
    return rows.map(mapInsightToPublicPayload)
  },
  ["insights:public:v1"],
  { tags: [INSIGHTS_PUBLIC_TAG], revalidate: 60 },
)

/** GET /api/insights/public — publicly accessible list of published insights */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const category = searchParams.get("category")?.trim().toLowerCase()
    const featuredRaw = searchParams.get("featured")

    const insights = await getCachedInsightsPayload({
      ...(featuredRaw !== null && { featured: featuredRaw === "true" }),
      ...(category && { categorySlug: category }),
    })

    return NextResponse.json({ insights })
  } catch (error) {
    console.error("[GET /api/insights/public]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}