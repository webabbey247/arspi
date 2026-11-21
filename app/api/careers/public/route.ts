import { NextResponse } from "next/server"
import { unstable_cache } from "next/cache"
import { getCareers } from "@/services/career.service"
import { isCareerClosed } from "@/lib/career-closing"
import { CAREERS_PUBLIC_TAG, PUBLIC_REVALIDATE_SECONDS } from "@/lib/public-cache"

/** The finished public payload, cached under CAREERS_PUBLIC_TAG (cleared on
 *  any career posting write). The mapping happens inside the cache because
 *  cached values come back JSON-serialised — Date objects become strings. */
const getPublicCareers = unstable_cache(async () => {
  const careers = await getCareers({ status: "PUBLISHED" })
  return careers.map(c => ({
    id:              c.id,
    title:           c.title,
    slug:            c.slug,
    department:      c.department,
    type:            c.type,
    experienceLevel: c.experienceLevel,
    location:        c.location,
    remote:          c.remote,
    salaryMin:       c.salaryMin,
    salaryMax:       c.salaryMax,
    currency:        c.currency,
    description:     c.description,
    responsibilities: c.responsibilities,
    requirements:    c.requirements,
    benefits:        c.benefits,
    applyEmail:      c.applyEmail,
    closingDate:     c.closingDate ? c.closingDate.toISOString() : null,
    createdAt:       c.createdAt.toISOString(),
  }))
}, ["careers-public"], { tags: [CAREERS_PUBLIC_TAG], revalidate: PUBLIC_REVALIDATE_SECONDS })

/** GET /api/careers/public — list published career postings */
export async function GET() {
  try {
    // Filtered per request, outside the cache, so a posting drops off as soon
    // as its closing date passes rather than when the cache next refreshes.
    const careers = (await getPublicCareers()).filter(c => !isCareerClosed(c.closingDate))
    return NextResponse.json({ careers })
  } catch (error) {
    console.error("[GET /api/careers/public]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
