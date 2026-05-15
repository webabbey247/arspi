import { NextRequest, NextResponse } from "next/server"
import { unstable_cache } from "next/cache"
import {
  getProgramsForListing,
  PROGRAMS_PUBLIC_TAG,
  CourseLevel,
} from "@/services/program.service"

/** Cached listing payload, 60s revalidate. Invalidated on program, category,
 *  or lookup mutations via revalidateTag(PROGRAMS_PUBLIC_TAG). */
const getCachedProgramsPayload = unstable_cache(
  async (filters: { level?: CourseLevel; featured?: boolean; categoryId?: string }) => {
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
        name: [p.instructor.profile?.firstName, p.instructor.profile?.lastName].filter(Boolean).join(" ") || p.instructor.email,
      },
      programLevel:   p.programLevel,
      programFormat:  p.programFormat,
      programPricing: p.programPricing,
    }))
  },
  ["programs:public:v1"],
  { tags: [PROGRAMS_PUBLIC_TAG], revalidate: 60 },
)

/** GET /api/programs/public — publicly accessible listing of programs.
 *  Returns only fields the public card consumes (services/public-program.service.ts).
 *  Detail-only fields (overview, curriculum, faqs, etc.) are served by /api/programs/[id]. */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const levelRaw    = searchParams.get("level")    ?? undefined
    const featuredRaw = searchParams.get("featured") ?? undefined
    const categoryId  = searchParams.get("categoryId") ?? undefined

    const payload = await getCachedProgramsPayload({
      ...(levelRaw    && { level:    levelRaw    as CourseLevel }),
      ...(featuredRaw && { featured: featuredRaw === "true" }),
      ...(categoryId  && { categoryId }),
    })

    return NextResponse.json({ programs: payload })
  } catch (error) {
    console.error("[GET /api/programs/public]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
