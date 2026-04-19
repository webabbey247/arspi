import { NextRequest, NextResponse } from "next/server"
import { getCertificateByToken } from "@/services/certificate.service"

type Context = { params: Promise<{ token: string }> }

/** GET /api/certificates/verify/[token] — public certificate verification (no auth) */
export async function GET(_req: NextRequest, { params }: Context) {
  try {
    const { token } = await params
    const cert = await getCertificateByToken(token)
    if (!cert) {
      return NextResponse.json({ error: "Certificate not found." }, { status: 404 })
    }

    const profile = cert.user.profile
    const recipientName =
      profile?.firstName || profile?.lastName
        ? [profile.firstName, profile.lastName].filter(Boolean).join(" ")
        : cert.user.email

    return NextResponse.json({
      valid: true,
      certificate: {
        id:             cert.id,
        verifyCode:     cert.verifyCode,
        issuedAt:       cert.issuedAt.toISOString(),
        expiresAt:      cert.expiresAt?.toISOString() ?? null,
        recipientName,
        recipientEmail: cert.user.email,
        programTitle:   cert.course.title,
        programSlug:    cert.course.slug,
        facilitator:    cert.course.instructorName,
      },
    })
  } catch (error) {
    console.error("[GET /api/certificates/verify/[token]]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
