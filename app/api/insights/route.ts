import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createInsight, getInsights, slugify } from "@/services/insight.service"
import { z } from "zod"

const createSchema = z.object({
  title:      z.string().min(3).max(255),
  slug:       z
    .string()
    .min(2)
    .max(255)
    .check(z.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens only"))
    .optional(),
  excerpt:    z.string().min(10).max(500),
  body:       z.string().min(10),
  categoryId: z.string().nullable().optional(),
  authorId:   z.string().nullable().optional(),
  featured:   z.boolean().optional(),
  published:  z.boolean().optional(),
  readTime:   z.string().max(20).optional(),
  coverImage: z.string().nullable().optional(),
})

/** GET /api/insights — list all insights (admin only) */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = req.nextUrl
    const categoryId   = searchParams.get("categoryId") ?? undefined
    const publishedRaw = searchParams.get("published")

    const insights = await getInsights({
      ...(categoryId            && { categoryId }),
      ...(publishedRaw !== null && { published: publishedRaw === "true" }),
    })

    return NextResponse.json({ insights })
  } catch (error) {
    console.error("[GET /api/insights]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

/** POST /api/insights — create a new insight (admin only) */
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

    const result = await createInsight({ ...input, slug }, session.sub)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 409 })
    }

    return NextResponse.json({ insight: result.data }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/insights]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
