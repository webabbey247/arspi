import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { getCareerApplications } from "@/services/career.application.service"

/** GET /api/admin/careers/[id]/applications?page=1&limit=20 — list applicants (admin only) */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await ctx.params

    const { searchParams } = req.nextUrl
    const page  = Math.max(1, Number(searchParams.get("page"))  || 1)
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20))
    const skip  = (page - 1) * limit

    const { items, total } = await getCareerApplications(id, { skip, take: limit })

    return NextResponse.json({
      applications: items,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    })
  } catch (error) {
    console.error("[GET /api/admin/careers/[id]/applications]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
