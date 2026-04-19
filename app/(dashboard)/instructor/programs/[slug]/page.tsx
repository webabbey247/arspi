"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { cn } from "@/lib/utils"

// ── Types ─────────────────────────────────────────────────────────────────────

type CourseLevel  = "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
type EnrollStatus = "ACTIVE" | "COMPLETED" | "DROPPED"

type Program = {
  id:           string
  title:        string
  slug:         string
  description:  string
  thumbnail:    string | null
  price:        number
  level:        CourseLevel
  featured:     boolean
  published:    boolean
  instructorId: string
  categoryId:   string | null
  category:     { id: string; name: string; slug: string } | null
  createdAt:    string
  updatedAt:    string
  _count:       { enrollments: number }

  tagline:              string | null
  duration:             string | null
  format:               string | null
  startDate:            string | null
  endDate:              string | null
  cohortSize:           number | null
  rating:               number | null
  reviewCount:          number | null
  enrolledCount:        number | null
  countriesCount:       number | null
  overview:             string | null
  learningObjectives:   unknown | null
  curriculum:           unknown | null
  whatIsIncluded:       unknown | null
  faqs:                 unknown | null
  instructorName:       string | null
  instructorTitle:      string | null
  instructorBio:        string | null
  instructorInitials:   string | null
  instructorCredentials: unknown | null
}

type Enrollment = {
  id:          string
  userId:      string
  courseId:    string
  status:      EnrollStatus
  enrolledAt:  string
  completedAt: string | null
  user: {
    id:      string
    email:   string
    profile: { firstName: string | null; lastName: string | null } | null
  }
}

// ── Constants ─────────────────────────────────────────────────────────────────

const LEVEL_LABELS: Record<CourseLevel, string> = {
  BEGINNER:     "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED:     "Advanced",
}

const LEVEL_COLORS: Record<CourseLevel, string> = {
  BEGINNER:     "bg-emerald-50 text-emerald-700",
  INTERMEDIATE: "bg-amber-50 text-amber-700",
  ADVANCED:     "bg-rose-50 text-rose-700",
}

const STATUS_COLORS: Record<EnrollStatus, string> = {
  ACTIVE:    "bg-blue-50 text-blue-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  DROPPED:   "bg-red-50 text-red-600",
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

function userName(e: Enrollment) {
  const p = e.user.profile
  if (p?.firstName || p?.lastName) return [p.firstName, p.lastName].filter(Boolean).join(" ")
  return e.user.email
}

function toStrArr(v: unknown): string[] {
  return Array.isArray(v) ? (v as string[]) : []
}

type CurriculumMod = { week?: string; title: string; desc?: string; lessons?: { title: string }[] }

function exportCSV(enrollments: Enrollment[], programTitle: string) {
  const headers = ["Name", "Email", "Status", "Enrolled At", "Completed At"]
  const rows = enrollments.map(e => [
    userName(e),
    e.user.email,
    e.status.charAt(0) + e.status.slice(1).toLowerCase(),
    fmtDate(e.enrolledAt),
    fmtDate(e.completedAt),
  ])
  const csv  = [headers, ...rows].map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n")
  const blob = new Blob([csv], { type: "text/csv" })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement("a")
  a.href     = url
  a.download = `${programTitle.replace(/\s+/g, "-").toLowerCase()}-enrollments.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent }: { label: string; value: React.ReactNode; sub?: string; accent?: string }) {
  return (
    <div className="rounded-[14px] border border-[#E5E2DC] bg-white px-5 py-4 flex flex-col gap-1">
      <p className="text-[11px] font-bold text-[#A8A39C] uppercase tracking-wide">{label}</p>
      <p className={cn("text-[26px] font-extrabold leading-tight", accent ?? "text-[#1A1916]")}>{value}</p>
      {sub && <p className="text-[12px] text-[#A8A39C]">{sub}</p>}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 py-3 border-b border-[#F0EEE9] last:border-none">
      <span className="w-28 shrink-0 text-[12px] font-medium text-[#A8A39C] uppercase tracking-wide pt-0.5">{label}</span>
      <span className="text-[13px] text-[#1A1916] flex-1">{value ?? <span className="text-[#A8A39C]">—</span>}</span>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function InstructorProgramDetailPage() {
  const { slug } = useParams<{ slug: string }>()

  const [program,       setProgram]       = useState<Program | null>(null)
  const [enrollments,   setEnrollments]   = useState<Enrollment[]>([])
  const [loading,       setLoading]       = useState(true)
  const [enrollLoading, setEnrollLoading] = useState(true)
  const [error,         setError]         = useState<string | null>(null)

  useEffect(() => {
    async function loadProgram() {
      try {
        const res  = await fetch(`/api/instructor/programs/${slug}`)
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          setError(err.error ?? `Error ${res.status}`)
          return
        }
        setProgram((await res.json()).program)
      } catch {
        setError("Failed to load program.")
      } finally {
        setLoading(false)
      }
    }

    async function loadEnrollments() {
      try {
        const res = await fetch(`/api/instructor/programs/${slug}/enrollments`)
        if (!res.ok) return
        setEnrollments((await res.json()).enrollments ?? [])
      } catch {
        // non-critical
      } finally {
        setEnrollLoading(false)
      }
    }

    loadProgram()
    loadEnrollments()
  }, [slug])

  // ── Analytics ─────────────────────────────────────────────────────────────

  const total     = enrollments.length
  const active    = enrollments.filter(e => e.status === "ACTIVE").length
  const completed = enrollments.filter(e => e.status === "COMPLETED").length
  const dropped   = enrollments.filter(e => e.status === "DROPPED").length
  const revenue   = (program?.price ?? 0) > 0 ? total * (program?.price ?? 0) : 0

  // ── Loading / Error ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="px-8 py-8 max-w-350 mx-auto">
        <div className="h-64 flex items-center justify-center text-[#A8A39C] text-[13px]">Loading…</div>
      </div>
    )
  }

  if (error || !program) {
    return (
      <div className="px-8 py-8 max-w-350 mx-auto">
        <div className="h-64 flex items-center justify-center text-[#A8A39C] text-[13px]">{error ?? "Program not found."}</div>
      </div>
    )
  }

  const curriculum      = Array.isArray(program.curriculum)      ? (program.curriculum as CurriculumMod[]) : []
  const learningObjs    = toStrArr(program.learningObjectives)
  const whatIsIncluded  = toStrArr(program.whatIsIncluded)
  const credentials     = toStrArr(program.instructorCredentials)
  const faqs            = Array.isArray(program.faqs) ? (program.faqs as { q: string; a: string }[]) : []

  return (
    <div className="px-8 py-8 max-w-350 mx-auto space-y-5">

      {/* Page header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link
            href="/instructor/programs"
            className="w-8 h-8 flex items-center justify-center rounded-[8px] border border-[#E5E2DC] bg-white text-[#6B6560] hover:border-[#0474C4] hover:text-[#0474C4] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </Link>
          <div>
            <h1 className="text-[18px] font-extrabold text-[#1A1916]">{program.title}</h1>
            <p className="text-[#A8A39C] text-[13px] mt-0.5">Created {fmtDate(program.createdAt)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/programs/${program.slug}`}
            target="_blank"
            className="h-8 px-3.5 rounded-[8px] border border-[#E5E2DC] bg-white text-[#6B6560] text-[13px] font-medium hover:border-emerald-400 hover:text-emerald-600 transition-colors flex items-center gap-1.5"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            View Public Page
          </Link>
          {enrollments.length > 0 && (
            <button
              onClick={() => exportCSV(enrollments, program.title)}
              className="h-8 px-3.5 rounded-[8px] border border-[#E5E2DC] bg-white text-[#6B6560] text-[13px] font-medium hover:border-[#0474C4] hover:text-[#0474C4] transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Analytics cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Enrolled"  value={total}     sub={`${program._count.enrollments} registered`} />
        <StatCard
          label="Revenue"
          value={program.price > 0 ? `$${revenue.toLocaleString()}` : "—"}
          sub={program.price > 0 ? `@ $${program.price} / seat` : "Free program"}
          accent={program.price > 0 ? "text-emerald-700" : undefined}
        />
        <StatCard label="Active"    value={active}    sub={`${total > 0 ? Math.round((active / total) * 100) : 0}% of enrolled`}    accent="text-blue-700" />
        <StatCard label="Completed" value={completed} sub={dropped > 0 ? `${dropped} dropped` : "0 dropped"} accent="text-emerald-700" />
      </div>

      {/* Content grid — Program Details + sidebar only */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left — core details */}
        <div className="col-span-1 lg:col-span-2">
          <div className="rounded-[14px] border border-[#E5E2DC] bg-white overflow-hidden">
            <div className="px-5 py-3 border-b border-[#E5E2DC] bg-[#FAFAF9]">
              <p className="text-[11px] font-bold text-[#A8A39C] uppercase tracking-wide">Program Details</p>
            </div>
            <div className="px-5">
              <InfoRow label="Title"    value={program.title} />
              <InfoRow label="Slug"     value={<span className="font-mono text-[12px] text-[#6B6560]">{program.slug}</span>} />
              <InfoRow label="Tagline"  value={program.tagline} />
              <InfoRow label="Level"    value={
                <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-semibold", LEVEL_COLORS[program.level])}>
                  {LEVEL_LABELS[program.level]}
                </span>
              } />
              <InfoRow label="Category" value={program.category?.name} />
              <InfoRow label="Price"    value={program.price > 0 ? `$${program.price}` : <span className="text-emerald-700 font-semibold">Free</span>} />
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">

          {/* Status */}
          <div className="rounded-[14px] border border-[#E5E2DC] bg-white overflow-hidden">
            <div className="px-5 py-3 border-b border-[#E5E2DC] bg-[#FAFAF9]">
              <p className="text-[11px] font-bold text-[#A8A39C] uppercase tracking-wide">Status</p>
            </div>
            <div className="p-5 space-y-4">
              {[
                {
                  label: "Published",
                  value: (
                    <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-semibold",
                      program.published ? "bg-emerald-50 text-emerald-700" : "bg-[#F5F4F1] text-[#6B6560]"
                    )}>
                      {program.published ? "Published" : "Draft"}
                    </span>
                  ),
                },
                {
                  label: "Featured",
                  value: (
                    <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-semibold",
                      program.featured ? "bg-amber-50 text-amber-700" : "bg-[#F5F4F1] text-[#6B6560]"
                    )}>
                      {program.featured ? "Yes" : "No"}
                    </span>
                  ),
                },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-[13px] text-[#6B6560]">{label}</span>
                  {value}
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="rounded-[14px] border border-[#E5E2DC] bg-white overflow-hidden">
            <div className="px-5 py-3 border-b border-[#E5E2DC] bg-[#FAFAF9]">
              <p className="text-[11px] font-bold text-[#A8A39C] uppercase tracking-wide">Description</p>
            </div>
            <div className="px-5 py-4">
              <p className="text-[13px] text-[#1A1916] leading-relaxed whitespace-pre-wrap">{program.description}</p>
            </div>
          </div>

          {/* Enrollment breakdown */}
          {!enrollLoading && total > 0 && (
            <div className="rounded-[14px] border border-[#E5E2DC] bg-white overflow-hidden">
              <div className="px-5 py-3 border-b border-[#E5E2DC] bg-[#FAFAF9]">
                <p className="text-[11px] font-bold text-[#A8A39C] uppercase tracking-wide">Breakdown</p>
              </div>
              <div className="p-5 space-y-3">
                {[
                  { label: "Active",    count: active,    color: "bg-blue-500"    },
                  { label: "Completed", count: completed, color: "bg-emerald-500" },
                  { label: "Dropped",   count: dropped,   color: "bg-red-400"     },
                ].map(({ label, count, color }) => (
                  <div key={label}>
                    <div className="flex justify-between text-[12px] mb-1">
                      <span className="text-[#6B6560]">{label}</span>
                      <span className="font-semibold text-[#1A1916]">{count}</span>
                    </div>
                    <div className="h-1.5 bg-[#F0EEE9] rounded-full">
                      <div
                        className={cn("h-full rounded-full transition-all", color)}
                        style={{ width: `${total > 0 ? Math.round((count / total) * 100) : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Programme Details + Social Proof — full width */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
        <div className="rounded-[14px] border border-[#E5E2DC] bg-white overflow-hidden">
          <div className="px-5 py-3 border-b border-[#E5E2DC] bg-[#FAFAF9]">
            <p className="text-[11px] font-bold text-[#A8A39C] uppercase tracking-wide">Programme Details</p>
          </div>
          <div className="px-5">
            <InfoRow label="Duration"    value={program.duration} />
            <InfoRow label="Format"      value={program.format} />
            <InfoRow label="Start Date"  value={program.startDate} />
            <InfoRow label="End Date"    value={program.endDate} />
            <InfoRow label="Cohort Size" value={program.cohortSize != null ? `${program.cohortSize} participants` : null} />
          </div>
        </div>

        <div className="rounded-[14px] border border-[#E5E2DC] bg-white overflow-hidden">
          <div className="px-5 py-3 border-b border-[#E5E2DC] bg-[#FAFAF9]">
            <p className="text-[11px] font-bold text-[#A8A39C] uppercase tracking-wide">Social Proof</p>
          </div>
          <div className="px-5">
            <InfoRow label="Rating"    value={program.rating        != null ? `${program.rating} / 5.0`                  : null} />
            <InfoRow label="Reviews"   value={program.reviewCount   != null ? program.reviewCount.toLocaleString()        : null} />
            <InfoRow label="Enrolled"  value={program.enrolledCount != null ? `${program.enrolledCount.toLocaleString()}+` : null} />
            <InfoRow label="Countries" value={program.countriesCount != null ? `${program.countriesCount}+`               : null} />
          </div>
        </div>
      </div>

      {/* Facilitator (left) + Learning Objectives + What's Included stacked (right) */}
      {(program.instructorName || program.instructorTitle || program.instructorBio ||
        learningObjs.length > 0 || whatIsIncluded.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
          {(program.instructorName || program.instructorTitle || program.instructorBio) && (
            <div className="rounded-[14px] border border-[#E5E2DC] bg-white overflow-hidden">
              <div className="px-5 py-3 border-b border-[#E5E2DC] bg-[#FAFAF9]">
                <p className="text-[11px] font-bold text-[#A8A39C] uppercase tracking-wide">Facilitator</p>
              </div>
              <div className="px-5">
                <InfoRow label="Name"     value={program.instructorName} />
                <InfoRow label="Title"    value={program.instructorTitle} />
                <InfoRow label="Initials" value={program.instructorInitials} />
                <InfoRow label="Bio"      value={program.instructorBio
                  ? <span className="whitespace-pre-wrap leading-relaxed">{program.instructorBio}</span>
                  : null}
                />
                {credentials.length > 0 && (
                  <InfoRow label="Credentials" value={
                    <div className="flex flex-wrap gap-1.5">
                      {credentials.map((c, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-full text-[11px] bg-[#F5F4F1] text-[#6B6560]">{c}</span>
                      ))}
                    </div>
                  } />
                )}
              </div>
            </div>
          )}

          <div className="space-y-5">
            {learningObjs.length > 0 && (
              <div className="rounded-[14px] border border-[#E5E2DC] bg-white overflow-hidden">
                <div className="px-5 py-3 border-b border-[#E5E2DC] bg-[#FAFAF9]">
                  <p className="text-[11px] font-bold text-[#A8A39C] uppercase tracking-wide">Learning Objectives</p>
                </div>
                <ul className="px-5 py-4 space-y-2">
                  {learningObjs.map((obj, i) => (
                    <li key={i} className="flex items-start gap-2 text-[13px] text-[#1A1916]">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#0474C4] shrink-0" />
                      {obj}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {whatIsIncluded.length > 0 && (
              <div className="rounded-[14px] border border-[#E5E2DC] bg-white overflow-hidden">
                <div className="px-5 py-3 border-b border-[#E5E2DC] bg-[#FAFAF9]">
                  <p className="text-[11px] font-bold text-[#A8A39C] uppercase tracking-wide">What&apos;s Included</p>
                </div>
                <ul className="px-5 py-4 space-y-2">
                  {whatIsIncluded.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-[13px] text-[#1A1916]">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Curriculum (left) + FAQs (right) — side by side */}
      {(curriculum.length > 0 || faqs.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
          {curriculum.length > 0 && (
            <div className="rounded-[14px] border border-[#E5E2DC] bg-white overflow-hidden">
              <div className="px-5 py-3 border-b border-[#E5E2DC] bg-[#FAFAF9]">
                <p className="text-[11px] font-bold text-[#A8A39C] uppercase tracking-wide">Curriculum</p>
              </div>
              <div className="divide-y divide-[#F0EEE9]">
                {curriculum.map((mod, i) => (
                  <div key={i} className="px-5 py-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      {mod.week && (
                        <span className="text-[10px] font-bold tracking-widest uppercase text-[#0474C4] bg-[#EEF6FF] px-2 py-0.5 rounded-full">{mod.week}</span>
                      )}
                      <span className="text-[13px] font-semibold text-[#1A1916]">{mod.title}</span>
                    </div>
                    {mod.desc && <p className="text-[12px] text-[#6B6560] leading-relaxed mb-2">{mod.desc}</p>}
                    {mod.lessons && mod.lessons.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {mod.lessons.map((l, j) => (
                          <span key={j} className="text-[11px] px-2 py-0.5 rounded-full bg-[#F5F4F1] text-[#6B6560]">{l.title}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {faqs.length > 0 && (
            <div className="rounded-[14px] border border-[#E5E2DC] bg-white overflow-hidden">
              <div className="px-5 py-3 border-b border-[#E5E2DC] bg-[#FAFAF9]">
                <p className="text-[11px] font-bold text-[#A8A39C] uppercase tracking-wide">FAQs</p>
              </div>
              <div className="divide-y divide-[#F0EEE9]">
                {faqs.map((faq, i) => (
                  <div key={i} className="px-5 py-4">
                    <p className="text-[13px] font-semibold text-[#1A1916] mb-1">{faq.q}</p>
                    <p className="text-[12px] text-[#6B6560] leading-relaxed">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Enrollments table */}
      <div className="rounded-[14px] border border-[#E5E2DC] bg-white overflow-hidden">
        <div className="px-5 py-3 border-b border-[#E5E2DC] bg-[#FAFAF9] flex items-center justify-between">
          <p className="text-[11px] font-bold text-[#A8A39C] uppercase tracking-wide">
            Enrolled Students
            {!enrollLoading && <span className="ml-2 text-[#1A1916]">{total}</span>}
          </p>
          {!enrollLoading && enrollments.length > 0 && (
            <button
              onClick={() => exportCSV(enrollments, program.title)}
              className="text-[11px] font-semibold text-[#0474C4] hover:text-[#06457F] transition-colors cursor-pointer"
            >
              Export CSV
            </button>
          )}
        </div>

        {enrollLoading ? (
          <div className="p-8 flex items-center justify-center text-[13px] text-[#A8A39C]">Loading enrollments…</div>
        ) : enrollments.length === 0 ? (
          <div className="p-8 flex items-center justify-center text-[13px] text-[#A8A39C]">No enrollments yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[#F0EEE9]">
                  {["Name", "Email", "Status", "Enrolled", "Completed"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-[#A8A39C] uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {enrollments.map((e, i) => (
                  <tr key={e.id} className={cn("border-b border-[#F0EEE9] last:border-none hover:bg-[#FAFAF9] transition-colors", i % 2 !== 0 ? "bg-[#FAFAF9]/40" : "")}>
                    <td className="px-4 py-3 font-medium text-[#1A1916] whitespace-nowrap">{userName(e)}</td>
                    <td className="px-4 py-3 text-[#6B6560]">{e.user.email}</td>
                    <td className="px-4 py-3">
                      <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-semibold", STATUS_COLORS[e.status])}>
                        {e.status.charAt(0) + e.status.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#6B6560] whitespace-nowrap">{fmtDate(e.enrolledAt)}</td>
                    <td className="px-4 py-3 text-[#6B6560] whitespace-nowrap">{fmtDate(e.completedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}
