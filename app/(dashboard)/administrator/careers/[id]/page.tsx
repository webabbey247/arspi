"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { sanitizeHtml } from "@/lib/sanitize"
import { DetailPageSkeleton, InlineSkeleton } from "@/components/ui/skeleton"
import { StatTile, Pill, EmptyState, DOTS, AURORA, metaCls } from "@/components/admin/AdminKit"
import { cn } from "@/lib/utils"

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
    return <DetailPageSkeleton />
  }

  if (error || !career) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-350 mx-auto">
        <p className="text-[13px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error ?? "Career posting not found."}
        </p>
        <Link href="/administrator/careers" className="text-[13px] text-[#6655DF] font-semibold mt-3 inline-block">← Back to careers</Link>
      </div>
    )
  }

  const responsibilities = asArr(career.responsibilities)
  const requirements     = asArr(career.requirements)
  const benefits         = asArr(career.benefits)

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-350 mx-auto">
      {/* Back */}
      <Link href="/administrator/careers" className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#69708A] hover:text-[#6655DF] transition-colors mb-4">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        Back to careers
      </Link>

      {/* Header */}
      <div className="rounded-[16px] overflow-hidden border border-[#DFE2ED] mb-6">
        <div className={cn("relative overflow-hidden bg-[#0E1230] px-6 py-6", DOTS)}>
          <div className={cn("absolute inset-0 opacity-70 blur-2xl motion-safe:animate-[pulse_10s_ease-in-out_infinite]", AURORA)} />
          <div className="relative flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/20 text-white uppercase tracking-wider">
              {TYPE_LABELS[career.type]}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/20 text-white uppercase tracking-wider">
              {LEVEL_LABELS[career.experienceLevel]}
            </span>
            <Pill tone={career.status === "PUBLISHED" ? "emerald" : "amber"}>{career.status}</Pill>
          </div>
          <h1 className="relative text-[clamp(22px,2.6vw,30px)] leading-[1.1] tracking-[-0.03em] font-extrabold text-white">{career.title}</h1>
          <p className="relative text-[14px] font-bold text-white/65 mt-1.5">
            {career.department} · {career.location}{career.remote && " · Remote-friendly"}
          </p>
        </div>
        <div className="bg-white px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-[12px]">
          <div>
            <p className={metaCls}>Salary</p>
            <p className="text-[14px] font-bold text-[#171C35] mt-1">{fmtSalary(career.salaryMin, career.salaryMax, career.currency)}</p>
          </div>
          <div>
            <p className={metaCls}>Closing date</p>
            <p className="text-[14px] font-bold text-[#171C35] mt-1">{fmtDate(career.closingDate)}</p>
          </div>
          <div>
            <p className={metaCls}>Posted</p>
            <p className="text-[14px] font-bold text-[#171C35] mt-1">{fmtDate(career.createdAt)}</p>
          </div>
          <div>
            <p className={metaCls}>Last updated</p>
            <p className="text-[14px] font-bold text-[#171C35] mt-1">{fmtDate(career.updatedAt)}</p>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 mt-6">
        <StatTile
          label="Views" value={career.views}
          motif="waves" accent="text-sky-600" tone="bg-sky-50 text-sky-600"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>}
          hint="On the public careers page"
        />
        <StatTile
          label="Applications" value={career.applications}
          motif="dots" accent="text-[#6655DF]" tone="bg-[#EEECFF] text-[#6655DF]"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>}
          hint="Submitted to date"
        />
        <StatTile
          label="Conversion"
          value={career.views > 0 ? `${((career.applications / career.views) * 100).toFixed(1)}%` : "\u2014"}
          motif="rings" accent="text-amber-600" tone="bg-amber-50 text-amber-600"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
          hint="Applications per view"
        />
        <StatTile
          label="Status" value={career.status === "PUBLISHED" ? "Live" : "Archived"}
          motif="hatch"
          accent={career.status === "PUBLISHED" ? "text-emerald-600" : "text-slate-500"}
          tone={career.status === "PUBLISHED" ? "bg-emerald-50 text-emerald-600" : "bg-[#F0EFFA] text-[#69708A]"}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
          hint={career.closingDate ? `Closes ${fmtDate(career.closingDate)}` : "No closing date"}
        />
      </div>

      {/* Body */}
      <div className="rounded-[16px] border border-[#DFE2ED] bg-white p-6 space-y-6">
        <section>
          <h3 className="text-[14px] font-bold text-[#171C35] mb-2">Description</h3>
          <div className="text-[13px] text-[#343A52] leading-relaxed [&_a]:text-[#6655DF] [&_a]:underline" dangerouslySetInnerHTML={{ __html: sanitizeHtml(career.description) }} />
        </section>

        {responsibilities.length > 0 && (
          <section>
            <h3 className="text-[14px] font-bold text-[#171C35] mb-2">Responsibilities</h3>
            <ul className="space-y-1.5">
              {responsibilities.map((item, i) => (
                <li key={i} className="flex gap-2 text-[13px] text-[#343A52]">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-[#6655DF] shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {requirements.length > 0 && (
          <section>
            <h3 className="text-[14px] font-bold text-[#171C35] mb-2">Requirements</h3>
            <ul className="space-y-1.5">
              {requirements.map((item, i) => (
                <li key={i} className="flex gap-2 text-[13px] text-[#343A52]">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-[#6655DF] shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {benefits.length > 0 && (
          <section>
            <h3 className="text-[14px] font-bold text-[#171C35] mb-2">Benefits</h3>
            <ul className="space-y-1.5">
              {benefits.map((item, i) => (
                <li key={i} className="flex gap-2 text-[13px] text-[#343A52]">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-emerald-500 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {career.applyEmail && (
          <section>
            <h3 className="text-[14px] font-bold text-[#171C35] mb-2">How to apply</h3>
            <div className="space-y-1 text-[13px] text-[#343A52]">
              <p>Email: <a href={`mailto:${career.applyEmail}`} className="text-[#6655DF] hover:underline">{career.applyEmail}</a></p>
            </div>
          </section>
        )}
      </div>

      {/* Applicants table — last section on the page */}
      <div className="rounded-[16px] border border-[#DFE2ED] bg-white overflow-hidden mt-6">
        <div className="px-5 py-3 border-b border-[#DFE2ED] bg-[#FAFAFF] flex items-center justify-between">
          <div>
            <h3 className="text-[13px] font-bold text-[#171C35]">Applicants</h3>
            <p className="text-[11px] text-[#8A90A6] mt-0.5">{applicantsTotal} total submission{applicantsTotal === 1 ? "" : "s"}</p>
          </div>
        </div>

        {applicantsLoading ? (
          <InlineSkeleton rows={3} />
        ) : applicants.length === 0 ? (
          <EmptyState
            className="border-0 rounded-none py-12"
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>}
            title="No applications yet"
            hint={career.status === "PUBLISHED"
              ? "This role is live on the public careers page. Submissions will appear here as they arrive."
              : "This role is archived, so it is not collecting applications."}
          />
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead className="bg-[#FAFAFF] border-b border-[#DFE2ED]">
                  <tr className="text-left text-[10px] font-bold text-[#8A90A6] uppercase tracking-[0.5px]">
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
                    <tr key={a.id} className="border-b border-[#F5F6FB] last:border-b-0 text-[#171C35]">
                      <td className="px-5 py-3 font-semibold">{a.fullName}</td>
                      <td className="px-3 py-3 text-[#343A52]">
                        <a href={`mailto:${a.email}`} className="hover:text-[#6655DF]">{a.email}</a>
                      </td>
                      <td className="px-3 py-3 text-[#343A52]">{a.country}</td>
                      <td className="px-3 py-3 text-[#343A52]">{a.mobile}</td>
                      <td className="px-3 py-3">
                        <a href={a.resumeUrl} target="_blank" rel="noreferrer" className="text-[#6655DF] hover:underline">View</a>
                      </td>
                      <td className="px-3 py-3">
                        {a.coverLetterUrl
                          ? <a href={a.coverLetterUrl} target="_blank" rel="noreferrer" className="text-[#6655DF] hover:underline">View</a>
                          : <span className="text-[#8A90A6]">—</span>}
                      </td>
                      <td className="px-3 py-3">
                        {a.linkedinUrl
                          ? <a href={a.linkedinUrl} target="_blank" rel="noreferrer" className="text-[#6655DF] hover:underline">Profile</a>
                          : <span className="text-[#8A90A6]">—</span>}
                      </td>
                      <td className="px-3 py-3 text-[#343A52]">{a.source ?? "—"}</td>
                      <td className="px-5 py-3 text-[#8A90A6] whitespace-nowrap">{fmtDate(a.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden flex flex-col">
              {applicants.map((a) => (
                <div key={a.id} className="px-4 py-4 border-b border-[#F0EFFA] last:border-none flex flex-col gap-3">
                  <div>
                    <p className="font-semibold text-[#171C35] text-[14px] leading-tight">{a.fullName}</p>
                    <a href={`mailto:${a.email}`} className="text-[12px] text-[#8A90A6] hover:text-[#6655DF] block truncate mt-0.5">{a.email}</a>
                  </div>

                  <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]">
                    <div>
                      <dt className="text-[10px] uppercase tracking-wide text-[#8A90A6] font-semibold">Country</dt>
                      <dd className="text-[#171C35] font-medium">{a.country}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase tracking-wide text-[#8A90A6] font-semibold">Mobile</dt>
                      <dd className="text-[#171C35] font-medium">{a.mobile}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase tracking-wide text-[#8A90A6] font-semibold">Source</dt>
                      <dd className="text-[#171C35] font-medium">{a.source ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase tracking-wide text-[#8A90A6] font-semibold">Submitted</dt>
                      <dd className="text-[#171C35] font-medium">{fmtDate(a.createdAt)}</dd>
                    </div>
                  </dl>

                  <div className="flex flex-wrap items-center gap-3 text-[12px] pt-1">
                    <a href={a.resumeUrl} target="_blank" rel="noreferrer" className="font-semibold text-[#6655DF] hover:underline">Resume</a>
                    {a.coverLetterUrl && (
                      <a href={a.coverLetterUrl} target="_blank" rel="noreferrer" className="font-semibold text-[#6655DF] hover:underline">Cover letter</a>
                    )}
                    {a.linkedinUrl && (
                      <a href={a.linkedinUrl} target="_blank" rel="noreferrer" className="font-semibold text-[#6655DF] hover:underline">LinkedIn</a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pager — hidden when no rows */}
        {applicants.length > 0 && (
          <div className="px-5 py-3 border-t border-[#DFE2ED] flex items-center justify-between">
            <span className="text-[11px] text-[#8A90A6]">
              Page {applicantsPage} of {totalApplicantPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={applicantsPage === 1}
                onClick={() => setAppPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-[8px] border border-[#DFE2ED] text-[#69708A] hover:border-[#6655DF] hover:text-[#6655DF] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-[11px] font-semibold uppercase tracking-[0.05em]"
              >
                Prev
              </button>
              <button
                type="button"
                disabled={applicantsPage === totalApplicantPages}
                onClick={() => setAppPage(p => Math.min(totalApplicantPages, p + 1))}
                className="px-3 py-1.5 rounded-[8px] border border-[#DFE2ED] text-[#69708A] hover:border-[#6655DF] hover:text-[#6655DF] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-[11px] font-semibold uppercase tracking-[0.05em]"
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
