"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"

type Applicant = {
  id:             string
  fullName:       string
  email:          string
  mobile:         string
  country:        string
  resumeUrl:      string
  coverLetterUrl: string | null
  linkedinUrl:    string | null
  source:         string | null
  createdAt:      string
}

type CareerType      = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP" | "TEMPORARY"
type ExperienceLevel = "ENTRY" | "JUNIOR" | "MID" | "SENIOR" | "LEAD" | "EXECUTIVE"
type CareerStatus    = "PUBLISHED" | "ARCHIVED"

type Career = {
  id:              string
  title:           string
  slug:            string
  department:      string
  type:            CareerType
  experienceLevel: ExperienceLevel
  location:        string
  remote:          boolean
  salaryMin:       number | null
  salaryMax:       number | null
  currency:        string
  description:     string
  responsibilities: unknown | null
  requirements:    unknown | null
  benefits:        unknown | null
  applyEmail:      string | null
  status:          CareerStatus
  views:           number
  applications:    number
  closingDate:     string | null
  createdAt:       string
  updatedAt:       string
}

const TYPE_LABELS: Record<CareerType, string> = {
  FULL_TIME: "Full-time", PART_TIME: "Part-time", CONTRACT: "Contract", INTERNSHIP: "Internship", TEMPORARY: "Temporary",
}
const LEVEL_LABELS: Record<ExperienceLevel, string> = {
  ENTRY: "Entry", JUNIOR: "Junior", MID: "Mid-Level", SENIOR: "Senior", LEAD: "Lead", EXECUTIVE: "Executive",
}

function fmtDate(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

function asArr(val: unknown): string[] {
  return Array.isArray(val) ? (val as string[]) : []
}

function fmtSalary(min: number | null, max: number | null, currency: string) {
  if (min === null && max === null) return "—"
  const fmt = (n: number) => `${currency} ${n.toLocaleString()}`
  if (min !== null && max !== null) return `${fmt(min)} – ${fmt(max)}`
  return fmt((min ?? max) as number)
}

function MetricCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-[14px] border border-[#E5E2DC] bg-white px-5 py-4">
      <p className="text-[11px] font-bold text-[#A8A39C] uppercase tracking-[0.5px]">{label}</p>
      <p className="text-[24px] font-extrabold text-[#1A1916] mt-1">{value}</p>
      {hint && <p className="text-[11px] text-[#A8A39C] mt-0.5">{hint}</p>}
    </div>
  )
}

export default function AdminCareerDetailPage() {
  const params  = useParams<{ id: string }>()
  const id      = params?.id ?? ""

  const [career, setCareer] = useState<Career | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const [applicants, setApplicants]         = useState<Applicant[]>([])
  const [applicantsLoading, setAppLoading]  = useState(false)
  const [applicantsTotal, setAppTotal]      = useState(0)
  const [applicantsPage, setAppPage]        = useState(1)
  const APPLICANTS_LIMIT                    = 20
  const totalApplicantPages                 = Math.max(1, Math.ceil(applicantsTotal / APPLICANTS_LIMIT))

  const fetchCareer = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const r = await fetch(`/api/admin/careers/${id}`)
      const d = await r.json()
      if (r.ok) setCareer(d.career)
      else      setError(d.error ?? "Failed to load posting.")
    } catch {
      setError("Failed to load posting.")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchCareer() }, [fetchCareer])

  const fetchApplicants = useCallback(async () => {
    if (!id) return
    setAppLoading(true)
    try {
      const r = await fetch(`/api/admin/careers/${id}/applications?page=${applicantsPage}&limit=${APPLICANTS_LIMIT}`)
      const d = await r.json()
      if (r.ok) {
        setApplicants(d.applications ?? [])
        setAppTotal(d.pagination?.total ?? 0)
      }
    } finally {
      setAppLoading(false)
    }
  }, [id, applicantsPage])

  useEffect(() => { fetchApplicants() }, [fetchApplicants])

  if (loading) {
    return <div className="px-8 py-8 max-w-350 mx-auto text-[#A8A39C] text-[13px]">Loading…</div>
  }

  if (error || !career) {
    return (
      <div className="px-8 py-8 max-w-350 mx-auto">
        <p className="text-[13px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error ?? "Career posting not found."}
        </p>
        <Link href="/administrator/careers" className="text-[13px] text-[#0474C4] font-semibold mt-3 inline-block">← Back to careers</Link>
      </div>
    )
  }

  const responsibilities = asArr(career.responsibilities)
  const requirements     = asArr(career.requirements)
  const benefits         = asArr(career.benefits)

  return (
    <div className="px-8 py-8 max-w-350 mx-auto">
      {/* Back */}
      <Link href="/administrator/careers" className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#6B6560] hover:text-[#0474C4] transition-colors mb-4">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        Back to careers
      </Link>

      {/* Header */}
      <div className="rounded-[14px] overflow-hidden border border-[#E5E2DC] mb-6">
        <div className="bg-[#0474C4] px-6 py-5">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/20 text-white uppercase tracking-wider">
              {TYPE_LABELS[career.type]}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/20 text-white uppercase tracking-wider">
              {LEVEL_LABELS[career.experienceLevel]}
            </span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${career.status === "PUBLISHED" ? "bg-emerald-500/30 text-white" : "bg-amber-500/30 text-white"}`}>
              {career.status}
            </span>
          </div>
          <h1 className="text-[22px] font-extrabold text-white leading-tight">{career.title}</h1>
          <p className="text-[13px] text-white/80 mt-1.5">
            {career.department} · {career.location}{career.remote && " · Remote-friendly"}
          </p>
        </div>
        <div className="bg-white px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-[12px]">
          <div>
            <p className="text-[10px] font-bold text-[#A8A39C] uppercase tracking-[0.5px]">Salary</p>
            <p className="text-[#1A1916] font-semibold mt-0.5">{fmtSalary(career.salaryMin, career.salaryMax, career.currency)}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#A8A39C] uppercase tracking-[0.5px]">Closing date</p>
            <p className="text-[#1A1916] font-semibold mt-0.5">{fmtDate(career.closingDate)}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#A8A39C] uppercase tracking-[0.5px]">Posted</p>
            <p className="text-[#1A1916] font-semibold mt-0.5">{fmtDate(career.createdAt)}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#A8A39C] uppercase tracking-[0.5px]">Last updated</p>
            <p className="text-[#1A1916] font-semibold mt-0.5">{fmtDate(career.updatedAt)}</p>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <MetricCard label="Views"        value={career.views}        hint="Total page views" />
        <MetricCard label="Applications" value={career.applications} hint="Submitted to date" />
        <MetricCard
          label="Conversion"
          value={career.views > 0 ? `${((career.applications / career.views) * 100).toFixed(1)}%` : "—"}
          hint="Applications / views"
        />
      </div>

      {/* Body */}
      <div className="rounded-[14px] border border-[#E5E2DC] bg-white p-6 space-y-6">
        <section>
          <h3 className="text-[14px] font-bold text-[#1A1916] mb-2">Description</h3>
          <div className="text-[13px] text-[#3F3B36] leading-relaxed [&_a]:text-[#0474C4] [&_a]:underline" dangerouslySetInnerHTML={{ __html: career.description }} />
        </section>

        {responsibilities.length > 0 && (
          <section>
            <h3 className="text-[14px] font-bold text-[#1A1916] mb-2">Responsibilities</h3>
            <ul className="space-y-1.5">
              {responsibilities.map((item, i) => (
                <li key={i} className="flex gap-2 text-[13px] text-[#3F3B36]">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-[#0474C4] shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {requirements.length > 0 && (
          <section>
            <h3 className="text-[14px] font-bold text-[#1A1916] mb-2">Requirements</h3>
            <ul className="space-y-1.5">
              {requirements.map((item, i) => (
                <li key={i} className="flex gap-2 text-[13px] text-[#3F3B36]">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-[#0474C4] shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {benefits.length > 0 && (
          <section>
            <h3 className="text-[14px] font-bold text-[#1A1916] mb-2">Benefits</h3>
            <ul className="space-y-1.5">
              {benefits.map((item, i) => (
                <li key={i} className="flex gap-2 text-[13px] text-[#3F3B36]">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-emerald-500 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {career.applyEmail && (
          <section>
            <h3 className="text-[14px] font-bold text-[#1A1916] mb-2">How to apply</h3>
            <div className="space-y-1 text-[13px] text-[#3F3B36]">
              <p>Email: <a href={`mailto:${career.applyEmail}`} className="text-[#0474C4] hover:underline">{career.applyEmail}</a></p>
            </div>
          </section>
        )}
      </div>

      {/* Applicants table — last section on the page */}
      <div className="rounded-[14px] border border-[#E5E2DC] bg-white overflow-hidden mt-6">
        <div className="px-5 py-3 border-b border-[#E5E2DC] bg-[#FAFAF9] flex items-center justify-between">
          <div>
            <h3 className="text-[13px] font-bold text-[#1A1916]">Applicants</h3>
            <p className="text-[11px] text-[#A8A39C] mt-0.5">{applicantsTotal} total submission{applicantsTotal === 1 ? "" : "s"}</p>
          </div>
        </div>

        {applicantsLoading ? (
          <div className="px-5 py-10 text-center text-[12px] text-[#A8A39C]">Loading applicants…</div>
        ) : applicants.length === 0 ? (
          <div className="px-5 py-10 text-center text-[12px] text-[#A8A39C]">No applications yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead className="bg-[#FAFAF9] border-b border-[#E5E2DC]">
                <tr className="text-left text-[10px] font-bold text-[#A8A39C] uppercase tracking-[0.5px]">
                  <th className="px-5 py-2.5">Name</th>
                  <th className="px-3 py-2.5">Email</th>
                  <th className="px-3 py-2.5">Country</th>
                  <th className="px-3 py-2.5">Mobile</th>
                  <th className="px-3 py-2.5">Resume</th>
                  <th className="px-3 py-2.5">Cover letter</th>
                  <th className="px-3 py-2.5">LinkedIn</th>
                  <th className="px-3 py-2.5">Source</th>
                  <th className="px-5 py-2.5">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {applicants.map((a) => (
                  <tr key={a.id} className="border-b border-[#F5F4F1] last:border-b-0 text-[#1A1916]">
                    <td className="px-5 py-3 font-semibold">{a.fullName}</td>
                    <td className="px-3 py-3 text-[#3F3B36]">
                      <a href={`mailto:${a.email}`} className="hover:text-[#0474C4]">{a.email}</a>
                    </td>
                    <td className="px-3 py-3 text-[#3F3B36]">{a.country}</td>
                    <td className="px-3 py-3 text-[#3F3B36]">{a.mobile}</td>
                    <td className="px-3 py-3">
                      <a href={a.resumeUrl} target="_blank" rel="noreferrer" className="text-[#0474C4] hover:underline">View</a>
                    </td>
                    <td className="px-3 py-3">
                      {a.coverLetterUrl
                        ? <a href={a.coverLetterUrl} target="_blank" rel="noreferrer" className="text-[#0474C4] hover:underline">View</a>
                        : <span className="text-[#A8A39C]">—</span>}
                    </td>
                    <td className="px-3 py-3">
                      {a.linkedinUrl
                        ? <a href={a.linkedinUrl} target="_blank" rel="noreferrer" className="text-[#0474C4] hover:underline">Profile</a>
                        : <span className="text-[#A8A39C]">—</span>}
                    </td>
                    <td className="px-3 py-3 text-[#3F3B36]">{a.source ?? "—"}</td>
                    <td className="px-5 py-3 text-[#A8A39C] whitespace-nowrap">{fmtDate(a.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pager — hidden when no rows */}
        {applicants.length > 0 && (
          <div className="px-5 py-3 border-t border-[#E5E2DC] flex items-center justify-between">
            <span className="text-[11px] text-[#A8A39C]">
              Page {applicantsPage} of {totalApplicantPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={applicantsPage === 1}
                onClick={() => setAppPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-[8px] border border-[#E5E2DC] text-[#6B6560] hover:border-[#0474C4] hover:text-[#0474C4] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-[11px] font-semibold uppercase tracking-[0.05em]"
              >
                Prev
              </button>
              <button
                type="button"
                disabled={applicantsPage === totalApplicantPages}
                onClick={() => setAppPage(p => Math.min(totalApplicantPages, p + 1))}
                className="px-3 py-1.5 rounded-[8px] border border-[#E5E2DC] text-[#6B6560] hover:border-[#0474C4] hover:text-[#0474C4] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-[11px] font-semibold uppercase tracking-[0.05em]"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
