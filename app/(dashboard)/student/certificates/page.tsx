"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"

type Certificate = {
  id:         string
  verifyCode: string
  issuedAt:   string
  expiresAt:  string | null
  course:     { id: string; title: string; slug: string }
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

function CertificateCard({ cert }: { cert: Certificate }) {
  return (
    <div className="rounded-[14px] border border-[#E5E2DC] bg-white overflow-hidden flex flex-col">
      <div className="px-4 sm:px-5 py-4 border-b border-[#E5E2DC] bg-gradient-to-br from-[#FEF9EC] to-white flex items-start gap-3">
        <div className="w-10 h-10 rounded-[10px] bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="6" /><path d="M15.5 13.5 17 22l-5-3-5 3 1.5-8.5" /></svg>
        </div>
        <div className="min-w-0">
          <p className="text-[14px] font-bold text-[#1A1916] leading-tight line-clamp-2">{cert.course.title}</p>
          <p className="text-[11px] text-[#A8A39C] mt-1">Issued {fmtDate(cert.issuedAt)}</p>
        </div>
      </div>
      <div className="p-4 sm:p-5 flex flex-col gap-2.5 flex-1">
        <p className="text-[11px] text-[#A8A39C]">Certificate ID: <span className="font-mono text-[#6B6560]">{cert.verifyCode.slice(0, 12)}…</span></p>
        {cert.expiresAt && (
          <p className="text-[11px] text-[#A8A39C]">Expires {fmtDate(cert.expiresAt)}</p>
        )}
        <div className="mt-auto pt-3 flex items-center gap-2">
          <Link
            href={`/verify/${cert.verifyCode}`}
            target="_blank" rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-[9px] text-[12px] font-semibold border border-[#E5E2DC] text-[#6B6560] hover:border-[#0474C4] hover:text-[#0474C4] transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
            View
          </Link>
          <a
            href={`/api/certificates/verify/${cert.verifyCode}/download`}
            target="_blank" rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-[9px] text-[12px] font-semibold bg-[#0474C4] text-white hover:bg-[#06457F] transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            Download
          </a>
        </div>
      </div>
    </div>
  )
}

const StudentCertificatesPage = () => {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading]           = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch("/api/student/certificates")
      .then(r => r.json())
      .then(d => { if (!cancelled) setCertificates(d.certificates ?? []) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return (
    <div className="max-w-350 mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-[18px] font-extrabold text-[#1A1916]">My Certificates</h1>
        <p className="text-[#A8A39C] text-[13px] mt-0.5">Certificates you&apos;ve earned by completing programmes</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-[14px]" />)}
        </div>
      ) : certificates.length === 0 ? (
        <div className="rounded-[14px] border border-[#E5E2DC] bg-white px-4 py-16 text-center">
          <p className="text-[13px] text-[#A8A39C] mb-3">You haven&apos;t earned any certificates yet.</p>
          <Link href="/student/programs" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[13px] font-semibold bg-[#0474C4] text-white hover:bg-[#06457F] transition-colors">
            View my programmes
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {certificates.map(cert => <CertificateCard key={cert.id} cert={cert} />)}
        </div>
      )}
    </div>
  )
}

export default StudentCertificatesPage
