import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { getProjectById, getProjectBySlug, updateProject, deleteProject, slugify } from "@/services/project.service"
import { z } from "zod"

const updateSchema = z.object({
  title:        z.string().min(3).max(255).optional(),
  slug:         z.string().min(2).max(255)
    .check(z.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens only"))
    .optional(),
  excerpt:      z.string().min(10).optional(),
  description:  z.string().min(10).optional(),
  coverImage:   z.string().nullable().optional(),
  status:       z.enum(["COMPLETE", "ACTIVE"]).optional(),
  client:       z.string().min(1).optional(),
  clientLogo:   z.string().nullable().optional(),
  startDate:    z.string().nullable().optional(),
  endDate:      z.string().nullable().optional(),
  displayOrder: z.number().int().min(0).optional(),
  divisionId:   z.string().nullable().optional(),
  departmentId: z.string().nullable().optional(),
  serviceIds:   z.array(z.string()).optional(),
  investigators: z.array(z.object({
    imageUrl: z.string().nullable().optional(),
    name:     z.string().min(1, "Name is required"),
    role:     z.string().nullable().optional(),
  })).min(1, "At least one project investigator is required").optional(),
  members:       z.array(z.object({
    imageUrl: z.string().nullable().optional(),
    name:     z.string().min(1, "Name is required"),
    role:     z.string().nullable().optional(),
  })).optional(),
})

function toDate(v: string | null | undefined): Date | null | undefined {
  if (v === undefined) return undefined
  if (v === null || v === "") return null
  return new Date(v)
}

type Context = { params: Promise<{ id: string }> }

/** GET /api/projects/[id] — fetch single project (admin only) */
export async function GET(_req: NextRequest, { params }: Context) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id }  = await params
    const project = await getProjectBySlug(id) ?? await getProjectById(id)
    if (!project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 })
    }

    return NextResponse.json({ project })
  } catch (error) {
    console.error("[GET /api/projects/[id]]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

/** PUT /api/projects/[id] (admin only) */
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
    if (input.title && !input.slug) input.slug = slugify(input.title)

    const result = await updateProject(id, {
      ...input,
      startDate: toDate(input.startDate),
      endDate:   toDate(input.endDate),
    })
    if (!result.success) {
      const status = result.error === "Project not found." ? 404 : 409
      return NextResponse.json({ error: result.error }, { status })
    }

    return NextResponse.json({ project: result.data })
  } catch (error) {
    console.error("[PUT /api/projects/[id]]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

/** DELETE /api/projects/[id] (admin only) */
export async function DELETE(_req: NextRequest, { params }: Context) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id }  = await params
    const result  = await deleteProject(id)
    if (!result.success) {
      const status = result.error === "Project not found." ? 404 : 409
      return NextResponse.json({ error: result.error }, { status })
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[DELETE /api/projects/[id]]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
