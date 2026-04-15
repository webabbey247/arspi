import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { getInsightById, updateInsight, deleteInsight, slugify } from "@/services/insight.service"
import { z } from "zod"

const updateSchema = z.object({
  title:      z.string().min(3).max(255).optional(),
  slug:       z
    .string()
    .min(2)
    .max(255)
    .check(z.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens only"))
    .optional(),
  excerpt:    z.string().min(10).max(500).optional(),
  body:       z.string().min(10).optional(),
  categoryId: z.string().nullable().optional(),
  authorId:   z.string().nullable().optional(),
  featured:   z.boolean().optional(),
  published:  z.boolean().optional(),
  readTime:   z.string().max(20).optional(),
  coverImage: z.string().nullable().optional(),
})

type Context = { params: Promise<{ id: string }> }

/** GET /api/insights/[id] — fetch a single insight (admin only) */
export async function GET(_req: NextRequest, { params }: Context) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const insight = await getInsightById(id)
    if (!insight) {
      return NextResponse.json({ error: "Insight not found." }, { status: 404 })
    }

    return NextResponse.json({ insight })
  } catch (error) {
    console.error("[GET /api/insights/[id]]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

/** PUT /api/insights/[id] — update an insight (admin only) */
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
    // Auto-derive slug from title if title changed but slug was not provided
    if (input.title && !input.slug) {
      input.slug = slugify(input.title)
    }

    const result = await updateInsight(id, input)
    if (!result.success) {
      const status = result.error === "Insight not found." ? 404 : 409
      return NextResponse.json({ error: result.error }, { status })
    }

    return NextResponse.json({ insight: result.data })
  } catch (error) {
    console.error("[PUT /api/insights/[id]]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

/** DELETE /api/insights/[id] — delete an insight (admin only) */
export async function DELETE(_req: NextRequest, { params }: Context) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const result = await deleteInsight(id)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 })
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[DELETE /api/insights/[id]]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
