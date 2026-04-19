import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { getProgramById, getProgramBySlug, updateProgram, deleteProgram, slugify } from "@/services/program.service"
import { z } from "zod"

const updateSchema = z.object({
  title:        z.string().min(3).max(255).optional(),
  slug:         z.string().min(2).max(255)
    .check(z.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens only"))
    .optional(),
  description:  z.string().min(10).optional(),
  thumbnail:    z.string().nullable().optional(),
  price:        z.number().min(0).optional(),
  level:        z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
  featured:     z.boolean().optional(),
  published:    z.boolean().optional(),
  categoryId:   z.string().nullable().optional(),
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
  instructorName:        z.string().nullable().optional(),
  instructorTitle:       z.string().nullable().optional(),
  instructorBio:         z.string().nullable().optional(),
  instructorInitials:    z.string().max(4).nullable().optional(),
  instructorCredentials: z.array(z.string()).nullable().optional(),
})

type Context = { params: Promise<{ id: string }> }

async function assertOwnership(id: string, instructorId: string) {
  const program = await getProgramBySlug(id) ?? await getProgramById(id)
  if (!program) return { ok: false as const, status: 404, error: "Program not found." }
  if (program.instructorId !== instructorId) return { ok: false as const, status: 403, error: "Forbidden" }
  return { ok: true as const, program }
}

/** GET /api/instructor/programs/[id] */
export async function GET(_req: NextRequest, { params }: Context) {
  try {
    const session = await getSession()
    if (!session || session.role !== "INSTRUCTOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const { id } = await params
    const check  = await assertOwnership(id, session.sub)
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status })
    return NextResponse.json({ program: check.program })
  } catch (error) {
    console.error("[GET /api/instructor/programs/[id]]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

/** PUT /api/instructor/programs/[id] */
export async function PUT(req: NextRequest, { params }: Context) {
  try {
    const session = await getSession()
    if (!session || session.role !== "INSTRUCTOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const { id }  = await params
    const check   = await assertOwnership(id, session.sub)
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status })

    const body   = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      )
    }

    const input = parsed.data
    if (input.title && !input.slug) input.slug = slugify(input.title)

    const result = await updateProgram(id, input)
    if (!result.success) {
      const status = result.error === "Program not found." ? 404 : 409
      return NextResponse.json({ error: result.error }, { status })
    }
    return NextResponse.json({ program: result.data })
  } catch (error) {
    console.error("[PUT /api/instructor/programs/[id]]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

/** DELETE /api/instructor/programs/[id] */
export async function DELETE(_req: NextRequest, { params }: Context) {
  try {
    const session = await getSession()
    if (!session || session.role !== "INSTRUCTOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const { id } = await params
    const check  = await assertOwnership(id, session.sub)
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status })

    const result = await deleteProgram(id)
    if (!result.success) {
      const status = result.error === "Program not found." ? 404 : 409
      return NextResponse.json({ error: result.error }, { status })
    }
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[DELETE /api/instructor/programs/[id]]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
