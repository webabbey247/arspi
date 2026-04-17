import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { getProgramById, updateProgram, deleteProgram, slugify } from "@/services/program.service"
import { z } from "zod"

const updateSchema = z.object({
  title:        z.string().min(3).max(255).optional(),
  slug:         z
    .string().min(2).max(255)
    .check(z.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens only"))
    .optional(),
  description:  z.string().min(10).optional(),
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
    week:   z.string(),
    title:  z.string(),
    desc:   z.string(),
    topics: z.array(z.string()),
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

type Context = { params: Promise<{ id: string }> }

/** GET /api/programs/[id] — fetch a single program (admin only) */
export async function GET(_req: NextRequest, { params }: Context) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const program = await getProgramById(id)
    if (!program) {
      return NextResponse.json({ error: "Program not found." }, { status: 404 })
    }

    return NextResponse.json({ program })
  } catch (error) {
    console.error("[GET /api/programs/[id]]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

/** PUT /api/programs/[id] — update a program (admin only) */
export async function PUT(req: NextRequest, { params }: Context) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id }  = await params
    const body    = await req.json()
    const parsed  = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      )
    }

    const input = parsed.data
    if (input.title && !input.slug) {
      input.slug = slugify(input.title)
    }

    const result = await updateProgram(id, input)
    if (!result.success) {
      const status = result.error === "Program not found." ? 404 : 409
      return NextResponse.json({ error: result.error }, { status })
    }

    return NextResponse.json({ program: result.data })
  } catch (error) {
    console.error("[PUT /api/programs/[id]]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

/** DELETE /api/programs/[id] — delete a program (admin only) */
export async function DELETE(_req: NextRequest, { params }: Context) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id }  = await params
    const result  = await deleteProgram(id)
    if (!result.success) {
      const status = result.error === "Program not found." ? 404 : 409
      return NextResponse.json({ error: result.error }, { status })
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[DELETE /api/programs/[id]]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
