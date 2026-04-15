import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { getWorkshopRegistrations } from "@/services/workshop.service"

type Context = { params: Promise<{ id: string }> }

/** GET /api/workshops/[id]/registrations — list registrations for a workshop (admin only) */
export async function GET(_req: NextRequest, { params }: Context) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id }      = await params
    const registrations = await getWorkshopRegistrations(id)

    return NextResponse.json({
      registrations: registrations.map(r => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error("[GET /api/workshops/[id]/registrations]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
