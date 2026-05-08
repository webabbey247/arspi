import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createOrganization, getOrganizations } from "@/services/organization.service"
import { z } from "zod"

const createSchema = z.object({
  name:         z.string().min(1).max(255),
  logo:         z.string().min(1),
  url:          z.string().url().nullable().optional(),
  description:  z.string().nullable().optional(),
  displayOrder: z.number().int().min(0).optional(),
})

/** GET /api/organizations — list (admin only) */
export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const organizations = await getOrganizations()
    return NextResponse.json({ organizations })
  } catch (error) {
    console.error("[GET /api/organizations]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

/** POST /api/organizations — create (admin only) */
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

    const result = await createOrganization(parsed.data)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 409 })
    }

    return NextResponse.json({ organization: result.data }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/organizations]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
