"use client"

import { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ContentBlockViewer } from "@/components/programs/ContentBlockViewer"
import StudentAssessments from "@/components/assessments/StudentAssessments"
import StudyPlanner from "@/components/study/StudyPlanner"
import { estimateLessonMinutes, fmtMins } from "@/lib/lesson-duration"
import { CoursePlayerSkeleton } from "@/components/ui/skeleton"
import { sanitizeHtml } from "@/lib/sanitize"
import { cn } from "@/lib/utils"
import type { ContentBlock } from "@/components/forms/ContentBlockEditor"
import { TickProgress } from "@/components/ui/TickProgress"

// ── Types ────────────────────────────────────────────────────────────────────

type Lesson = { id?: string; title: string; description?: string | null; blocks?: ContentBlock[] }
type Chapter = { id?: string; title: string; desc?: string | null; lessons?: Lesson[] }

type Facilitator = {
  name?: string; imageUrl?: string | null; title?: string
  bio?: string; credentials?: string | null
}

type ProgramDetail = {
  id: string; title: string; slug: string; thumbnail: string | null
  tagline: string | null; overview: string | null; level: string
  duration: string | null; format: string | null
  rating: number | null; reviewCount: number | null
  enrolledCount: number | null; countriesCount: number | null
  learningObjectives: unknown; targetAudience: unknown; facilitators: unknown
  category: { name: string } | null
  curriculum: unknown
  instructor: { email: string; profile: { firstName: string | null; lastName: string | null } | null }
}

type ApiResponse = {
  program:       ProgramDetail
  enrollment:    { status: "ACTIVE" | "COMPLETED" | "DROPPED"; enrolledAt: string; completedAt: string | null }
  totalLessons:  number
  completedIds:  string[]
  passedQuizIds: string[]
  certificate:   { verifyCode: string } | null
}

type TabKey = "lesson" | "overview" | "assessments" | "timetable" | "resources" | "instructors"

/** What a lesson mostly *is*, for the rail's type icon — mirrors how Udemy
 *  marks each row as video vs article. Ordered by how strongly a block type
 *  defines the lesson: a lesson with a video reads as a video lesson even if
 *  it also carries notes. */
type LessonKind = "video" | "quiz" | "assignment" | "resource" | "reading"

// ── Derivation helpers ───────────────────────────────────────────────────────

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string" && v.trim() !== "") : []
}

function asFacilitators(value: unknown): Facilitator[] {
  return Array.isArray(value) ? (value as Facilitator[]).filter(f => f && typeof f === "object" && f.name) : []
}

function toEmbedUrl(url: string): string | null {
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]+)/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`
  const vimeo = url.match(/vimeo\.com\/(\d+)/)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`
  return null
}




function lessonKind(lesson: Lesson): LessonKind {
  const types = new Set((lesson.blocks ?? []).map(b => b.type))
  if (types.has("video"))                              return "video"
  if (types.has("quiz"))                               return "quiz"
  if (types.has("assignment"))                         return "assignment"
  if (types.has("pdf") || types.has("document"))       return "resource"
  return "reading"
}

function quizBlockIdsForLesson(lesson: Lesson): string[] {
  return (lesson.blocks ?? []).filter(b => b.type === "quiz" && b.id).map(b => b.id!)
}

function isLessonDoneWith(lesson: Lesson, completed: Set<string>, passed: Set<string>): boolean {
  if (!lesson.id) return false
  const quizIds = quizBlockIdsForLesson(lesson)
  if (quizIds.length > 0) return quizIds.every(id => passed.has(id))
  return completed.has(lesson.id)
}

function isChapterDoneWith(chapter: Chapter, completed: Set<string>, passed: Set<string>): boolean {
  const lessons = chapter.lessons ?? []
  return lessons.length === 0 || lessons.every(l => isLessonDoneWith(l, completed, passed))
}

function instructorName(program: ProgramDetail): string {
  const prof = program.instructor.profile
  if (prof?.firstName || prof?.lastName) return [prof.firstName, prof.lastName].filter(Boolean).join(" ")
  return program.instructor.email
}

const LEVEL_LABELS: Record<string, string> = {
  BEGINNER: "Beginner", INTERMEDIATE: "Intermediate", ADVANCED: "Advanced",
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

// ── Small presentational pieces ──────────────────────────────────────────────

const Icon = {
  back:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></svg>,
  prev:    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></svg>,
  next:    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>,
  check:   <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
  chevron: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>,
  lock:    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="11" width="18" height="10" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>,
  close:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
  panel:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="15" y1="3" x2="15" y2="21" /></svg>,
  search:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>,
  download:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>,
  play:    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="7 4 20 12 7 20 7 4" /></svg>,
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

/** Thin circular progress meter for the top bar. */
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

const proseCls =
  "text-[14px] text-[#171C35] leading-relaxed [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5 [&_p]:mb-2.5 last:[&_p]:mb-0 [&_h2]:font-bold [&_h2]:text-[15px] [&_h2]:mt-4 [&_h2]:mb-1.5 [&_h3]:font-bold [&_h3]:text-[14px] [&_h3]:mt-3 [&_h3]:mb-1 [&_a]:text-[#6655DF] [&_a]:underline"

// ── Page ─────────────────────────────────────────────────────────────────────

const StudentCoursePlayerPage = () => {
  const { slug } = useParams<{ slug: string }>()

  const [data, setData]       = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState("")
  const [completedIds, setCompletedIds]   = useState<Set<string>>(new Set())
  const [passedQuizIds, setPassedQuizIds] = useState<Set<string>>(new Set())
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null)
  const [openChapters, setOpenChapters] = useState<Set<number>>(new Set())

  const [tab, setTab]             = useState<TabKey>("lesson")
  const [railOpen, setRailOpen]   = useState(true)   // desktop: collapse the rail
  const [drawerOpen, setDrawerOpen] = useState(false) // mobile: slide the rail in
  const [progressOpen, setProgressOpen] = useState(false)
  const [railQuery, setRailQuery] = useState("")

  const progressRef = useRef<HTMLDivElement>(null)
  const stageRef    = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError("")
      try {
        const res = await fetch(`/api/student/programs/${slug}`)
        const d   = await res.json()
        if (!res.ok) throw new Error(d.error ?? "Failed to load programme.")
        if (cancelled) return
        setData(d)
        const completed = new Set<string>(d.completedIds ?? [])
        const passed    = new Set<string>(d.passedQuizIds ?? [])
        setCompletedIds(completed)
        setPassedQuizIds(passed)

        // Land on the first not-yet-done lesson in an unlocked chapter (or the
        // very first lesson if the programme is already fully complete).
        const chapters = Array.isArray(d.program?.curriculum) ? (d.program.curriculum as Chapter[]) : []
        let unlockedSoFar = true
        let picked: { ci: number; lesson: Lesson } | null = null
        let firstAny: { ci: number; lesson: Lesson } | null = null
        for (let ci = 0; ci < chapters.length; ci++) {
          const chapter = chapters[ci]
          for (const lesson of chapter.lessons ?? []) {
            if (!lesson.id) continue
            if (!firstAny) firstAny = { ci, lesson }
            if (unlockedSoFar && !picked && !isLessonDoneWith(lesson, completed, passed)) {
              picked = { ci, lesson }
            }
          }
          unlockedSoFar = unlockedSoFar && isChapterDoneWith(chapter, completed, passed)
        }
        const chosen = picked ?? firstAny
        if (chosen) {
          setSelectedLessonId(chosen.lesson.id!)
          setOpenChapters(new Set([chosen.ci]))
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Something went wrong.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [slug])

  useEffect(() => {
    if (!progressOpen) return
    function onDown(e: MouseEvent) {
      if (!progressRef.current?.contains(e.target as Node)) setProgressOpen(false)
    }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setProgressOpen(false) }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [progressOpen])

  // Close the mobile drawer on Escape so it never traps a small-screen user.
  useEffect(() => {
    if (!drawerOpen) return
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setDrawerOpen(false) }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [drawerOpen])

  /** A lesson counts as done differently depending on whether it has a quiz:
   *  quiz-bearing lessons are done once every quiz block in them is passed
   *  (no separate manual tick); others use the plain completedIds toggle. */
  function isLessonDone(lesson: Lesson): boolean {
    return isLessonDoneWith(lesson, completedIds, passedQuizIds)
  }

  function isChapterDone(chapter: Chapter): boolean {
    return isChapterDoneWith(chapter, completedIds, passedQuizIds)
  }

  async function handleQuizAnswer(blockId: string, selectedIndex: number, variantIndex = 0): Promise<boolean> {
    const res = await fetch(`/api/student/programs/${slug}/quizzes/${blockId}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ selectedIndex, variantIndex }),
    })
    const d = await res.json().catch(() => ({}))
    if (!res.ok) return false

    setPassedQuizIds(new Set<string>(d.passedQuizIds ?? []))
    if (Array.isArray(d.completedIds)) setCompletedIds(new Set<string>(d.completedIds))
    setData(cur => cur ? {
      ...cur,
      enrollment: d.enrollment ? { ...cur.enrollment, status: d.enrollment.status, completedAt: d.enrollment.completedAt } : cur.enrollment,
      certificate: d.certificate ?? cur.certificate,
    } : cur)
    return !!d.correct
  }

  async function toggleLesson(lessonId: string, next: boolean) {
    setPendingId(lessonId)
    const prev = new Set(completedIds)
    const optimistic = new Set(completedIds)
    if (next) optimistic.add(lessonId)
    else optimistic.delete(lessonId)
    setCompletedIds(optimistic)

    try {
      const res = await fetch(`/api/student/programs/${slug}/lessons/${lessonId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ completed: next }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error ?? "Failed to update progress.")
      setCompletedIds(new Set<string>(d.completedIds))
      setData(cur => cur ? {
        ...cur,
        enrollment: { ...cur.enrollment, status: d.enrollment.status, completedAt: d.enrollment.completedAt },
        certificate: d.certificate ?? cur.certificate,
      } : cur)
    } catch {
      setCompletedIds(prev) // revert optimistic update on failure
    } finally {
      setPendingId(null)
    }
  }

  function toggleChapter(ci: number) {
    setOpenChapters(cur => {
      const next = new Set(cur)
      if (next.has(ci)) next.delete(ci)
      else next.add(ci)
      return next
    })
  }

  function selectLesson(ci: number, lessonId: string) {
    setSelectedLessonId(lessonId)
    setOpenChapters(cur => new Set(cur).add(ci))
    setTab("lesson")
    setDrawerOpen(false)
    // Moving between lessons should start at the top of the new one, not
    // wherever the previous lesson happened to be scrolled to.
    stageRef.current?.scrollTo({ top: 0, behavior: "smooth" })
  }

  if (loading) return <CoursePlayerSkeleton />

  if (error || !data) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-350 mx-auto">
        <p className="text-[13px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error || "Programme not found."}</p>
        <Link href="/student/programs" className="inline-block mt-4 text-[13px] font-semibold text-[#6655DF] hover:text-[#2C2368]">← Back to My Programs</Link>
      </div>
    )
  }

  const { program, enrollment, totalLessons, certificate } = data
  const chapters  = Array.isArray(program.curriculum) ? (program.curriculum as Chapter[]) : []
  const completed = enrollment.status === "COMPLETED"
  const pct = completed ? 100 : totalLessons > 0 ? Math.round((completedIds.size / totalLessons) * 100) : 0

  // A chapter unlocks once every chapter before it is fully done (all lessons,
  // and any quiz blocks within them, complete) — the first chapter is always open.
  const chapterUnlocked = chapters.map((_, i) => chapters.slice(0, i).every(isChapterDone))

  // Flat, ordered list of every lesson across every chapter — used to find the
  // selected lesson's chapter, to number the rail, and for Previous/Next.
  const flat = chapters.flatMap((chapter, ci) =>
    (chapter.lessons ?? [])
      .filter((lesson): lesson is Lesson & { id: string } => !!lesson.id)
      .map(lesson => ({ ci, lesson, locked: !chapterUnlocked[ci] }))
  )
  const selectedIndex   = flat.findIndex(f => f.lesson.id === selectedLessonId)
  const selected        = selectedIndex >= 0 ? flat[selectedIndex] : null
  const selectedChapter = selected ? chapters[selected.ci] : null
  const prevEntry       = flat.slice(0, selectedIndex).reverse().find(f => !f.locked)
  const nextEntry       = flat.slice(selectedIndex + 1).find(f => !f.locked)
  const selectedHasQuiz = selected ? quizBlockIdsForLesson(selected.lesson).length > 0 : false
  const selectedDone    = selected ? isLessonDone(selected.lesson) : false
  const selectedHasContent = !!selected?.lesson.description || (selected?.lesson.blocks?.length ?? 0) > 0

  const totalMinutes = flat.reduce((sum, f) => sum + estimateLessonMinutes(f.lesson), 0)
  const objectives   = asStringArray(program.learningObjectives)
  const audience     = asStringArray(program.targetAudience)
  const facilitators = asFacilitators(program.facilitators)

  // The lesson's first video/image becomes the stage, the way a Udemy lecture
  // opens on its player. Remaining blocks render below so nothing is lost.
  const stageBlock = (selected?.lesson.blocks ?? []).find(b => b.type === "video" || b.type === "image") ?? null
  const bodyBlocks = (selected?.lesson.blocks ?? []).filter(b => b !== stageBlock)

  // Downloadables gathered across every unlocked chapter — the lock rules that
  // govern the rail have to govern this list too, or it becomes a side door.
  const resources = chapters.flatMap((chapter, ci) =>
    chapterUnlocked[ci]
      ? (chapter.lessons ?? []).flatMap(lesson =>
          (lesson.blocks ?? [])
            .filter((b): b is Extract<ContentBlock, { type: "pdf" | "document" | "survey" }> =>
              b.type === "pdf" || b.type === "document" || b.type === "survey")
            .map(b => ({ block: b, chapter: chapter.title, lesson: lesson.title })))
      : []
  )

  const railChapters = chapters.map((chapter, ci) => {
    const lessons = chapter.lessons ?? []
    const q = railQuery.trim().toLowerCase()
    return {
      ci, chapter, lessons,
      visible: q ? lessons.filter(l => l.title.toLowerCase().includes(q)) : lessons,
      doneCount: lessons.filter(isLessonDone).length,
      minutes: lessons.reduce((s, l) => s + estimateLessonMinutes(l), 0),
    }
  }).filter(c => !railQuery.trim() || c.visible.length > 0)

  const TABS: { key: TabKey; label: string; badge?: number }[] = [
    { key: "lesson",      label: "Lesson" },
    { key: "overview",    label: "Overview" },
    { key: "assessments", label: "Assessments" },
    { key: "timetable",   label: "Timetable" },
    { key: "resources",   label: "Resources", badge: resources.length },
    { key: "instructors", label: "Instructors", badge: facilitators.length + 1 },
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
          <p className="px-4 py-8 text-center text-[14px] font-bold text-[#8A90A6]">No lessons match “{railQuery}”.</p>
        )}
        {railChapters.map(({ ci, chapter, lessons, visible, doneCount, minutes }) => {
          const unlocked = chapterUnlocked[ci]
          const open     = openChapters.has(ci) || !!railQuery.trim()
          return (
            <div key={ci} className="border-b border-[#F0EFFA] last:border-none">
              <button
                type="button"
                disabled={!unlocked}
                onClick={() => toggleChapter(ci)}
                className={cn(
                  "w-full flex items-start justify-between gap-2 px-4 py-3 text-left transition-colors",
                  unlocked ? "cursor-pointer hover:bg-[#FAFAFF]" : "cursor-not-allowed opacity-55",
                )}
              >
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-[14px] font-bold text-[#171C35]">
                    {!unlocked && <span className="text-[#8A90A6] shrink-0">{Icon.lock}</span>}
                    <span className="line-clamp-2">Section {ci + 1}: {chapter.title}</span>
                  </span>
                  <span className="block text-[11px] tracking-[0.12em] uppercase font-extrabold text-[#8A90A6] mt-1">
                    {doneCount} / {lessons.length} · ~{fmtMins(minutes)}
                  </span>
                </span>
                {unlocked && (
                  <span className={cn("shrink-0 text-[#69708A] mt-0.5 transition-transform", open && "rotate-180")}>{Icon.chevron}</span>
                )}
              </button>

              {!unlocked && (
                <p className="text-[11px] tracking-[0.12em] uppercase font-extrabold text-[#8A90A6] px-4 pb-2.5 -mt-1.5">Complete the previous section to unlock</p>
              )}

              {unlocked && open && (
                <div className="border-t border-[#F0EFFA] bg-[#FCFCFE]">
                  {visible.map((lesson, li) => {
                    const done    = isLessonDone(lesson)
                    const active  = !!lesson.id && lesson.id === selectedLessonId
                    const kind    = lessonKind(lesson)
                    const mins    = estimateLessonMinutes(lesson)
                    const number  = lessons.indexOf(lesson) + 1
                    return (
                      <button
                        key={lesson.id ?? li}
                        type="button"
                        disabled={!lesson.id}
                        onClick={() => lesson.id && selectLesson(ci, lesson.id)}
                        className={cn(
                          "w-full flex items-start gap-2.5 px-3.5 py-2.5 text-left border-t border-[#F3F4FA] first:border-t-0 transition-colors relative",
                          lesson.id ? "cursor-pointer" : "cursor-default",
                          active ? "bg-[#EEECFF]" : "hover:bg-white",
                        )}
                      >
                        {active && <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#6655DF]" />}
                        <span className={cn(
                          "mt-0.5 w-[15px] h-[15px] rounded-[4px] border-2 flex items-center justify-center shrink-0 transition-colors",
                          done ? "bg-emerald-600 border-emerald-600 text-white" : "border-[#C9CCDD] text-transparent",
                        )}>
                          {Icon.check}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className={cn(
                            "block text-[14px] font-bold leading-snug",
                            done ? "text-[#8A90A6]" : active ? "text-[#2C2368] font-semibold" : "text-[#171C35]",
                          )}>
                            {number}. {lesson.title}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] tracking-[0.12em] uppercase font-extrabold text-[#8A90A6] mt-1">
                            <span className="shrink-0">{KIND_ICON[kind]}</span>
                            ~{fmtMins(mins)}
                          </span>
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

  return (
    <div className="h-full flex flex-col bg-[#0B0E24]">

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <header className="shrink-0 h-14 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 bg-[#12163A] border-b border-white/10">
        <Link
          href="/student/programs"
          className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[9px] text-[12px] font-semibold text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        >
          {Icon.back}
          <span className="hidden sm:inline">My Programs</span>
        </Link>

        <div className="w-px h-5 bg-white/15 shrink-0 hidden sm:block" />

        <h1 className="flex-1 min-w-0 text-[14px] font-bold text-white truncate">{program.title}</h1>

        {/* Progress */}
        <div ref={progressRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setProgressOpen(o => !o)}
            aria-haspopup="dialog"
            aria-expanded={progressOpen}
            className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <span className="relative flex items-center justify-center">
              <ProgressRing pct={pct} done={completed} />
              <span className="absolute text-[9px] font-extrabold text-white">{pct}</span>
            </span>
            <span className="hidden sm:inline text-[12px] font-semibold text-white/85">Your progress</span>
          </button>

          {progressOpen && (
            <div role="dialog" className="absolute right-0 top-[calc(100%+8px)] z-30 w-66 bg-white rounded-[14px] shadow-[0_18px_44px_rgba(5,8,26,0.4)] border border-[#DFE2ED] p-4">
              <p className="text-[12px] font-bold text-[#171C35]">
                {completedIds.size} of {totalLessons} lessons complete
              </p>
              <TickProgress value={pct} ticks={30} tone={completed ? "success" : "brand"} className="mt-2" />
              <p className="text-[11px] text-[#8A90A6] mt-2">
                {completed
                  ? "Programme complete — your certificate is ready."
                  : `${totalLessons - completedIds.size} to go · about ${fmtMins(Math.max(0, totalMinutes - flat.filter(f => isLessonDone(f.lesson)).reduce((s, f) => s + estimateLessonMinutes(f.lesson), 0)))} of content left`}
              </p>
              {certificate && (
                <a
                  href={`/api/certificates/verify/${certificate.verifyCode}/download`}
                  target="_blank" rel="noopener noreferrer"
                  className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-[10px] text-[12px] font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors no-underline"
                >
                  {Icon.download}
                  Download certificate
                </a>
              )}
            </div>
          )}
        </div>

        {/* Rail toggles */}
        <button
          type="button"
          onClick={() => setRailOpen(o => !o)}
          aria-label={railOpen ? "Hide course content" : "Show course content"}
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

        <div ref={stageRef} className="flex-1 min-w-0 overflow-y-auto bg-[#F5F6FB]">
          {chapters.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <p className="text-[13px] text-[#8A90A6]">This programme&apos;s curriculum hasn&apos;t been published yet.</p>
            </div>
          ) : !selected ? (
            <div className="px-4 py-16 text-center">
              <p className="text-[13px] text-[#8A90A6]">Select a lesson from Course content to get started.</p>
            </div>
          ) : (
            <>
              {/* Stage */}
              <div className="bg-[#0B0E24]">
                {stageBlock?.type === "video" && stageBlock.url ? (
                  <div className="aspect-video w-full bg-black">
                    {toEmbedUrl(stageBlock.url) ? (
                      <iframe
                        src={toEmbedUrl(stageBlock.url)!}
                        title={selected.lesson.title}
                        className="w-full h-full"
                        allow="autoplay; encrypted-media; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <video controls src={stageBlock.url} className="w-full h-full" />
                    )}
                  </div>
                ) : stageBlock?.type === "image" && stageBlock.url ? (
                  <div className="relative aspect-video w-full bg-black">
                    <Image src={stageBlock.url} alt={stageBlock.caption || selected.lesson.title} fill className="object-contain" />
                  </div>
                ) : (
                  // No media in this lesson — the programme cover carries the
                  // stage instead, under a scrim that darkens towards the
                  // bottom so the type stays legible over any photograph.
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
                        STAGE_GRADIENTS[selectedIndex % STAGE_GRADIENTS.length],
                      )} />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E24] via-[#0B0E24]/80 to-[#0B0E24]/30" />
                    <div className="relative p-5 sm:p-8 w-full">
                      <span className="block text-[12px] tracking-[0.12em] uppercase font-extrabold text-white/80 mb-1.5">
                        Section {selected.ci + 1} · Lesson {selectedIndex + 1} of {flat.length}
                      </span>
                      <p className="text-[clamp(28px,3.4vw,40px)] leading-[1.1] tracking-[-0.035em] font-extrabold text-white max-w-3xl [text-shadow:0_2px_14px_rgba(0,0,0,0.5)]">
                        {selected.lesson.title}
                      </p>
                      <span className="inline-flex items-center gap-1.5 mt-3 px-2.5 py-1 rounded-full bg-white/18 text-white text-[11px] tracking-[0.12em] uppercase font-extrabold backdrop-blur-sm">
                        {KIND_ICON[lessonKind(selected.lesson)]}
                        {KIND_LABEL[lessonKind(selected.lesson)]} · ~{fmtMins(estimateLessonMinutes(selected.lesson))}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Lesson bar */}
              <div className="bg-white border-b border-[#DFE2ED]">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <span className="block text-[12px] tracking-[0.12em] uppercase font-extrabold text-[#6655DF] mb-1.5 truncate">
                        Section {selected.ci + 1} · {selectedChapter?.title}
                      </span>
                      <h2 className="text-[clamp(28px,3.4vw,40px)] leading-[1.1] tracking-[-0.035em] font-extrabold text-[#171C35]">
                        {selected.lesson.title}
                      </h2>
                      <p className="flex items-center gap-1.5 text-[11.5px] text-[#8A90A6] mt-1.5">
                        <span>{KIND_ICON[lessonKind(selected.lesson)]}</span>
                        {KIND_LABEL[lessonKind(selected.lesson)]}
                        <span className="text-[#D8DAE5]">·</span>
                        ~{fmtMins(estimateLessonMinutes(selected.lesson))}
                      </p>
                    </div>

                    {selectedHasQuiz ? (
                      <span className={cn(
                        "shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold",
                        selectedDone ? "bg-emerald-50 text-emerald-700" : "bg-[#EEECFF] text-[#6655DF]",
                      )}>
                        {selectedDone && Icon.check}
                        {selectedDone ? "Quiz passed" : "Quiz required"}
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={pendingId === selected.lesson.id}
                        onClick={() => toggleLesson(selected.lesson.id, !selectedDone)}
                        className={cn(
                          "shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[12.5px] font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
                          selectedDone
                            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            : "bg-[#6655DF] text-white hover:bg-[#2C2368]",
                        )}
                      >
                        {selectedDone && Icon.check}
                        {selectedDone ? "Completed" : "Mark as complete"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Tabs */}
                <div className="max-w-4xl mx-auto px-4 sm:px-6">
                  <div className="flex items-center gap-1 overflow-x-auto -mb-px">
                    {TABS.map(t => (
                      <button
                        key={t.key}
                        type="button"
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
                  </div>
                </div>
              </div>

              {/* Tab panels */}
              <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-16">

                {tab === "lesson" && (
                  <div className="space-y-5">
                    {selected.lesson.description && (
                      <div className={proseCls} dangerouslySetInnerHTML={{ __html: sanitizeHtml(selected.lesson.description) }} />
                    )}
                    {stageBlock?.type === "video" && stageBlock.caption && (
                      <p className="text-[12px] text-[#69708A] italic">{stageBlock.caption}</p>
                    )}
                    {bodyBlocks.length > 0 && (
                      <ContentBlockViewer
                        blocks={bodyBlocks}
                        quizProgress={passedQuizIds}
                        onQuizAnswer={handleQuizAnswer}
                        programSlug={slug}
                      />
                    )}
                    {!selectedHasContent && (
                      <p className="text-[13px] text-[#8A90A6] py-10 text-center">No content in this lesson yet.</p>
                    )}

                    {/* Up next */}
                    {nextEntry ? (
                      <button
                        type="button"
                        onClick={() => selectLesson(nextEntry.ci, nextEntry.lesson.id)}
                        className="w-full text-left rounded-[14px] border border-[#DFE2ED] bg-white hover:border-[#6655DF] hover:shadow-[0_6px_20px_rgba(102,85,223,0.1)] transition-all px-4 py-3.5 flex items-center gap-3 cursor-pointer"
                      >
                        <span className="w-9 h-9 rounded-full bg-[#EEECFF] text-[#6655DF] flex items-center justify-center shrink-0">
                          {Icon.play}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[10.5px] font-bold uppercase tracking-[0.5px] text-[#8A90A6]">Up next</span>
                          <span className="block text-[13.5px] font-semibold text-[#171C35] truncate mt-0.5">{nextEntry.lesson.title}</span>
                        </span>
                        <span className="shrink-0 text-[#6655DF]">{Icon.next}</span>
                      </button>
                    ) : completed ? (
                      <div className="rounded-[14px] border border-emerald-200 bg-emerald-50 px-4 py-4 text-center">
                        <p className="text-[13.5px] font-bold text-emerald-800">That&apos;s the whole programme — well done.</p>
                        {certificate && (
                          <a
                            href={`/api/certificates/verify/${certificate.verifyCode}/download`}
                            target="_blank" rel="noopener noreferrer"
                            className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[12.5px] font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors no-underline"
                          >
                            {Icon.download}
                            Download certificate
                          </a>
                        )}
                      </div>
                    ) : null}

                    {/* Prev / Next */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <button
                        type="button"
                        disabled={!prevEntry}
                        onClick={() => prevEntry && selectLesson(prevEntry.ci, prevEntry.lesson.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[9px] text-[12px] font-semibold text-[#69708A] hover:text-[#6655DF] hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      >
                        {Icon.prev} Previous
                      </button>
                      <button
                        type="button"
                        disabled={!nextEntry}
                        onClick={() => nextEntry && selectLesson(nextEntry.ci, nextEntry.lesson.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[9px] text-[12px] font-semibold text-[#69708A] hover:text-[#6655DF] hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      >
                        Next {Icon.next}
                      </button>
                    </div>
                  </div>
                )}

                {tab === "overview" && (
                  <div className="space-y-6">
                    <div>
                      <span className="block text-[12px] tracking-[0.12em] uppercase font-extrabold text-[#6655DF] mb-1.5">Programme</span>
                      <h3 className="text-[clamp(28px,3.4vw,40px)] leading-[1.1] tracking-[-0.035em] font-extrabold text-[#171C35]">{program.title}</h3>
                      {program.tagline && <p className="text-[14px] text-[#69708A] mt-1.5">{program.tagline}</p>}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                      <StatTile label="Level"   value={LEVEL_LABELS[program.level] ?? program.level} />
                      <StatTile label="Lessons" value={totalLessons} />
                      <StatTile label="Content" value={`~${fmtMins(totalMinutes)}`} />
                      <StatTile label="Sections" value={chapters.length} />
                      {program.duration && <StatTile label="Duration" value={program.duration} />}
                      {program.format   && <StatTile label="Format"   value={program.format} />}
                      {program.category && <StatTile label="Category" value={program.category.name} />}
                      {program.rating != null && (
                        <StatTile
                          label="Rating"
                          value={<>{program.rating.toFixed(1)} <span className="text-amber-500">★</span>{program.reviewCount ? <span className="text-[11px] font-semibold text-[#8A90A6]"> ({program.reviewCount})</span> : null}</>}
                        />
                      )}
                      {program.enrolledCount != null && <StatTile label="Enrolled" value={program.enrolledCount.toLocaleString()} />}
                      {program.countriesCount != null && <StatTile label="Countries" value={program.countriesCount} />}
                    </div>

                    <p className="text-[11px] text-[#8A90A6] -mt-3">
                      Content times are estimated from each lesson&apos;s material, not measured playback.
                    </p>

                    {objectives.length > 0 && (
                      <section>
                        <h4 className="text-[13px] font-bold text-[#171C35] mb-2.5">What you&apos;ll learn</h4>
                        <ul className="grid sm:grid-cols-2 gap-x-5 gap-y-2">
                          {objectives.map((o, i) => (
                            <li key={i} className="flex items-start gap-2 text-[13.5px] text-[#171C35] leading-snug">
                              <span className="mt-0.5 text-emerald-600 shrink-0">{Icon.check}</span>
                              {o}
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}

                    {program.overview && (
                      <section>
                        <h4 className="text-[13px] font-bold text-[#171C35] mb-2">About this programme</h4>
                        <div className={proseCls} dangerouslySetInnerHTML={{ __html: sanitizeHtml(program.overview) }} />
                      </section>
                    )}

                    {audience.length > 0 && (
                      <section>
                        <h4 className="text-[13px] font-bold text-[#171C35] mb-2.5">Who this is for</h4>
                        <ul className="space-y-1.5">
                          {audience.map((a, i) => (
                            <li key={i} className="flex items-start gap-2 text-[13.5px] text-[#171C35] leading-snug">
                              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#6655DF] shrink-0" />
                              {a}
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}

                    <section className="rounded-[14px] border border-[#DFE2ED] bg-white p-4">
                      <h4 className="text-[13px] font-bold text-[#171C35]">Certificate</h4>
                      <p className="text-[12.5px] text-[#69708A] mt-1">
                        {certificate
                          ? "Issued — you can download it any time."
                          : `Awarded automatically once all ${totalLessons} lessons are complete.`}
                      </p>
                      {certificate && (
                        <a
                          href={`/api/certificates/verify/${certificate.verifyCode}/download`}
                          target="_blank" rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[12px] font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors no-underline"
                        >
                          {Icon.download}
                          Download certificate
                        </a>
                      )}
                    </section>
                  </div>
                )}

                {/* Self-loading: it fetches its own board, and renders a
                    "not graded" note when the programme has grading off. */}
                {tab === "assessments" && <StudentAssessments slug={slug} />}

                {tab === "timetable" && <StudyPlanner slug={slug} />}

                {tab === "resources" && (
                  <div>
                    <h3 className="text-[15px] font-extrabold text-[#171C35]">Downloads & resources</h3>
                    <p className="text-[12.5px] text-[#69708A] mt-1 mb-4">
                      Everything attached to the sections you&apos;ve unlocked so far.
                    </p>
                    {resources.length === 0 ? (
                      <p className="text-[13px] text-[#8A90A6] py-10 text-center">
                        No downloads in the sections you&apos;ve unlocked yet.
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {resources.map(({ block, chapter, lesson }, i) => {
                          const title = block.title || "Untitled"
                          return (
                            <li key={`${block.id}-${i}`}>
                              <a
                                href={block.url}
                                target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-3 rounded-[12px] border border-[#DFE2ED] bg-white px-3.5 py-3 hover:border-[#6655DF] transition-colors no-underline"
                              >
                                <span className="w-9 h-9 rounded-[9px] bg-[#EEECFF] text-[#6655DF] flex items-center justify-center shrink-0 text-[10px] font-bold uppercase">
                                  {block.type === "pdf" ? "PDF" : block.type === "survey" ? "FORM" : "DOC"}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block text-[13px] font-semibold text-[#171C35] truncate">{title}</span>
                                  <span className="block text-[11px] text-[#8A90A6] truncate mt-0.5">
                                    {chapter} · {lesson}
                                    {block.type === "pdf" && block.fileSize ? ` · ${block.fileSize}` : ""}
                                  </span>
                                </span>
                                <span className="shrink-0 text-[#8A90A6]">{Icon.download}</span>
                              </a>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                )}

                {tab === "instructors" && (
                  <div className="space-y-5">
                    <div className="rounded-[14px] border border-[#DFE2ED] bg-white p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#8A90A6]">Programme lead</p>
                      <p className="text-[15px] font-extrabold text-[#171C35] mt-1">{instructorName(program)}</p>
                      <p className="text-[12.5px] text-[#69708A] mt-0.5">{program.instructor.email}</p>
                    </div>

                    {facilitators.map((f, i) => (
                      <div key={i} className="rounded-[14px] border border-[#DFE2ED] bg-white p-4 flex flex-col sm:flex-row gap-4">
                        <div className="relative w-16 h-16 rounded-full overflow-hidden bg-[#EEECFF] shrink-0">
                          {f.imageUrl ? (
                            <Image src={f.imageUrl} alt={f.name ?? "Facilitator"} fill className="object-cover" />
                          ) : (
                            <span className="w-full h-full flex items-center justify-center text-[18px] font-extrabold text-[#6655DF]">
                              {(f.name ?? "?").charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[14.5px] font-extrabold text-[#171C35]">{f.name}</p>
                          {f.title && <p className="text-[12.5px] text-[#6655DF] font-semibold mt-0.5">{f.title}</p>}
                          {f.credentials && <p className="text-[11.5px] text-[#8A90A6] mt-0.5">{f.credentials}</p>}
                          {f.bio && (
                            <div className={cn(proseCls, "mt-2 text-[13px]")} dangerouslySetInnerHTML={{ __html: sanitizeHtml(f.bio) }} />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── Rail — desktop ──────────────────────────────────────────────── */}
        {chapters.length > 0 && (
          <aside
            className={cn(
              "hidden lg:flex flex-col shrink-0 border-l border-[#DFE2ED] bg-white transition-[width] duration-200 overflow-hidden",
              railOpen ? "w-95" : "w-0 border-l-0",
            )}
          >
            <div className="shrink-0 flex items-center justify-between gap-2 px-4 h-12 border-b border-[#DFE2ED]">
              <h2 className="text-[14px] font-bold text-[#171C35]">Course content</h2>
              <span className="text-[11px] tracking-[0.12em] uppercase font-extrabold text-[#8A90A6]">{completedIds.size}/{totalLessons}</span>
            </div>
            {railBody}
          </aside>
        )}
      </div>

      {/* ── Rail — mobile drawer ──────────────────────────────────────────── */}
      {drawerOpen && chapters.length > 0 && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="flex-1 bg-[#0B0E24]/55" onClick={() => setDrawerOpen(false)} />
          <div className="w-[88%] max-w-90 bg-white flex flex-col shadow-2xl">
            <div className="shrink-0 flex items-center justify-between gap-2 px-4 h-13 border-b border-[#DFE2ED]">
              <h2 className="text-[14px] font-bold text-[#171C35]">
                Course content
                <span className="ml-2 text-[11px] tracking-[0.12em] uppercase font-extrabold text-[#8A90A6]">{completedIds.size}/{totalLessons}</span>
              </h2>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close course content"
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

export default StudentCoursePlayerPage
