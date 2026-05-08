import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { getProgramPricings, createProgramPricing } from "@/services/program-lookup.service"

/** GET /api/programs/pricing — list all pricing options (admin only) */
export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const pricing = await getProgramPricings()
    return NextResponse.json({ pricing })
  } catch (error) {
    console.error("[GET /api/programs/pricing]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

/** POST /api/programs/pricing — create a pricing option (admin only) */
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

    const result = await createProgramPricing(name.trim())
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 409 })
    }

    return NextResponse.json({ pricing: result.data }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/programs/pricing]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
