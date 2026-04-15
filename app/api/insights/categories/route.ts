import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { getInsightCategories, createInsightCategory } from "@/services/insight.service"
import { z } from "zod"

const createSchema = z.object({
  name: z.string().min(2).max(50),
})

/** GET /api/insights/categories — list all categories (admin only) */
export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const categories = await getInsightCategories()
    return NextResponse.json({ categories })
  } catch (error) {
    console.error("[GET /api/insights/categories]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

/** POST /api/insights/categories — create a category (admin only) */
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

    const result = await createInsightCategory(parsed.data.name)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 409 })
    }

    return NextResponse.json({ category: result.data }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/insights/categories]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
