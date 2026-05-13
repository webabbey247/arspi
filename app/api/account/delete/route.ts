import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getSession } from "@/lib/session"
import { disableOwnAccount } from "@/services/profile.service"

export async function POST() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const result = await disableOwnAccount(session.sub)
    if (!result.success) {
      const status = result.error === "User not found." ? 404 : 400
      return NextResponse.json({ error: result.error }, { status })
    }

    const cookieStore = await cookies()
    cookieStore.delete("arspi-auth")

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[POST /api/account/delete]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
