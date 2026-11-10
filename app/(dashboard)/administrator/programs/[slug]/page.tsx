"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { sanitizeHtml } from "@/lib/sanitize"
import { estimateLessonMinutes, fmtMins } from "@/lib/lesson-duration"
import { CoursePlayerSkeleton, InlineSkeleton } from "@/components/ui/skeleton"
import { ContentBlockViewer } from "@/components/programs/ContentBlockViewer"
import type { ContentBlock } from "@/components/forms/ContentBlockEditor"
import AssessmentManager from "@/components/assessments/AssessmentManager"
import ProgramProgress from "@/components/admin/ProgramProgress"
import { TickProgress } from "@/components/ui/TickProgress"
import { Panel, TabScroller, metaCls } from "@/components/admin/AdminKit"
import { DropdownMenu, type DropdownItem } from "@/components/ui/DropdownMenu"

// ── Types ─────────────────────────────────────────────────────────────────────

type CourseLevel  = "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
type CourseStatus = "DRAFT" | "PUBLISHED"
type EnrollStatus = "ACTIVE" | "COMPLETED" | "DROPPED"

/** The curriculum JSON, as the editor writes it. Chapters hold lessons, and a
 *  lesson's real content is its block list — the same shape the student player
 *  reads, so the rail and the lesson preview here can mirror it exactly. */
type Lesson  = {
  id?: string
  title: string
  description?: string | null
  /** Optional rich-text intro, rendered above the lesson content. */
  orientation?: string | null
  blocks?: ContentBlock[]
  estimatedMinutes?: number | null
}
type Chapter = { id?: string; week?: string; title: string; desc?: string | null; lessons?: Lesson[] }

type Facilitator = {
  name?: string; imageUrl?: string | null; title?: string
  bio?: string; credentials?: string | null
}

/** Field names here follow `ProgramRow` in services/program.service.ts, which
 *  is what GET /api/programs/[id] returns. */
type Program = {
  id:          string
  title:       string
  slug:        string
  excerpt:     string
  thumbnail:   string | null
  price:       number
  pricing:     string
  paymentType: string | null
  level:       CourseLevel
  featured:    boolean
  status:      CourseStatus
  predefinedAnalytics: boolean
  instructorId: string
  instructor:  { id: string; email: string; profile: { firstName: string | null; lastName: string | null } | null }
  categoryId:  string | null
  category:    { id: string; name: string; slug: string } | null
  createdAt:   string
  updatedAt:   string
  _count:      { enrollments: number }

  tagline:        string | null
  duration:       string | null
  format:         string | null
  startDate:      string | null
  endDate:        string | null
  cohortSize:     number | null
  rating:         number | null
  reviewCount:    number | null
  enrolledCount:  number | null
  countriesCount: number | null

  overview:           string | null
  targetAudience:     unknown | null
  learningObjectives: unknown | null
  curriculum:         unknown | null
  whatIsIncluded:     unknown | null
  faqs:               unknown | null
  facilitators:       unknown | null

  gradingEnabled:          boolean
  quizWeight:              number
  projectWeight:           number
  passMark:                number
  componentPassMark:       number
  maxQuizAttempts:         number
  attemptCooldownHours:    number
  maxProjectResubmissions: number

  programLevel:   { id: string; name: string; slug: string } | null
  programFormat:  { id: string; name: string; slug: string } | null
  programPricing: { id: string; name: string; slug: string } | null
}

type CertInfo = { id: string; verifyCode: string; issuedAt: string }

type Enrollment = {
  id:          string
  userId:      string
  courseId:    string
  status:      EnrollStatus
  enrolledAt:  string
  completedAt: string | null
  certificate: CertInfo | null
  user: {
    id:      string
    email:   string
    profile: { firstName: string | null; lastName: string | null } | null
  }
}

type TabKey =
  | "lesson" | "overview" | "curriculum" | "learners" | "progress"
  | "assessments" | "grading" | "facilitators" | "faqs" | "record"

/** What a lesson mostly *is*, for the rail's type icon. Mirrors the student
 *  player so a lesson reads the same in both workspaces. */
type LessonKind = "video" | "quiz" | "assignment" | "resource" | "reading"

// ── Constants ─────────────────────────────────────────────────────────────────

const LEVEL_LABELS: Record<CourseLevel, string> = {
  BEGINNER: "Beginner", INTERMEDIATE: "Intermediate", ADVANCED: "Advanced",
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

/** Stable per-lesson accent for the fallback stage, so a lesson without media
 *  still gets a distinct, repeatable look rather than a blank grey box. */
const STAGE_GRADIENTS = [
  "from-[#2C2368] via-[#4B3BA8] to-[#6655DF]",
  "from-[#0F2A4A] via-[#15496F] to-[#2E7BA6]",
  "from-[#3A1D52] via-[#6A2E73] to-[#A64B8B]",
  "from-[#113A33] via-[#1C6B52] to-[#3BA17C]",
  "from-[#4A2208] via-[#8A4418] to-[#C8762E]",
]

const Icon = {
  back:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></svg>,
  chevron: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>,
  check:   <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
  close:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
  panel:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="15" y1="3" x2="15" y2="21" /></svg>,
  search:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>,
  dots:    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.9" /><circle cx="12" cy="12" r="1.9" /><circle cx="12" cy="19" r="1.9" /></svg>,
  external:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>,
  download:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>,
  publish: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>,
  archive: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8" /><rect x="1" y="3" width="22" height="5" /><line x1="10" y1="12" x2="14" y2="12" /></svg>,
  edit:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>,
}

const KIND_ICON: Record<LessonKind, React.ReactNode> = {
  video:      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><rect x="2" y="4" width="14" height="16" rx="2" /><polygon points="16 10 22 7 22 17 16 14" /></svg>,
  reading:    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>,
  quiz:       <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
  assignment: <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>,
  resource:   <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>,
}

const KIND_LABEL: Record<LessonKind, string> = {
  video: "Video", reading: "Reading", quiz: "Quiz", assignment: "Assignment", resource: "Resource",
}

const proseCls =
  "text-[14px] text-[#171C35] leading-relaxed [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5 [&_p]:mb-2.5 last:[&_p]:mb-0 [&_h2]:font-bold [&_h2]:text-[15px] [&_h2]:mt-4 [&_h2]:mb-1.5 [&_h3]:font-bold [&_h3]:text-[14px] [&_h3]:mt-3 [&_h3]:mb-1 [&_a]:text-[#6655DF] [&_a]:underline"

// ── Helpers ───────────────────────────────────────────────────────────────────

/** `startDate` and `endDate` are `String?` in the schema, not DateTime, so they
 *  can hold free text like "Q1 2026". Parsing that yields an Invalid Date, and
 *  printing "Invalid Date" at a learner-facing figure is worse than printing
 *  what the author actually typed — so fall back to the raw value. */
function fmtDate(value: string | null) {
  if (!value) return "—"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string" && v.trim() !== "") : []
}

function asFacilitators(value: unknown): Facilitator[] {
  return Array.isArray(value) ? (value as Facilitator[]).filter(f => f && typeof f === "object" && f.name) : []
}

function asFaqs(value: unknown): { q: string; a: string }[] {
  return Array.isArray(value)
    ? (value as { q?: string; a?: string }[])
        .filter(f => f && typeof f === "object" && f.q)
        .map(f => ({ q: f.q ?? "", a: f.a ?? "" }))
    : []
}

function asChapters(value: unknown): Chapter[] {
  return Array.isArray(value) ? (value as Chapter[]).filter(c => c && typeof c === "object") : []
}

function userName(e: Enrollment) {
  const p = e.user.profile
  if (p?.firstName || p?.lastName) return [p.firstName, p.lastName].filter(Boolean).join(" ")
  return e.user.email
}

function instructorName(p: Program) {
  const prof = p.instructor.profile
  if (prof?.firstName || prof?.lastName) return [prof.firstName, prof.lastName].filter(Boolean).join(" ")
  return p.instructor.email
}

function lessonKind(lesson: Lesson): LessonKind {
  const types = new Set((lesson.blocks ?? []).map(b => b.type))
  if (types.has("video"))                        return "video"
  if (types.has("quiz"))                         return "quiz"
  if (types.has("assignment"))                   return "assignment"
  if (types.has("pdf") || types.has("document")) return "resource"
  return "reading"
}

/** The authoring gaps an admin actually needs to see: a lesson with no blocks
 *  at all renders empty for a learner, and a lesson with no id can never be
 *  marked complete, because progress is keyed on it. */
function lessonIssues(lesson: Lesson): string[] {
  const out: string[] = []
  if (!lesson.id)                      out.push("No id — progress can't be recorded")
  if (!(lesson.blocks ?? []).length)   out.push("No content blocks")
  if (!lesson.title?.trim())           out.push("No title")
  return out
}

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

// ── Small presentational pieces ───────────────────────────────────────────────

/** Thin circular meter for the top bar. */
function ProgressRing({ pct, done }: { pct: number; done: boolean }) {
  const r = 13
  const c = 2 * Math.PI * r
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" className="-rotate-90 shrink-0">
      <circle cx="16" cy="16" r={r} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="3.5" />
      <circle
        cx="16" cy="16" r={r} fill="none" strokeWidth="3.5" strokeLinecap="round"
        stroke={done ? "#34D399" : "#A99BFF"}
        strokeDasharray={c}
        strokeDashoffset={c - (c * pct) / 100}
        className="transition-[stroke-dashoffset] duration-500"
      />
    </svg>
  )
}

function StatTile({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-[12px] border border-[#DFE2ED] bg-white px-3.5 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#8A90A6]">{label}</p>
      <p className="text-[15px] font-extrabold text-[#171C35] mt-1 leading-tight">{value}</p>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 py-3 border-b border-[#F0EFFA] last:border-none">
      <span className={cn("w-28 shrink-0 pt-0.5", metaCls)}>{label}</span>
      <span className="text-[14px] text-[#171C35] flex-1">{value ?? <span className="text-[#8A90A6]">—</span>}</span>
    </div>
  )
}

/** The kit's Panel with its body padding removed: the bodies on this page
 *  carry their own (InfoRow rows, divided lists, a full-bleed table). Going
 *  through Panel means the panel heading is the workspace's 14px bold one
 *  rather than a second, smaller heading style invented here. */
function Card({ title, aside, children }: { title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return <Panel title={title} action={aside} bodyClassName="p-0">{children}</Panel>
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h4 className="text-[15px] font-bold text-[#171C35] mb-2.5">{children}</h4>
}

function Hollow({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[14px] border border-dashed border-[#DFE2ED] bg-white px-4 py-12 text-center">
      <p className="text-[14px] text-[#69708A]">{children}</p>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProgramDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const router   = useRouter()

  const [program,       setProgram]       = useState<Program | null>(null)
  const [enrollments,   setEnrollments]   = useState<Enrollment[]>([])
  const [loading,       setLoading]       = useState(true)
  const [enrollLoading, setEnrollLoading] = useState(true)
  const [error,         setError]         = useState<string | null>(null)
  const [actionId,      setActionId]      = useState<string | null>(null)
  const [statusSaving,  setStatusSaving]  = useState(false)

  // Player chrome, mirroring the student page.
  const [tab, setTab]                           = useState<TabKey>("overview")
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null)
  const [openChapters, setOpenChapters]         = useState<Set<number>>(new Set([0]))
  const [railOpen, setRailOpen]                 = useState(true)
  const [drawerOpen, setDrawerOpen]             = useState(false)
  const [railQuery, setRailQuery]               = useState("")
  const [metricsOpen, setMetricsOpen]           = useState(false)
  const metricsRef = useRef<HTMLDivElement>(null)

  // ── Mutations ──────────────────────────────────────────────────────────────

  async function markComplete(enrollmentId: string) {
    setActionId(enrollmentId)
    try {
      const res = await fetch(`/api/programs/${slug}/enrollments/${enrollmentId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ status: "COMPLETED" }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        toast.error(d.error ?? "Could not mark this enrolment complete.")
        return
      }
      const data = await res.json()
      setEnrollments(prev => prev.map(e =>
        e.id === enrollmentId
          ? { ...e, status: "COMPLETED", completedAt: data.enrollment.completedAt, certificate: data.certificate }
          : e
      ))
    } finally {
      setActionId(null)
    }
  }

  async function issueCert(enrollmentId: string, userId: string, courseId: string) {
    setActionId(enrollmentId)
    try {
      const res = await fetch("/api/certificates", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ userId, courseId }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        toast.error(d.error ?? "Could not issue the certificate.")
        return
      }
      const data = await res.json()
      setEnrollments(prev => prev.map(e =>
        e.id === enrollmentId ? { ...e, certificate: data.certificate } : e
      ))
    } finally {
      setActionId(null)
    }
  }

  async function revokeCert(certId: string, enrollmentId: string) {
    setActionId(enrollmentId)
    try {
      const res = await fetch(`/api/certificates/${certId}`, { method: "DELETE" })
      if (res.ok) {
        setEnrollments(prev => prev.map(e =>
          e.id === enrollmentId ? { ...e, certificate: null } : e
        ))
      } else {
        toast.error("Could not revoke the certificate.")
      }
    } finally {
      setActionId(null)
    }
  }

  /** A draft can go live and a live programme can go back to draft, so the pair
   *  is a round trip — the same contract the programme list uses. */
  async function setStatus(next: CourseStatus) {
    if (!program) return
    setStatusSaving(true)
    try {
      const res = await fetch(`/api/programs/${program.id}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ status: next }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        toast.error(d.error ?? "Failed to update programme status.")
        return
      }
      setProgram(p => (p ? { ...p, status: next } : p))
      toast.success(next === "PUBLISHED"
        ? `"${program.title}" is now live.`
        : `"${program.title}" has been archived back to draft and is off the public site.`)
    } finally {
      setStatusSaving(false)
    }
  }

  // ── Load ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false

    async function loadProgram() {
      try {
        const res = await fetch(`/api/programs/${slug}`)
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          if (!cancelled) setError(err.error ?? `Error ${res.status}`)
          return
        }
        const data = await res.json()
        if (!cancelled) setProgram(data.program)
      } catch {
        if (!cancelled) setError("Failed to load programme.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    async function loadEnrollments() {
      try {
        const res = await fetch(`/api/programs/${slug}/enrollments`)
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled) setEnrollments(data.enrollments ?? [])
      } catch {
        // non-critical: the roster tab shows its own empty state
      } finally {
        if (!cancelled) setEnrollLoading(false)
      }
    }

    loadProgram()
    loadEnrollments()
    return () => { cancelled = true }
  }, [slug])

  // Dismiss the metrics popover on an outside click or Escape.
  useEffect(() => {
    if (!metricsOpen) return
    function onDown(e: MouseEvent) {
      if (metricsRef.current && !metricsRef.current.contains(e.target as Node)) setMetricsOpen(false)
    }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setMetricsOpen(false) }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [metricsOpen])

  // ── Derived ────────────────────────────────────────────────────────────────

  const chapters = useMemo(() => asChapters(program?.curriculum), [program?.curriculum])

  /** Every lesson in order, with the chapter it belongs to — the rail, the
   *  stage and the prev/next pager all index into this one list. */
  const flat = useMemo(
    () => chapters.flatMap((chapter, ci) =>
      (chapter.lessons ?? []).map(lesson => ({ ci, chapter, lesson }))),
    [chapters],
  )

  const objectives   = useMemo(() => asStringArray(program?.learningObjectives), [program?.learningObjectives])
  const audience     = useMemo(() => asStringArray(program?.targetAudience), [program?.targetAudience])
  const included     = useMemo(() => asStringArray(program?.whatIsIncluded), [program?.whatIsIncluded])
  const faqs         = useMemo(() => asFaqs(program?.faqs), [program?.faqs])
  const facilitators = useMemo(() => asFacilitators(program?.facilitators), [program?.facilitators])

  const railChapters = useMemo(() => {
    const q = railQuery.trim().toLowerCase()
    return chapters
      .map((chapter, ci) => {
        const lessons = chapter.lessons ?? []
        const visible = q
          ? lessons.filter(l => l.title?.toLowerCase().includes(q))
          : lessons
        return {
          ci, chapter, lessons, visible,
          minutes: lessons.reduce((s, l) => s + estimateLessonMinutes(l), 0),
          issues:  lessons.reduce((s, l) => s + (lessonIssues(l).length > 0 ? 1 : 0), 0),
        }
      })
      .filter(c => !q || c.visible.length > 0)
  }, [chapters, railQuery])

  const selected      = flat.find(f => f.lesson.id && f.lesson.id === selectedLessonId) ?? null
  const selectedIndex = selected ? flat.indexOf(selected) : -1
  const stageBlock    = selected?.lesson.blocks?.find(b => b.type === "video" || b.type === "image") ?? null

  const total     = enrollments.length
  const active    = enrollments.filter(e => e.status === "ACTIVE").length
  const completed = enrollments.filter(e => e.status === "COMPLETED").length
  const dropped   = enrollments.filter(e => e.status === "DROPPED").length
  const certified = enrollments.filter(e => e.certificate).length
  // An approximation: the schema records no payments, so this prices completed
  // enrolments at list price rather than reporting money actually taken.
  const revenue   = completed * (program?.price ?? 0)
  const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0

  const chapterTotal = chapters.length
  const lessonTotal  = flat.length
  const totalMinutes = flat.reduce((s, f) => s + estimateLessonMinutes(f.lesson), 0)
  const blockTotal   = flat.reduce((s, f) => s + (f.lesson.blocks?.length ?? 0), 0)
  const quizLessons  = flat.filter(f => (f.lesson.blocks ?? []).some(b => b.type === "quiz")).length
  const assignLessons= flat.filter(f => (f.lesson.blocks ?? []).some(b => b.type === "assignment")).length
  const flaggedCount = flat.filter(f => lessonIssues(f.lesson).length > 0).length

  // ── Actions ────────────────────────────────────────────────────────────────

  function selectLesson(ci: number, lessonId: string) {
    setSelectedLessonId(lessonId)
    setOpenChapters(prev => new Set(prev).add(ci))
    setTab("lesson")
    setDrawerOpen(false)
  }

  function toggleChapter(ci: number) {
    setOpenChapters(prev => {
      const next = new Set(prev)
      if (next.has(ci)) next.delete(ci); else next.add(ci)
      return next
    })
  }

  // ── Loading / error ────────────────────────────────────────────────────────

  if (loading) return <CoursePlayerSkeleton />

  if (error || !program) {
    return (
      <div className="h-full flex items-center justify-center bg-[#F5F6FB] px-4">
        <div className="text-center">
          <p className="text-[15px] font-bold text-[#171C35]">{error ?? "Programme not found."}</p>
          <button
            onClick={() => router.push("/administrator/programs")}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[13px] font-semibold bg-[#6655DF] text-white hover:bg-[#2C2368] transition-colors cursor-pointer"
          >
            Back to programmes
          </button>
        </div>
      </div>
    )
  }

  const live = program.status === "PUBLISHED"

  const TABS: { key: TabKey; label: string; badge?: number }[] = [
    { key: "overview",     label: "Overview" },
    { key: "curriculum",   label: "Curriculum",   badge: chapterTotal },
    { key: "lesson",       label: "Lesson" },
    { key: "learners",     label: "Learners",     badge: total },
    { key: "progress",     label: "Progress" },
    { key: "assessments",  label: "Assessments" },
    { key: "grading",      label: "Grading" },
    { key: "facilitators", label: "Facilitators", badge: facilitators.length },
    { key: "faqs",         label: "FAQs",         badge: faqs.length },
    { key: "record",       label: "Record" },
  ]

  const menuItems: DropdownItem[] = [
    {
      label: "View public page",
      description: live ? "Opens the live listing" : "Draft — not on the public site",
      icon: Icon.external,
      onSelect: () => window.open(`/programs/${program.slug}`, "_blank", "noopener,noreferrer"),
    },
    {
      label: "Edit programme",
      description: "Opens the editor on the programme list",
      icon: Icon.edit,
      onSelect: () => router.push("/administrator/programs"),
    },
    ...(enrollments.length > 0
      ? [{
          label: "Export learners CSV",
          description: `${total} enrolment${total === 1 ? "" : "s"}`,
          icon: Icon.download,
          onSelect: () => exportCSV(enrollments, program.title),
        } as DropdownItem]
      : []),
    { type: "separator" as const },
    live
      ? {
          label: statusSaving ? "Archiving…" : "Archive programme",
          description: "Back to draft, off the public site",
          icon: Icon.archive,
          onSelect: () => setStatus("DRAFT"),
        }
      : {
          label: statusSaving ? "Approving…" : "Approve programme",
          description: "Publish it to the public site",
          icon: Icon.publish,
          onSelect: () => setStatus("PUBLISHED"),
        },
  ]

  // ── Rail (shared by the desktop aside and the mobile drawer) ───────────────

  const railBody = (
    <>
      <div className="shrink-0 px-3.5 py-2.5 border-b border-[#DFE2ED] bg-white">
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8A90A6]">{Icon.search}</span>
          <input
            value={railQuery}
            onChange={e => setRailQuery(e.target.value)}
            placeholder="Search lessons…"
            className="w-full pl-8 pr-3 py-1.5 text-[14px] font-bold bg-[#FAFAFF] border border-[#DFE2ED] rounded-[9px] text-[#171C35] outline-none placeholder:text-[#8A90A6] focus:border-[#6655DF] transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain">
        {railChapters.length === 0 && (
          <p className="px-4 py-8 text-center text-[14px] font-bold text-[#8A90A6]">
            {railQuery.trim() ? `No lessons match “${railQuery}”.` : "No chapters authored yet."}
          </p>
        )}
        {railChapters.map(({ ci, chapter, lessons, visible, minutes, issues }) => {
          const open = openChapters.has(ci) || !!railQuery.trim()
          return (
            <div key={ci} className="border-b border-[#F0EFFA] last:border-none">
              <button
                type="button"
                onClick={() => toggleChapter(ci)}
                className="w-full flex items-start justify-between gap-2 px-4 py-3 text-left cursor-pointer hover:bg-[#FAFAFF] transition-colors"
              >
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-[14px] font-bold text-[#171C35]">
                    <span className="line-clamp-2">Section {ci + 1}: {chapter.title}</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] tracking-[0.12em] uppercase font-extrabold text-[#8A90A6] mt-1">
                    {lessons.length} lesson{lessons.length === 1 ? "" : "s"} · ~{fmtMins(minutes)}
                    {issues > 0 && (
                      <span className="text-amber-600 normal-case tracking-normal font-bold">· {issues} to fix</span>
                    )}
                  </span>
                </span>
                <span className={cn("shrink-0 text-[#69708A] mt-0.5 transition-transform", open && "rotate-180")}>{Icon.chevron}</span>
              </button>

              {open && (
                <div className="border-t border-[#F0EFFA] bg-[#FCFCFE]">
                  {visible.length === 0 && (
                    <p className="px-3.5 py-3 text-[12px] text-[#8A90A6]">No lessons in this section.</p>
                  )}
                  {visible.map((lesson, li) => {
                    const activeRow = !!lesson.id && lesson.id === selectedLessonId
                    const kind      = lessonKind(lesson)
                    const issueList = lessonIssues(lesson)
                    const number    = lessons.indexOf(lesson) + 1
                    return (
                      <button
                        key={lesson.id ?? li}
                        type="button"
                        disabled={!lesson.id}
                        onClick={() => lesson.id && selectLesson(ci, lesson.id)}
                        className={cn(
                          "w-full flex items-start gap-2.5 px-3.5 py-2.5 text-left border-t border-[#F3F4FA] first:border-t-0 transition-colors relative",
                          lesson.id ? "cursor-pointer" : "cursor-default",
                          activeRow ? "bg-[#EEECFF]" : "hover:bg-white",
                        )}
                      >
                        {activeRow && <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#6655DF]" />}
                        <span className={cn(
                          "mt-0.5 w-[18px] h-[18px] rounded-[5px] flex items-center justify-center shrink-0",
                          issueList.length > 0 ? "bg-amber-50 text-amber-600" : "bg-[#EEECFF] text-[#6655DF]",
                        )}>
                          {KIND_ICON[kind]}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className={cn(
                            "block text-[14px] font-bold leading-snug",
                            activeRow ? "text-[#2C2368]" : "text-[#171C35]",
                          )}>
                            {number}. {lesson.title || "Untitled lesson"}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] tracking-[0.12em] uppercase font-extrabold text-[#8A90A6] mt-1">
                            {KIND_LABEL[kind]} · {lesson.blocks?.length ?? 0} block{(lesson.blocks?.length ?? 0) === 1 ? "" : "s"} · ~{fmtMins(estimateLessonMinutes(lesson))}
                          </span>
                          {issueList.length > 0 && (
                            <span className="block text-[11px] font-bold text-amber-700 mt-1">{issueList[0]}</span>
                          )}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )

  // ── Render ─────────────────────────────────────────────────────────────────

  const lessonStage = tab === "lesson" && selected

  return (
    <div className="h-full flex flex-col bg-[#0B0E24]">

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <header className="shrink-0 h-14 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 bg-[#12163A] border-b border-white/10">
        <Link
          href="/administrator/programs"
          className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[9px] text-[12px] font-semibold text-white/70 hover:text-white hover:bg-white/10 transition-colors no-underline"
        >
          {Icon.back}
          <span className="hidden sm:inline">Programmes</span>
        </Link>

        <div className="w-px h-5 bg-white/15 shrink-0 hidden sm:block" />

        {/* The badge is grouped with the title rather than pushed to the far
            right, so it reads as a label on this programme and not as another
            toolbar control. The title truncates inside the group, which keeps
            the badge adjacent to the text however long the title is. */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <h1 className="min-w-0 text-[14px] font-bold text-white truncate">{program.title}</h1>
          <span className={cn(
            "shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-[0.08em]",
            live ? "bg-emerald-400/20 text-emerald-300" : "bg-amber-400/20 text-amber-200",
          )}>
            {live ? "Live" : "Draft"}
          </span>
        </div>

        {/* Completion, with the enrolment split behind it */}
        <div ref={metricsRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMetricsOpen(o => !o)}
            aria-haspopup="dialog"
            aria-expanded={metricsOpen}
            className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <span className="relative flex items-center justify-center">
              <ProgressRing pct={completionPct} done={total > 0 && completed === total} />
              <span className="absolute text-[9px] font-extrabold text-white">{completionPct}</span>
            </span>
            <span className="hidden sm:inline text-[12px] font-semibold text-white/85">Completion</span>
          </button>

          {metricsOpen && (
            <div role="dialog" className="absolute right-0 top-[calc(100%+8px)] z-30 w-72 bg-white rounded-[14px] shadow-[0_18px_44px_rgba(5,8,26,0.4)] border border-[#DFE2ED] p-4">
              {enrollLoading ? (
                <InlineSkeleton rows={2} />
              ) : total === 0 ? (
                <p className="text-[12.5px] text-[#69708A]">No one is enrolled yet, so there is nothing to measure.</p>
              ) : (
                <>
                  <p className="text-[12px] font-bold text-[#171C35]">
                    {completed} of {total} enrolment{total === 1 ? "" : "s"} complete
                  </p>
                  <TickProgress
                    value={completionPct}
                    ticks={30}
                    tone={completed === total ? "success" : "brand"}
                    className="mt-2"
                  />
                  <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]">
                    {([
                      ["Active", active], ["Completed", completed],
                      ["Dropped", dropped], ["Certificates", certified],
                    ] as const).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between gap-2">
                        <dt className="text-[#8A90A6] font-semibold">{k}</dt>
                        <dd className="text-[#171C35] font-extrabold">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <button
                    type="button"
                    onClick={() => { setTab("progress"); setMetricsOpen(false) }}
                    className="mt-3 w-full inline-flex items-center justify-center px-3 py-2 rounded-[10px] text-[12px] font-semibold bg-[#6655DF] text-white hover:bg-[#2C2368] transition-colors cursor-pointer"
                  >
                    Open lesson-level progress
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <DropdownMenu
          triggerLabel="Programme actions"
          trigger={Icon.dots}
          items={menuItems}
          align="right"
          menuWidth="w-64"
          header={<span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#8A90A6]">Programme</span>}
          triggerClassName="shrink-0 w-8 h-8 flex items-center justify-center rounded-[9px] text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        />

        {/* Rail toggles */}
        <button
          type="button"
          onClick={() => setRailOpen(o => !o)}
          aria-label={railOpen ? "Hide programme content" : "Show programme content"}
          className="hidden lg:flex shrink-0 w-8 h-8 items-center justify-center rounded-[9px] text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          {Icon.panel}
        </button>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="lg:hidden shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[9px] text-[12px] font-semibold bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
        >
          {Icon.panel}
          <span className="hidden sm:inline">Content</span>
        </button>
      </header>

      {/* ── Stage + rail ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex min-h-0">

        <div className="flex-1 min-w-0 overflow-y-auto bg-[#F5F6FB]">

          {/* Stage. In the Lesson tab it shows the lesson's own media, exactly
              as a learner would see it; otherwise it carries the programme. */}
          <div className="bg-[#0B0E24]">
            {lessonStage && stageBlock?.type === "video" && stageBlock.url ? (
              <div className="aspect-video w-full bg-black">
                <video controls src={stageBlock.url} className="w-full h-full" />
              </div>
            ) : lessonStage && stageBlock?.type === "image" && stageBlock.url ? (
              <div className="relative aspect-video w-full bg-black">
                <Image src={stageBlock.url} alt={stageBlock.caption || selected.lesson.title} fill className="object-contain" />
              </div>
            ) : (
              <div className="relative w-full aspect-[21/7] min-h-45 flex items-end overflow-hidden">
                {program.thumbnail ? (
                  <Image
                    src={program.thumbnail}
                    alt={program.title}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 70vw"
                    className="object-cover"
                  />
                ) : (
                  <div className={cn(
                    "absolute inset-0 bg-gradient-to-br",
                    STAGE_GRADIENTS[Math.max(0, selectedIndex) % STAGE_GRADIENTS.length],
                  )} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E24] via-[#0B0E24]/80 to-[#0B0E24]/30" />
                <div className="relative p-5 sm:p-8 w-full">
                  <span className="block text-[12px] tracking-[0.12em] uppercase font-extrabold text-white/80 mb-1.5">
                    {lessonStage
                      ? `Section ${selected.ci + 1} · Lesson ${selectedIndex + 1} of ${flat.length}`
                      : `${live ? "Live" : "Draft"} · ${LEVEL_LABELS[program.level]}${program.category ? ` · ${program.category.name}` : ""}`}
                  </span>
                  <p className="text-[clamp(28px,3.4vw,40px)] leading-[1.1] tracking-[-0.035em] font-extrabold text-white max-w-3xl [text-shadow:0_2px_14px_rgba(0,0,0,0.5)]">
                    {lessonStage ? selected.lesson.title : program.title}
                  </p>
                  {lessonStage ? (
                    <span className="inline-flex items-center gap-1.5 mt-3 px-2.5 py-1 rounded-full bg-white/18 text-white text-[11px] tracking-[0.12em] uppercase font-extrabold backdrop-blur-sm">
                      {KIND_ICON[lessonKind(selected.lesson)]}
                      {KIND_LABEL[lessonKind(selected.lesson)]} · ~{fmtMins(estimateLessonMinutes(selected.lesson))}
                    </span>
                  ) : program.tagline ? (
                    <p className="text-[14px] font-bold text-white/70 mt-2 max-w-2xl">{program.tagline}</p>
                  ) : null}
                </div>
              </div>
            )}
          </div>

          {/* Bar: who/what, plus the one action that belongs at this level */}
          <div className="bg-white border-b border-[#DFE2ED]">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <span className="block text-[12px] tracking-[0.12em] uppercase font-extrabold text-[#6655DF] mb-1.5 truncate">
                    {lessonStage
                      ? `Section ${selected.ci + 1} · ${selected.chapter.title}`
                      : `Instructor of record · ${instructorName(program)}`}
                  </span>
                  <h2 className="text-[clamp(28px,3.4vw,40px)] leading-[1.1] tracking-[-0.035em] font-extrabold text-[#171C35]">
                    {lessonStage ? selected.lesson.title : program.title}
                  </h2>
                  <p className="flex flex-wrap items-center gap-1.5 text-[11.5px] text-[#8A90A6] mt-1.5">
                    {lessonStage ? (
                      <>
                        <span>{KIND_ICON[lessonKind(selected.lesson)]}</span>
                        {KIND_LABEL[lessonKind(selected.lesson)]}
                        <span className="text-[#D8DAE5]">·</span>
                        {selected.lesson.blocks?.length ?? 0} block{(selected.lesson.blocks?.length ?? 0) === 1 ? "" : "s"}
                        <span className="text-[#D8DAE5]">·</span>
                        ~{fmtMins(estimateLessonMinutes(selected.lesson))}
                      </>
                    ) : (
                      <>
                        {lessonTotal} lesson{lessonTotal === 1 ? "" : "s"} across {chapterTotal} section{chapterTotal === 1 ? "" : "s"}
                        <span className="text-[#D8DAE5]">·</span>
                        ~{fmtMins(totalMinutes)} of content
                        <span className="text-[#D8DAE5]">·</span>
                        created {fmtDate(program.createdAt)}
                      </>
                    )}
                  </p>
                </div>

                {lessonStage ? (
                  <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold bg-[#F0EFFA] text-[#69708A]">
                    Read-only preview
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={statusSaving}
                    onClick={() => setStatus(live ? "DRAFT" : "PUBLISHED")}
                    className={cn(
                      "shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[12.5px] font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
                      live
                        ? "bg-[#F0EFFA] text-[#171C35] hover:bg-[#E4E2F5]"
                        : "bg-[#6655DF] text-white hover:bg-[#2C2368]",
                    )}
                  >
                    {live ? Icon.archive : Icon.publish}
                    {statusSaving ? "Saving…" : live ? "Archive to draft" : "Approve and publish"}
                  </button>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6">
              <TabScroller activeKey={tab} role="tablist" aria-label="Programme view">
                {TABS.map(t => (
                  <button
                    key={t.key}
                    type="button"
                    role="tab"
                    aria-selected={tab === t.key}
                    onClick={() => setTab(t.key)}
                    className={cn(
                      "shrink-0 px-3.5 py-2.5 text-[14px] font-bold border-b-2 transition-colors cursor-pointer",
                      tab === t.key
                        ? "border-[#6655DF] text-[#171C35]"
                        : "border-transparent text-[#69708A] hover:text-[#171C35]",
                    )}
                  >
                    {t.label}
                    {t.badge !== undefined && t.badge > 0 && (
                      <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#F0EFFA] text-[#69708A]">{t.badge}</span>
                    )}
                  </button>
                ))}
              </TabScroller>
            </div>
          </div>

          {/* ── Tab panels ──────────────────────────────────────────────────── */}
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-16">

            {/* Lesson — what a learner sees, read-only */}
            {tab === "lesson" && (
              !selected ? (
                <Hollow>
                  {lessonTotal === 0
                    ? "No curriculum has been authored for this programme yet, so there is no lesson to preview."
                    : "Pick a lesson from Programme content to preview exactly what a learner sees."}
                </Hollow>
              ) : (
                <div className="space-y-5">
                  {lessonIssues(selected.lesson).length > 0 && (
                    <div className="rounded-[14px] border border-amber-200 bg-amber-50 px-4 py-3">
                      <p className="text-[12px] font-extrabold uppercase tracking-[0.08em] text-amber-700">Needs attention</p>
                      <ul className="mt-1.5 space-y-1">
                        {lessonIssues(selected.lesson).map((issue, i) => (
                          <li key={i} className="text-[13px] text-amber-900">{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selected.lesson.orientation && (
                    <section className="rounded-[14px] border border-[#DFE2ED] bg-[#FAFAFF] px-4 py-4 sm:px-5">
                      <h3 className="text-[11px] tracking-[0.12em] uppercase font-extrabold text-[#6655DF]">
                        Why this lesson matters
                      </h3>
                      <div
                        className={cn(proseCls, "mt-2 text-[#2C2368]")}
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(selected.lesson.orientation) }}
                      />
                    </section>
                  )}

                  {selected.lesson.description && (
                    <div className={proseCls} dangerouslySetInnerHTML={{ __html: sanitizeHtml(selected.lesson.description) }} />
                  )}

                  {/* No programSlug: assignment blocks stay read-only here, and
                      quiz blocks carry no student progress. */}
                  <ContentBlockViewer blocks={selected.lesson.blocks ?? []} />

                  {(selected.lesson.blocks ?? []).length === 0 && !selected.lesson.description && (
                    <Hollow>This lesson has no content blocks, so a learner would open it and find an empty page.</Hollow>
                  )}

                  {/* Prev / next, so a reviewer can walk the whole programme */}
                  <div className="flex items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      disabled={selectedIndex <= 0}
                      onClick={() => {
                        const prev = flat[selectedIndex - 1]
                        if (prev?.lesson.id) selectLesson(prev.ci, prev.lesson.id)
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[12.5px] font-semibold border border-[#DFE2ED] bg-white text-[#171C35] hover:border-[#6655DF] hover:text-[#6655DF] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Previous lesson
                    </button>
                    <span className="text-[11.5px] font-bold text-[#8A90A6]">
                      {selectedIndex + 1} of {flat.length}
                    </span>
                    <button
                      type="button"
                      disabled={selectedIndex >= flat.length - 1}
                      onClick={() => {
                        const next = flat[selectedIndex + 1]
                        if (next?.lesson.id) selectLesson(next.ci, next.lesson.id)
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[12.5px] font-semibold border border-[#DFE2ED] bg-white text-[#171C35] hover:border-[#6655DF] hover:text-[#6655DF] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Next lesson
                    </button>
                  </div>
                </div>
              )
            )}

            {/* Overview */}
            {tab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  <StatTile label="Status"   value={live ? "Live" : "Draft"} />
                  <StatTile label="Enrolled" value={total} />
                  <StatTile label="Completion" value={`${completionPct}%`} />
                  <StatTile label="Certificates" value={certified} />
                  <StatTile label="Revenue" value={program.price > 0 ? `$${revenue.toLocaleString()}` : "Free"} />
                  <StatTile label="Lessons"  value={lessonTotal} />
                  <StatTile label="Sections" value={chapterTotal} />
                  <StatTile label="Content"  value={`~${fmtMins(totalMinutes)}`} />
                  <StatTile label="Level"    value={LEVEL_LABELS[program.level]} />
                  {program.duration && <StatTile label="Duration" value={program.duration} />}
                  {program.format   && <StatTile label="Format"   value={program.format} />}
                  {program.category && <StatTile label="Category" value={program.category.name} />}
                </div>

                <p className="text-[11px] text-[#8A90A6] -mt-3">
                  Content times are estimated from each lesson&apos;s material, not measured playback. Revenue prices
                  completed enrolments at list price — the schema records no payments.
                </p>

                {program.excerpt && (
                  <section>
                    <SectionHeading>Card summary</SectionHeading>
                    <p className="text-[14px] text-[#171C35] leading-relaxed whitespace-pre-wrap">{program.excerpt}</p>
                  </section>
                )}

                {program.overview && (
                  <section>
                    <SectionHeading>About this programme</SectionHeading>
                    <div className={proseCls} dangerouslySetInnerHTML={{ __html: sanitizeHtml(program.overview) }} />
                  </section>
                )}

                {objectives.length > 0 && (
                  <section>
                    <SectionHeading>What learners will take away</SectionHeading>
                    <ul className="grid sm:grid-cols-2 gap-x-5 gap-y-2">
                      {objectives.map((o, i) => (
                        <li key={i} className="flex items-start gap-2 text-[14px] text-[#171C35] leading-snug">
                          <span className="mt-0.5 text-emerald-600 shrink-0">{Icon.check}</span>
                          {o}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {audience.length > 0 && (
                  <section>
                    <SectionHeading>Who this is for</SectionHeading>
                    <ul className="space-y-1.5">
                      {audience.map((a, i) => (
                        <li key={i} className="flex items-start gap-2 text-[14px] text-[#171C35] leading-snug">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#6655DF] shrink-0" />
                          {a}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {included.length > 0 && (
                  <section>
                    <SectionHeading>What&apos;s included</SectionHeading>
                    <ul className="grid sm:grid-cols-2 gap-x-5 gap-y-2">
                      {included.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-[14px] text-[#171C35] leading-snug">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            )}

            {/* Curriculum — the authoring view of the same tree the rail shows */}
            {tab === "curriculum" && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  <StatTile label="Sections" value={chapterTotal} />
                  <StatTile label="Lessons"  value={lessonTotal} />
                  <StatTile label="Blocks"   value={blockTotal} />
                  <StatTile label="With a quiz" value={quizLessons} />
                  <StatTile label="With an assignment" value={assignLessons} />
                </div>

                {flaggedCount > 0 && (
                  <div className="rounded-[14px] border border-amber-200 bg-amber-50 px-4 py-3">
                    <p className="text-[13px] font-bold text-amber-900">
                      {flaggedCount} lesson{flaggedCount === 1 ? "" : "s"} need attention
                    </p>
                    <p className="text-[12.5px] text-amber-800 mt-0.5">
                      A lesson with no blocks opens empty for a learner, and one without an id can never be marked
                      complete — progress is keyed on it. Flagged lessons are marked amber in the rail.
                    </p>
                  </div>
                )}

                {chapterTotal === 0 ? (
                  <Hollow>No curriculum has been authored yet. Add sections and lessons from the programme editor.</Hollow>
                ) : (
                  chapters.map((chapter, ci) => {
                    const lessons = chapter.lessons ?? []
                    return (
                      <Card
                        key={ci}
                        title={`Section ${ci + 1} — ${chapter.title}`}
                        aside={
                          <span className="text-[11px] font-bold text-[#8A90A6]">
                            {lessons.length} lesson{lessons.length === 1 ? "" : "s"} · ~{fmtMins(lessons.reduce((s, l) => s + estimateLessonMinutes(l), 0))}
                          </span>
                        }
                      >
                        {chapter.desc && (
                          <p className="px-5 pt-4 text-[14px] text-[#69708A] leading-relaxed">{chapter.desc}</p>
                        )}
                        {lessons.length === 0 ? (
                          <p className="px-5 py-4 text-[13px] text-[#8A90A6]">This section has no lessons.</p>
                        ) : (
                          <div className="divide-y divide-[#F0EFFA]">
                            {lessons.map((lesson, li) => {
                              const kind   = lessonKind(lesson)
                              const issues = lessonIssues(lesson)
                              return (
                                <div key={lesson.id ?? li} className="px-5 py-3.5 flex items-start gap-3">
                                  <span className={cn(
                                    "mt-0.5 w-[20px] h-[20px] rounded-[6px] flex items-center justify-center shrink-0",
                                    issues.length > 0 ? "bg-amber-50 text-amber-600" : "bg-[#EEECFF] text-[#6655DF]",
                                  )}>
                                    {KIND_ICON[kind]}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <p className="text-[14px] font-bold text-[#171C35]">{li + 1}. {lesson.title || "Untitled lesson"}</p>
                                      <span className="text-[10px] font-extrabold uppercase tracking-[0.08em] px-1.5 py-0.5 rounded-full bg-[#F0EFFA] text-[#69708A]">
                                        {KIND_LABEL[kind]}
                                      </span>
                                    </div>
                                    <p className="text-[11.5px] text-[#8A90A6] mt-1">
                                      {lesson.blocks?.length ?? 0} block{(lesson.blocks?.length ?? 0) === 1 ? "" : "s"} · ~{fmtMins(estimateLessonMinutes(lesson))}
                                    </p>
                                    {issues.length > 0 && (
                                      <p className="text-[11.5px] font-bold text-amber-700 mt-1">{issues.join(" · ")}</p>
                                    )}
                                  </div>
                                  {lesson.id && (
                                    <button
                                      type="button"
                                      onClick={() => selectLesson(ci, lesson.id!)}
                                      className="shrink-0 text-[11.5px] font-bold text-[#6655DF] hover:text-[#2C2368] transition-colors cursor-pointer"
                                    >
                                      Preview
                                    </button>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </Card>
                    )
                  })
                )}
              </div>
            )}

            {/* Learners — the roster, with the certificate actions */}
            {tab === "learners" && (
              <Card
                title="Enrolments"
                aside={
                  !enrollLoading && enrollments.length > 0 ? (
                    <button
                      onClick={() => exportCSV(enrollments, program.title)}
                      className="text-[11px] font-bold text-[#6655DF] hover:text-[#2C2368] transition-colors cursor-pointer"
                    >
                      Export CSV
                    </button>
                  ) : undefined
                }
              >
                {enrollLoading ? (
                  <InlineSkeleton rows={3} />
                ) : enrollments.length === 0 ? (
                  <div className="px-5 py-12 text-center">
                    <p className="text-[14px] font-bold text-[#171C35]">No enrolments yet</p>
                    <p className="text-[13px] text-[#69708A] mt-1">
                      {live
                        ? "This programme is live, so enrolments will appear here as they come in."
                        : "This programme is a draft, so it is not open for enrolment."}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-[13px]">
                        <thead>
                          <tr className="border-b border-[#F0EFFA]">
                            {["Name", "Email", "Status", "Enrolled", "Completed", "Certificate", ""].map(h => (
                              <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-[#8A90A6] uppercase tracking-[0.5px] whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {enrollments.map((e, i) => (
                            <tr key={e.id} className={cn("border-b border-[#F0EFFA] last:border-none hover:bg-[#FAFAFF] transition-colors", i % 2 === 0 ? "" : "bg-[#FAFAFF]/40")}>
                              <td className="px-4 py-3 font-semibold text-[#171C35] whitespace-nowrap">{userName(e)}</td>
                              <td className="px-4 py-3 text-[#69708A]">{e.user.email}</td>
                              <td className="px-4 py-3">
                                <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-semibold", STATUS_COLORS[e.status])}>
                                  {e.status.charAt(0) + e.status.slice(1).toLowerCase()}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-[#69708A] whitespace-nowrap">{fmtDate(e.enrolledAt)}</td>
                              <td className="px-4 py-3 text-[#69708A] whitespace-nowrap">{fmtDate(e.completedAt)}</td>

                              <td className="px-4 py-3 whitespace-nowrap">
                                {e.certificate ? (
                                  <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700">Issued</span>
                                    <a
                                      href={`/verify/${e.certificate.verifyCode}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-[11px] text-[#6655DF] hover:underline"
                                    >
                                      Verify
                                    </a>
                                  </div>
                                ) : e.status === "COMPLETED" ? (
                                  <button
                                    onClick={() => issueCert(e.id, e.userId, e.courseId)}
                                    disabled={actionId === e.id}
                                    className="text-[11px] font-semibold text-[#6655DF] hover:text-[#2C2368] disabled:opacity-50 transition-colors cursor-pointer"
                                  >
                                    {actionId === e.id ? "Issuing…" : "Issue certificate"}
                                  </button>
                                ) : (
                                  <span className="text-[#8A90A6]">—</span>
                                )}
                              </td>

                              <td className="px-4 py-3 whitespace-nowrap">
                                <DropdownMenu
                                  triggerLabel={`Actions for ${userName(e)}`}
                                  trigger={Icon.dots}
                                  align="right"
                                  menuWidth="w-56"
                                  triggerClassName="w-7 h-7 flex items-center justify-center rounded-[8px] text-[#69708A] hover:bg-[#F0EFFA] hover:text-[#171C35] transition-colors cursor-pointer"
                                  items={[
                                    {
                                      label: "View learner",
                                      icon: Icon.external,
                                      onSelect: () => router.push(`/administrator/users/${e.userId}`),
                                    },
                                    ...(e.status === "ACTIVE"
                                      ? [{
                                          label: actionId === e.id ? "Saving…" : "Mark complete",
                                          description: "Also issues a certificate",
                                          icon: Icon.check,
                                          onSelect: () => markComplete(e.id),
                                        } as DropdownItem]
                                      : []),
                                    ...(e.certificate
                                      ? [
                                          { type: "separator" as const },
                                          {
                                            label: "Revoke certificate",
                                            danger: true,
                                            onSelect: () => revokeCert(e.certificate!.id, e.id),
                                          } as DropdownItem,
                                        ]
                                      : []),
                                  ]}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="md:hidden flex flex-col">
                      {enrollments.map(e => (
                        <div key={e.id} className="px-4 py-4 border-b border-[#F0EFFA] last:border-none flex flex-col gap-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-bold text-[#171C35] text-[14px] leading-tight truncate">{userName(e)}</p>
                              <p className="text-[12px] text-[#8A90A6] mt-0.5 truncate">{e.user.email}</p>
                            </div>
                            <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-semibold shrink-0", STATUS_COLORS[e.status])}>
                              {e.status.charAt(0) + e.status.slice(1).toLowerCase()}
                            </span>
                          </div>

                          <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]">
                            <div>
                              <dt className="text-[10px] uppercase tracking-[0.5px] text-[#8A90A6] font-bold">Enrolled</dt>
                              <dd className="text-[#171C35] font-semibold">{fmtDate(e.enrolledAt)}</dd>
                            </div>
                            <div>
                              <dt className="text-[10px] uppercase tracking-[0.5px] text-[#8A90A6] font-bold">Completed</dt>
                              <dd className="text-[#171C35] font-semibold">{fmtDate(e.completedAt)}</dd>
                            </div>
                            <div className="col-span-2">
                              <dt className="text-[10px] uppercase tracking-[0.5px] text-[#8A90A6] font-bold">Certificate</dt>
                              <dd className="text-[#171C35] font-semibold mt-0.5">
                                {e.certificate ? (
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700">Issued</span>
                                    <a
                                      href={`/verify/${e.certificate.verifyCode}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-[11px] text-[#6655DF] hover:underline"
                                    >
                                      Verify
                                    </a>
                                  </div>
                                ) : e.status === "COMPLETED" ? (
                                  <button
                                    onClick={() => issueCert(e.id, e.userId, e.courseId)}
                                    disabled={actionId === e.id}
                                    className="text-[11px] font-semibold text-[#6655DF] hover:text-[#2C2368] disabled:opacity-50 transition-colors cursor-pointer"
                                  >
                                    {actionId === e.id ? "Issuing…" : "Issue certificate"}
                                  </button>
                                ) : (
                                  <span className="text-[#8A90A6]">—</span>
                                )}
                              </dd>
                            </div>
                          </dl>

                          {(e.status === "ACTIVE" || e.certificate) && (
                            <div className="flex flex-wrap items-center gap-3 pt-1">
                              {e.status === "ACTIVE" && (
                                <button
                                  onClick={() => markComplete(e.id)}
                                  disabled={actionId === e.id}
                                  className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-800 disabled:opacity-50 transition-colors cursor-pointer"
                                >
                                  {actionId === e.id ? "Saving…" : "Mark complete"}
                                </button>
                              )}
                              {e.certificate && (
                                <button
                                  onClick={() => revokeCert(e.certificate!.id, e.id)}
                                  disabled={actionId === e.id}
                                  className="text-[11px] font-semibold text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors cursor-pointer"
                                >
                                  Revoke
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </Card>
            )}

            {/* Progress — lesson, quiz and assignment level */}
            {tab === "progress" && <ProgramProgress programId={program.id} />}

            {/* Assessments */}
            {tab === "assessments" && <AssessmentManager programId={program.id} />}

            {/* Grading policy */}
            {tab === "grading" && (
              <div className="space-y-5">
                {!program.gradingEnabled && (
                  <div className="rounded-[14px] border border-[#DFE2ED] bg-white px-4 py-3">
                    <p className="text-[13px] font-bold text-[#171C35]">Grading is off for this programme</p>
                    <p className="text-[12.5px] text-[#69708A] mt-0.5">
                      Learners can still take quizzes, but no overall grade is computed and the pass marks below are
                      not applied. Turn it on in the programme editor.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatTile label="Quiz weight"    value={`${program.quizWeight}%`} />
                  <StatTile label="Project weight" value={`${program.projectWeight}%`} />
                  <StatTile label="Pass mark"      value={program.passMark} />
                  <StatTile label="Component pass" value={program.componentPassMark} />
                </div>

                <Card title="Attempt policy">
                  <div className="px-5">
                    <InfoRow label="Quiz attempts" value={
                      program.maxQuizAttempts > 0
                        ? `${program.maxQuizAttempts} per assessment`
                        : "Unlimited"
                    } />
                    <InfoRow label="Cooldown" value={
                      program.attemptCooldownHours > 0
                        ? `${program.attemptCooldownHours} hour${program.attemptCooldownHours === 1 ? "" : "s"} between attempts`
                        : "No waiting period"
                    } />
                    <InfoRow label="Project resubmissions" value={
                      program.maxProjectResubmissions > 0
                        ? `${program.maxProjectResubmissions} allowed`
                        : "None — one submission only"
                    } />
                    <InfoRow label="Weighting" value={
                      program.quizWeight + program.projectWeight === 100
                        ? <span className="text-emerald-700 font-semibold">Quiz and project weights total 100%</span>
                        : <span className="text-amber-700 font-semibold">
                            Weights total {program.quizWeight + program.projectWeight}% — grades will not scale to the pass mark correctly
                          </span>
                    } />
                  </div>
                </Card>
              </div>
            )}

            {/* Facilitators */}
            {tab === "facilitators" && (
              <div className="space-y-5">
                <Card title="Instructor of record">
                  <div className="px-5">
                    <InfoRow label="Name"  value={instructorName(program)} />
                    <InfoRow label="Email" value={<span className="font-mono text-[12.5px] text-[#69708A]">{program.instructor.email}</span>} />
                    <InfoRow label="Account" value={
                      <Link href={`/administrator/users/${program.instructorId}`} className="text-[#6655DF] font-semibold hover:underline">
                        Open user record
                      </Link>
                    } />
                  </div>
                </Card>

                {facilitators.length === 0 ? (
                  <Hollow>No facilitators have been added. The public programme page will show only the instructor of record.</Hollow>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                    {facilitators.map((f, i) => (
                      <Card key={i} title={`Facilitator ${i + 1}`}>
                        <div className="px-5">
                          <InfoRow label="Name"  value={f.name} />
                          <InfoRow label="Title" value={f.title} />
                          <InfoRow label="Bio"   value={
                            f.bio ? <span className="whitespace-pre-wrap leading-relaxed">{f.bio}</span> : null
                          } />
                          <InfoRow label="Credentials" value={f.credentials} />
                          <InfoRow label="Photo" value={
                            f.imageUrl
                              ? <span className="font-mono text-[12px] text-[#69708A] break-all">{f.imageUrl}</span>
                              : <span className="text-amber-700 font-semibold">Missing — a placeholder initial will show</span>
                          } />
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* FAQs */}
            {tab === "faqs" && (
              faqs.length === 0 ? (
                <Hollow>No FAQs have been authored for this programme.</Hollow>
              ) : (
                <Card title={`FAQs · ${faqs.length}`}>
                  <div className="divide-y divide-[#F0EFFA]">
                    {faqs.map((faq, i) => (
                      <div key={i} className="px-5 py-4">
                        <p className="text-[15px] font-bold text-[#171C35] mb-1">{faq.q}</p>
                        <p className="text-[14px] text-[#69708A] leading-relaxed">{faq.a}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )
            )}

            {/* Record — the flat admin record, for checking what was actually saved */}
            {tab === "record" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
                <Card title="Identity">
                  <div className="px-5">
                    <InfoRow label="Title" value={program.title} />
                    <InfoRow label="Slug"  value={<span className="font-mono text-[12.5px] text-[#69708A]">{program.slug}</span>} />
                    <InfoRow label="Tagline" value={program.tagline} />
                    <InfoRow label="Level" value={
                      <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-semibold", LEVEL_COLORS[program.level])}>
                        {LEVEL_LABELS[program.level]}
                      </span>
                    } />
                    <InfoRow label="Category" value={program.category?.name} />
                  </div>
                </Card>

                {/* Status lives beside the title in the top bar, so repeating
                    it here would be a second source of truth for the same
                    fact. Price and payment moved in from the Commercial card:
                    what a programme costs is part of how it is published. */}
                <Card title="Publication">
                  <div className="px-5">
                    <InfoRow label="Featured" value={
                      <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-semibold",
                        program.featured ? "bg-amber-50 text-amber-700" : "bg-[#F5F6FB] text-[#69708A]")}>
                        {program.featured ? "Yes" : "No"}
                      </span>
                    } />
                    <InfoRow label="Price" value={
                      program.price > 0
                        ? `$${program.price}`
                        : <span className="text-emerald-700 font-semibold">Free</span>
                    } />
                    <InfoRow label="Pricing" value={program.programPricing?.name ?? program.pricing} />
                    <InfoRow label="Payment" value={program.paymentType} />
                    <InfoRow label="Updated" value={fmtDate(program.updatedAt)} />
                    <InfoRow label="Public page" value={
                      <a
                        href={`/programs/${program.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#6655DF] font-semibold hover:underline"
                      >
                        /programs/{program.slug}
                      </a>
                    } />
                  </div>
                </Card>

                <Card title="Delivery">
                  <div className="px-5">
                    <InfoRow label="Duration" value={program.duration} />
                    <InfoRow label="Format"   value={program.programFormat?.name ?? program.format} />
                    <InfoRow label="Starts"   value={fmtDate(program.startDate)} />
                    <InfoRow label="Ends"     value={fmtDate(program.endDate)} />
                    <InfoRow label="Cohort size" value={program.cohortSize != null ? `${program.cohortSize} participants` : null} />
                  </div>
                </Card>

                <Card
                  title="Social proof"
                  aside={
                    <span className={cn(
                      "text-[10px] font-extrabold uppercase tracking-[0.08em] px-1.5 py-0.5 rounded-full",
                      program.predefinedAnalytics ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700",
                    )}>
                      {program.predefinedAnalytics ? "Authored figures" : "Real figures"}
                    </span>
                  }
                >
                  <div className="px-5">
                    <InfoRow label="Rating"    value={program.rating != null ? `${program.rating} / 5.0` : null} />
                    <InfoRow label="Reviews"   value={program.reviewCount != null ? program.reviewCount.toLocaleString() : null} />
                    <InfoRow label="Enrolled"  value={program.enrolledCount != null ? `${program.enrolledCount.toLocaleString()}+` : null} />
                    <InfoRow label="Countries" value={program.countriesCount != null ? `${program.countriesCount}+` : null} />
                  </div>
                  <p className="px-5 pb-4 text-[11.5px] text-[#8A90A6]">
                    {program.predefinedAnalytics
                      ? "These are the numbers shown on the public page. They are authored, not measured — the live count is "
                      : "The public page shows the live enrolment count, which is currently "}
                    <span className="font-bold text-[#171C35]">{program._count?.enrollments ?? total}</span>.
                  </p>
                </Card>
              </div>
            )}

          </div>
        </div>

        {/* ── Rail — desktop ──────────────────────────────────────────────── */}
        <aside
          className={cn(
            "hidden lg:flex flex-col shrink-0 border-l border-[#DFE2ED] bg-white transition-[width] duration-200 overflow-hidden",
            railOpen ? "w-95" : "w-0 border-l-0",
          )}
        >
          <div className="shrink-0 flex items-center justify-between gap-2 px-4 h-12 border-b border-[#DFE2ED]">
            <h2 className="text-[14px] font-bold text-[#171C35]">Programme content</h2>
            <span className="text-[11px] tracking-[0.12em] uppercase font-extrabold text-[#8A90A6]">
              {lessonTotal} lesson{lessonTotal === 1 ? "" : "s"}
            </span>
          </div>
          {railBody}
        </aside>
      </div>

      {/* ── Rail — mobile drawer ──────────────────────────────────────────── */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="flex-1 bg-[#0B0E24]/55" onClick={() => setDrawerOpen(false)} />
          <div className="w-[88%] max-w-90 bg-white flex flex-col shadow-2xl">
            <div className="shrink-0 flex items-center justify-between gap-2 px-4 h-13 border-b border-[#DFE2ED]">
              <h2 className="text-[14px] font-bold text-[#171C35]">
                Programme content
                <span className="ml-2 text-[11px] tracking-[0.12em] uppercase font-extrabold text-[#8A90A6]">
                  {lessonTotal}
                </span>
              </h2>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close programme content"
                className="w-7 h-7 flex items-center justify-center rounded-full text-[#69708A] hover:bg-[#F5F6FB] cursor-pointer"
              >
                {Icon.close}
              </button>
            </div>
            {railBody}
          </div>
        </div>
      )}
    </div>
  )
}
