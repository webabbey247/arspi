import { NextResponse } from "next/server"
import { getOrganizations } from "@/services/organization.service"

/** GET /api/organizations/public — public list */
export async function GET() {
  try {
    const organizations = await getOrganizations()
    return NextResponse.json({
      organizations: organizations.map(o => ({
        id:          o.id,
        name:        o.name,
        logo:        o.logo,
        url:         o.url,
        description: o.description,
      })),
    })
  } catch (error) {
    console.error("[GET /api/organizations/public]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
