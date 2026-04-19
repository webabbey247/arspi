import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createProgram, getPrograms, slugify, CourseLevel } from "@/services/program.service"
import { z } from "zod"

const createSchema = z.object({
  title:        z.string().min(3).max(255),
  slug:         z
    .string().min(2).max(255)
    .check(z.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens only"))
    .optional(),
  description:  z.string().min(10),
  thumbnail:    z.string().nullable().optional(),
  price:        z.number().min(0).optional(),
  level:        z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
  featured:     z.boolean().optional(),
  published:    z.boolean().optional(),
  categoryId:   z.string().nullable().optional(),

  // Extended programme details
  tagline:              z.string().nullable().optional(),
  duration:             z.string().nullable().optional(),
  format:               z.string().nullable().optional(),
  startDate:            z.string().nullable().optional(),
  endDate:              z.string().nullable().optional(),
  cohortSize:           z.number().int().positive().nullable().optional(),
  rating:               z.number().min(0).max(5).nullable().optional(),
  reviewCount:          z.number().int().min(0).nullable().optional(),
  enrolledCount:        z.number().int().min(0).nullable().optional(),
  countriesCount:       z.number().int().min(0).nullable().optional(),

  // Rich content (JSON)
  overview:             z.string().nullable().optional(),
  targetAudience:       z.array(z.string()).nullable().optional(),
  learningObjectives:   z.array(z.string()).nullable().optional(),
  curriculum:           z.array(z.object({
    week:           z.string().optional(),
    title:          z.string(),
    desc:           z.string().nullable().optional(),
    isAssessment:   z.boolean().optional(),
    assessmentLink: z.string().nullable().optional(),
    lessons: z.array(z.object({
      title:         z.string(),
      description:   z.string().nullable().optional(),
      embedUrls:     z.array(z.string()).optional(),
      referenceUrls: z.array(z.string()).optional(),
    })).optional(),
  })).nullable().optional(),
  whatIsIncluded:       z.array(z.string()).nullable().optional(),
  faqs:                 z.array(z.object({ q: z.string(), a: z.string() })).nullable().optional(),

  // Standalone instructor
  instructorName:        z.string().nullable().optional(),
  instructorTitle:       z.string().nullable().optional(),
  instructorBio:         z.string().nullable().optional(),
  instructorInitials:    z.string().max(4).nullable().optional(),
  instructorCredentials: z.array(z.string()).nullable().optional(),
})

/** GET /api/programs — list all programs (admin only) */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = req.nextUrl
    const categoryId   = searchParams.get("categoryId")  ?? undefined
    const levelRaw     = searchParams.get("level")        ?? undefined
    const publishedRaw = searchParams.get("published")
    const featuredRaw  = searchParams.get("featured")

    const programs = await getPrograms({
      ...(categoryId                   && { categoryId }),
      ...(levelRaw                     && { level: levelRaw as CourseLevel }),
      ...(publishedRaw !== null        && { published: publishedRaw === "true" }),
      ...(featuredRaw  !== null        && { featured:  featuredRaw  === "true" }),
    })

    return NextResponse.json({ programs })
  } catch (error) {
    console.error("[GET /api/programs]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

/** POST /api/programs — create a new program (admin only) */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body   = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      )
    }

    const input = parsed.data
    const slug  = input.slug ?? slugify(input.title)

    const result = await createProgram({ ...input, slug }, session.sub)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 409 })
    }

    return NextResponse.json({ program: result.data }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/programs]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
