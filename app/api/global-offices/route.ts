import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createGlobalOffice, getGlobalOffices, OfficeRegion } from "@/services/global-office.service"
import { z } from "zod"

const createSchema = z.object({
  city:         z.string().min(1).max(100),
  country:      z.string().min(1).max(100),
  region:       z.enum(["AFRICA", "AMERICAS", "ASIA", "EUROPE", "OCEANIA", "MIDDLE_EAST"]).optional(),
  addressLine1: z.string().min(1).max(255),
  addressLine2: z.string().nullable().optional(),
  postalCode:   z.string().nullable().optional(),
  phone:        z.string().nullable().optional(),
  email:        z.string().email().nullable().optional(),
  mapUrl:       z.string().url().nullable().optional(),
  coverImage:   z.string().nullable().optional(),
  displayOrder: z.number().int().min(0).optional(),
  active:       z.boolean().optional(),
})

/** GET /api/global-offices — list (admin only) */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = req.nextUrl
    const regionRaw = searchParams.get("region") ?? undefined

    const offices = await getGlobalOffices({
      ...(regionRaw && { region: regionRaw as OfficeRegion }),
    })

    return NextResponse.json({ offices })
  } catch (error) {
    console.error("[GET /api/global-offices]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

/** POST /api/global-offices (admin only) */
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

    const result = await createGlobalOffice(parsed.data)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 409 })
    }

    return NextResponse.json({ office: result.data }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/global-offices]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
