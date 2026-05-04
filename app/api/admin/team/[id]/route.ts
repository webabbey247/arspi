import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getSession } from "@/lib/session"
import { getTeamMemberById, updateTeamMember, deleteTeamMember } from "@/services/team.service"

const updateSchema = z.object({
  name:         z.string().min(2).max(255).optional(),
  position:     z.string().min(1).max(255).optional(),
  category:     z.enum(["EXECUTIVE_MANAGEMENT", "STAFF"]).optional(),
  coverImage:   z.string().nullable().optional(),
  description:  z.string().nullable().optional(),
  displayOrder: z.number().int().optional(),
})

/** GET /api/admin/team/[id] (admin only) */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const { id } = await ctx.params
    const member = await getTeamMemberById(id)
    if (!member) return NextResponse.json({ error: "Team member not found." }, { status: 404 })
    return NextResponse.json({ member })
  } catch (error) {
    console.error("[GET /api/admin/team/[id]]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

/** PUT /api/admin/team/[id] (admin only) */
export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const { id } = await ctx.params
    const body   = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      )
    }
    const result = await updateTeamMember(id, parsed.data)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 })
    }
    return NextResponse.json({ member: result.data })
  } catch (error) {
    console.error("[PUT /api/admin/team/[id]]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

/** DELETE /api/admin/team/[id] (admin only) */
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const { id } = await ctx.params
    const result = await deleteTeamMember(id)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 })
    }
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[DELETE /api/admin/team/[id]]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
