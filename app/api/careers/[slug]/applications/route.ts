import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getCareerBySlug } from "@/services/career.service"
import { createCareerApplication } from "@/services/career.application.service"

const schema = z.object({
  fullName:       z.string().min(2).max(255),
  email:          z.string().email(),
  mobile:         z.string().min(5).max(40),
  country:        z.string().min(2).max(120),
  resumeUrl:      z.string().url(),
  coverLetterUrl: z.string().url().nullable().optional(),
  linkedinUrl:    z.string().url().nullable().optional(),
  source:         z.string().max(120).nullable().optional(),
})

/** POST /api/careers/[slug]/applications — submit an application for a public career posting */
export async function POST(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await ctx.params

    const career = await getCareerBySlug(slug)
    if (!career || career.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Career posting not found." }, { status: 404 })
    }

    const body   = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      )
    }

    const result = await createCareerApplication({ ...parsed.data, careerId: career.id })
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ application: result.data }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/careers/[slug]/applications]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
