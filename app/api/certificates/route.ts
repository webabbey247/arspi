import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { issueCertificate } from "@/services/certificate.service"
import { z } from "zod"

const issueSchema = z.object({
  userId:   z.string().min(1),
  courseId: z.string().min(1),
})

/** POST /api/certificates — manually issue a certificate for a completed enrollment (admin only) */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body   = await req.json()
    const parsed = issueSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      )
    }

    const result = await issueCertificate(parsed.data.userId, parsed.data.courseId)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      certificate: {
        id:         result.data.id,
        verifyCode: result.data.verifyCode,
        issuedAt:   result.data.issuedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error("[POST /api/certificates]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
