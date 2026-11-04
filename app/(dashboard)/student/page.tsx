"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  BookOpen, Users, GraduationCap, Flame, Play, ArrowRight, Calendar,
  CheckCircle2, Sparkles, TrendingUp, Award, CalendarPlus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { StudentHomeSkeleton } from "@/components/ui/skeleton"
import { TickProgress } from "@/components/ui/TickProgress"

// ── Types (mirrors /api/student/dashboard) ──────────────────────────────────

type Stats = {
  programs:     { total: number; active: number; completed: number; thisMonth: number }
  workshops:    { total: number; upcoming: number; past: number }
  certificates: { total: number; thisMonth: number }
}
type ContinueLearning = {
  courseId: string; title: string; slug: string; thumbnail: string | null
  completedLessons: number; totalLessons: number
} | null
type WorkshopRow = {
  id: string; title: string; slug: string | null; date: string | null
  status: "PENDING" | "CONFIRMED" | "CANCELLED"; startTime?: string | null
}
type CalendarWorkshop = { id: string; title: string; slug: string; date: string }
type ActivityKind = "enrolled" | "completed" | "progress" | "certificate" | "workshop"
type ActivityRow = { id: string; kind: ActivityKind; title: string; href: string | null; at: string }
type ProgressRow = {
  id: string; title: string; slug: string
  completedLessons: number; totalLessons: number
  status: "ACTIVE" | "COMPLETED" | "DROPPED"; lastTouchedAt: string
}

type DashboardData = {
  student:           { firstName: string | null; name: string }
  stats:             Stats
  lessons:           { completed: number; total: number }
  activity:          ActivityRow[]
  programProgress:   ProgressRow[]
  continueLearning:  ContinueLearning
  upcomingWorkshops: WorkshopRow[]
  calendarWorkshops: CalendarWorkshop[]
}

// ── Formatting ───────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

/** Compact relative time for the activity feed — "3d ago" reads faster than a
 *  date when the whole column is timestamps. */
function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diff / 60000)
  if (mins < 1)   return "just now"
  if (mins < 60)  return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24)   return `${hrs}h ago`
  const days = Math.round(hrs / 24)
  if (days < 7)   return `${days}d ago`
  const weeks = Math.round(days / 7)
  if (weeks < 5)  return `${weeks}w ago`
  return fmtDate(iso)
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 18) return "Good afternoon"
  return "Good evening"
}

const metaCls = "text-[11px] tracking-[0.12em] uppercase font-extrabold text-[#8A90A6]"

// ── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  href, icon, label, value, sub, tone, featured,
}: {
  href: string; icon: React.ReactNode; label: string; value: number
  sub: string; tone: string; featured?: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative rounded-[16px] border px-4 pt-7 pb-4 transition-all no-underline block",
        featured
          ? "bg-[#2C2368] border-[#2C2368] hover:bg-[#241C61]"
          : "bg-white border-[#DFE2ED] hover:border-[#6655DF] hover:shadow-[0_8px_24px_rgba(102,85,223,0.1)]",
      )}
    >
      {/* Icon sits in a notch above the card, as in the reference layout */}
      <span className={cn(
        "absolute -top-3.5 left-4 w-9 h-9 rounded-[11px] flex items-center justify-center border shadow-sm",
        featured ? "bg-white border-white text-[#2C2368]" : cn(tone, "border-white"),
      )}>
        {icon}
      </span>

      <p className={cn("text-[30px] font-extrabold leading-none tracking-[-0.03em]", featured ? "text-white" : "text-[#171C35]")}>
        {value.toLocaleString()}
      </p>
      <p className={cn("text-[14px] font-bold mt-2", featured ? "text-white/90" : "text-[#171C35]")}>{label}</p>
      <p className={cn("text-[12px] font-bold mt-1", featured ? "text-white/55" : "text-[#8A90A6]")}>{sub}</p>

      <ArrowRight className={cn(
        "absolute top-4 right-4 w-3.5 h-3.5 transition-all group-hover:translate-x-0.5",
        featured ? "text-white/50" : "text-[#C9CCDD] group-hover:text-[#6655DF]",
      )} />
    </Link>
  )
}

// ── Continue learning hero ───────────────────────────────────────────────────

function ContinueHero({ item }: { item: ContinueLearning }) {
  if (!item) return null
  const pct = item.totalLessons > 0 ? Math.round((item.completedLessons / item.totalLessons) * 100) : 0
  return (
    <section className="relative rounded-[18px] overflow-hidden min-h-45 flex items-end">
      <div className="absolute inset-0">
        {item.thumbnail ? (
          <Image src={item.thumbnail} alt={item.title} fill className="object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#2C2368] via-[#4B3BA8] to-[#6655DF]" />
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-[#0B0E24] via-[#0B0E24]/85 to-[#0B0E24]/40" />

      <div className="relative w-full p-5">
        <span className={cn(metaCls, "block text-white/75 mb-1.5")}>Pick up where you left off</span>
        <p className="text-[clamp(18px,2vw,24px)] leading-[1.15] tracking-[-0.03em] font-extrabold text-white max-w-lg">
          {item.title}
        </p>

        {item.totalLessons > 0 && (
          <TickProgress
            value={pct}
            tone="light"
            className="mt-3.5 max-w-sm"
            label={`${item.completedLessons} of ${item.totalLessons} lessons`}
          />
        )}

        <Link
          href={`/student/programs/${item.slug}`}
          className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-[12px] text-[14px] font-bold bg-white text-[#171C35] hover:bg-[#EEECFF] transition-colors no-underline"
        >
          <Play className="w-4 h-4 fill-current" />
          {item.completedLessons > 0 ? "Continue learning" : "Start learning"}
        </Link>
      </div>
    </section>
  )
}

// ── Overall progress ring ────────────────────────────────────────────────────

function ProgressRing({ pct }: { pct: number }) {
  const r = 46
  const c = 2 * Math.PI * r
  return (
    <div className="relative w-28 h-28 shrink-0">
      <svg viewBox="0 0 112 112" className="w-full h-full -rotate-90">
        <circle cx="56" cy="56" r={r} fill="none" stroke="#F0EFFA" strokeWidth="11" />
        <circle
          cx="56" cy="56" r={r} fill="none" stroke="#6655DF" strokeWidth="11" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (c * pct) / 100}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[26px] font-extrabold text-[#171C35] leading-none tracking-[-0.03em]">{pct}%</span>
        <span className={cn(metaCls, "mt-1 text-[9px]")}>Overall</span>
      </div>
    </div>
  )
}

// ── Progress panel ───────────────────────────────────────────────────────────

function ProgressPanel({ lessons, rows }: { lessons: { completed: number; total: number }; rows: ProgressRow[] }) {
  const pct = lessons.total > 0 ? Math.round((lessons.completed / lessons.total) * 100) : 0

  return (
    <div className="rounded-[18px] border border-[#DFE2ED] bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-[#F0EFFA] flex items-center justify-between gap-3">
        <div>
          <h2 className="text-[14px] font-bold text-[#171C35]">Your progress</h2>
          <p className="text-[12px] font-bold text-[#8A90A6] mt-0.5">How far you are through each programme</p>
        </div>
        <Link href="/student/programs" className="shrink-0 text-[14px] font-bold text-[#6655DF] hover:text-[#2C2368] transition-colors no-underline">
          See all
        </Link>
      </div>

      <div className="p-5 flex flex-col sm:flex-row items-center gap-6">
        <ProgressRing pct={pct} />
        <div className="grid grid-cols-3 gap-3 w-full">
          {[
            { label: "Lessons done", value: lessons.completed },
            { label: "Lessons left",  value: Math.max(0, lessons.total - lessons.completed) },
            { label: "Programmes",    value: rows.length },
          ].map(s => (
            <div key={s.label} className="rounded-[12px] bg-[#FAFAFF] border border-[#F0EFFA] px-3 py-2.5 text-center sm:text-left">
              <p className="text-[20px] font-extrabold text-[#171C35] leading-none">{s.value}</p>
              <p className={cn(metaCls, "mt-1.5")}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {rows.length > 0 && (
        <div className="px-5 pb-5 space-y-3.5">
          {rows.map(r => {
            const done = r.status === "COMPLETED"
            const rp = done ? 100 : Math.round((r.completedLessons / r.totalLessons) * 100)
            return (
              <div key={r.id}>
                <div className="flex items-center justify-between gap-3 mb-1.5">
                  <Link
                    href={`/student/programs/${r.slug}`}
                    className="text-[14px] font-bold text-[#171C35] hover:text-[#6655DF] transition-colors truncate no-underline"
                  >
                    {r.title}
                  </Link>
                  <span className="text-[12px] font-bold text-[#69708A] shrink-0">
                    {r.completedLessons}/{r.totalLessons}
                  </span>
                </div>
                <TickProgress value={rp} ticks={36} tone={done ? "success" : "brand"} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Activity feed ────────────────────────────────────────────────────────────

const ACTIVITY_META: Record<ActivityKind, { icon: React.ReactNode; tone: string; verb: string }> = {
  enrolled:    { icon: <Sparkles className="w-3.5 h-3.5" />,     tone: "bg-[#EEECFF] text-[#6655DF]",   verb: "Enrolled in" },
  progress:    { icon: <TrendingUp className="w-3.5 h-3.5" />,   tone: "bg-sky-50 text-sky-600",        verb: "Picked up again" },
  completed:   { icon: <CheckCircle2 className="w-3.5 h-3.5" />, tone: "bg-emerald-50 text-emerald-600", verb: "Completed" },
  certificate: { icon: <Award className="w-3.5 h-3.5" />,        tone: "bg-amber-50 text-amber-600",    verb: "Earned a certificate for" },
  workshop:    { icon: <CalendarPlus className="w-3.5 h-3.5" />, tone: "bg-rose-50 text-rose-500",      verb: "Registered for" },
}

function ActivityFeed({ rows }: { rows: ActivityRow[] }) {
  return (
    <div className="rounded-[18px] border border-[#DFE2ED] bg-white overflow-hidden h-full flex flex-col">
      <div className="px-5 py-4 border-b border-[#F0EFFA]">
        <h2 className="text-[14px] font-bold text-[#171C35]">Your activity</h2>
        <p className="text-[12px] font-bold text-[#8A90A6] mt-0.5">Everything you&apos;ve done lately</p>
      </div>

      {rows.length === 0 ? (
        <p className="px-5 py-12 text-center text-[14px] font-bold text-[#8A90A6]">Nothing here yet.</p>
      ) : (
        <ul className="flex-1 px-5 py-4 space-y-4">
          {rows.map((a, i) => {
            const meta = ACTIVITY_META[a.kind]
            return (
              <li key={a.id} className="relative flex gap-3">
                {/* Timeline spine, stopping short of the last item */}
                {i < rows.length - 1 && <span className="absolute left-[13px] top-8 bottom-[-16px] w-px bg-[#F0EFFA]" />}
                <span className={cn("relative w-7 h-7 rounded-full flex items-center justify-center shrink-0", meta.tone)}>
                  {meta.icon}
                </span>
                <div className="min-w-0 flex-1 -mt-0.5">
                  <p className="text-[13.5px] leading-snug text-[#69708A]">
                    <span className="font-bold text-[#171C35]">{meta.verb}</span>{" "}
                    {a.href ? (
                      <Link href={a.href} className="font-bold text-[#6655DF] hover:text-[#2C2368] transition-colors no-underline">
                        {a.title}
                      </Link>
                    ) : (
                      <span className="font-bold text-[#171C35]">{a.title}</span>
                    )}
                  </p>
                  <p className={cn(metaCls, "mt-1")}>{relTime(a.at)}</p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

// ── Up next ──────────────────────────────────────────────────────────────────

function UpNext({ rows }: { rows: WorkshopRow[] }) {
  return (
    <div className="rounded-[18px] border border-[#DFE2ED] bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-[#F0EFFA] flex items-center justify-between gap-3">
        <div>
          <h2 className="text-[14px] font-bold text-[#171C35]">Up next</h2>
          <p className="text-[12px] font-bold text-[#8A90A6] mt-0.5">Workshops you&apos;re registered for</p>
        </div>
        <Link href="/student/workshops" className="shrink-0 text-[14px] font-bold text-[#6655DF] hover:text-[#2C2368] transition-colors no-underline">
          View all
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="px-5 py-10 text-center text-[14px] font-bold text-[#8A90A6]">No upcoming workshops.</p>
      ) : (
        <ul className="divide-y divide-[#F0EFFA]">
          {rows.map(r => {
            const d = r.date ? new Date(r.date) : null
            return (
              <li key={r.id}>
                <Link
                  href={r.slug ? `/workshop/${r.slug}` : "/student/workshops"}
                  className="flex items-center gap-3.5 px-5 py-3.5 hover:bg-[#FAFAFF] transition-colors no-underline"
                >
                  <span className="w-12 shrink-0 rounded-[10px] bg-[#EEECFF] py-1.5 text-center">
                    <span className="block text-[16px] font-extrabold text-[#6655DF] leading-none">
                      {d ? d.getDate() : "–"}
                    </span>
                    <span className="block text-[9px] font-extrabold uppercase tracking-[0.1em] text-[#6655DF]/70 mt-0.5">
                      {d ? d.toLocaleDateString("en-GB", { month: "short" }) : "TBA"}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-bold text-[#171C35] truncate">{r.title}</span>
                    <span className={cn(metaCls, "block mt-1")}>
                      {r.startTime ? `${r.startTime} · ` : ""}{r.status === "CONFIRMED" ? "Confirmed" : "Pending"}
                    </span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#C9CCDD] shrink-0" />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

// ── This-month calendar ──────────────────────────────────────────────────────

function MonthCalendar({ events }: { events: CalendarWorkshop[] }) {
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
    <div className="rounded-[18px] border border-[#DFE2ED] bg-white overflow-hidden h-full flex flex-col">
      <div className="px-5 py-4 border-b border-[#F0EFFA] flex items-center gap-2">
        <Calendar className="w-4 h-4 text-[#6655DF]" />
        <h2 className="text-[14px] font-bold text-[#171C35]">{monthLabel}</h2>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-7 gap-1 mb-1">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={i} className="text-[10px] font-extrabold text-[#8A90A6] text-center py-1">{d}</div>
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
                className={cn(
                  "relative aspect-square flex items-center justify-center rounded-[9px] text-[12px] font-bold",
                  isToday ? "bg-[#6655DF] text-white"
                    : dayEvents.length > 0 ? "bg-[#EEECFF] text-[#6655DF]"
                    : "text-[#171C35]",
                )}
              >
                {day}
                {dayEvents.length > 0 && !isToday && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#6655DF]" />}
              </div>
            )
          })}
        </div>
      </div>

      {events.length > 0 && (
        <div className="border-t border-[#F0EFFA] px-5 py-4 space-y-2.5 mt-auto">
          <p className={metaCls}>This month</p>
          {events.slice(0, 3).map(e => (
            <Link key={e.id} href={`/workshop/${e.slug}`} className="flex items-center gap-2 text-[13.5px] font-bold text-[#171C35] hover:text-[#6655DF] transition-colors no-underline">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6655DF] shrink-0" />
              <span className="truncate flex-1">{e.title}</span>
              <span className="text-[#8A90A6] shrink-0">{new Date(e.date).getDate()}</span>
            </Link>
          ))}
        </div>
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

  const today = useMemo(
    () => new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }),
    [],
  )

  if (loading) return <StudentHomeSkeleton />

  // A failed request still parses to an object ({ error: "…" }), so check for
  // the payload itself rather than just truthiness before destructuring.
  if (!data?.stats) {
    return (
      <div className="max-w-350 mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="rounded-[18px] border border-[#DFE2ED] bg-white px-4 py-16 text-center">
          <p className="text-[14px] font-bold text-[#171C35]">We couldn&apos;t load your dashboard.</p>
          <p className="text-[13px] text-[#69708A] mt-1.5">Please refresh the page and try again.</p>
          <Link href="/student/programs" className="mt-4 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-[10px] text-[14px] font-bold bg-[#6655DF] text-white hover:bg-[#2C2368] transition-colors no-underline">
            Go to My Learning
          </Link>
        </div>
      </div>
    )
  }

  const { stats, lessons, activity, programProgress, continueLearning, upcomingWorkshops, calendarWorkshops } = data
  const firstName = data.student?.firstName?.trim() || data.student?.name?.split(" ")[0] || "there"

  return (
    <div className="max-w-350 mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

      {/* Greeting */}
      <div className="mb-8">
        <span className="block text-[12px] tracking-[0.12em] uppercase font-extrabold text-[#6655DF] mb-1.5">{today}</span>
        <h1 className="text-[clamp(28px,3.4vw,40px)] leading-[1.1] tracking-[-0.035em] font-extrabold text-[#171C35]">
          {greeting()}, {firstName}! <span className="inline-block">👋</span>
        </h1>
        <p className="text-[#69708A] text-[15px] mt-1.5 max-w-180">
          {stats.programs.active > 0
            ? `You have ${stats.programs.active} programme${stats.programs.active === 1 ? "" : "s"} on the go. Here's where you left things.`
            : "Here's an overview of your learning."}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 mt-6">
        <StatCard
          href="/student/programs" label="Programmes enrolled" value={stats.programs.total}
          icon={<BookOpen className="w-4.5 h-4.5" />} tone="bg-[#EEECFF] text-[#6655DF]"
          sub={stats.programs.thisMonth > 0 ? `${stats.programs.thisMonth} joined this month` : `${stats.programs.completed} completed`}
        />
        <StatCard
          featured
          href="/student/programs" label="In progress" value={stats.programs.active}
          icon={<Flame className="w-4.5 h-4.5" />} tone="bg-amber-50 text-amber-600"
          sub={lessons.total > 0 ? `${lessons.completed} of ${lessons.total} lessons done` : "No lessons tracked yet"}
        />
        <StatCard
          href="/student/workshops" label="Workshops" value={stats.workshops.total}
          icon={<Users className="w-4.5 h-4.5" />} tone="bg-rose-50 text-rose-500"
          sub={`${stats.workshops.upcoming} upcoming · ${stats.workshops.past} past`}
        />
        <StatCard
          href="/student/certificates" label="Certificates" value={stats.certificates.total}
          icon={<GraduationCap className="w-4.5 h-4.5" />} tone="bg-emerald-50 text-emerald-600"
          sub={stats.certificates.thisMonth > 0 ? `${stats.certificates.thisMonth} earned this month` : "Finish a programme to earn one"}
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2 flex flex-col gap-4">
          {continueLearning && <ContinueHero item={continueLearning} />}
          <ProgressPanel lessons={lessons} rows={programProgress} />
        </div>
        <ActivityFeed rows={activity} />
      </div>

      {/* Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <UpNext rows={upcomingWorkshops} />
        </div>
        <MonthCalendar events={calendarWorkshops} />
      </div>
    </div>
  )
}

export default StudentDashboardPage
