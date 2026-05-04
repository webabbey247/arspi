import { NextResponse } from "next/server"
import { getPublicTeamData } from "@/services/team.service"

/** GET /api/team/public — all team members grouped by category */
export async function GET() {
  try {
    const grouped = await getPublicTeamData()
    return NextResponse.json({ team: grouped })
  } catch (error) {
    console.error("[GET /api/team/public]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
