import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { getProgramById, getProgramBySlug, getProgramEnrollments } from "@/services/program.service"
import { getCertificatesByProgram } from "@/services/certificate.service"

type Context = { params: Promise<{ id: string }> }

/** GET /api/programs/[id]/enrollments — list enrollments for a program (admin only) */
export async function GET(_req: NextRequest, { params }: Context) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id }  = await params
    const program = await getProgramBySlug(id) ?? await getProgramById(id)
    if (!program) {
      return NextResponse.json({ error: "Program not found." }, { status: 404 })
    }

    const [enrollments, certificates] = await Promise.all([
      getProgramEnrollments(program.id),
      getCertificatesByProgram(program.id),
    ])

    // Index certs by userId for O(1) lookup
    const certByUser = new Map(certificates.map(c => [c.userId, c]))

    return NextResponse.json({
      enrollments: enrollments.map(e => {
        const cert = certByUser.get(e.userId)
        return {
          ...e,
          enrolledAt:  e.enrolledAt.toISOString(),
          completedAt: e.completedAt?.toISOString() ?? null,
          certificate: cert
            ? { id: cert.id, verifyCode: cert.verifyCode, issuedAt: cert.issuedAt.toISOString() }
            : null,
        }
      }),
    })
  } catch (error) {
    console.error("[GET /api/programs/[id]/enrollments]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
