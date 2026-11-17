"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Search, Inbox } from "lucide-react"
import { cn } from "@/lib/utils"
import { TableSkeletonRows, SkeletonCardList } from "@/components/ui/skeleton"
import { FilterSelect } from "@/components/admin/AdminKit"

type Row = {
  enrollmentId: string
  status: "ACTIVE" | "COMPLETED" | "DROPPED"
  enrolledAt: string
  completedAt: string | null
  progressPct: number
  lessonsDone: number
  lessonsTotal: number
  grade: { finalMarks: number; passed: boolean } | null
  pendingMarking: number
  programme: { id: string; title: string; slug: string }
  student: { id: string; email: string; name: string; avatar: string | null }
}

const STATUS_PILL: Record<Row["status"], string> = {
  ACTIVE:    "bg-sky-50 text-sky-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  DROPPED:   "bg-[#F5F6FB] text-[#69708A]",
}

const PAGE_SIZE = 20

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

function Avatar({ s }: { s: Row["student"] }) {
  return s.avatar
    ? <Image src={s.avatar} alt="" width={34} height={34} className="rounded-full object-cover shrink-0" />
    : (
      <span className="w-[34px] h-[34px] rounded-full bg-[#EEECFF] text-[#6655DF] text-[11px] font-extrabold grid place-items-center shrink-0">
        {s.name.slice(0, 2).toUpperCase()}
      </span>
    )
}

function Progress({ r }: { r: Row }) {
  return (
    <div className="min-w-32">
      <div className="flex items-center justify-between text-[11.5px] font-semibold text-[#69708A] mb-1">
        <span>{r.progressPct}%</span>
        <span>{r.lessonsDone}/{r.lessonsTotal} lessons</span>
      </div>
      <div className="h-1.5 rounded-full bg-[#F0EFFA] overflow-hidden" role="progressbar" aria-valuenow={r.progressPct} aria-valuemin={0} aria-valuemax={100} aria-label={`${r.student.name} progress`}>
        <div className={cn("h-full rounded-full", r.progressPct === 100 ? "bg-emerald-500" : "bg-[#6655DF]")} style={{ width: `${r.progressPct}%` }} />
      </div>
    </div>
  )
}

function Marking({ n }: { n: number }) {
  if (n === 0) return <span className="text-[12.5px] text-[#8A90A6]">—</span>
  return (
    <Link href="/instructor/grading" className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold no-underline hover:bg-amber-100">
      {n} to mark
    </Link>
  )
}

/**
 * The instructor's learners: everyone enrolled in a programme assigned to
 * them, one row per enrolment. A learner on two of their programmes appears
 * twice, once per programme, since progress and grades are per programme.
 */
export default function InstructorStudentsPage() {
  const [rows, setRows]         = useState<Row[] | null>(null)
  const [programmes, setProgs]  = useState<{ id: string; title: string }[]>([])
  const [error, setError]       = useState<string | null>(null)
  const [search, setSearch]     = useState("")
  const [programme, setProgramme] = useState<string>("ALL")
  const [status, setStatus]     = useState<"ALL" | Row["status"]>("ALL")
  const [page, setPage]         = useState(1)

  useEffect(() => {
    let live = true
    fetch("/api/instructor/students")
      .then(async r => {
        const d = await r.json().catch(() => ({}))
        if (!live) return
        if (!r.ok) { setError(d.error ?? "Could not load your students."); setRows([]); return }
        setRows(d.students ?? [])
        setProgs(d.programmes ?? [])
      })
      .catch(() => { if (live) { setError("Could not load your students."); setRows([]) } })
    return () => { live = false }
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (rows ?? []).filter(r =>
      (programme === "ALL" || r.programme.id === programme) &&
      (status === "ALL" || r.status === status) &&
      (!q || r.student.name.toLowerCase().includes(q) || r.student.email.toLowerCase().includes(q) || r.programme.title.toLowerCase().includes(q)),
    )
  }, [rows, search, programme, status])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, totalPages)
  const shown = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)
  const loading = rows === null
  const learners = new Set((rows ?? []).map(r => r.student.id)).size
  const toMark = (rows ?? []).reduce((n, r) => n + r.pendingMarking, 0)

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-350 mx-auto">
      <div className="mb-6">
        <span className="block text-[12px] tracking-[0.12em] uppercase font-extrabold text-[#6655DF] mb-1.5">Instructor</span>
        <h1 className="text-[clamp(28px,3.4vw,40px)] leading-[1.1] tracking-[-0.035em] font-extrabold text-[#171C35]">Students</h1>
        <p className="text-[#69708A] text-[15px] mt-1.5 max-w-180">
          Learners enrolled in the programmes assigned to you
          {!loading && rows!.length > 0 && <> · {learners} learner{learners === 1 ? "" : "s"}{toMark > 0 && <>, <Link href="/instructor/grading" className="font-bold text-amber-700 underline">{toMark} submission{toMark === 1 ? "" : "s"} to mark</Link></>}</>}
        </p>
      </div>

      <div className="rounded-[16px] border border-[#DFE2ED] overflow-hidden bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-3 sm:px-4 py-3 border-b border-[#DFE2ED]">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8A90A6]" />
            <input
              value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search students…" aria-label="Search students"
              className="w-full pl-8 pr-3 py-2 text-[13px] bg-white border border-[#DFE2ED] rounded-[10px] text-[#171C35] outline-none placeholder:text-[#8A90A6] focus:border-[#6655DF] transition-colors"
            />
          </div>
          <div className="sm:ml-auto flex flex-wrap items-center gap-2">
            <FilterSelect
              label="Filter by programme" menuWidth="w-72"
              value={programme} onChange={v => { setProgramme(v); setPage(1) }}
              options={[{ value: "ALL", label: "All programmes" }, ...programmes.map(p => ({ value: p.id, label: p.title }))]}
            />
            <FilterSelect
              label="Filter by status"
              value={status} onChange={v => { setStatus(v); setPage(1) }}
              options={[
                { value: "ALL", label: "All statuses" },
                { value: "ACTIVE", label: "Active" },
                { value: "COMPLETED", label: "Completed" },
                { value: "DROPPED", label: "Dropped" },
              ] as const}
            />
          </div>
        </div>

        {error && <p className="px-4 py-3 text-[13px] text-red-600 bg-red-50 border-b border-red-100">{error}</p>}

        {/* Table — desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-[#FAFAFF] border-b border-[#DFE2ED]">
                {["Student", "Programme", "Progress", "Grade", "To mark", "Status", "Enrolled"].map(c => (
                  <th key={c} className="px-4 py-2.5 text-left text-[11px] font-bold text-[#8A90A6] tracking-[0.5px] uppercase whitespace-nowrap">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? <TableSkeletonRows colSpan={7} /> : shown.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center">
                  <Inbox className="w-7 h-7 text-[#C9CCDD] mx-auto mb-2" />
                  <p className="text-[13.5px] font-bold text-[#171C35]">
                    {rows!.length === 0 ? "No learners yet." : "No students match these filters."}
                  </p>
                  {rows!.length === 0 && <p className="text-[12.5px] text-[#8A90A6] mt-1">Learners appear here once they enrol in a programme assigned to you.</p>}
                </td></tr>
              ) : shown.map(r => (
                <tr key={r.enrollmentId} className="border-b border-[#F0EFFA] last:border-none hover:bg-[#FAFAFF]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar s={r.student} />
                      <div className="min-w-0">
                        <p className="font-semibold text-[#171C35] truncate">{r.student.name}</p>
                        <p className="text-[11.5px] text-[#8A90A6] truncate">{r.student.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-60">
                    <Link href={`/programs/${r.programme.slug}`} className="font-semibold text-[#171C35] hover:text-[#6655DF] line-clamp-2">{r.programme.title}</Link>
                  </td>
                  <td className="px-4 py-3"><Progress r={r} /></td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {r.grade
                      ? <span className={cn("font-bold", r.grade.passed ? "text-emerald-700" : "text-[#171C35]")}>{Math.round(r.grade.finalMarks)}/100{r.grade.passed ? " · passed" : ""}</span>
                      : <span className="text-[#8A90A6]">—</span>}
                  </td>
                  <td className="px-4 py-3"><Marking n={r.pendingMarking} /></td>
                  <td className="px-4 py-3">
                    <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize", STATUS_PILL[r.status])}>{r.status.toLowerCase()}</span>
                  </td>
                  <td className="px-4 py-3 text-[#69708A] whitespace-nowrap">{fmtDate(r.enrolledAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cards — mobile */}
        <div className="md:hidden">
          {loading ? <SkeletonCardList /> : shown.length === 0 ? (
            <p className="px-4 py-10 text-center text-[13px] text-[#8A90A6]">{rows!.length === 0 ? "No learners yet." : "No students match these filters."}</p>
          ) : shown.map(r => (
            <div key={r.enrollmentId} className="px-4 py-4 border-b border-[#F0EFFA] last:border-none space-y-3">
              <div className="flex items-center gap-3">
                <Avatar s={r.student} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[14px] text-[#171C35] truncate">{r.student.name}</p>
                  <p className="text-[12px] text-[#8A90A6] truncate">{r.programme.title}</p>
                </div>
                <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize shrink-0", STATUS_PILL[r.status])}>{r.status.toLowerCase()}</span>
              </div>
              <Progress r={r} />
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-[#69708A]">
                  {r.grade ? `${Math.round(r.grade.finalMarks)}/100${r.grade.passed ? " · passed" : ""}` : "Not graded"} · enrolled {fmtDate(r.enrolledAt)}
                </span>
                <Marking n={r.pendingMarking} />
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-3 sm:px-4 py-2.5 bg-[#FAFAFF] border-t border-[#DFE2ED]">
          <p className="text-[11px] text-[#8A90A6]">
            Showing <span className="font-semibold text-[#69708A]">{filtered.length === 0 ? 0 : (current - 1) * PAGE_SIZE + 1}–{Math.min(current * PAGE_SIZE, filtered.length)}</span> of <span className="font-semibold text-[#69708A]">{filtered.length}</span> enrolments
          </p>
          {filtered.length > PAGE_SIZE && (
            <div className="flex items-center gap-1.5">
              <button onClick={() => setPage(Math.max(1, current - 1))} disabled={current === 1} className="px-3 py-1 rounded-[8px] text-[12px] font-semibold border border-[#DFE2ED] bg-white text-[#69708A] hover:border-[#6655DF] hover:text-[#6655DF] disabled:opacity-40 cursor-pointer">Prev</button>
              <span className="text-[11px] font-semibold text-[#69708A] px-2">{current} / {totalPages}</span>
              <button onClick={() => setPage(Math.min(totalPages, current + 1))} disabled={current >= totalPages} className="px-3 py-1 rounded-[8px] text-[12px] font-semibold border border-[#DFE2ED] bg-white text-[#69708A] hover:border-[#6655DF] hover:text-[#6655DF] disabled:opacity-40 cursor-pointer">Next</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
