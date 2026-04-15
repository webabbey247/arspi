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
      date:        w.date ? w.date.toISOString() : null,
      time:        w.time,
      duration:    w.duration,
      facilitator: w.facilitator,
      capacity:    w.capacity,
      registered:  w.registered,
      coverImage:  w.coverImage,
    }))

    return NextResponse.json({ workshops: payload })
  } catch (error) {
    console.error("[GET /api/workshops/public]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
