import { NextResponse } from "next/server"
import { unstable_cache } from "next/cache"
import { getPublicTeamData } from "@/services/team.service"
import { PUBLIC_REVALIDATE_SECONDS, TEAM_PUBLIC_TAG } from "@/lib/public-cache"

/** Cached under TEAM_PUBLIC_TAG, cleared on any team member write. */
const getCachedTeam = unstable_cache(() => getPublicTeamData(), ["team-public"], {
  tags: [TEAM_PUBLIC_TAG], revalidate: PUBLIC_REVALIDATE_SECONDS,
})

/** GET /api/team/public — all team members grouped by category */
export async function GET() {
  try {
    const grouped = await getCachedTeam()
    return NextResponse.json({ team: grouped })
  } catch (error) {
    console.error("[GET /api/team/public]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
