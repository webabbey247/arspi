import { NextResponse } from "next/server"
import { getGlobalOffices } from "@/services/global-office.service"

/** GET /api/global-offices/public — public list (active only) */
export async function GET() {
  try {
    const offices = await getGlobalOffices({ activeOnly: true })
    return NextResponse.json({
      offices: offices.map(o => ({
        id:           o.id,
        city:         o.city,
        country:      o.country,
        region:       o.region,
        addressLine1: o.addressLine1,
        addressLine2: o.addressLine2,
        postalCode:   o.postalCode,
        phone:        o.phone,
        email:        o.email,
        mapUrl:       o.mapUrl,
        coverImage:   o.coverImage,
      })),
    })
  } catch (error) {
    console.error("[GET /api/global-offices/public]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
