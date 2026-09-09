"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Skeleton } from "@/components/ui/skeleton"

// ── Types (mirrors /api/student/dashboard) ──────────────────────────────────

type Stats = {
  programs:     { total: number; active: number; completed: number }
  workshops:    { total: number; upcoming: number; past: number }
  certificates: { total: number }
}
type ContinueLearning = {
  courseId: string; title: string; slug: string; thumbnail: string | null
  completedLessons: number; totalLessons: number
} | null
type ProgramRow = {
  id: string; title: string; slug: string; thumbnail: string | null; level: string
  status: "ACTIVE" | "COMPLETED" | "DROPPED"; enrolledAt: string
  completedLessons: number; totalLessons: number
}
type WorkshopRow = {
  id: string; title: string; slug: string | null; date: string | null
  status: "PENDING" | "CONFIRMED" | "CANCELLED"; startTime?: string | null
}
type CalendarWorkshop = { id: string; title: string; slug: string; date: string }

type DashboardData = {
  stats:             Stats
  continueLearning:  ContinueLearning
  recentPrograms:    ProgramRow[]
  recentWorkshops:   WorkshopRow[]
  upcomingWorkshops: WorkshopRow[]
  calendarWorkshops: CalendarWorkshop[]
}

const LEVEL_LABELS: Record<string, string> = { BEGINNER: "Beginner", INTERMEDIATE: "Intermediate", ADVANCED: "Advanced" }
const LEVEL_COLORS: Record<string, string> = {
  BEGINNER:     "bg-emerald-50 text-emerald-700",
  INTERMEDIATE: "bg-amber-50 text-amber-700",
  ADVANCED:     "bg-rose-50 text-rose-700",
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

// ── Continue-learning notification bar ──────────────────────────────────────

function ContinueLearningBar({ item }: { item: ContinueLearning }) {
  if (!item) return null
  const pct = item.totalLessons > 0 ? Math.round((item.completedLessons / item.totalLessons) * 100) : 0
  return (
    <Link
      href={`/student/programs/${item.slug}`}
      className="group flex items-center gap-4 rounded-[14px] border border-[#BFE0FA] bg-gradient-to-r from-[#EEF6FF] to-white px-4 sm:px-5 py-4 mb-6 hover:border-[#0474C4] transition-colors"
    >
      <div className="relative w-11 h-11 rounded-[11px] bg-[#0474C4] text-white flex items-center justify-center shrink-0 overflow-hidden">
        {item.thumbnail ? (
          <Image src={item.thumbnail} alt="" fill className="object-cover opacity-90" />
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold text-[#0474C4] uppercase tracking-wide">Continue where you left off</p>
        <p className="text-[14px] font-bold text-[#1A1916] truncate mt-0.5">{item.title}</p>
        {item.totalLessons > 0 ? (
          <div className="flex items-center gap-2 mt-1.5">
            <div className="h-1.5 flex-1 max-w-40 rounded-full bg-[#D9E9F7] overflow-hidden">
              <div className="h-full bg-[#0474C4] rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[11px] text-[#6B6560] font-medium shrink-0">{item.completedLessons}/{item.totalLessons} lessons</span>
          </div>
        ) : (
          <p className="text-[11px] text-[#6B6560] mt-1">You&apos;re enrolled — pick up where you left off</p>
        )}
      </div>
      <span className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[13px] font-semibold bg-[#0474C4] text-white group-hover:bg-[#06457F] transition-colors shrink-0">
        Continue
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
      </span>
    </Link>
  )
}

// ── Stat cards ───────────────────────────────────────────────────────────────

function StatCard({
  href, icon, color, bg, label, loading, total, breakdown,
}: {
  href: string; icon: React.ReactNode; color: string; bg: string; label: string
  loading: boolean; total: number; breakdown: { label: string; value: number; tone: "emerald" | "amber" | "slate" }[]
}) {
  const toneClasses = { emerald: "bg-emerald-50 text-emerald-700", amber: "bg-amber-50 text-amber-700", slate: "bg-[#F0EEE9] text-[#6B6560]" }
  return (
    <Link href={href} className="group flex flex-col gap-3 p-4 rounded-[14px] border border-[#E5E2DC] bg-white hover:border-[#0474C4] hover:shadow-sm transition-all">
      <div className="flex items-center justify-between">
        <div className="w-9 h-9 rounded-[10px] flex items-center justify-center" style={{ backgroundColor: bg, color }}>
          <svg viewBox="0 0 24 24" className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
        </div>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#A8A39C] group-hover:text-[#0474C4] group-hover:translate-x-0.5 transition-all">
          <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
        </svg>
      </div>
      <div>
        <p className="text-[24px] font-extrabold text-[#1A1916] leading-none">
          {loading ? <Skeleton className="inline-block w-10 h-6" /> : total.toLocaleString()}
        </p>
        <p className="text-[13px] font-semibold text-[#6B6560] mt-1.5">{label}</p>
      </div>
      {!loading && (
        <div className="flex flex-wrap gap-1.5">
          {breakdown.map(b => (
            <span key={b.label} className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${toneClasses[b.tone]}`}>{b.value} {b.label}</span>
          ))}
        </div>
      )}
    </Link>
  )
}

// ── Workshop mini-table ────────────────────────────────────────────────────

function WorkshopTable({
  title, rows, loading, emptyLabel, dateLabel,
}: {
  title: string; rows: WorkshopRow[]; loading: boolean; emptyLabel: string; dateLabel: string
}) {
  return (
    <div className="rounded-[14px] border border-[#E5E2DC] bg-white overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b border-[#E5E2DC] bg-[#FAFAF9] flex items-center justify-between">
        <h2 className="text-[13px] font-bold text-[#1A1916]">{title}</h2>
        <Link href="/student/workshops" className="text-[11px] font-semibold text-[#0474C4] hover:text-[#06457F] transition-colors">View all</Link>
      </div>
      <table className="w-full text-[12.5px]">
        <thead>
          <tr className="border-b border-[#F0EEE9]">
            <th className="px-4 py-2 text-left text-[10px] font-bold text-[#A8A39C] uppercase tracking-wide">Workshop</th>
            <th className="px-4 py-2 text-left text-[10px] font-bold text-[#A8A39C] uppercase tracking-wide whitespace-nowrap">{dateLabel}</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <tr key={i} className="border-b border-[#F0EEE9] last:border-none">
                <td className="px-4 py-2.5"><Skeleton className="h-3.5 w-32" /></td>
                <td className="px-4 py-2.5"><Skeleton className="h-3.5 w-16" /></td>
              </tr>
            ))
          ) : rows.length === 0 ? (
            <tr><td colSpan={2} className="px-4 py-8 text-center text-[#A8A39C] text-[12px]">{emptyLabel}</td></tr>
          ) : rows.map(r => (
            <tr key={r.id} className="border-b border-[#F0EEE9] last:border-none hover:bg-[#FAFAF9] transition-colors">
              <td className="px-4 py-2.5 font-medium text-[#1A1916] truncate max-w-40">{r.title}</td>
              <td className="px-4 py-2.5 text-[#6B6560] whitespace-nowrap">{r.date ? fmtDate(r.date) : "TBA"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Recent programs table ───────────────────────────────────────────────────

function RecentProgramsTable({ rows, loading }: { rows: ProgramRow[]; loading: boolean }) {
  return (
    <div className="rounded-[14px] border border-[#E5E2DC] bg-white overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b border-[#E5E2DC] bg-[#FAFAF9] flex items-center justify-between">
        <h2 className="text-[13px] font-bold text-[#1A1916]">Recent Programs</h2>
        <Link href="/student/programs" className="text-[11px] font-semibold text-[#0474C4] hover:text-[#06457F] transition-colors">View all</Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-[#F0EEE9]">
              {["Programme", "Level", "Progress", "Status", "Enrolled"].map(c => (
                <th key={c} className="px-4 py-2 text-left text-[10px] font-bold text-[#A8A39C] uppercase tracking-wide whitespace-nowrap">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b border-[#F0EEE9] last:border-none">
                  {Array.from({ length: 5 }).map((__, j) => <td key={j} className="px-4 py-3"><Skeleton className="h-3.5 w-full" /></td>)}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-[#A8A39C] text-[13px]">No programmes enrolled yet.</td></tr>
            ) : rows.map(p => {
              const pct = p.status === "COMPLETED" ? 100 : p.totalLessons > 0 ? Math.round((p.completedLessons / p.totalLessons) * 100) : 0
              return (
                <tr key={p.id} className="border-b border-[#F0EEE9] last:border-none hover:bg-[#FAFAF9] transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/student/programs/${p.slug}`} className="font-semibold text-[#1A1916] hover:text-[#0474C4] transition-colors line-clamp-1">{p.title}</Link>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${LEVEL_COLORS[p.level] ?? "bg-[#F0EEE9] text-[#6B6560]"}`}>{LEVEL_LABELS[p.level] ?? p.level}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 rounded-full bg-[#F0EEE9] overflow-hidden">
                        <div className={`h-full rounded-full ${p.status === "COMPLETED" ? "bg-emerald-600" : "bg-[#0474C4]"}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[11px] text-[#6B6560]">{pct}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${p.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700" : p.status === "DROPPED" ? "bg-[#F0EEE9] text-[#6B6560]" : "bg-[#EEF6FF] text-[#0474C4]"}`}>
                      {p.status === "COMPLETED" ? "Completed" : p.status === "DROPPED" ? "Dropped" : "Active"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#6B6560] whitespace-nowrap">{fmtDate(p.enrolledAt)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── This-month calendar ─────────────────────────────────────────────────────

function MonthCalendar({ events, loading }: { events: CalendarWorkshop[]; loading: boolean }) {
  const now = useMemo(() => new Date(), [])
  const year = now.getFullYear()
  const month = now.getMonth()
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayDate = now.getDate()
  const monthLabel = now.toLocaleDateString("en-GB", { month: "long", year: "numeric" })

  const eventsByDay = new Map<number, CalendarWorkshop[]>()
  for (const e of events) {
    const d = new Date(e.date).getDate()
    eventsByDay.set(d, [...(eventsByDay.get(d) ?? []), e])
  }

  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div className="rounded-[14px] border border-[#E5E2DC] bg-white overflow-hidden flex flex-col h-full">
      <div className="px-4 py-3 border-b border-[#E5E2DC] bg-[#FAFAF9]">
        <h2 className="text-[13px] font-bold text-[#1A1916]">{monthLabel}</h2>
      </div>
      {loading ? (
        <div className="p-4"><Skeleton className="h-48 rounded-[10px]" /></div>
      ) : (
        <>
          <div className="p-3">
            <div className="grid grid-cols-7 gap-1 mb-1">
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <div key={i} className="text-[10px] font-bold text-[#A8A39C] text-center py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, i) => {
                if (day === null) return <div key={i} />
                const dayEvents = eventsByDay.get(day) ?? []
                const isToday = day === todayDate
                return (
                  <div
                    key={i}
                    className={`relative aspect-square flex items-center justify-center rounded-[8px] text-[11px] ${
                      isToday ? "bg-[#0474C4] text-white font-bold" : dayEvents.length > 0 ? "bg-[#EEF6FF] text-[#0474C4] font-semibold" : "text-[#1A1916]"
                    }`}
                  >
                    {day}
                    {dayEvents.length > 0 && !isToday && <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-[#0474C4]" />}
                  </div>
                )
              })}
            </div>
          </div>
          {events.length > 0 ? (
            <div className="border-t border-[#E5E2DC] px-4 py-3 space-y-2">
              <p className="text-[10px] font-bold text-[#A8A39C] uppercase tracking-wide">This month</p>
              {events.slice(0, 4).map(e => (
                <Link key={e.id} href={`/workshop/${e.slug}`} className="flex items-center gap-2 text-[12px] text-[#1A1916] hover:text-[#0474C4] transition-colors">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0474C4] shrink-0" />
                  <span className="truncate flex-1">{e.title}</span>
                  <span className="text-[#A8A39C] shrink-0">{new Date(e.date).getDate()}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="border-t border-[#E5E2DC] px-4 py-6 text-center text-[11px] text-[#A8A39C]">No workshops this month.</div>
          )}
        </>
      )}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

const StudentDashboardPage = () => {
  const [data, setData]       = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch("/api/student/dashboard")
      .then(r => r.json())
      .then(d => { if (!cancelled) setData(d) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const stats             = data?.stats
  const recentPrograms    = data?.recentPrograms ?? []
  const recentWorkshops   = data?.recentWorkshops ?? []
  const upcomingWorkshops = data?.upcomingWorkshops ?? []
  const calendarWorkshops = data?.calendarWorkshops ?? []

  return (
    <div className="max-w-350 mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-[18px] font-extrabold text-[#1A1916]">Dashboard</h1>
        <p className="text-[#A8A39C] text-[13px] mt-0.5">An overview of your learning</p>
      </div>

      <ContinueLearningBar item={data?.continueLearning ?? null} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <StatCard
          href="/student/programs"
          label="Programs" loading={loading} total={stats?.programs.total ?? 0}
          color="#C07C0A" bg="#FEF3C7"
          icon={<><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></>}
          breakdown={[
            { label: "active", value: stats?.programs.active ?? 0, tone: "emerald" },
            { label: "completed", value: stats?.programs.completed ?? 0, tone: "slate" },
          ]}
        />
        <StatCard
          href="/student/workshops"
          label="Workshops" loading={loading} total={stats?.workshops.total ?? 0}
          color="#7C3AED" bg="#F3EEFF"
          icon={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>}
          breakdown={[
            { label: "upcoming", value: stats?.workshops.upcoming ?? 0, tone: "emerald" },
            { label: "past", value: stats?.workshops.past ?? 0, tone: "slate" },
          ]}
        />
        <StatCard
          href="/student/certificates"
          label="Certificates" loading={loading} total={stats?.certificates.total ?? 0}
          color="#059669" bg="#ECFDF5"
          icon={<><circle cx="12" cy="8" r="6" /><path d="M15.5 13.5 17 22l-5-3-5 3 1.5-8.5" /></>}
          breakdown={[]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <WorkshopTable title="Recent Workshops" dateLabel="Date" rows={recentWorkshops} loading={loading} emptyLabel="No past workshops yet." />
        <WorkshopTable title="Upcoming Workshops" dateLabel="Date" rows={upcomingWorkshops} loading={loading} emptyLabel="No upcoming workshops." />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RecentProgramsTable rows={recentPrograms} loading={loading} />
        </div>
        <MonthCalendar events={calendarWorkshops} loading={loading} />
      </div>
    </div>
  )
}

export default StudentDashboardPage
