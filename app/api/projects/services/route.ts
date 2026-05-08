import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { getProjectServiceList, createProjectService } from "@/services/project.service"

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const services = await getProjectServiceList()
    return NextResponse.json({ services })
  } catch (error) {
    console.error("[GET /api/projects/services]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

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
    const result = await createProjectService(name.trim())
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 409 })
    return NextResponse.json({ service: result.data }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/projects/services]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
