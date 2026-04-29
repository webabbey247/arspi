import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { db } from "@/lib/db"
import { computeDurationHours } from "@/services/workshop.service"

/** GET /api/student/workshops — list workshop registrations for the logged-in student */
export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== "USER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const registrations = await db.workshopRegistration.findMany({
      where: {
        email: { equals: session.email, mode: "insensitive" },
      },
      include: {
        workshop: {
          select: {
            id:             true,
            title:          true,
            slug:           true,
            description:    true,
            category:       true,
            type:           true,
            fee:            true,
            date:           true,
            startTime:      true,
            endTime:        true,
            timezone:       true,
            level:          true,
            facilitator:    true,
            facilitators:   true,
            medium:         true,
            onlinePlatform: true,
            onlineLink:     true,
            venueAddress:   true,
            venueCity:      true,
            venueState:     true,
            venueCountry:   true,
            coverImage:     true,
            capacity:       true,
            registered:     true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const enriched = registrations.map(r => ({
      ...r,
      workshop: r.workshop
        ? { ...r.workshop, duration: computeDurationHours(r.workshop.startTime, r.workshop.endTime) }
        : r.workshop,
    }))

    return NextResponse.json({ registrations: enriched })
  } catch (error) {
    console.error("[GET /api/student/workshops]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
