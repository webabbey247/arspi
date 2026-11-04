"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  MoreVertical, Play, Award, Share2, Heart, Archive, ArchiveRestore, Star, Check,
  Search, LayoutGrid, List, ChevronDown, BookOpen, Trophy, Flame, GraduationCap,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { MyLearningSkeleton } from "@/components/ui/skeleton"
import { TickProgress } from "@/components/ui/TickProgress"

type ProgramSummary = {
  enrollmentId: string
  status:       "ACTIVE" | "COMPLETED" | "DROPPED"
  enrolledAt:   string
  completedAt:  string | null
  studentRating: number | null
  favorited:     boolean
  archived:      boolean
  course: {
    id: string; title: string; slug: string; thumbnail: string | null
    tagline: string | null; excerpt: string; level: string
    instructor: { name: string }
  }
  totalLessons:     number
  completedLessons: number
  certificateCode:  string | null
}

type Filter = "all" | "progress" | "completed" | "favorites" | "archived"
type Sort   = "recent" | "progress" | "title"
type View   = "grid" | "list"

const LEVEL_LABELS: Record<string, string> = {
  BEGINNER: "Beginner", INTERMEDIATE: "Intermediate", ADVANCED: "Advanced",
}

const SORTS: { id: Sort; label: string }[] = [
  { id: "recent",   label: "Recently enrolled" },
  { id: "progress", label: "Furthest along" },
  { id: "title",    label: "Title (A–Z)" },
]

function pctOf(p: ProgramSummary): number {
  if (p.status === "COMPLETED") return 100
  return p.totalLessons > 0 ? Math.round((p.completedLessons / p.totalLessons) * 100) : 0
}

/** Shared label styling — matches the sidebar's own section labels. */
const metaCls = "text-[11px] tracking-[0.12em] uppercase font-extrabold text-[#8A90A6]"

// ── Star rating ──────────────────────────────────────────────────────────────

function StarRow({ value, onRate }: { value: number | null; onRate: (n: number) => void }) {
  const [hover, setHover] = useState<number | null>(null)
  const shown = hover ?? value ?? 0
  return (
    <div className="flex items-center gap-0.5" onMouseLeave={() => setHover(null)}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHover(n)}
          onClick={e => { e.preventDefault(); e.stopPropagation(); onRate(n) }}
          className="p-0 leading-none cursor-pointer"
          aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`}
        >
          <Star className={cn("w-3.5 h-3.5 transition-colors", n <= shown ? "fill-amber-400 text-amber-400" : "fill-none text-[#D8DAE5]")} />
        </button>
      ))}
    </div>
  )
}

// ── Kebab action menu ────────────────────────────────────────────────────────

function CardMenu({
  slug, favorited, archived, certificateCode, onToggleFavorite, onToggleArchive, onShare,
}: {
  slug: string
  favorited: boolean
  archived: boolean
  certificateCode: string | null
  onToggleFavorite: () => void
  onToggleArchive:  () => void
  onShare:          () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false) }
    document.addEventListener("mousedown", onDocClick)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDocClick)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  const itemCls = "w-full flex items-center gap-2.5 px-3.5 py-2 text-[14px] font-bold text-[#171C35] hover:bg-[#F5F6FB] transition-colors cursor-pointer text-left no-underline"

  return (
    <div ref={ref} className="relative z-20">
      <button
        type="button"
        onClick={e => { e.preventDefault(); e.stopPropagation(); setOpen(o => !o) }}
        className="w-8 h-8 rounded-full bg-white/95 shadow-sm border border-black/5 flex items-center justify-center hover:bg-white transition-colors cursor-pointer"
        aria-label="Program actions"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreVertical className="w-3.5 h-3.5 text-[#69708A]" />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 mt-1.5 w-52 rounded-[12px] border border-[#DFE2ED] bg-white shadow-[0_12px_32px_rgba(23,28,53,0.16)] py-1.5 overflow-hidden">
          <Link href={`/student/programs/${slug}`} className={itemCls} onClick={() => setOpen(false)}>
            <Play className="w-3.5 h-3.5 text-[#8A90A6]" /> Continue
          </Link>
          {certificateCode && (
            <a href={`/verify/${certificateCode}`} target="_blank" rel="noopener noreferrer" className={itemCls} onClick={() => setOpen(false)}>
              <Award className="w-3.5 h-3.5 text-[#8A90A6]" /> View certificate
            </a>
          )}
          <button type="button" className={itemCls} onClick={e => { e.preventDefault(); e.stopPropagation(); onShare(); setOpen(false) }}>
            <Share2 className="w-3.5 h-3.5 text-[#8A90A6]" /> Share
          </button>
          <button type="button" className={itemCls} onClick={e => { e.preventDefault(); e.stopPropagation(); onToggleFavorite(); setOpen(false) }}>
            <Heart className={cn("w-3.5 h-3.5", favorited ? "fill-red-500 text-red-500" : "text-[#8A90A6]")} />
            {favorited ? "Unfavorite" : "Favorite"}
          </button>
          <button type="button" className={itemCls} onClick={e => { e.preventDefault(); e.stopPropagation(); onToggleArchive(); setOpen(false) }}>
            {archived ? <ArchiveRestore className="w-3.5 h-3.5 text-[#8A90A6]" /> : <Archive className="w-3.5 h-3.5 text-[#8A90A6]" />}
            {archived ? "Unarchive" : "Archive"}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Cover ────────────────────────────────────────────────────────────────────

function Cover({ src, alt, className }: { src: string | null; alt: string; className?: string }) {
  if (src) return <Image src={src} alt={alt} fill className={cn("object-cover", className)} />
  return (
    <div className="w-full h-full bg-gradient-to-br from-[#2C2368] via-[#4B3BA8] to-[#6655DF] flex items-center justify-center">
      <BookOpen className="w-7 h-7 text-white/50" />
    </div>
  )
}

// ── "Jump back in" hero ──────────────────────────────────────────────────────

function ResumeHero({ p }: { p: ProgramSummary }) {
  const pct = pctOf(p)
  const remaining = Math.max(0, p.totalLessons - p.completedLessons)
  return (
    <section className="relative rounded-[20px] overflow-hidden mb-6 min-h-55 flex items-end">
      <div className="absolute inset-0">
        <Cover src={p.course.thumbnail} alt={p.course.title} />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-[#0B0E24] via-[#0B0E24]/85 to-[#0B0E24]/45" />

      <div className="relative w-full p-5 sm:p-7">
        <span className={cn(metaCls, "block text-white/75 mb-1.5")}>Jump back in</span>
        <h2 className="text-[clamp(20px,2.4vw,28px)] leading-[1.15] tracking-[-0.03em] font-extrabold text-white max-w-2xl">
          {p.course.title}
        </h2>
        <p className="text-[14px] text-white/70 mt-1.5">{p.course.instructor.name}</p>

        <TickProgress
          value={pct}
          tone="light"
          className="mt-4 max-w-md"
          label={`${p.completedLessons} of ${p.totalLessons} lessons`}
        />

        <div className="flex flex-wrap items-center gap-3 mt-5">
          <Link
            href={`/student/programs/${p.course.slug}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[12px] text-[14px] font-bold bg-white text-[#171C35] hover:bg-[#EEECFF] transition-colors no-underline"
          >
            <Play className="w-4 h-4 fill-current" />
            {p.completedLessons > 0 ? "Continue learning" : "Start learning"}
          </Link>
          <span className="text-[14px] font-bold text-white/70">
            {remaining > 0 ? `${remaining} lesson${remaining === 1 ? "" : "s"} to go` : "Final stretch"}
          </span>
        </div>
      </div>
    </section>
  )
}

// ── Stat tile ────────────────────────────────────────────────────────────────

function StatTile({ icon, label, value, tone }: {
  icon: React.ReactNode; label: string; value: number; tone: string
}) {
  return (
    <div className="rounded-[14px] border border-[#DFE2ED] bg-white px-4 py-3.5 flex items-center gap-3">
      <span className={cn("w-10 h-10 rounded-[11px] flex items-center justify-center shrink-0", tone)}>{icon}</span>
      <span className="min-w-0">
        <span className="block text-[22px] font-extrabold text-[#171C35] leading-none">{value}</span>
        <span className={cn(metaCls, "block mt-1 truncate")}>{label}</span>
      </span>
    </div>
  )
}

// ── Program card (grid) ──────────────────────────────────────────────────────

function ProgramCard({
  p, onRate, onToggleFavorite, onToggleArchive, onShare,
}: {
  p: ProgramSummary
  onRate:           (n: number) => void
  onToggleFavorite: () => void
  onToggleArchive:  () => void
  onShare:          () => void
}) {
  const completed = p.status === "COMPLETED"
  const pct = pctOf(p)

  return (
    <article className="group relative rounded-[16px] border border-[#DFE2ED] bg-white overflow-hidden hover:border-[#6655DF] hover:shadow-[0_10px_30px_rgba(102,85,223,0.12)] hover:-translate-y-0.5 transition-all duration-200 flex flex-col">

      {/* Overlaid controls sit outside the Link so they stay valid and clickable */}
      <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
        <button
          type="button"
          onClick={e => { e.preventDefault(); e.stopPropagation(); onToggleFavorite() }}
          aria-label={p.favorited ? "Remove from favorites" : "Add to favorites"}
          className={cn(
            "w-8 h-8 rounded-full bg-white/95 shadow-sm border border-black/5 flex items-center justify-center hover:bg-white transition-all cursor-pointer z-20",
            p.favorited ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
          )}
        >
          <Heart className={cn("w-3.5 h-3.5", p.favorited ? "fill-red-500 text-red-500" : "text-[#69708A]")} />
        </button>
        <CardMenu
          slug={p.course.slug}
          favorited={p.favorited}
          archived={p.archived}
          certificateCode={p.certificateCode}
          onToggleFavorite={onToggleFavorite}
          onToggleArchive={onToggleArchive}
          onShare={onShare}
        />
      </div>

      <Link href={`/student/programs/${p.course.slug}`} className="flex flex-col no-underline">
        <div className="relative w-full aspect-video bg-[#F5F6FB] shrink-0 overflow-hidden">
          <Cover src={p.course.thumbnail} alt={p.course.title} className="group-hover:scale-[1.04] transition-transform duration-500" />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/55 to-transparent" />

          <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/90 text-[#171C35] text-[10px] font-extrabold uppercase tracking-[0.08em] backdrop-blur-sm">
            {LEVEL_LABELS[p.course.level] ?? p.course.level}
          </span>

          {completed && (
            <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold uppercase tracking-[0.08em]">
              <Check className="w-2.5 h-2.5" strokeWidth={3} />
              Completed
            </span>
          )}
          {p.archived && !completed && (
            <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#171C35]/85 text-white text-[10px] font-extrabold uppercase tracking-[0.08em]">
              Archived
            </span>
          )}
        </div>

        <div className="px-4 pt-3.5 flex flex-col gap-1">
          <p className="text-[14px] font-bold text-[#171C35] leading-snug line-clamp-2 group-hover:text-[#6655DF] transition-colors">
            {p.course.title}
          </p>
          <p className="text-[11px] tracking-[0.12em] uppercase font-extrabold text-[#8A90A6] truncate">{p.course.instructor.name}</p>
        </div>
      </Link>

      <div className="px-4 pb-4 pt-3 mt-auto">
        <TickProgress value={pct} ticks={34} tone={completed ? "success" : "brand"} />
        <div className="flex items-center justify-between mt-2">
          <span className="text-[12px] font-bold text-[#69708A]">
            {pct}% · {p.completedLessons}/{p.totalLessons}
          </span>
          <StarRow value={p.studentRating} onRate={onRate} />
        </div>

        {p.certificateCode && (
          <a
            href={`/verify/${p.certificateCode}`}
            target="_blank" rel="noopener noreferrer"
            className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-[10px] text-[14px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors no-underline"
          >
            <Award className="w-3.5 h-3.5" />
            View certificate
          </a>
        )}
      </div>
    </article>
  )
}

// ── Program row (list) ───────────────────────────────────────────────────────

function ProgramRow({
  p, onRate, onToggleFavorite, onToggleArchive, onShare,
}: {
  p: ProgramSummary
  onRate:           (n: number) => void
  onToggleFavorite: () => void
  onToggleArchive:  () => void
  onShare:          () => void
}) {
  const completed = p.status === "COMPLETED"
  const pct = pctOf(p)

  return (
    <article className="group relative rounded-[14px] border border-[#DFE2ED] bg-white hover:border-[#6655DF] transition-colors flex items-center gap-4 p-3">
      <Link href={`/student/programs/${p.course.slug}`} className="relative w-28 sm:w-36 aspect-video rounded-[10px] overflow-hidden shrink-0 bg-[#F5F6FB] no-underline">
        <Cover src={p.course.thumbnail} alt={p.course.title} />
      </Link>

      <div className="min-w-0 flex-1">
        <Link href={`/student/programs/${p.course.slug}`} className="no-underline">
          <p className="text-[14px] font-bold text-[#171C35] leading-snug line-clamp-1 group-hover:text-[#6655DF] transition-colors">
            {p.course.title}
          </p>
        </Link>
        <p className={cn(metaCls, "mt-1 truncate")}>
          {p.course.instructor.name} · {LEVEL_LABELS[p.course.level] ?? p.course.level}
        </p>

        <div className="flex items-center gap-3 mt-2.5 max-w-md">
          <TickProgress value={pct} ticks={28} tone={completed ? "success" : "brand"} className="flex-1" />
          <span className="text-[12px] font-bold text-[#69708A] shrink-0">{pct}% · {p.completedLessons}/{p.totalLessons}</span>
        </div>
      </div>

      <div className="hidden sm:flex flex-col items-end gap-2 shrink-0">
        <StarRow value={p.studentRating} onRate={onRate} />
        {completed && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-extrabold uppercase tracking-[0.08em]">
            <Check className="w-2.5 h-2.5" strokeWidth={3} /> Completed
          </span>
        )}
      </div>

      <div className="shrink-0">
        <CardMenu
          slug={p.course.slug}
          favorited={p.favorited}
          archived={p.archived}
          certificateCode={p.certificateCode}
          onToggleFavorite={onToggleFavorite}
          onToggleArchive={onToggleArchive}
          onShare={onShare}
        />
      </div>
    </article>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

const StudentProgramsPage = () => {
  const [programs, setPrograms] = useState<ProgramSummary[]>([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState<Filter>("all")
  const [sort, setSort]         = useState<Sort>("recent")
  const [view, setView]         = useState<View>("grid")
  const [search, setSearch]     = useState("")
  const [sortOpen, setSortOpen] = useState(false)
  const sortRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    fetch("/api/student/programs")
      .then(r => r.json())
      .then(d => { if (!cancelled) setPrograms(d.programs ?? []) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!sortOpen) return
    function onDown(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [sortOpen])

  async function patch(slug: string, body: Record<string, unknown>) {
    const resp = await fetch(`/api/student/programs/${slug}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    })
    if (!resp.ok) {
      toast.error("Could not save your change.")
      return null
    }
    return resp.json()
  }

  function updateLocal(enrollmentId: string, patchFields: Partial<ProgramSummary>) {
    setPrograms(prev => prev.map(p => (p.enrollmentId === enrollmentId ? { ...p, ...patchFields } : p)))
  }

  async function handleRate(p: ProgramSummary, n: number) {
    const next = p.studentRating === n ? null : n
    const prev = p.studentRating
    updateLocal(p.enrollmentId, { studentRating: next })
    const result = await patch(p.course.slug, { studentRating: next })
    if (result) toast.success(next ? `Rated ${next} star${next > 1 ? "s" : ""}.` : "Rating cleared.")
    else updateLocal(p.enrollmentId, { studentRating: prev })
  }

  async function handleToggleFavorite(p: ProgramSummary) {
    const next = !p.favorited
    updateLocal(p.enrollmentId, { favorited: next })
    const result = await patch(p.course.slug, { favorited: next })
    if (result) toast.success(next ? "Added to favourites." : "Removed from favourites.")
    else updateLocal(p.enrollmentId, { favorited: !next })
  }

  async function handleToggleArchive(p: ProgramSummary) {
    const next = !p.archived
    updateLocal(p.enrollmentId, { archived: next })
    const result = await patch(p.course.slug, { archived: next })
    if (result) toast.success(next ? "Programme archived." : "Programme restored.")
    else updateLocal(p.enrollmentId, { archived: !next })
  }

  async function handleShare(p: ProgramSummary) {
    const url = `${window.location.origin}/programs/${p.course.slug}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success("Link copied to clipboard.")
    } catch {
      toast.error("Could not copy the link.")
    }
  }

  const live = useMemo(() => programs.filter(p => !p.archived), [programs])

  const counts = useMemo(() => ({
    all:       live.length,
    progress:  live.filter(p => p.status !== "COMPLETED").length,
    completed: live.filter(p => p.status === "COMPLETED").length,
    favorites: live.filter(p => p.favorited).length,
    archived:  programs.filter(p => p.archived).length,
  }), [live, programs])

  const certificates = useMemo(() => programs.filter(p => p.certificateCode).length, [programs])

  /** Nothing records when a programme was last opened, so "jump back in"
   *  favours the most recent enrolment that has actually been started —
   *  finishing something part-done beats surfacing an untouched course. */
  const resume = useMemo(() => {
    const open = live.filter(p => p.status !== "COMPLETED")
    if (open.length === 0) return null
    const started = open.filter(p => p.completedLessons > 0)
    const pool = started.length > 0 ? started : open
    return [...pool].sort((a, b) => +new Date(b.enrolledAt) - +new Date(a.enrolledAt))[0]
  }, [live])

  const visible = useMemo(() => {
    const base =
      filter === "archived"  ? programs.filter(p => p.archived) :
      filter === "favorites" ? live.filter(p => p.favorited) :
      filter === "completed" ? live.filter(p => p.status === "COMPLETED") :
      filter === "progress"  ? live.filter(p => p.status !== "COMPLETED") :
                               live

    const q = search.trim().toLowerCase()
    const searched = q
      ? base.filter(p =>
          p.course.title.toLowerCase().includes(q) ||
          p.course.instructor.name.toLowerCase().includes(q) ||
          (p.course.tagline ?? "").toLowerCase().includes(q))
      : base

    return [...searched].sort((a, b) => {
      if (sort === "title")    return a.course.title.localeCompare(b.course.title)
      if (sort === "progress") return pctOf(b) - pctOf(a)
      return +new Date(b.enrolledAt) - +new Date(a.enrolledAt)
    })
  }, [programs, live, filter, search, sort])

  const FILTERS: { id: Filter; label: string; count: number }[] = [
    { id: "all",       label: "All",         count: counts.all },
    { id: "progress",  label: "In progress", count: counts.progress },
    { id: "completed", label: "Completed",   count: counts.completed },
    { id: "favorites", label: "Favourites",  count: counts.favorites },
    { id: "archived",  label: "Archived",    count: counts.archived },
  ]

  const emptyCopy: Record<Filter, string> = {
    all:       "You haven't enrolled in any programmes yet.",
    progress:  "Nothing in progress — every programme you've started is finished.",
    completed: "You haven't completed a programme yet. Keep going.",
    favorites: "You haven't favourited any programmes yet.",
    archived:  "You don't have any archived programmes.",
  }

  if (loading) return <MyLearningSkeleton />

  return (
    <div className="max-w-350 mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

      {/* Page header */}
      <div className="mb-6">
        <span className="block text-[12px] tracking-[0.12em] uppercase font-extrabold text-[#6655DF] mb-1.5">Learner</span>
        <h1 className="text-[clamp(28px,3.4vw,40px)] leading-[1.1] tracking-[-0.035em] font-extrabold text-[#171C35]">My Learning</h1>
        <p className="text-[#69708A] text-[15px] mt-1.5 max-w-180">Your enrolled programmes, progress and certificates</p>
      </div>

      {programs.length > 0 && (
        <>
          {resume && <ResumeHero p={resume} />}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <StatTile icon={<BookOpen className="w-4.5 h-4.5 text-[#6655DF]" />}  label="Enrolled"     value={counts.all}       tone="bg-[#EEECFF]" />
            <StatTile icon={<Flame className="w-4.5 h-4.5 text-amber-600" />}     label="In progress"  value={counts.progress}  tone="bg-amber-50" />
            <StatTile icon={<Trophy className="w-4.5 h-4.5 text-emerald-600" />}  label="Completed"    value={counts.completed} tone="bg-emerald-50" />
            <StatTile icon={<GraduationCap className="w-4.5 h-4.5 text-sky-600" />} label="Certificates" value={certificates}   tone="bg-sky-50" />
          </div>
        </>
      )}

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-5">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 -mb-0.5">
          {FILTERS.map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[14px] font-bold border transition-colors cursor-pointer",
                filter === f.id
                  ? "bg-[#6655DF] text-white border-[#6655DF]"
                  : "bg-white border-[#DFE2ED] text-[#69708A] hover:border-[#6655DF] hover:text-[#6655DF]",
              )}
            >
              {f.label}
              <span className={cn(
                "text-[11px] font-extrabold px-1.5 py-0.5 rounded-full leading-none",
                filter === f.id ? "bg-white/20 text-white" : "bg-[#F0EFFA] text-[#69708A]",
              )}>
                {f.count}
              </span>
            </button>
          ))}
        </div>

        <div className="lg:ml-auto flex items-center gap-2">
          <div className="relative flex-1 lg:w-60 lg:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8A90A6]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search your programmes…"
              className="w-full pl-9 pr-3 py-2 text-[14px] font-bold bg-white border border-[#DFE2ED] rounded-[10px] text-[#171C35] outline-none placeholder:font-normal placeholder:text-[#8A90A6] focus:border-[#6655DF] transition-colors"
            />
          </div>

          <div ref={sortRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setSortOpen(o => !o)}
              aria-haspopup="menu"
              aria-expanded={sortOpen}
              className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[14px] font-bold bg-white border border-[#DFE2ED] text-[#69708A] hover:border-[#6655DF] hover:text-[#6655DF] transition-colors cursor-pointer"
            >
              <span className="hidden sm:inline">{SORTS.find(s => s.id === sort)?.label}</span>
              <span className="sm:hidden">Sort</span>
              <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", sortOpen && "rotate-180")} />
            </button>
            {sortOpen && (
              <div role="menu" className="absolute right-0 mt-1.5 z-30 w-52 rounded-[12px] border border-[#DFE2ED] bg-white shadow-[0_12px_32px_rgba(23,28,53,0.16)] py-1.5">
                {SORTS.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => { setSort(s.id); setSortOpen(false) }}
                    className={cn(
                      "w-full flex items-center justify-between px-3.5 py-2 text-[14px] font-bold text-left transition-colors cursor-pointer",
                      sort === s.id ? "bg-[#EEECFF] text-[#6655DF]" : "text-[#171C35] hover:bg-[#F5F6FB]",
                    )}
                  >
                    {s.label}
                    {sort === s.id && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="shrink-0 flex items-center gap-0.5 p-0.5 rounded-[10px] bg-[#F0EFFA]">
            {([["grid", LayoutGrid], ["list", List]] as const).map(([id, IconCmp]) => (
              <button
                key={id}
                type="button"
                onClick={() => setView(id)}
                aria-label={`${id} view`}
                aria-pressed={view === id}
                className={cn(
                  "w-8 h-8 rounded-[8px] flex items-center justify-center transition-colors cursor-pointer",
                  view === id ? "bg-white text-[#6655DF] shadow-sm" : "text-[#8A90A6] hover:text-[#6655DF]",
                )}
              >
                <IconCmp className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      {visible.length === 0 ? (
        <div className="rounded-[16px] border border-dashed border-[#DFE2ED] bg-white px-4 py-16 text-center">
          <span className="w-12 h-12 rounded-full bg-[#EEECFF] flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-5 h-5 text-[#6655DF]" />
          </span>
          <p className="text-[14px] font-bold text-[#171C35]">
            {search.trim() ? `No programmes match “${search.trim()}”.` : emptyCopy[filter]}
          </p>
          {filter === "all" && !search.trim() && (
            <Link href="/programs" className="mt-4 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-[10px] text-[14px] font-bold bg-[#6655DF] text-white hover:bg-[#2C2368] transition-colors no-underline">
              Browse programmes
            </Link>
          )}
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {visible.map(p => (
            <ProgramCard
              key={p.enrollmentId}
              p={p}
              onRate={n => handleRate(p, n)}
              onToggleFavorite={() => handleToggleFavorite(p)}
              onToggleArchive={() => handleToggleArchive(p)}
              onShare={() => handleShare(p)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {visible.map(p => (
            <ProgramRow
              key={p.enrollmentId}
              p={p}
              onRate={n => handleRate(p, n)}
              onToggleFavorite={() => handleToggleFavorite(p)}
              onToggleArchive={() => handleToggleArchive(p)}
              onShare={() => handleShare(p)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default StudentProgramsPage
