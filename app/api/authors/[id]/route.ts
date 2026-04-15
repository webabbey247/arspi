import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { getAuthorById, updateAuthor, deleteAuthor } from "@/services/author.service"
import { z } from "zod"

const updateSchema = z.object({
  name:     z.string().min(2).max(100).optional(),
  jobTitle: z.string().max(100).nullable().optional(),
  bio:      z.string().max(500).nullable().optional(),
  avatar:   z.string().check(z.url()).nullable().optional(),
})

type Context = { params: Promise<{ id: string }> }

/** GET /api/authors/[id] */
export async function GET(_req: NextRequest, { params }: Context) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const author  = await getAuthorById(id)
    if (!author) return NextResponse.json({ error: "Author not found." }, { status: 404 })

    return NextResponse.json({ author })
  } catch (error) {
    console.error("[GET /api/authors/[id]]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

/** PUT /api/authors/[id] */
export async function PUT(req: NextRequest, { params }: Context) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const body    = await req.json()
    const parsed  = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      )
    }

    const result = await updateAuthor(id, parsed.data)
    if (!result.success) {
      const status = result.error === "Author not found." ? 404 : 409
      return NextResponse.json({ error: result.error }, { status })
    }

    return NextResponse.json({ author: result.data })
  } catch (error) {
    console.error("[PUT /api/authors/[id]]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

/** DELETE /api/authors/[id] */
export async function DELETE(_req: NextRequest, { params }: Context) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const result  = await deleteAuthor(id)
    if (!result.success) {
      const status = result.error === "Author not found." ? 404 : 409
      return NextResponse.json({ error: result.error }, { status })
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[DELETE /api/authors/[id]]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
