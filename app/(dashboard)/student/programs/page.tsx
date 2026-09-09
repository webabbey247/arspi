"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  MoreVertical, Play, Award, Share2, Heart, Archive, ArchiveRestore, Star, Check,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

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

type Filter = "all" | "favorites" | "archived"

// ── Star rating ─────────────────────────────────────────────────────────────

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
          <Star className={cn("w-3 h-3 transition-colors", n <= shown ? "fill-amber-400 text-amber-400" : "fill-none text-[#D8D4CC]")} />
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
    document.addEventListener("mousedown", onDocClick)
    return () => document.removeEventListener("mousedown", onDocClick)
  }, [open])

  const itemCls = "w-full flex items-center gap-2 px-3 py-2 text-[12.5px] text-[#1A1916] hover:bg-[#F5F4F1] transition-colors cursor-pointer text-left"

  return (
    <div ref={ref} className="absolute top-2 right-2 z-10">
      <button
        type="button"
        onClick={e => { e.preventDefault(); e.stopPropagation(); setOpen(o => !o) }}
        className="w-7 h-7 rounded-full bg-white/95 shadow-sm border border-black/5 flex items-center justify-center hover:bg-white transition-colors cursor-pointer"
        aria-label="Program actions"
      >
        <MoreVertical className="w-3.5 h-3.5 text-[#6B6560]" />
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-48 rounded-[10px] border border-[#E5E2DC] bg-white shadow-lg py-1 overflow-hidden">
          <Link href={`/student/programs/${slug}`} className={itemCls} onClick={() => setOpen(false)}>
            <Play className="w-3.5 h-3.5 text-[#6B6560]" /> Continue
          </Link>
          {certificateCode && (
            <a href={`/verify/${certificateCode}`} target="_blank" rel="noopener noreferrer" className={itemCls} onClick={() => setOpen(false)}>
              <Award className="w-3.5 h-3.5 text-[#6B6560]" /> View certificate
            </a>
          )}
          <button type="button" className={itemCls} onClick={e => { e.preventDefault(); e.stopPropagation(); onShare(); setOpen(false) }}>
            <Share2 className="w-3.5 h-3.5 text-[#6B6560]" /> Share
          </button>
          <button type="button" className={itemCls} onClick={e => { e.preventDefault(); e.stopPropagation(); onToggleFavorite(); setOpen(false) }}>
            <Heart className={cn("w-3.5 h-3.5", favorited ? "fill-red-500 text-red-500" : "text-[#6B6560]")} />
            {favorited ? "Unfavorite" : "Favorite"}
          </button>
          <button type="button" className={itemCls} onClick={e => { e.preventDefault(); e.stopPropagation(); onToggleArchive(); setOpen(false) }}>
            {archived ? <ArchiveRestore className="w-3.5 h-3.5 text-[#6B6560]" /> : <Archive className="w-3.5 h-3.5 text-[#6B6560]" />}
            {archived ? "Unarchive" : "Archive"}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Program card ─────────────────────────────────────────────────────────────

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
  const pct = completed ? 100 : p.totalLessons > 0 ? Math.round((p.completedLessons / p.totalLessons) * 100) : 0

  return (
    <div className="group relative rounded-[14px] border border-[#E5E2DC] bg-white overflow-hidden hover:border-[#0474C4] hover:shadow-sm transition-all flex flex-col">
      <Link href={`/student/programs/${p.course.slug}`} className="flex flex-col">
        <div className="relative w-full aspect-video bg-[#F5F4F1] shrink-0">
          {p.course.thumbnail ? (
            <Image src={p.course.thumbnail} alt={p.course.title} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#A8A39C]">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>
            </div>
          )}
          {completed && (
            <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
              <Check className="w-2.5 h-2.5" strokeWidth={3} />
              Completed
            </span>
          )}
        </div>
        <div className="px-4 pt-4 flex flex-col gap-1.5">
          <p className="text-[14px] font-bold text-[#1A1916] leading-tight line-clamp-2 group-hover:text-[#0474C4] transition-colors">{p.course.title}</p>
          <p className="text-[11px] text-[#A8A39C]">{p.course.instructor.name}</p>
        </div>
      </Link>

      <div className="px-4 pb-4 pt-3 mt-auto">
        <div className="h-1.5 rounded-full bg-[#F0EEE9] overflow-hidden">
          <div className={cn("h-full rounded-full transition-all", completed ? "bg-emerald-600" : "bg-[#0474C4]")} style={{ width: `${pct}%` }} />
        </div>
        <div className="flex items-end justify-between mt-1.5">
          <span className="text-[11px] text-[#6B6560]">{pct}% complete</span>
          <div className="flex flex-col items-end gap-0.5">
            <StarRow value={p.studentRating} onRate={onRate} />
            <span className="text-[10px] text-[#A8A39C]">Your rating</span>
          </div>
        </div>
      </div>

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
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all",       label: "All" },
  { id: "favorites", label: "Favorites" },
  { id: "archived",  label: "Archived" },
]

const StudentProgramsPage = () => {
  const [programs, setPrograms] = useState<ProgramSummary[]>([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState<Filter>("all")
  const [toast, setToast]       = useState<{ msg: string; ok: boolean } | null>(null)

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    let cancelled = false
    fetch("/api/student/programs")
      .then(r => r.json())
      .then(d => { if (!cancelled) setPrograms(d.programs ?? []) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  async function patch(slug: string, body: Record<string, unknown>) {
    const resp = await fetch(`/api/student/programs/${slug}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    })
    if (!resp.ok) {
      showToast("Could not save your change.", false)
      return null
    }
    return resp.json()
  }

  function updateLocal(enrollmentId: string, patchFields: Partial<ProgramSummary>) {
    setPrograms(prev => prev.map(p => (p.enrollmentId === enrollmentId ? { ...p, ...patchFields } : p)))
  }

  async function handleRate(p: ProgramSummary, n: number) {
    const next = p.studentRating === n ? null : n
    updateLocal(p.enrollmentId, { studentRating: next })
    const result = await patch(p.course.slug, { studentRating: next })
    if (result) showToast(next ? `Rated ${next} star${next > 1 ? "s" : ""}.` : "Rating cleared.")
  }

  async function handleToggleFavorite(p: ProgramSummary) {
    const next = !p.favorited
    updateLocal(p.enrollmentId, { favorited: next })
    const result = await patch(p.course.slug, { favorited: next })
    if (result) showToast(next ? "Added to favorites." : "Removed from favorites.")
  }

  async function handleToggleArchive(p: ProgramSummary) {
    const next = !p.archived
    updateLocal(p.enrollmentId, { archived: next })
    const result = await patch(p.course.slug, { archived: next })
    if (result) showToast(next ? "Program archived." : "Program restored.")
  }

  async function handleShare(p: ProgramSummary) {
    const url = `${window.location.origin}/programs/${p.course.slug}`
    try {
      await navigator.clipboard.writeText(url)
      showToast("Link copied to clipboard.")
    } catch {
      showToast("Could not copy the link.", false)
    }
  }

  const visible = useMemo(() => {
    if (filter === "favorites") return programs.filter(p => p.favorited && !p.archived)
    if (filter === "archived")  return programs.filter(p => p.archived)
    return programs.filter(p => !p.archived)
  }, [programs, filter])

  const emptyCopy: Record<Filter, string> = {
    all:       "You haven't enrolled in any programmes yet.",
    favorites: "You haven't favorited any programmes yet.",
    archived:  "You don't have any archived programmes.",
  }

  return (
    <div className="max-w-350 mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {toast && (
        <div className={cn(
          "fixed top-4 right-4 left-4 sm:left-auto z-100 px-4 py-3 rounded-lg shadow-lg text-[13px] font-medium flex items-center gap-2",
          toast.ok ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-600 border border-red-200",
        )}>
          {toast.msg}
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[18px] font-extrabold text-[#1A1916]">My Programs</h1>
          <p className="text-[#A8A39C] text-[13px] mt-0.5">Your enrolled programmes and progress</p>
        </div>
        <div className="flex items-center gap-2">
          {FILTERS.map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-colors cursor-pointer",
                filter === f.id
                  ? "bg-[#0474C4] text-white border-[#0474C4]"
                  : "border-[#E5E2DC] text-[#6B6560] hover:border-[#0474C4] hover:text-[#0474C4]",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-[14px]" />)}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-[14px] border border-[#E5E2DC] bg-white px-4 py-16 text-center">
          <p className="text-[13px] text-[#A8A39C] mb-3">{emptyCopy[filter]}</p>
          {filter === "all" && (
            <Link href="/programs" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[13px] font-semibold bg-[#0474C4] text-white hover:bg-[#06457F] transition-colors">
              Browse programmes
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
      )}
    </div>
  )
}

export default StudentProgramsPage
