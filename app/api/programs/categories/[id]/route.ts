import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { updateProgramCategory, deleteProgramCategory } from "@/services/program.service"

type Context = { params: Promise<{ id: string }> }

/** PUT /api/programs/categories/[id] — update a category (admin only) */
export async function PUT(req: NextRequest, { params }: Context) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id }   = await params
    const { name } = await req.json()
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 })
    }

    const result = await updateProgramCategory(id, name.trim())
    if (!result.success) {
      const status = result.error === "Category not found." ? 404 : 409
      return NextResponse.json({ error: result.error }, { status })
    }

    return NextResponse.json({ category: result.data })
  } catch (error) {
    console.error("[PUT /api/programs/categories/[id]]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

/** DELETE /api/programs/categories/[id] — delete a category (admin only) */
export async function DELETE(_req: NextRequest, { params }: Context) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const result = await deleteProgramCategory(id)
    if (!result.success) {
      const status = result.error === "Category not found." ? 404 : 409
      return NextResponse.json({ error: result.error }, { status })
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[DELETE /api/programs/categories/[id]]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
