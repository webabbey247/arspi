import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getSession } from "@/lib/session"
import { createTeamMember, getTeamMembers, type TeamCategory } from "@/services/team.service"

const createSchema = z.object({
  name:         z.string().min(2).max(255),
  position:     z.string().min(1).max(255),
  category:     z.enum(["EXECUTIVE_MANAGEMENT", "STAFF"]).optional(),
  coverImage:   z.string().nullable().optional(),
  description:  z.string().nullable().optional(),
  displayOrder: z.number().int().optional(),
})

/** GET /api/admin/team?page=1&limit=20&category=STAFF — paginated list (admin only) */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = req.nextUrl
    const page     = Math.max(1, Number(searchParams.get("page")) || 1)
    const limit    = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20))
    const category = (searchParams.get("category") as TeamCategory | null) || undefined

    const skip = (page - 1) * limit
    const { items, total } = await getTeamMembers({ skip, take: limit, category })

    return NextResponse.json({
      members: items,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    })
  } catch (error) {
    console.error("[GET /api/admin/team]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

/** POST /api/admin/team — create a team member (admin only) */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body   = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      )
    }

    const result = await createTeamMember(parsed.data)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    return NextResponse.json({ member: result.data }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/admin/team]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
