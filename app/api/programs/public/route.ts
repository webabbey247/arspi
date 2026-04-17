import { NextRequest, NextResponse } from "next/server"
import { getPrograms, CourseLevel } from "@/services/program.service"

/** GET /api/programs/public — publicly accessible list of published programs */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const levelRaw    = searchParams.get("level")    ?? undefined
    const featuredRaw = searchParams.get("featured") ?? undefined
    const categoryId  = searchParams.get("categoryId") ?? undefined

    const programs = await getPrograms({
      published: true,
      ...(levelRaw    && { level:    levelRaw    as CourseLevel }),
      ...(featuredRaw && { featured: featuredRaw === "true" }),
      ...(categoryId  && { categoryId }),
    })

    const payload = programs.map(p => ({
      id:          p.id,
      title:       p.title,
      slug:        p.slug,
      description: p.description,
      thumbnail:   p.thumbnail,
      price:       p.price,
      level:       p.level,
      featured:    p.featured,
      category:    p.category ? { id: p.category.id, name: p.category.name, slug: p.category.slug } : null,
      instructor:  {
        name: [p.instructor.profile?.firstName, p.instructor.profile?.lastName].filter(Boolean).join(" ") || p.instructor.email,
      },
      enrolled:    p._count.enrollments,
      createdAt:   p.createdAt.toISOString(),

      // Extended programme details
      tagline:              p.tagline,
      duration:             p.duration,
      format:               p.format,
      startDate:            p.startDate,
      endDate:              p.endDate,
      cohortSize:           p.cohortSize,
      rating:               p.rating,
      reviewCount:          p.reviewCount,
      enrolledCount:        p.enrolledCount,
      countriesCount:       p.countriesCount,

      // Rich content
      overview:             p.overview,
      targetAudience:       p.targetAudience,
      learningObjectives:   p.learningObjectives,
      curriculum:           p.curriculum,
      whatIsIncluded:       p.whatIsIncluded,
      faqs:                 p.faqs,

      // Standalone instructor
      instructorName:        p.instructorName,
      instructorTitle:       p.instructorTitle,
      instructorBio:         p.instructorBio,
      instructorInitials:    p.instructorInitials,
      instructorCredentials: p.instructorCredentials,
    }))

    return NextResponse.json({ programs: payload })
  } catch (error) {
    console.error("[GET /api/programs/public]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
