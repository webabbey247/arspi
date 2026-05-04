import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { getCareerDepartments, createCareerDepartment } from "@/services/career.service"

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const departments = await getCareerDepartments()
    return NextResponse.json({ departments })
  } catch (error) {
    console.error("[GET /api/admin/careers/departments]", error)
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
    const result = await createCareerDepartment(name.trim())
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 409 })
    }
    return NextResponse.json({ department: result.data }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/admin/careers/departments]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
