import { NextRequest, NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import type { ReactElement } from "react"
import { createElement } from "react"
import { getCertificateByToken } from "@/services/certificate.service"
import { CertificatePDF } from "@/components/CertificatePDF"

type Context = { params: Promise<{ token: string }> }

/** GET /api/certificates/verify/[token]/download — stream the PDF certificate */
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

    const issuedAt = new Date(cert.issuedAt).toLocaleDateString("en-GB", {
      day:   "2-digit",
      month: "long",
      year:  "numeric",
    })

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://arspi.org"

    const buffer = await renderToBuffer(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      createElement(CertificatePDF, {
        recipientName,
        programTitle:  cert.course.title,
        facilitator:   cert.course.instructorName,
        issuedAt,
        verifyCode:    cert.verifyCode,
        verifyBaseUrl: baseUrl,
      }) as ReactElement<any>
    )

    const filename = `ARPS-Certificate-${cert.course.slug}-${cert.verifyCode.slice(0, 8)}.pdf`

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control":       "no-store",
      },
    })
  } catch (error) {
    console.error("[GET /api/certificates/verify/[token]/download]", error)
    return NextResponse.json({ error: "Failed to generate certificate." }, { status: 500 })
  }
}
