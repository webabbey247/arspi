import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getCertificateByToken } from "@/services/certificate.service"

type Props = { params: Promise<{ token: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params
  const cert = await getCertificateByToken(token)
  if (!cert) return { title: "Certificate Not Found — ARPS Institute" }
  const profile = cert.user.profile
  const name =
    profile?.firstName || profile?.lastName
      ? [profile.firstName, profile.lastName].filter(Boolean).join(" ")
      : cert.user.email
  return { title: `Certificate — ${name} · ARPS Institute` }
}

export default async function VerifyPage({ params }: Props) {
  const { token } = await params
  const cert = await getCertificateByToken(token)

  if (!cert) notFound()

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

  const expiresAt = cert.expiresAt
    ? new Date(cert.expiresAt).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })
    : null

  return (
    <div className="min-h-screen bg-[#060D14] flex flex-col">

      {/* Top bar */}
      <header className="border-b border-white/8 px-8 py-4 flex items-center justify-between">
        <Link href="/" className="text-[#F7F3ED] text-[13px] font-semibold tracking-wide hover:text-[#C8A96E] transition-colors">
          ARPS Institute
        </Link>
        <span className="text-[11px] text-white/30 uppercase tracking-widest">Certificate Verification</span>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-2xl">

          {/* Valid badge */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div>
              <p className="text-emerald-400 text-[13px] font-semibold">Certificate Verified</p>
              <p className="text-white/35 text-[11px]">This certificate is authentic and issued by ARPS Institute</p>
            </div>
          </div>

          {/* Certificate card */}
          <div
            className="relative rounded-2xl overflow-hidden"
            style={{ background: "linear-gradient(135deg, #0B1625 0%, #0F1E30 100%)", border: "1px solid rgba(200,169,110,0.25)" }}
          >
            {/* Gold top accent */}
            <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, transparent, #C8A96E, transparent)" }} />

            <div className="px-10 py-10">

              {/* Certificate of completion */}
              <div className="flex items-center gap-3 mb-8">
                <div className="h-px flex-1" style={{ background: "rgba(200,169,110,0.25)" }} />
                <span className="text-[10px] tracking-[0.2em] uppercase text-[#C8A96E]/70 font-medium">Certificate of Completion</span>
                <div className="h-px flex-1" style={{ background: "rgba(200,169,110,0.25)" }} />
              </div>

              {/* Recipient */}
              <div className="text-center mb-8">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/35 mb-3">Awarded to</p>
                <h1 className="text-[2.4rem] font-serif text-[#C8A96E] leading-tight mb-1">{recipientName}</h1>
                <p className="text-[11px] text-white/35 tracking-wide">{cert.user.email}</p>
              </div>

              {/* Program */}
              <div className="text-center mb-8">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/35 mb-3">For successfully completing</p>
                <h2 className="text-[1.35rem] font-semibold text-[#F7F3ED] leading-snug">{cert.course.title}</h2>
                {cert.course.instructorName && (
                  <p className="text-[12px] text-white/40 mt-1.5">Facilitated by {cert.course.instructorName}</p>
                )}
              </div>

              {/* Meta grid */}
              <div className="grid grid-cols-3 gap-4 pt-8 border-t" style={{ borderColor: "rgba(200,169,110,0.15)" }}>
                <div className="text-center">
                  <p className="text-[9.5px] uppercase tracking-[0.18em] text-white/30 mb-1.5">Date Issued</p>
                  <p className="text-[13px] text-[#F7F3ED]/80 font-medium">{issuedAt}</p>
                </div>
                <div className="text-center border-x" style={{ borderColor: "rgba(200,169,110,0.12)" }}>
                  <p className="text-[9.5px] uppercase tracking-[0.18em] text-white/30 mb-1.5">Certificate ID</p>
                  <p className="text-[13px] text-[#F7F3ED]/80 font-mono">{token.slice(0, 16).toUpperCase()}</p>
                </div>
                <div className="text-center">
                  <p className="text-[9.5px] uppercase tracking-[0.18em] text-white/30 mb-1.5">Valid Until</p>
                  <p className="text-[13px] text-[#F7F3ED]/80 font-medium">{expiresAt ?? "No Expiry"}</p>
                </div>
              </div>

            </div>

            {/* Gold bottom accent */}
            <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, transparent, #C8A96E, transparent)" }} />
          </div>

          {/* Download button */}
          <div className="mt-6 flex items-center justify-between gap-4">
            <a
              href={`/api/certificates/verify/${token}/download`}
              download
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-semibold text-[#060D14] transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #C8A96E, #D4BA85)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download Certificate
            </a>

            <Link
              href="/programs"
              className="text-[12px] text-white/35 hover:text-white/60 transition-colors"
            >
              Browse more programs →
            </Link>
          </div>

          {/* Footer note */}
          <p className="text-center text-[11px] text-white/20 mt-8">
            This certificate was issued by ARPS Institute. To report a fraudulent certificate, contact{" "}
            <a href="mailto:info@arspi.org" className="underline hover:text-white/40 transition-colors">info@arspi.org</a>
          </p>

        </div>
      </main>
    </div>
  )
}
