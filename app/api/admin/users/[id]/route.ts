import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { getUserDetail, updateUser } from "@/services/user.service"
import { z } from "zod"

/** Status only. Changing a user's role from the dashboard is switched off: an
 *  admin could demote their own account (or the last admin) and lock
 *  themselves out with no way back in the UI. `.strict()` rejects a `role`
 *  field outright rather than silently ignoring it. */
const patchSchema = z.object({
  status: z.enum(["ACTIVE", "DISABLED"]).optional(),
}).strict()

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

/** PATCH /api/admin/users/[id] — update status (admin only). Role changes are disabled. */
export async function PATCH(req: NextRequest, { params }: Context) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const body   = await req.json()
    if (body && typeof body === "object" && "role" in body) {
      return NextResponse.json({ error: "Changing roles is disabled." }, { status: 403 })
    }
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
