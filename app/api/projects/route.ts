import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import {
  createProject,
  getProjects,
  getProjectDivisions,
  getProjectDepartments,
  getProjectServiceList,
  slugify,
  ProjectStatus,
} from "@/services/project.service"
import { z } from "zod"

const personSchema = z.object({
  imageUrl: z.string().nullable().optional(),
  name:     z.string().min(1, "Name is required"),
  role:     z.string().nullable().optional(),
})

const createSchema = z.object({
  title:        z.string().min(3).max(255),
  slug:         z.string().min(2).max(255)
    .check(z.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens only"))
    .optional(),
  excerpt:      z.string().min(10),
  description:  z.string().min(10),
  coverImage:   z.string().nullable().optional(),
  status:       z.enum(["COMPLETE", "ACTIVE"]).optional(),
  client:       z.string().min(1),
  clientLogo:   z.string().nullable().optional(),
  startDate:    z.string().nullable().optional(),
  endDate:      z.string().nullable().optional(),
  displayOrder: z.number().int().min(0).optional(),
  divisionId:   z.string().nullable().optional(),
  departmentId: z.string().nullable().optional(),
  serviceIds:   z.array(z.string()).optional(),
  investigators: z.array(personSchema).min(1, "At least one project investigator is required"),
  members:       z.array(personSchema).optional(),
})

function toDate(v: string | null | undefined): Date | null | undefined {
  if (v === undefined) return undefined
  if (v === null || v === "") return null
  return new Date(v)
}

/** GET /api/projects — list projects + taxonomy bundles for the admin page (admin only)
 *
 *  Returns everything the admin Projects screen needs in a single round-trip:
 *  projects (with relations), divisions, departments and services lists with
 *  per-row project counts. Mirrors /api/projects/public but exposes the full
 *  ProjectRow shape (e.g. description) for the edit drawer.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = req.nextUrl
    const statusRaw = searchParams.get("status") ?? undefined

    const [projects, divisions, departments, services] = await Promise.all([
      getProjects({
        ...(statusRaw && { status: statusRaw as ProjectStatus }),
      }),
      getProjectDivisions(),
      getProjectDepartments(),
      getProjectServiceList(),
    ])

    return NextResponse.json({ projects, divisions, departments, services })
  } catch (error) {
    console.error("[GET /api/projects]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

/** POST /api/projects — create a project (admin only) */
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

    const result = await createProject({
      ...input,
      slug,
      startDate: toDate(input.startDate),
      endDate:   toDate(input.endDate),
    })
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 409 })
    }

    return NextResponse.json({ project: result.data }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/projects]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
