"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"

// ── Types ────────────────────────────────────────────────────────────────────
// Lean shapes matching what each admin GET route already returns —
// decoupled from the service row types so this page only depends on the wire shape.

type ProgramRow = {
  id: string; title: string; slug: string; status: "DRAFT" | "PUBLISHED"
  createdAt: string; _count: { enrollments: number }
}
type InsightRow = {
  id: string; title: string; slug: string; published: boolean
  createdAt: string; publishedAt: string | null
}
type WorkshopRow = {
  id: string; title: string; slug: string; published: boolean
  date: string | null; createdAt: string; registered: number
  _count?: { registrations: number }
}
type ProjectRow = {
  id: string; title: string; slug: string; status: "ACTIVE" | "COMPLETE"
  client: string; createdAt: string
}

type Section = "programs" | "insights" | "workshops" | "projects"
type Tone    = "emerald" | "amber" | "slate"

// ── Section config (icon paths lifted from DashboardSidebar for consistency) ──

const SECTION_CONFIG: Record<Section, { label: string; href: string; color: string; bg: string; icon: React.ReactNode }> = {
  insights: {
    label: "Insights", href: "/administrator/insights", color: "#0474C4", bg: "#EEF6FF",
    icon: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></>,
  },
  workshops: {
    label: "Workshops", href: "/administrator/workshops", color: "#7C3AED", bg: "#F3EEFF",
    icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
  },
  programs: {
    label: "Programs", href: "/administrator/programs", color: "#C07C0A", bg: "#FEF3C7",
    icon: <><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></>,
  },
  projects: {
    label: "Research Projects", href: "/administrator/projects", color: "#059669", bg: "#ECFDF5",
    icon: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><path d="M9 21V9" /></>,
  },
}

const TONE_CLASSES: Record<Tone, string> = {
  emerald: "bg-emerald-50 text-emerald-700",
  amber:   "bg-amber-50 text-amber-700",
  slate:   "bg-[#F0EEE9] text-[#6B6560]",
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins   = Math.floor(diffMs / 60000)
  if (mins < 1)     return "just now"
  if (mins < 60)    return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24)   return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7)     return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 5)    return `${weeks}w ago`
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

function untilLabel(iso: string): string {
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000)
  if (days <= 0) return "today"
  if (days === 1) return "tomorrow"
  if (days < 7)   return `in ${days}d`
  const weeks = Math.round(days / 7)
  return `in ${weeks}w`
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

// ── UI pieces ────────────────────────────────────────────────────────────────

function Icon({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  )
}

function StatCard({
  section, loading, total, breakdown,
}: {
  section:   Section
  loading:   boolean
  total:     number
  breakdown: { label: string; value: number; tone: Tone }[]
}) {
  const cfg = SECTION_CONFIG[section]
  return (
    <Link
      href={cfg.href}
      className="group flex flex-col gap-3 p-4 rounded-[14px] border border-[#E5E2DC] bg-white hover:border-[#0474C4] hover:shadow-sm transition-all"
    >
      <div className="flex items-center justify-between">
        <div className="w-9 h-9 rounded-[10px] flex items-center justify-center" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
          <Icon className="w-4.5 h-4.5">{cfg.icon}</Icon>
        </div>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#A8A39C] group-hover:text-[#0474C4] group-hover:translate-x-0.5 transition-all">
          <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
        </svg>
      </div>
      <div>
        <p className="text-[24px] font-extrabold text-[#1A1916] leading-none">
          {loading ? <Skeleton className="inline-block w-10 h-6" /> : total.toLocaleString()}
        </p>
        <p className="text-[13px] font-semibold text-[#6B6560] mt-1.5">{cfg.label}</p>
      </div>
      {loading ? (
        <div className="flex flex-wrap gap-1.5">
          <Skeleton className="h-4.5 w-16 rounded-full" />
          <Skeleton className="h-4.5 w-14 rounded-full" />
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {breakdown.map(b => (
            <span key={b.label} className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${TONE_CLASSES[b.tone]}`}>
              {b.value} {b.label}
            </span>
          ))}
        </div>
      )}
    </Link>
  )
}

type RecentEntry = { title: string; meta: string; statusLabel: string; statusTone: Tone }

function RecentPanel({
  section, loading, items, emptyLabel,
}: {
  section:    Section
  loading:    boolean
  items:      RecentEntry[]
  emptyLabel: string
}) {
  const cfg = SECTION_CONFIG[section]
  return (
    <div className="rounded-[14px] border border-[#E5E2DC] bg-white overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E2DC] bg-[#FAFAF9]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-[7px] flex items-center justify-center" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
            <Icon className="w-3 h-3">{cfg.icon}</Icon>
          </div>
          <h2 className="text-[13px] font-bold text-[#1A1916]">{section === "workshops" ? "Upcoming Workshops" : `Recent ${cfg.label}`}</h2>
        </div>
        <Link href={cfg.href} className="text-[11px] font-semibold text-[#0474C4] hover:text-[#06457F] transition-colors">View all</Link>
      </div>
      <div className="flex-1">
        {loading ? (
          <div className="flex flex-col gap-2.5 px-4 py-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-2.5 w-1/3" />
                </div>
                <Skeleton className="h-4.5 w-14 rounded-full shrink-0" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="px-4 py-8 text-center text-[#A8A39C] text-[12px]">{emptyLabel}</div>
        ) : (
          items.map((item, i) => (
            <Link
              key={i}
              href={cfg.href}
              className="flex items-center gap-2 px-4 py-2.5 border-b border-[#F0EEE9] last:border-none hover:bg-[#FAFAF9] transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-semibold text-[#1A1916] truncate">{item.title}</p>
                <p className="text-[11px] text-[#A8A39C] mt-0.5">{item.meta}</p>
              </div>
              <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${TONE_CLASSES[item.statusTone]}`}>
                {item.statusLabel}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

const AdministratorDashboardPage = () => {
  const [programs, setPrograms]   = useState<ProgramRow[]>([])
  const [insights, setInsights]   = useState<InsightRow[]>([])
  const [workshops, setWorkshops] = useState<WorkshopRow[]>([])
  const [projects, setProjects]   = useState<ProjectRow[]>([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const [pRes, iRes, wRes, jRes] = await Promise.all([
        fetch("/api/programs"),
        fetch("/api/insights"),
        fetch("/api/workshops"),
        fetch("/api/projects"),
      ])
      const [pData, iData, wData, jData] = await Promise.all([pRes.json(), iRes.json(), wRes.json(), jRes.json()])
      if (cancelled) return
      if (pRes.ok) setPrograms(pData.programs ?? [])
      if (iRes.ok) setInsights(iData.insights ?? [])
      if (wRes.ok) setWorkshops(wData.workshops ?? [])
      if (jRes.ok) setProjects(jData.projects ?? [])
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  const now = useMemo(() => new Date().getTime(), [])

  const programsPublished = programs.filter(p => p.status === "PUBLISHED").length
  const programsDraft     = programs.length - programsPublished
  const insightsPublished = insights.filter(i => i.published).length
  const insightsDraft     = insights.length - insightsPublished
  const workshopsUpcoming = workshops.filter(w => w.date && new Date(w.date).getTime() >= now).length
  const workshopsPast     = workshops.length - workshopsUpcoming
  const projectsActive    = projects.filter(p => p.status === "ACTIVE").length
  const projectsComplete  = projects.length - projectsActive

  const sortedByCreated = <T extends { createdAt: string }>(rows: T[]) =>
    [...rows].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const recentPrograms: RecentEntry[] = sortedByCreated(programs).slice(0, 5).map(p => ({
    title: p.title, meta: timeAgo(p.createdAt),
    statusLabel: p.status === "DRAFT" ? "Draft" : "Published",
    statusTone:  p.status === "DRAFT" ? "amber" : "emerald",
  }))

  const upcomingWorkshops: RecentEntry[] = workshops
    .filter(w => w.date && new Date(w.date).getTime() >= now)
    .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime())
    .slice(0, 5)
    .map(w => ({
      title: w.title, meta: `${fmtDate(w.date!)} · ${untilLabel(w.date!)}`,
      statusLabel: w.published ? "Published" : "Draft",
      statusTone:  w.published ? "emerald" : "amber",
    }))

  const recentInsights: RecentEntry[] = sortedByCreated(insights).slice(0, 5).map(i => ({
    title: i.title, meta: timeAgo(i.createdAt),
    statusLabel: i.published ? "Published" : "Draft",
    statusTone:  i.published ? "emerald" : "amber",
  }))

  const recentProjects: RecentEntry[] = sortedByCreated(projects).slice(0, 5).map(p => ({
    title: p.title, meta: p.client,
    statusLabel: p.status === "ACTIVE" ? "Active" : "Complete",
    statusTone:  p.status === "ACTIVE" ? "emerald" : "slate",
  }))

  return (
    <div className="max-w-350 mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-[18px] font-extrabold text-[#1A1916]">Dashboard</h1>
        <p className="text-[#A8A39C] text-[13px] mt-0.5">An overview of your platform&apos;s content</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          section="insights" loading={loading} total={insights.length}
          breakdown={[
            { label: "published", value: insightsPublished, tone: "emerald" },
            { label: "draft",     value: insightsDraft,     tone: "amber" },
          ]}
        />
        <StatCard
          section="workshops" loading={loading} total={workshops.length}
          breakdown={[
            { label: "upcoming", value: workshopsUpcoming, tone: "emerald" },
            { label: "past",     value: workshopsPast,     tone: "slate" },
          ]}
        />
        <StatCard
          section="programs" loading={loading} total={programs.length}
          breakdown={[
            { label: "published", value: programsPublished, tone: "emerald" },
            { label: "draft",     value: programsDraft,     tone: "amber" },
          ]}
        />
        <StatCard
          section="projects" loading={loading} total={projects.length}
          breakdown={[
            { label: "active",   value: projectsActive,   tone: "emerald" },
            { label: "complete", value: projectsComplete, tone: "slate" },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <RecentPanel section="programs"  loading={loading} items={recentPrograms}    emptyLabel="No programs yet." />
        <RecentPanel section="workshops" loading={loading} items={upcomingWorkshops} emptyLabel="No upcoming workshops." />
        <RecentPanel section="insights"  loading={loading} items={recentInsights}    emptyLabel="No insights yet." />
        <RecentPanel section="projects"  loading={loading} items={recentProjects}    emptyLabel="No research projects yet." />
      </div>
    </div>
  )
}

export default AdministratorDashboardPage
