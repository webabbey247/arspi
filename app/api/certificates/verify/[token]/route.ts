import { NextRequest, NextResponse } from "next/server"
import { getCertificateByToken, displayName } from "@/services/certificate.service"

type Context = { params: Promise<{ token: string }> }

/** GET /api/certificates/verify/[token] — public certificate verification (no auth) */
export async function GET(_req: NextRequest, { params }: Context) {
  try {
    const { token } = await params
    const cert = await getCertificateByToken(token)
    if (!cert) {
      return NextResponse.json({ error: "Certificate not found." }, { status: 404 })
    }

    return NextResponse.json({
      valid: true,
      certificate: {
        id:             cert.id,
        verifyCode:     cert.verifyCode,
        issuedAt:       cert.issuedAt.toISOString(),
        expiresAt:      cert.expiresAt?.toISOString() ?? null,
        recipientName:  displayName(cert.user),
        recipientEmail: cert.user.email,
        programTitle:   cert.course.title,
        programSlug:    cert.course.slug,
        facilitator:    displayName(cert.course.instructor),
      },
    })
  } catch (error) {
    console.error("[GET /api/certificates/verify/[token]]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
