import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { getProgramCategories, createProgramCategory } from "@/services/program.service"

/** GET /api/programs/categories — list all categories (admin only) */
export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const categories = await getProgramCategories()
    return NextResponse.json({ categories })
  } catch (error) {
    console.error("[GET /api/programs/categories]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

/** POST /api/programs/categories — create a category (admin only) */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { name } = await req.json()
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 })
    }

    const result = await createProgramCategory(name.trim())
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 409 })
    }

    return NextResponse.json({ category: result.data }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/programs/categories]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
