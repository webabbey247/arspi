import "server-only"
import { unstable_cache } from "next/cache"
import { getProgramsForListing, PROGRAMS_PUBLIC_TAG, type CourseLevel } from "@/services/program.service"
import { getWorkshops, computeDurationHours, normalizeFacilitators } from "@/services/workshop.service"
import { getInsightsForListing, INSIGHTS_PUBLIC_TAG, type InsightListingRow } from "@/services/insight.service"
import { PUBLIC_REVALIDATE_SECONDS, WORKSHOPS_PUBLIC_TAG } from "@/lib/public-cache"
import { sanitizeHtml } from "@/lib/sanitize"
import { getProgramLevels, getProgramFormats, getProgramPricings } from "@/services/program-lookup.service"

/**
 * The cached payloads behind the public listing APIs, shared by the routes
 * (/api/programs/public, /api/workshops/public, /api/insights/public) and the
 * server-rendered pages. Both paths hit the same cache entries, and every admin
 * write clears them through the tags.
 */

// ── Programmes ───────────────────────────────────────────────────────────────

export type ProgramListingFilters = { level?: CourseLevel; featured?: boolean; categoryId?: string }

/** 60s revalidate; invalidated on programme, category or lookup changes. */
export const getPublicProgramsPayload = unstable_cache(
  async (filters: ProgramListingFilters) => {
    const programs = await getProgramsForListing(filters)
    return programs.map(p => ({
      id:          p.id,
      title:       p.title,
      slug:        p.slug,
      excerpt:     p.excerpt,
      thumbnail:   p.thumbnail,
      price:       p.price,
      pricing:     p.pricing,
      paymentType: p.paymentType,
      level:       p.level,
      featured:    p.featured,
      tagline:     p.tagline,
      duration:    p.duration,
      format:      p.format,
      startDate:   p.startDate,
      endDate:     p.endDate,
      rating:      p.rating,
      reviewCount: p.reviewCount,
      enrolled:    p._count.enrollments,
      createdAt:   p.createdAt.toISOString(),
      category:    p.category,
      instructor:  {
        name: p.instructor
          ? [p.instructor.profile?.firstName, p.instructor.profile?.lastName].filter(Boolean).join(" ") || "ARPS Institute"
          : "ARPS Institute",
      },
      programLevel:   p.programLevel,
      programFormat:  p.programFormat,
      programPricing: p.programPricing,
    }))
  },
  ["programs:public:v1"],
  { tags: [PROGRAMS_PUBLIC_TAG], revalidate: 60 },
)

// ── Workshops ────────────────────────────────────────────────────────────────

/** Every published workshop, shaped for the public pages. Cleared on any
 *  workshop write — the home page and every public footer ask for it. */
export const getPublicWorkshopsPayload = unstable_cache(async () => {
  const workshops = await getWorkshops({ published: true })
  return workshops.map(w => ({
    id:          w.id,
    title:       w.title,
    slug:        w.slug,
    // Sanitised once here (and cached) rather than in every visitor's browser.
    description: sanitizeHtml(w.description),
    type:        w.type,
    category:    w.category,
    fee:         w.fee,
    featured:    w.featured,
    date:           w.date ? w.date.toISOString() : null,
    startTime:      w.startTime,
    endTime:        w.endTime,
    timezone:       w.timezone,
    duration:       computeDurationHours(w.startTime, w.endTime),
    level:          w.level,
    facilitator:    w.facilitator,
    facilitators:   normalizeFacilitators(w.facilitators),
    medium:         w.medium,
    onlinePlatform: w.onlinePlatform,
    // onlineLink is deliberately omitted: for a paid workshop it's what
    // people pay for. Confirmed registrants get it in their email.
    venueAddress:   w.venueAddress,
    venueCity:      w.venueCity,
    venueState:     w.venueState,
    venueCountry:   w.venueCountry,
    capacity:       w.capacity,
    registered:     w._count?.registrations ?? 0,
    coverImage:     w.coverImage,
  }))
}, ["workshops-public"], { tags: [WORKSHOPS_PUBLIC_TAG], revalidate: PUBLIC_REVALIDATE_SECONDS })

type PublicWorkshopRow = Awaited<ReturnType<typeof getPublicWorkshopsPayload>>[number]

/** `upcoming`: today onwards, soonest first; otherwise newest first. */
export function selectWorkshops(
  all: PublicWorkshopRow[],
  { sort, limit = 50 }: { sort?: string | null; limit?: number } = {},
): PublicWorkshopRow[] {
  let rows = all
  if (sort === "upcoming") {
    const now = Date.now()
    rows = all
      .filter(w => w.date && new Date(w.date).getTime() >= now - 86_400_000)
      .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime())
  }
  return rows.slice(0, Math.min(Math.max(limit, 1), 50))
}

// ── Insights ─────────────────────────────────────────────────────────────────

function toInitials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase() ?? "").join("")
}

function formatInsightDate(publishedAt: Date | null, createdAt: Date) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" })
    .format(publishedAt ?? createdAt)
}

function toPublicInsight(insight: InsightListingRow) {
  const authorName = insight.author?.name ?? "ARPS Institute"
  return {
    id:             insight.id,
    title:          insight.title,
    slug:           insight.slug,
    excerpt:        insight.excerpt,
    featured:       insight.featured,
    readTime:       insight.readTime || "5 min read",
    author:         authorName,
    authorInitials: toInitials(authorName),
    category:       insight.category?.name ?? "Uncategorized",
    date:           formatInsightDate(insight.publishedAt, insight.createdAt),
    publishedAt:    insight.publishedAt ? insight.publishedAt.toISOString() : null,
    coverImage:     insight.coverImage,
  }
}

/** 60s revalidate; invalidated on insight changes. */
export const getPublicInsightsPayload = unstable_cache(
  async (filters: { featured?: boolean; categorySlug?: string }) => {
    const rows = await getInsightsForListing({ published: true, ...filters })
    return rows.map(toPublicInsight)
  },
  ["insights:public:v1"],
  { tags: [INSIGHTS_PUBLIC_TAG], revalidate: 60 },
)

// ── Programme lookups ────────────────────────────────────────────────────────

/** Lookup options (levels / formats / pricing). They rarely change; lookup and
 *  programme writes clear PROGRAMS_PUBLIC_TAG. Null for an unknown kind. */
export const getPublicLookupItems = unstable_cache(async (kind: string) => {
  const rows =
    kind === "levels"  ? await getProgramLevels()  :
    kind === "formats" ? await getProgramFormats() :
    kind === "pricing" ? await getProgramPricings() :
    null
  return rows ? rows.map(r => ({ id: r.id, name: r.name, slug: r.slug })) : null
}, ["programs-public-lookups"], { tags: [PROGRAMS_PUBLIC_TAG], revalidate: PUBLIC_REVALIDATE_SECONDS })
