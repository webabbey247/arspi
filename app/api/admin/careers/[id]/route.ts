import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import {
  getCareerById,
  updateCareer,
  deleteCareer,
  toggleCareerStatus,
} from "@/services/career.service"
import { z } from "zod"

const updateSchema = z.object({
  title:           z.string().min(2).max(255).optional(),
  slug:            z
    .string()
    .min(2)
    .max(255)
    .check(z.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens only"))
    .optional(),
  department:      z.string().min(1).max(120).optional(),
  type:            z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "TEMPORARY"]).optional(),
  experienceLevel: z.enum(["ENTRY", "JUNIOR", "MID", "SENIOR", "LEAD", "EXECUTIVE"]).optional(),
  location:        z.string().min(1).max(120).optional(),
  remote:          z.boolean().optional(),
  salaryMin:       z.number().min(0).nullable().optional(),
  salaryMax:       z.number().min(0).nullable().optional(),
  currency:        z.string().max(10).optional(),
  description:     z.string().min(10).optional(),
  responsibilities: z.array(z.string()).nullable().optional(),
  requirements:    z.array(z.string()).nullable().optional(),
  benefits:        z.array(z.string()).nullable().optional(),
  applyEmail:      z.string().email().nullable().optional(),
  status:          z.enum(["PUBLISHED", "ARCHIVED"]).optional(),
  closingDate:     z.string().nullable().optional(),
  toggleStatus:    z.boolean().optional(),
})

/** GET /api/admin/careers/[id] — fetch a single career posting (admin only) */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await ctx.params
    const career = await getCareerById(id)
    if (!career) return NextResponse.json({ error: "Career posting not found." }, { status: 404 })

    return NextResponse.json({ career })
  } catch (error) {
    console.error("[GET /api/admin/careers/[id]]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

/** PUT /api/admin/careers/[id] — update a career posting (admin only) */
export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await ctx.params
    const body   = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      )
    }

    if (parsed.data.toggleStatus) {
      const result = await toggleCareerStatus(id)
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 404 })
      }
      return NextResponse.json({ career: result.data })
    }

    const { toggleStatus: _toggle, ...input } = parsed.data
    void _toggle
    const result = await updateCareer(id, input)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 409 })
    }

    return NextResponse.json({ career: result.data })
  } catch (error) {
    console.error("[PUT /api/admin/careers/[id]]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

/** DELETE /api/admin/careers/[id] — delete a career posting (admin only) */
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await ctx.params
    const result = await deleteCareer(id)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 })
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[DELETE /api/admin/careers/[id]]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
