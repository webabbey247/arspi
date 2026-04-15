import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { updateInsightCategory, deleteInsightCategory } from "@/services/insight.service"
import { z } from "zod"

const updateSchema = z.object({
  name: z.string().min(2).max(50),
})

type Context = { params: Promise<{ id: string }> }

/** PUT /api/insights/categories/[id] — rename a category (admin only) */
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

    const result = await updateInsightCategory(id, parsed.data.name)
    if (!result.success) {
      const status = result.error === "Category not found." ? 404 : 409
      return NextResponse.json({ error: result.error }, { status })
    }

    return NextResponse.json({ category: result.data })
  } catch (error) {
    console.error("[PUT /api/insights/categories/[id]]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

/** DELETE /api/insights/categories/[id] — delete a category (admin only) */
export async function DELETE(_req: NextRequest, { params }: Context) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const result = await deleteInsightCategory(id)
    if (!result.success) {
      const status = result.error === "Category not found." ? 404 : 409
      return NextResponse.json({ error: result.error }, { status })
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[DELETE /api/insights/categories/[id]]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
