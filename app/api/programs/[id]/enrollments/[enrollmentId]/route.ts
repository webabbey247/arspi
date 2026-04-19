import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { db } from "@/lib/db"
import { issueCertificate } from "@/services/certificate.service"
import { z } from "zod"

const patchSchema = z.object({
  status: z.enum(["ACTIVE", "COMPLETED", "DROPPED"]),
})

type Context = { params: Promise<{ id: string; enrollmentId: string }> }

/** PATCH /api/programs/[id]/enrollments/[enrollmentId]
 *  Update enrollment status. When status → COMPLETED, auto-issues a certificate.
 */
export async function PATCH(req: NextRequest, { params }: Context) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { enrollmentId } = await params
    const body   = await req.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      )
    }

    const enrollment = await db.enrollment.findUnique({ where: { id: enrollmentId } })
    if (!enrollment) {
      return NextResponse.json({ error: "Enrollment not found." }, { status: 404 })
    }

    const { status } = parsed.data
    const updatedEnrollment = await db.enrollment.update({
      where: { id: enrollmentId },
      data: {
        status,
        completedAt: status === "COMPLETED" ? new Date() : null,
      },
    })

    // Auto-issue certificate when marked complete
    let certificate = null
    if (status === "COMPLETED") {
      const result = await issueCertificate(enrollment.userId, enrollment.courseId)
      if (result.success) {
        certificate = {
          id:         result.data.id,
          verifyCode: result.data.verifyCode,
          issuedAt:   result.data.issuedAt.toISOString(),
        }
      }
    }

    return NextResponse.json({
      enrollment: {
        ...updatedEnrollment,
        enrolledAt:  updatedEnrollment.enrolledAt.toISOString(),
        completedAt: updatedEnrollment.completedAt?.toISOString() ?? null,
      },
      certificate,
    })
  } catch (error) {
    console.error("[PATCH /api/programs/[id]/enrollments/[enrollmentId]]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
