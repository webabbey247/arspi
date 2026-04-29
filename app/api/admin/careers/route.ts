import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import {
  createCareer,
  getCareers,
  slugify,
  CareerType,
  ExperienceLevel,
  CareerStatus,
} from "@/services/career.service"
import { z } from "zod"

const createSchema = z.object({
  title:           z.string().min(2).max(255),
  slug:            z
    .string()
    .min(2)
    .max(255)
    .check(z.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens only"))
    .optional(),
  department:      z.string().min(1).max(120),
  type:            z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "TEMPORARY"]).optional(),
  experienceLevel: z.enum(["ENTRY", "JUNIOR", "MID", "SENIOR", "LEAD", "EXECUTIVE"]).optional(),
  location:        z.string().min(1).max(120),
  remote:          z.boolean().optional(),
  salaryMin:       z.number().min(0).nullable().optional(),
  salaryMax:       z.number().min(0).nullable().optional(),
  currency:        z.string().max(10).optional(),
  description:     z.string().min(10),
  responsibilities: z.array(z.string()).nullable().optional(),
  requirements:    z.array(z.string()).nullable().optional(),
  benefits:        z.array(z.string()).nullable().optional(),
  applyEmail:      z.string().email().nullable().optional(),
  status:          z.enum(["PUBLISHED", "ARCHIVED"]).optional(),
  closingDate:     z.string().nullable().optional(),
})

/** GET /api/admin/careers — list careers (admin only) */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = req.nextUrl
    const status          = searchParams.get("status")
    const department      = searchParams.get("department")
    const type            = searchParams.get("type")
    const experienceLevel = searchParams.get("experienceLevel")
    const location        = searchParams.get("location")

    const careers = await getCareers({
      ...(status          && { status:          status          as CareerStatus }),
      ...(department      && { department }),
      ...(type            && { type:            type            as CareerType }),
      ...(experienceLevel && { experienceLevel: experienceLevel as ExperienceLevel }),
      ...(location        && { location }),
    })

    return NextResponse.json({ careers })
  } catch (error) {
    console.error("[GET /api/admin/careers]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

/** POST /api/admin/careers — create a new career posting (admin only) */
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

    const input = parsed.data
    const slug  = input.slug ?? slugify(input.title)

    const result = await createCareer({ ...input, slug })
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 409 })
    }

    return NextResponse.json({ career: result.data }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/admin/careers]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
