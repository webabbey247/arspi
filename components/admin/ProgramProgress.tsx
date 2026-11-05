"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { TickProgress } from "@/components/ui/TickProgress"
import { Panel, StatTile, EmptyState, Pill, SearchInput, FilterChips, metaCls } from "@/components/admin/AdminKit"

type Learner = {
  userId: string; name: string; email: string
  status: "ACTIVE" | "COMPLETED" | "DROPPED"
  enrolledAt: string; completedAt: string | null
  lessons:     { done: number; total: number; pct: number }
  quizzes:     { passed: number; total: number }
  assignments: { submitted: number; accepted: number; total: number }
  assessments: { attempted: number; passed: number; total: number }
  grade:       { finalMarks: number; quizPct: number; projectPct: number; passed: boolean } | null
  certificate: string | null
  lastActiveAt: string | null
}

type Progress = {
  totals: {
    enrolled: number; completed: number; lessons: number; quizzes: number
    assignments: number; avgCompletion: number; awaitingReview: number
  }
  learners: Learner[]
}

type Filter = "all" | "active" | "completed" | "stalled"

function relTime(iso: string | null) {
  if (!iso) return "never"
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days < 1) return "today"
  if (days === 1) return "yesterday"
  if (days < 7) return `${days}d ago`
  if (days < 35) return `${Math.round(days / 7)}w ago`
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

/**
 * Per-learner progress for one programme.
 *
 * This is the view that was missing: nothing in the admin workspace read
 * lesson, quiz or assignment progress, so staff could see that someone was
 * enrolled but not how far they had got.
 */
export default function ProgramProgress({ programId }: { programId: string }) {
  const [data, setData]       = useState<Progress | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState("")
  const [filter, setFilter]   = useState<Filter>("all")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/programs/${programId}/progress`)
      const d   = await res.json()
      if (res.ok) setData(d)
    } finally {
      setLoading(false)
    }
  }, [programId])

  useEffect(() => { load() }, [load])

  /** "Stalled" = started, not finished, nothing touched in a fortnight. The
   *  figure staff actually act on — it names who to chase. */
  const isStalled = (l: Learner) =>
    l.status === "ACTIVE" &&
    l.lessons.done > 0 &&
    l.lessons.pct < 100 &&
    (!l.lastActiveAt || Date.now() - new Date(l.lastActiveAt).getTime() > 14 * 86_400_000)

  const counts = useMemo(() => {
    const ls = data?.learners ?? []
    return {
      all:       ls.length,
      active:    ls.filter(l => l.status === "ACTIVE").length,
      completed: ls.filter(l => l.status === "COMPLETED").length,
      stalled:   ls.filter(isStalled).length,
    }
  }, [data])

  const visible = useMemo(() => {
    const ls = data?.learners ?? []
    const base =
      filter === "active"    ? ls.filter(l => l.status === "ACTIVE") :
      filter === "completed" ? ls.filter(l => l.status === "COMPLETED") :
      filter === "stalled"   ? ls.filter(isStalled) : ls
    const q = search.trim().toLowerCase()
    return q ? base.filter(l => l.name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q)) : base
  }, [data, filter, search])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-[16px]" />)}
        </div>
        <Skeleton className="h-80 rounded-[16px]" />
      </div>
    )
  }

  if (!data) return null
  const { totals } = data

  return (
    <div className="space-y-4">
      {/* Headline figures */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatTile
          label="Enrolled" value={totals.enrolled}
          motif="dots" accent="text-[#6655DF]" tone="bg-[#EEECFF] text-[#6655DF]"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>}
          breakdown={[
            { label: "completed", value: totals.completed, tone: "emerald" },
            { label: "in progress", value: totals.enrolled - totals.completed, tone: "sky" },
          ]}
        />
        <StatTile
          label="Average completion" value={`${totals.avgCompletion}%`}
          motif="hatch" accent="text-emerald-600" tone="bg-emerald-50 text-emerald-600"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
          hint={`Across ${totals.lessons} lesson${totals.lessons === 1 ? "" : "s"}`}
        />
        <StatTile
          label="Needs chasing" value={counts.stalled}
          motif="rings" accent="text-amber-600" tone="bg-amber-50 text-amber-600"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
          hint="Started, quiet for 2 weeks"
        />
        <StatTile
          label="Awaiting review" value={totals.awaitingReview}
          motif="waves" accent="text-sky-600" tone="bg-sky-50 text-sky-600"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>}
          hint={`${totals.assignments} assignment${totals.assignments === 1 ? "" : "s"} in this programme`}
        />
      </div>

      <Panel
        title="Learners"
        note="Lessons, quizzes, assignments and grade for each enrolment"
        bodyClassName="p-0"
        icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>}
        action={<span className={metaCls}>{visible.length} of {counts.all}</span>}
      >
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 px-4 sm:px-5 py-3 border-b border-[#F0EFFA]">
          <FilterChips
            value={filter}
            onChange={setFilter}
            options={[
              { id: "all",       label: "All",         count: counts.all },
              { id: "active",    label: "In progress", count: counts.active },
              { id: "completed", label: "Completed",   count: counts.completed },
              { id: "stalled",   label: "Stalled",     count: counts.stalled },
            ]}
          />
          <SearchInput value={search} onChange={setSearch} placeholder="Search learners…" className="lg:ml-auto lg:w-60" />
        </div>

        {visible.length === 0 ? (
          <EmptyState
            className="border-0 rounded-none"
            title={counts.all === 0 ? "Nobody is enrolled yet." : "No learners match those filters."}
            hint={counts.all === 0 ? "Progress appears here as soon as someone enrols." : undefined}
          />
        ) : (
          <ul className="divide-y divide-[#F0EFFA]">
            {visible.map(l => (
              <li key={l.userId} className="px-4 sm:px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[14px] font-bold text-[#171C35]">{l.name}</p>
                      {l.status === "COMPLETED" && <Pill tone="emerald">Completed</Pill>}
                      {isStalled(l) && <Pill tone="amber">Stalled</Pill>}
                      {l.certificate && <Pill tone="sky">Certificate</Pill>}
                    </div>
                    <p className={cn(metaCls, "mt-1 truncate")}>
                      {l.email} · last active {relTime(l.lastActiveAt)}
                    </p>
                  </div>

                  {l.grade && (
                    <div className="text-right shrink-0">
                      <p className="text-[18px] font-extrabold text-[#171C35] leading-none">
                        {Math.round(l.grade.finalMarks)}<span className="text-[12px] text-[#8A90A6]">/100</span>
                      </p>
                      <p className={cn("text-[11px] font-extrabold uppercase tracking-[0.08em] mt-1",
                        l.grade.passed ? "text-emerald-700" : "text-amber-700")}>
                        {l.grade.passed ? "Passing" : "Not yet"}
                      </p>
                    </div>
                  )}
                </div>

                <TickProgress
                  value={l.lessons.pct}
                  ticks={30}
                  tone={l.lessons.pct === 100 ? "success" : "brand"}
                  className="mt-3"
                  label={`${l.lessons.done} of ${l.lessons.total} lessons`}
                />

                <dl className="grid grid-cols-3 gap-3 mt-3">
                  {[
                    { k: "Quizzes",     v: `${l.quizzes.passed}/${l.quizzes.total}` },
                    { k: "Assignments", v: `${l.assignments.accepted}/${l.assignments.total}`,
                      sub: l.assignments.submitted > l.assignments.accepted
                        ? `${l.assignments.submitted - l.assignments.accepted} awaiting` : undefined },
                    { k: "Assessments", v: `${l.assessments.passed}/${l.assessments.total}` },
                  ].map(x => (
                    <div key={x.k} className="rounded-[10px] bg-[#FAFAFF] border border-[#F0EFFA] px-3 py-2">
                      <dt className={metaCls}>{x.k}</dt>
                      <dd className="text-[14px] font-bold text-[#171C35] mt-0.5 tabular-nums">{x.v}</dd>
                      {x.sub && <dd className="text-[11px] font-bold text-amber-700 mt-0.5">{x.sub}</dd>}
                    </div>
                  ))}
                </dl>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}
