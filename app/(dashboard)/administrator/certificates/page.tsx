"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { TableSkeletonRows, SkeletonCardList } from "@/components/ui/skeleton"

type Certificate = {
  id:         string
  verifyCode: string
  issuedAt:   string
  expiresAt:  string | null
  user:       { id: string; email: string; name: string }
  course:     { id: string; title: string; slug: string }
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

function ConfirmDialog({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#171C35]/40">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
        <p className="text-[14px] text-[#171C35] mb-5">{message}</p>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-[10px] text-[13px] font-semibold border border-[#DFE2ED] text-[#69708A] hover:bg-[#F5F6FB] cursor-pointer">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-[10px] text-[13px] font-semibold bg-red-600 text-white hover:bg-red-700 cursor-pointer">Revoke</button>
        </div>
      </div>
    </div>
  )
}

const PAGE_SIZE = 20

const AdminCertificatesPage = () => {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState("")
  const [page, setPage]                 = useState(1)
  const [revokeTarget, setRevokeTarget] = useState<Certificate | null>(null)

  const fetchCertificates = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch("/api/certificates")
      const d = await r.json()
      if (r.ok) setCertificates(d.certificates ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCertificates() }, [fetchCertificates])
  useEffect(() => { setPage(1) }, [search])

  async function handleRevoke() {
    if (!revokeTarget) return
    const res = await fetch(`/api/certificates/${revokeTarget.id}`, { method: "DELETE" })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      alert(d.error ?? "Failed to revoke certificate.")
      return
    }
    setRevokeTarget(null)
    fetchCertificates()
  }

  const q = search.toLowerCase()
  const filtered = certificates.filter(c =>
    !q ||
    c.user.name.toLowerCase().includes(q) ||
    c.user.email.toLowerCase().includes(q) ||
    c.course.title.toLowerCase().includes(q)
  )
  const totalPages   = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated     = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-350 mx-auto">
      <div className="mb-6">
        <span className="block text-[12px] tracking-[0.12em] uppercase font-extrabold text-[#6655DF] mb-1.5">Administrator</span>
        <h1 className="text-[clamp(28px,3.4vw,40px)] leading-[1.1] tracking-[-0.035em] font-extrabold text-[#171C35]">Certificates</h1>
        <p className="text-[#69708A] text-[15px] mt-1.5 max-w-180">All certificates issued across every programme</p>
      </div>

      <div className="rounded-[16px] border border-[#DFE2ED] overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-3 sm:px-4 py-3 bg-white border-b border-[#DFE2ED]">
          <div className="relative w-full sm:w-72">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A90A6]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by student or programme…"
              className="w-full pl-8 pr-3 py-2 text-[13px] bg-white border border-[#DFE2ED] rounded-[10px] text-[#171C35] outline-none placeholder:text-[#8A90A6] focus:border-[#6655DF] transition-colors"
            />
          </div>
        </div>

        {/* Table — desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-[#FAFAFF] border-b border-[#DFE2ED]">
                {["Student", "Programme", "Issued", "Certificate ID", ""].map((col, i) => (
                  <th key={i} className="px-4 py-2.5 text-left text-[11px] font-bold text-[#8A90A6] tracking-[0.5px] uppercase whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonRows colSpan={5} />
              ) : paginated.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-[#8A90A6]">No certificates found.</td></tr>
              ) : paginated.map(c => (
                <tr key={c.id} className="border-b border-[#F0EFFA] last:border-none hover:bg-[#FAFAFF] transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[#171C35] leading-tight">{c.user.name}</p>
                    <p className="text-[11px] text-[#8A90A6] mt-0.5">{c.user.email}</p>
                  </td>
                  <td className="px-4 py-3 text-[#171C35]">{c.course.title}</td>
                  <td className="px-4 py-3 text-[#69708A] whitespace-nowrap">{fmtDate(c.issuedAt)}</td>
                  <td className="px-4 py-3 text-[#69708A] font-mono text-[11px] whitespace-nowrap">{c.verifyCode.slice(0, 12)}…</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Link href={`/verify/${c.verifyCode}`} target="_blank" title="View certificate" className="w-7 h-7 flex items-center justify-center rounded-[8px] border border-[#DFE2ED] text-[#69708A] hover:border-[#6655DF] hover:text-[#6655DF] hover:bg-blue-50 transition-colors">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                      </Link>
                      <a href={`/api/certificates/verify/${c.verifyCode}/download`} target="_blank" rel="noopener noreferrer" title="Download PDF" className="w-7 h-7 flex items-center justify-center rounded-[8px] border border-[#DFE2ED] text-[#69708A] hover:border-[#6655DF] hover:text-[#6655DF] hover:bg-blue-50 transition-colors">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                      </a>
                      <button onClick={() => setRevokeTarget(c)} title="Revoke" className="w-7 h-7 flex items-center justify-center rounded-[8px] border border-red-200 bg-red-50 text-red-500 hover:border-red-400 hover:text-red-600 hover:bg-red-100 cursor-pointer transition-colors">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cards — mobile */}
        <div className="md:hidden flex flex-col">
          {loading ? (
            <SkeletonCardList />
          ) : paginated.length === 0 ? (
            <div className="px-4 py-10 text-center text-[#8A90A6] text-[13px]">No certificates found.</div>
          ) : paginated.map(c => (
            <div key={c.id} className="px-4 py-4 border-b border-[#F0EFFA] last:border-none flex flex-col gap-3">
              <div>
                <p className="font-semibold text-[#171C35] text-[14px] leading-tight">{c.user.name}</p>
                <p className="text-[12px] text-[#8A90A6] mt-0.5">{c.user.email}</p>
              </div>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[12px]">
                <div>
                  <dt className="text-[10px] uppercase tracking-wide text-[#8A90A6] font-semibold">Programme</dt>
                  <dd className="text-[#171C35] font-medium">{c.course.title}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-wide text-[#8A90A6] font-semibold">Issued</dt>
                  <dd className="text-[#171C35] font-medium">{fmtDate(c.issuedAt)}</dd>
                </div>
              </dl>
              <div className="flex items-center justify-end gap-1.5 pt-1">
                <Link href={`/verify/${c.verifyCode}`} target="_blank" aria-label="View certificate" className="w-8 h-8 flex items-center justify-center rounded-[8px] border border-[#DFE2ED] bg-white text-[#69708A] hover:border-[#6655DF] hover:text-[#6655DF] hover:bg-blue-50 transition-colors">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                </Link>
                <a href={`/api/certificates/verify/${c.verifyCode}/download`} target="_blank" rel="noopener noreferrer" aria-label="Download PDF" className="w-8 h-8 flex items-center justify-center rounded-[8px] border border-[#DFE2ED] bg-white text-[#69708A] hover:border-[#6655DF] hover:text-[#6655DF] hover:bg-blue-50 transition-colors">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                </a>
                <button onClick={() => setRevokeTarget(c)} aria-label="Revoke" className="w-8 h-8 flex items-center justify-center rounded-[8px] border border-red-200 bg-red-50 text-red-500 hover:border-red-400 hover:text-red-600 hover:bg-red-100 cursor-pointer transition-colors">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-3 sm:px-4 py-2.5 bg-[#FAFAFF] border-t border-[#DFE2ED]">
          <p className="text-[11px] text-[#8A90A6]">
            {filtered.length === 0 ? (
              <>Showing <span className="font-semibold text-[#69708A]">0</span> of <span className="font-semibold text-[#69708A]">{certificates.length}</span> certificates</>
            ) : (
              <>Showing <span className="font-semibold text-[#69708A]">{(page - 1) * PAGE_SIZE + 1}</span>–<span className="font-semibold text-[#69708A]">{Math.min(page * PAGE_SIZE, filtered.length)}</span> of <span className="font-semibold text-[#69708A]">{filtered.length}</span> certificates</>
            )}
          </p>
          {filtered.length > 0 && (
            <div className="flex items-center gap-1.5">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 rounded-[8px] text-[12px] font-semibold border border-[#DFE2ED] bg-white text-[#69708A] hover:border-[#6655DF] hover:text-[#6655DF] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors">Prev</button>
              <span className="text-[11px] font-semibold text-[#69708A] px-2">{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1 rounded-[8px] text-[12px] font-semibold border border-[#DFE2ED] bg-white text-[#69708A] hover:border-[#6655DF] hover:text-[#6655DF] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors">Next</button>
            </div>
          )}
        </div>
      </div>

      {revokeTarget && (
        <ConfirmDialog
          message={`Revoke the certificate for "${revokeTarget.user.name}" — ${revokeTarget.course.title}? This can't be undone.`}
          onConfirm={handleRevoke}
          onCancel={() => setRevokeTarget(null)}
        />
      )}
    </div>
  )
}

export default AdminCertificatesPage
