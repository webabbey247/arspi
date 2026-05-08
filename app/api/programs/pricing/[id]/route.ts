import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { updateProgramPricing, deleteProgramPricing } from "@/services/program-lookup.service"

type Context = { params: Promise<{ id: string }> }

/** PUT /api/programs/pricing/[id] — update a pricing option (admin only) */
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

    const result = await updateProgramPricing(id, name.trim())
    if (!result.success) {
      const status = result.error === "Pricing option not found." ? 404 : 409
      return NextResponse.json({ error: result.error }, { status })
    }

    return NextResponse.json({ pricing: result.data })
  } catch (error) {
    console.error("[PUT /api/programs/pricing/[id]]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

/** DELETE /api/programs/pricing/[id] — delete a pricing option (admin only) */
export async function DELETE(_req: NextRequest, { params }: Context) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const result = await deleteProgramPricing(id)
    if (!result.success) {
      const status = result.error === "Pricing option not found." ? 404 : 409
      return NextResponse.json({ error: result.error }, { status })
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[DELETE /api/programs/pricing/[id]]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
