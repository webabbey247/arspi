import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createWorkshop, getWorkshops, slugify, WorkshopCategory, WorkshopType } from "@/services/workshop.service"
import { z } from "zod"

const createSchema = z.object({
  title:       z.string().min(2).max(255),
  slug:        z.string().min(2).max(255)
    .check(z.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens only"))
    .optional(),
  description: z.string().min(10),
  type:        z.enum(["FREE", "PAID"]).optional(),
  category:    z.enum(["SHORT_COURSE", "WEBINAR", "MASTERCLASS", "CONFERENCE", "WORKSHOP"]).optional(),
  fee:         z.number().min(0).optional(),
  featured:    z.boolean().optional(),
  published:   z.boolean().optional(),
  date:        z.string().nullable().optional(),
  time:        z.string().max(20).optional(),
  duration:    z.string().max(50).optional(),
  facilitator: z.string().max(255).optional(),
  capacity:    z.number().int().positive().optional(),
  coverImage:  z.string().nullable().optional(),
})

/** GET /api/instructor/workshops — list workshops belonging to the logged-in instructor */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "INSTRUCTOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = req.nextUrl
    const typeRaw      = searchParams.get("type")
    const categoryRaw  = searchParams.get("category")
    const publishedRaw = searchParams.get("published")
    const featuredRaw  = searchParams.get("featured")

    const workshops = await getWorkshops({
      instructorId: session.sub,
      ...(typeRaw      && { type:      typeRaw     as WorkshopType }),
      ...(categoryRaw  && { category:  categoryRaw as WorkshopCategory }),
      ...(publishedRaw !== null && { published: publishedRaw === "true" }),
      ...(featuredRaw  !== null && { featured:  featuredRaw  === "true" }),
    })

    return NextResponse.json({ workshops })
  } catch (error) {
    console.error("[GET /api/instructor/workshops]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

/** POST /api/instructor/workshops — create a workshop owned by the instructor */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "INSTRUCTOR") {
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

    const result = await createWorkshop({ ...input, slug, instructorId: session.sub })
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 409 })
    }

    return NextResponse.json({ workshop: result.data }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/instructor/workshops]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
