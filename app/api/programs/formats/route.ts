import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { getProgramFormats, createProgramFormat } from "@/services/program-lookup.service"

/** GET /api/programs/formats — list all program formats (admin only) */
export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const formats = await getProgramFormats()
    return NextResponse.json({ formats })
  } catch (error) {
    console.error("[GET /api/programs/formats]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

/** POST /api/programs/formats — create a format (admin only) */
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

    const result = await createProgramFormat(name.trim())
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 409 })
    }

    return NextResponse.json({ format: result.data }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/programs/formats]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
