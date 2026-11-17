"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { BookOpen, Users, ClipboardCheck, TrendingUp, Inbox, CalendarDays, Activity, GraduationCap, ArrowRight, FileUp, FolderUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { AdminPageHeader, StatTile, Panel, PanelLink, Pill, metaCls, type PillTone } from "@/components/admin/AdminKit"
import { TypeTile, timeAgo, type NotificationItem } from "@/components/notifications/meta"
import NotificationBanner from "@/components/notifications/NotificationBanner"

type Programme = {
  id: string; title: string; slug: string; thumbnail: string | null
  state: "live" | "draft" | "awaiting"
  learners: number; avgCompletion: number | null; toMark: number; updatedAt: string
}
type QueueItem = { id: string; kind: "assignment" | "project"; title: string; programme: string; learner: string; submittedAt: string }
type Data = {
  stats: {
    programmes: { total: number; live: number; draft: number; awaiting: number }
    learners: { total: number; active: number; completed: number }
    toMark: { total: number; assignments: number; projects: number }
    avgCompletion: number | null
  }
  programmes: Programme[]
  queue: QueueItem[]
  recentEnrolments: { id: string; learner: string; programme: string; enrolledAt: string; progress: number }[]
  workshops: { id: string; title: string; date: string | null; startTime: string; medium: string; registered: number; published: boolean }[]
  activity: NotificationItem[]
}

const STATE: Record<Programme["state"], { label: string; tone: PillTone }> = {
  live:     { label: "Live",              tone: "emerald" },
  draft:    { label: "Draft",             tone: "amber" },
  awaiting: { label: "Awaiting approval", tone: "brand" },
}

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"
}

function Bar({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-[12px] text-[#8A90A6]">No learners yet</span>
  return (
    <div className="flex items-center gap-2 min-w-28">
      <div className="h-1.5 flex-1 rounded-full bg-[#F0EFFA] overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Average completion">
        <div className={cn("h-full rounded-full", pct >= 100 ? "bg-emerald-500" : "bg-[#6655DF]")} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[12px] font-bold text-[#69708A] w-9 text-right">{pct}%</span>
    </div>
  )
}

function Rows({ n = 4 }: { n?: number }) {
  return (
    <div className="px-4 sm:px-5 py-4 space-y-3">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="flex items-center gap-3"><Skeleton className="h-9 w-9 rounded-[10px]" /><div className="flex-1 space-y-1.5"><Skeleton className="h-3.5 w-2/3" /><Skeleton className="h-2.5 w-1/3" /></div></div>
      ))}
    </div>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-4 sm:px-5 py-10 text-center text-[13.5px] font-bold text-[#8A90A6]">{children}</p>
}

/**
 * The instructor's home: what they teach, who's learning, and what needs
 * them — work to mark first, since that's what learners are waiting on.
 */
export default function InstructorDashboard({ firstName }: { firstName: string | null }) {
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let live = true
    fetch("/api/instructor/dashboard")
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(d => { if (live) setData(d) })
      .catch(() => { if (live) setError(true) })
    return () => { live = false }
  }, [])

  const loading = !data && !error
  const s = data?.stats

  return (
    <div className="max-w-350 mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <AdminPageHeader
        tone="band"
        eyebrow="Instructor workspace"
        title={`${greeting()}${firstName ? `, ${firstName}` : ""}.`}
        description={
          !s ? "Your programmes, learners and marking in one place."
            : s.toMark.total > 0 ? `${s.toMark.total} submission${s.toMark.total === 1 ? " is" : "s are"} waiting for your marks.`
            : s.programmes.total === 0 ? "No programmes have been assigned to you yet — an administrator will assign one for review."
            : "You're up to date on marking. Here's how your programmes are doing."
        }
        stats={s ? [
          { label: "To mark", value: s.toMark.total },
          { label: "Learners", value: s.learners.total },
        ] : undefined}
        actions={s && s.toMark.total > 0 ? (
          <Link href="/instructor/grading" className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-[12px] bg-white text-[#171C35] text-[14px] font-bold hover:bg-[#EEECFF] no-underline">
            Start marking <ArrowRight className="w-4 h-4" />
          </Link>
        ) : undefined}
      />

      <NotificationBanner className="mb-6" />

      {error && (
        <p className="mb-6 rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-[13.5px] text-red-700">
          Couldn&apos;t load your dashboard. Refresh to try again.
        </p>
      )}

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatTile
          href="/instructor/programs" label="My programmes" value={s?.programmes.total ?? 0} loading={loading}
          motif="dots" accent="text-[#6655DF]" tone="bg-[#EEECFF] text-[#6655DF]"
          icon={<BookOpen className="w-4 h-4" />}
          breakdown={s ? [
            { label: "live", value: s.programmes.live, tone: "emerald" },
            { label: "draft", value: s.programmes.draft, tone: "amber" },
            ...(s.programmes.awaiting ? [{ label: "awaiting", value: s.programmes.awaiting, tone: "sky" as const }] : []),
          ] : undefined}
        />
        <StatTile
          href="/instructor/students" label="Learners" value={s?.learners.total ?? 0} loading={loading}
          motif="waves" accent="text-sky-600" tone="bg-sky-50 text-sky-600"
          icon={<Users className="w-4 h-4" />}
          breakdown={s ? [
            { label: "active", value: s.learners.active, tone: "sky" },
            { label: "completed", value: s.learners.completed, tone: "emerald" },
          ] : undefined}
        />
        <StatTile
          href="/instructor/grading" label="To mark" value={s?.toMark.total ?? 0} loading={loading}
          motif="hatch" accent="text-amber-600" tone="bg-amber-50 text-amber-600"
          icon={<ClipboardCheck className="w-4 h-4" />}
          breakdown={s ? [
            { label: "assignments", value: s.toMark.assignments, tone: "amber" },
            { label: "projects", value: s.toMark.projects, tone: "slate" },
          ] : undefined}
        />
        <StatTile
          label="Avg. completion" value={s?.avgCompletion == null ? "—" : `${s.avgCompletion}%`} loading={loading}
          motif="rings" accent="text-emerald-600" tone="bg-emerald-50 text-emerald-600"
          icon={<TrendingUp className="w-4 h-4" />}
          hint="Lessons completed, across your learners"
        />
      </div>

      {/* ── Programmes + marking queue ───────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-3 mb-3">
        <Panel
          title="My programmes" note="Assigned to you to review, edit and grade"
          icon={<BookOpen className="w-4 h-4" />}
          action={<PanelLink href="/instructor/programs">Manage</PanelLink>}
          bodyClassName="p-0"
        >
          {loading ? <Rows /> : !data || data.programmes.length === 0 ? (
            <Empty>No programmes assigned yet.</Empty>
          ) : (
            <ul className="divide-y divide-[#F0EFFA]">
              {data.programmes.slice(0, 6).map(p => (
                <li key={p.id} className="px-4 sm:px-5 py-3.5 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <div className="flex items-center gap-3 min-w-0 flex-1 basis-64">
                    {p.thumbnail
                      // eslint-disable-next-line @next/next/no-img-element -- programme thumbnails come from the upload host
                      ? <img src={p.thumbnail} alt="" className="w-10 h-10 rounded-[10px] object-cover shrink-0" />
                      : <span className="w-10 h-10 rounded-[10px] bg-[#EEECFF] text-[#6655DF] grid place-items-center shrink-0"><GraduationCap className="w-4.5 h-4.5" /></span>}
                    <div className="min-w-0">
                      <Link href={`/programs/${p.slug}`} className="block text-[14px] font-bold text-[#171C35] hover:text-[#6655DF] truncate no-underline">{p.title}</Link>
                      <div className="flex items-center gap-2 mt-1">
                        <Pill tone={STATE[p.state].tone}>{STATE[p.state].label}</Pill>
                        <span className={metaCls}>{p.learners} learner{p.learners === 1 ? "" : "s"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-full sm:w-40"><Bar pct={p.avgCompletion} /></div>
                  <div className="w-24 text-right">
                    {p.toMark > 0
                      ? <Link href="/instructor/grading" className="inline-flex px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold no-underline hover:bg-amber-100">{p.toMark} to mark</Link>
                      : <span className="text-[12px] text-[#8A90A6]">Nothing to mark</span>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Marking queue" note="Oldest first — learners are waiting on these"
          icon={<Inbox className="w-4 h-4" />}
          action={<PanelLink href="/instructor/grading">Open grading</PanelLink>}
          bodyClassName="p-0"
        >
          {loading ? <Rows /> : !data || data.queue.length === 0 ? (
            <Empty>All caught up — nothing to mark.</Empty>
          ) : (
            <ul className="divide-y divide-[#F0EFFA]">
              {data.queue.map(q => (
                <li key={`${q.kind}-${q.id}`}>
                  <Link href="/instructor/grading" className="flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-[#FAFAFF] no-underline">
                    <span className={cn("w-9 h-9 rounded-[10px] grid place-items-center shrink-0", q.kind === "project" ? "bg-amber-50 text-amber-600" : "bg-[#EEECFF] text-[#6655DF]")}>
                      {q.kind === "project" ? <FolderUp className="w-4 h-4" /> : <FileUp className="w-4 h-4" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13.5px] font-bold text-[#171C35] truncate">{q.title}</span>
                      <span className={cn(metaCls, "block mt-0.5 truncate")}>{q.learner} · {q.programme}</span>
                    </span>
                    <span className="text-[11.5px] font-semibold text-[#8A90A6] whitespace-nowrap">{timeAgo(q.submittedAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* ── Enrolments · workshops · activity ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Panel
          title="Recent enrolments" note="Newest learners on your programmes"
          icon={<GraduationCap className="w-4 h-4" />}
          action={<PanelLink href="/instructor/students">All students</PanelLink>}
          bodyClassName="p-0"
        >
          {loading ? <Rows n={3} /> : !data || data.recentEnrolments.length === 0 ? (
            <Empty>No enrolments yet.</Empty>
          ) : (
            <ul className="divide-y divide-[#F0EFFA]">
              {data.recentEnrolments.map(e => (
                <li key={e.id} className="px-4 sm:px-5 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[13.5px] font-bold text-[#171C35] truncate">{e.learner}</span>
                    <span className="text-[11.5px] text-[#8A90A6] whitespace-nowrap">{timeAgo(e.enrolledAt)}</span>
                  </div>
                  <p className={cn(metaCls, "mt-0.5 truncate")}>{e.programme}</p>
                  <div className="mt-2"><Bar pct={e.progress} /></div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Upcoming workshops" note="Sessions you're running"
          icon={<CalendarDays className="w-4 h-4" />}
          action={<PanelLink href="/instructor/workshops">All workshops</PanelLink>}
          bodyClassName="p-0"
        >
          {loading ? <Rows n={3} /> : !data || data.workshops.length === 0 ? (
            <Empty>No upcoming workshops.</Empty>
          ) : (
            <ul className="divide-y divide-[#F0EFFA]">
              {data.workshops.map(w => {
                const d = w.date ? new Date(w.date) : null
                return (
                  <li key={w.id} className="px-4 sm:px-5 py-3 flex items-center gap-3">
                    <span className="w-11 shrink-0 rounded-[10px] border border-[#DFE2ED] text-center py-1">
                      <span className="block text-[10px] font-extrabold uppercase text-[#6655DF]">{d ? d.toLocaleDateString("en-GB", { month: "short" }) : "—"}</span>
                      <span className="block text-[16px] font-extrabold text-[#171C35] leading-tight">{d ? d.getDate() : "?"}</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13.5px] font-bold text-[#171C35] truncate">{w.title}</span>
                      <span className={cn(metaCls, "block mt-0.5")}>
                        {[w.startTime, w.medium.replace(/_/g, " ").toLowerCase(), `${w.registered} registered`].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </Panel>

        <Panel
          title="Recent activity" note="Your latest notifications"
          icon={<Activity className="w-4 h-4" />}
          action={<PanelLink href="/notifications">View all</PanelLink>}
          bodyClassName="p-0"
        >
          {loading ? <Rows n={3} /> : !data || data.activity.length === 0 ? (
            <Empty>Nothing new.</Empty>
          ) : (
            <ul className="divide-y divide-[#F0EFFA]">
              {data.activity.slice(0, 5).map(n => (
                <li key={n.id}>
                  <Link href={n.link ?? "/notifications"} className={cn("flex gap-3 px-4 sm:px-5 py-3 hover:bg-[#FAFAFF] no-underline", !n.read && "bg-[#FBFAFF]")}>
                    <TypeTile type={n.type} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-bold text-[#171C35] leading-snug line-clamp-2">{n.title}</span>
                      <span className="block text-[11.5px] text-[#8A90A6] mt-0.5">{timeAgo(n.createdAt)}</span>
                    </span>
                    {!n.read && <span className="mt-1.5 w-2 h-2 rounded-full bg-[#6655DF] shrink-0" aria-label="Unread" />}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  )
}
