import { NextResponse } from "next/server"
import { getCareers } from "@/services/career.service"

/** GET /api/careers/public — list published career postings */
export async function GET() {
  try {
    const careers = await getCareers({ status: "PUBLISHED" })

    const payload = careers.map(c => ({
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

    return NextResponse.json({ careers: payload })
  } catch (error) {
    console.error("[GET /api/careers/public]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
