import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getSession } from "@/lib/session"
import { getAccountProfile, updateAccountProfile } from "@/services/profile.service"

const nullableTrimmed = z
  .string()
  .max(255)
  .transform(v => v.trim() === "" ? null : v.trim())
  .nullable()
  .optional()

const updateSchema = z.object({
  firstName:    z.string().min(1, "First name is required").max(50).optional(),
  lastName:     z.string().min(1, "Last name is required").max(50).optional(),
  avatar:       z.string().url("Invalid avatar URL").nullable().optional(),
  bio:          z.string().max(500, "Max 500 characters").nullable().optional(),
  phone:        nullableTrimmed,
  country:      nullableTrimmed,
  jobTitle:     nullableTrimmed,
  organisation: nullableTrimmed,
  addressLine1: nullableTrimmed,
  addressLine2: nullableTrimmed,
  city:         nullableTrimmed,
  state:        nullableTrimmed,
  postalCode:   nullableTrimmed,
  dateOfBirth: z.preprocess(
    v => {
      if (v === null || v === undefined) return v
      if (typeof v !== "string") return v
      const trimmed = v.trim()
      if (trimmed === "") return null
      const d = new Date(trimmed)
      return isNaN(d.getTime()) ? undefined : d
    },
    z.date().nullable().optional(),
  ),
  language:     nullableTrimmed,
  timezone:     nullableTrimmed,
  emailOptIn:   z.boolean().optional(),
})

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const profile = await getAccountProfile(session.sub)
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 })

  return NextResponse.json(profile)
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body   = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      )
    }

    const result = await updateAccountProfile(session.sub, parsed.data)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error("[PATCH /api/account/profile]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
