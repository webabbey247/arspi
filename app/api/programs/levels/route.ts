import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { getProgramLevels, createProgramLevel } from "@/services/program-lookup.service"

/** GET /api/programs/levels — list all program levels (admin only) */
export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const levels = await getProgramLevels()
    return NextResponse.json({ levels })
  } catch (error) {
    console.error("[GET /api/programs/levels]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

/** POST /api/programs/levels — create a level (admin only) */
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

    const result = await createProgramLevel(name.trim())
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 409 })
    }

    return NextResponse.json({ level: result.data }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/programs/levels]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
