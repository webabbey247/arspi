import { NextResponse } from "next/server"
import { requireApiRole } from "@/lib/guard"
import { getCertificatesByUser } from "@/services/certificate.service"

/** GET /api/student/certificates — the logged-in student's own certificates. */
export async function GET() {
  try {
    const guard = await requireApiRole("USER")
    if (!guard.ok) return guard.response

    const certificates = await getCertificatesByUser(guard.session.sub)
    return NextResponse.json({
      certificates: certificates.map(c => ({
        id:         c.id,
        verifyCode: c.verifyCode,
        issuedAt:   c.issuedAt.toISOString(),
        expiresAt:  c.expiresAt?.toISOString() ?? null,
        course:     { id: c.course.id, title: c.course.title, slug: c.course.slug },
      })),
    })
  } catch (error) {
    console.error("[GET /api/student/certificates]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
