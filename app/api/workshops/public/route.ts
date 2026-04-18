import { NextResponse } from "next/server"
import { getWorkshops } from "@/services/workshop.service"

/** GET /api/workshops/public — publicly accessible list of published workshops */
export async function GET() {
  try {
    const workshops = await getWorkshops({ published: true })

    // Serialise Dates to ISO strings for the client
    const payload = workshops.map(w => ({
      id:          w.id,
      title:       w.title,
      slug:        w.slug,
      description: w.description,
      type:        w.type,
      category:    w.category,
      fee:         w.fee,
      featured:    w.featured,
      date:           w.date ? w.date.toISOString() : null,
      startTime:      w.startTime,
      endTime:        w.endTime,
      timezone:       w.timezone,
      duration:       w.duration,
      level:          w.level,
      facilitator:    w.facilitator,
      medium:         w.medium,
      onlinePlatform: w.onlinePlatform,
      onlineLink:     w.onlineLink,
      venueAddress:   w.venueAddress,
      venueCity:      w.venueCity,
      venueState:     w.venueState,
      venueCountry:   w.venueCountry,
      capacity:       w.capacity,
      registered:     w._count?.registrations ?? 0,
      coverImage:     w.coverImage,
    }))

    return NextResponse.json({ workshops: payload })
  } catch (error) {
    console.error("[GET /api/workshops/public]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
