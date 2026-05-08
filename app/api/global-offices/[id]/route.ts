import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { getGlobalOfficeById, updateGlobalOffice, deleteGlobalOffice } from "@/services/global-office.service"
import { z } from "zod"

const updateSchema = z.object({
  city:         z.string().min(1).max(100).optional(),
  country:      z.string().min(1).max(100).optional(),
  region:       z.enum(["AFRICA", "AMERICAS", "ASIA", "EUROPE", "OCEANIA", "MIDDLE_EAST"]).optional(),
  addressLine1: z.string().min(1).max(255).optional(),
  addressLine2: z.string().nullable().optional(),
  postalCode:   z.string().nullable().optional(),
  phone:        z.string().nullable().optional(),
  email:        z.string().email().nullable().optional(),
  mapUrl:       z.string().url().nullable().optional(),
  coverImage:   z.string().nullable().optional(),
  displayOrder: z.number().int().min(0).optional(),
  active:       z.boolean().optional(),
})

type Context = { params: Promise<{ id: string }> }

/** GET /api/global-offices/[id] (admin only) */
export async function GET(_req: NextRequest, { params }: Context) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id }  = await params
    const office  = await getGlobalOfficeById(id)
    if (!office) return NextResponse.json({ error: "Office not found." }, { status: 404 })

    return NextResponse.json({ office })
  } catch (error) {
    console.error("[GET /api/global-offices/[id]]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

/** PUT /api/global-offices/[id] (admin only) */
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

    const result = await updateGlobalOffice(id, parsed.data)
    if (!result.success) {
      const status = result.error === "Office not found." ? 404 : 409
      return NextResponse.json({ error: result.error }, { status })
    }

    return NextResponse.json({ office: result.data })
  } catch (error) {
    console.error("[PUT /api/global-offices/[id]]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

/** DELETE /api/global-offices/[id] (admin only) */
export async function DELETE(_req: NextRequest, { params }: Context) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id }  = await params
    const result  = await deleteGlobalOffice(id)
    if (!result.success) {
      const status = result.error === "Office not found." ? 404 : 409
      return NextResponse.json({ error: result.error }, { status })
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[DELETE /api/global-offices/[id]]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
