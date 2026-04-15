import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { getAuthors, createAuthor } from "@/services/author.service"
import { z } from "zod"

const createSchema = z.object({
  name:     z.string().min(2).max(100),
  jobTitle: z.string().max(100).nullable().optional(),
  bio:      z.string().max(500).nullable().optional(),
  avatar:   z.string().check(z.url()).nullable().optional(),
})

/** GET /api/authors — list all authors (admin only) */
export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const authors = await getAuthors()
    return NextResponse.json({ authors })
  } catch (error) {
    console.error("[GET /api/authors]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

/** POST /api/authors — create an author (admin only) */
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

    const result = await createAuthor(parsed.data)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 409 })
    }

    return NextResponse.json({ author: result.data }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/authors]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
