import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { getUserDetail, updateUser } from "@/services/user.service"
import { z } from "zod"

const patchSchema = z.object({
  role:   z.enum(["ADMIN", "INSTRUCTOR", "USER"]).optional(),
  status: z.enum(["ACTIVE", "DISABLED"]).optional(),
})

type Context = { params: Promise<{ id: string }> }

/** GET /api/admin/users/[id] — fetch full user detail (admin only) */
export async function GET(_req: NextRequest, { params }: Context) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const user   = await getUserDetail(id)
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 })
    }

    return NextResponse.json({ ...user, createdAt: user.createdAt.toISOString() })
  } catch (error) {
    console.error("[GET /api/admin/users/[id]]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

/** PATCH /api/admin/users/[id] — update role or status (admin only) */
export async function PATCH(req: NextRequest, { params }: Context) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const body   = await req.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      )
    }

    const result = await updateUser(id, parsed.data)
    if (!result.success) {
      const status = result.error === "User not found." ? 404 : 400
      return NextResponse.json({ error: result.error }, { status })
    }

    return NextResponse.json({ ...result.data, createdAt: result.data.createdAt.toISOString() })
  } catch (error) {
    console.error("[PATCH /api/admin/users/[id]]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
