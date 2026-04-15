import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { getWorkshopById, updateWorkshop, deleteWorkshop, slugify } from "@/services/workshop.service"
import { z } from "zod"

const updateSchema = z.object({
  title:       z.string().min(2).max(255).optional(),
  slug:        z
    .string()
    .min(2)
    .max(255)
    .check(z.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens only"))
    .optional(),
  description: z.string().min(10).optional(),
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

type Context = { params: Promise<{ id: string }> }

/** GET /api/workshops/[id] — fetch a single workshop (admin only) */
export async function GET(_req: NextRequest, { params }: Context) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const workshop = await getWorkshopById(id)
    if (!workshop) {
      return NextResponse.json({ error: "Workshop not found." }, { status: 404 })
    }

    return NextResponse.json({ workshop })
  } catch (error) {
    console.error("[GET /api/workshops/[id]]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

/** PUT /api/workshops/[id] — update a workshop (admin only) */
export async function PUT(req: NextRequest, { params }: Context) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const body   = await req.json()
    const parsed = updateSchema.safeParse(body)
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

    const result = await updateWorkshop(id, input)
    if (!result.success) {
      const status = result.error === "Workshop not found." ? 404 : 409
      return NextResponse.json({ error: result.error }, { status })
    }

    return NextResponse.json({ workshop: result.data })
  } catch (error) {
    console.error("[PUT /api/workshops/[id]]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

/** DELETE /api/workshops/[id] — delete a workshop (admin only) */
export async function DELETE(_req: NextRequest, { params }: Context) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const result = await deleteWorkshop(id)
    if (!result.success) {
      const status = result.error === "Workshop not found." ? 404 : 409
      return NextResponse.json({ error: result.error }, { status })
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[DELETE /api/workshops/[id]]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
