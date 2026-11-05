"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AdminPageHeader, StatTile, Panel, PanelLink, Pill, metaCls,
  type StatBreakdown, type PillTone,
} from "@/components/admin/AdminKit"
import { cn } from "@/lib/utils"

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

// ── Section config (icon paths lifted from DashboardSidebar for consistency) ──

const SECTION_CONFIG: Record<Section, { label: string; href: string; color: string; bg: string; icon: React.ReactNode }> = {
  insights: {
    label: "Insights", href: "/administrator/insights", color: "#6655DF", bg: "#EEECFF",
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
  breakdown: StatBreakdown[]
}) {
  const cfg = SECTION_CONFIG[section]
  return (
    <StatTile
      href={cfg.href}
      label={cfg.label}
      value={total.toLocaleString()}
      loading={loading}
      breakdown={breakdown}
      tone=""
      icon={
        <span className="grid place-items-center w-full h-full rounded-[11px]" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
          <Icon className="w-4.5 h-4.5">{cfg.icon}</Icon>
        </span>
      }
    />
  )
}

type RecentEntry = { title: string; meta: string; statusLabel: string; statusTone: PillTone }

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
    <Panel
      title={section === "workshops" ? "Upcoming workshops" : `Recent ${cfg.label.toLowerCase()}`}
      note={section === "workshops" ? "Next five by date" : "Five most recently created"}
      action={<PanelLink href={cfg.href}>View all</PanelLink>}
      bodyClassName="p-0"
      icon={
        <span className="grid place-items-center w-full h-full rounded-[11px]" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
          <Icon className="w-4 h-4">{cfg.icon}</Icon>
        </span>
      }
    >
      {loading ? (
        <div className="flex flex-col gap-3 px-4 sm:px-5 py-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-2/3" />
                <Skeleton className="h-2.5 w-1/3" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full shrink-0" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="px-4 sm:px-5 py-10 text-center text-[14px] font-bold text-[#8A90A6]">{emptyLabel}</p>
      ) : (
        <ul className="divide-y divide-[#F0EFFA]">
          {items.map((item, i) => (
            <li key={i}>
              <Link
                href={cfg.href}
                className="flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-[#FAFAFF] transition-colors no-underline"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-bold text-[#171C35] truncate">{item.title}</span>
                  <span className={cn(metaCls, "block mt-1 truncate")}>{item.meta}</span>
                </span>
                <Pill tone={item.statusTone}>{item.statusLabel}</Pill>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
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

  // Header figures: what the public can see, and what is still unfinished.
  // Workshops and projects have no draft state, so only the two that do
  // contribute to the draft count — otherwise it would read as zero-inflated.
  const livePublished = programsPublished + insightsPublished + workshops.filter(w => w.published).length
  const totalDrafts   = programsDraft + insightsDraft

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
      <AdminPageHeader
        tone="band"
        title="Dashboard"
        description="Everything published across the platform, and what needs attention."
        stats={loading ? undefined : [
          { label: "Live",   value: livePublished },
          { label: "Drafts", value: totalDrafts },
        ]}
      />

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
