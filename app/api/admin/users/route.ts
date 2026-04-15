import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { getUsers } from "@/services/user.service"
import { Role, UserStatus } from "@prisma/client"

/** GET /api/admin/users — list all users (admin only) */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = req.nextUrl
    const role   = searchParams.get("role")   as Role       | null
    const status = searchParams.get("status") as UserStatus | null
    const search = searchParams.get("search") ?? undefined

    const users = await getUsers({
      role:   role   ?? undefined,
      status: status ?? undefined,
      search,
    })

    return NextResponse.json(
      users.map(u => ({ ...u, createdAt: u.createdAt.toISOString() }))
    )
  } catch (error) {
    console.error("[GET /api/admin/users]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
