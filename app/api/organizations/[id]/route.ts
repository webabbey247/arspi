import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { getOrganizationById, updateOrganization, deleteOrganization } from "@/services/organization.service"
import { z } from "zod"

const updateSchema = z.object({
  name:         z.string().min(1).max(255).optional(),
  logo:         z.string().min(1).optional(),
  url:          z.string().url().nullable().optional(),
  description:  z.string().nullable().optional(),
  displayOrder: z.number().int().min(0).optional(),
})

type Context = { params: Promise<{ id: string }> }

/** GET /api/organizations/[id] (admin only) */
export async function GET(_req: NextRequest, { params }: Context) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id }       = await params
    const organization = await getOrganizationById(id)
    if (!organization) {
      return NextResponse.json({ error: "Organization not found." }, { status: 404 })
    }

    return NextResponse.json({ organization })
  } catch (error) {
    console.error("[GET /api/organizations/[id]]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

/** PUT /api/organizations/[id] (admin only) */
export async function PUT(req: NextRequest, { params }: Context) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const body   = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      )
    }

    const result = await updateOrganization(id, parsed.data)
    if (!result.success) {
      const status = result.error === "Organization not found." ? 404 : 409
      return NextResponse.json({ error: result.error }, { status })
    }

    return NextResponse.json({ organization: result.data })
  } catch (error) {
    console.error("[PUT /api/organizations/[id]]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

/** DELETE /api/organizations/[id] (admin only) */
export async function DELETE(_req: NextRequest, { params }: Context) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id }  = await params
    const result  = await deleteOrganization(id)
    if (!result.success) {
      const status = result.error === "Organization not found." ? 404 : 409
      return NextResponse.json({ error: result.error }, { status })
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[DELETE /api/organizations/[id]]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
