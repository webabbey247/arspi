"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import {
  FileText, Download, CheckCircle2, RotateCcw, Inbox, Unlock, ExternalLink, FileSpreadsheet, PencilLine,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import RubricMarker from "@/components/rubrics/RubricMarker"
import { RubricGrid } from "@/components/rubrics/RubricGrid"
import type { RubricMarks, RubricVersionView } from "@/lib/rubric"

type Criterion = { id: string; criterion: string; maxPoints: number }
type SubFile   = { url: string; name: string; size?: number }
type Draft     = RubricMarks & { allowResubmit?: boolean }

type ProjectRow = {
  id: string
  attemptNo: number
  status: "IN_PROGRESS" | "SUBMITTED" | "GRADED" | "CHANGES_REQUESTED"
  files: SubFile[] | null
  note: string | null
  score: number | null
  maxScore: number | null
  passed: boolean | null
  rubricScores: Record<string, number> | null
  feedback: string | null
  submittedAt: string | null
  gradedAt: string | null
  rubricVersionId: string | null
  rubricMarks: RubricMarks | null
  gradeBand: string | null
  markingDraft: Draft | null
  assessment: {
    id: string; title: string; rubric: Criterion[] | null; rubricId: string | null
    course: { id: string; title: string; slug: string; componentPassMark: number }
  }
  student: { id: string; name: string; email: string }
}

type AssignmentRow = {
  id: string
  blockId: string
  blockTitle: string | null
  lessonTitle: string | null
  text: string | null
  linkUrl: string | null
  files: SubFile[] | null
  status: "SUBMITTED" | "RETURNED" | "ACCEPTED"
  feedback: string | null
  points: number | null
  maxPoints: number | null
  submittedAt: string
  gradedAt: string | null
  rubricVersionId: string | null
  rubricMarks: RubricMarks | null
  gradeBand: string | null
  markingDraft: Draft | null
  course: { id: string; title: string; slug: string }
  student: { id: string; name: string; email: string }
}

type Rubrics = Record<string, RubricVersionView>

const metaCls = "text-[11px] tracking-[0.12em] uppercase font-extrabold text-[#8A90A6]"
const pillCls = "px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-[0.08em]"

function fmtBytes(n?: number) {
  if (!n) return ""
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

function fmtWhen(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

function downloadCsv(filename: string, header: string[], rows: (string | number | null | undefined)[][]) {
  const esc = (v: string | number | null | undefined) => `"${String(v ?? "").replace(/"/g, '""')}"`
  const csv = [header, ...rows].map(r => r.map(esc).join(",")).join("\n")
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }))
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ── Shared pieces ────────────────────────────────────────────────────────────

function FileChips({ files }: { files: SubFile[] | null }) {
  if (!files?.length) return null
  return (
    <div className="flex flex-wrap gap-2">
      {files.map((f, i) => (
        <a
          key={i} href={f.url} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[9px] border border-[#DFE2ED] bg-[#FAFAFF] text-[13px] font-bold text-[#171C35] hover:border-[#6655DF] transition-colors no-underline"
        >
          <FileText className="w-3.5 h-3.5 text-[#6655DF]" />
          <span className="truncate max-w-50">{f.name}</span>
          {f.size ? <span className="text-[#8A90A6] font-normal">{fmtBytes(f.size)}</span> : null}
          <Download className="w-3 h-3 text-[#8A90A6]" />
        </a>
      ))}
    </div>
  )
}

/** The learner's work, shown beside the rubric while marking. */
function WorkPanel({
  title, text, linkUrl, files, note,
}: { title: string; text?: string | null; linkUrl?: string | null; files: SubFile[] | null; note?: string | null }) {
  return (
    <div className="rounded-[14px] border border-[#DFE2ED] bg-white p-4 space-y-3 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
      <p className={metaCls}>{title}</p>
      {text && <p className="text-[13.5px] text-[#171C35] whitespace-pre-line leading-relaxed">{text}</p>}
      {linkUrl && (
        <a href={linkUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[13.5px] font-bold text-[#6655DF] underline underline-offset-2 break-all">
          {linkUrl} <ExternalLink className="w-3.5 h-3.5 shrink-0" />
        </a>
      )}
      <FileChips files={files} />
      {note && (
        <div className="pt-3 border-t border-[#F0EFFA]">
          <p className={cn(metaCls, "mb-1")}>Learner&apos;s note</p>
          <p className="text-[13.5px] text-[#171C35] whitespace-pre-line">{note}</p>
        </div>
      )}
      {!text && !linkUrl && !files?.length && !note && (
        <p className="text-[13px] text-[#8A90A6]">Nothing attached.</p>
      )}
    </div>
  )
}

/** Learner's work on the left, rubric grid on the right (stacked on small screens). */
function MarkingWorkspace({ work, children }: { work: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="border-t border-[#F0EFFA] bg-[#FAFAFF] px-4 sm:px-5 py-4">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] gap-5 items-start">
        {work}
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  )
}

function ScopeToggle({ scope, setScope, pendingLabel }: {
  scope: "pending" | "all"; setScope: (s: "pending" | "all") => void; pendingLabel: string
}) {
  return (
    <div className="flex items-center gap-0.5 p-0.5 rounded-[10px] bg-[#F0EFFA]">
      {(["pending", "all"] as const).map(s => (
        <button
          key={s} type="button" onClick={() => setScope(s)}
          className={cn(
            "px-3.5 py-1.5 rounded-[8px] text-[14px] font-bold transition-colors cursor-pointer",
            scope === s ? "bg-white text-[#6655DF] shadow-sm" : "text-[#8A90A6] hover:text-[#6655DF]",
          )}
        >
          {s === "pending" ? pendingLabel : "All"}
        </button>
      ))}
    </div>
  )
}

function ExportButton({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <button
      type="button" onClick={onClick} disabled={disabled}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[13px] font-bold border border-[#DFE2ED] text-[#69708A] hover:border-[#6655DF] hover:text-[#6655DF] disabled:opacity-40 cursor-pointer"
    >
      <FileSpreadsheet className="w-3.5 h-3.5" /> Export CSV
    </button>
  )
}

function QueueState({ loading, empty, emptyText }: { loading: boolean; empty: boolean; emptyText: string }) {
  if (loading) {
    return (
      <div className="p-5 space-y-2.5">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-[12px]" />)}
      </div>
    )
  }
  if (empty) {
    return (
      <div className="px-5 py-14 text-center">
        <Inbox className="w-8 h-8 text-[#C9CCDD] mx-auto mb-2.5" />
        <p className="text-[14px] font-bold text-[#171C35]">{emptyText}</p>
      </div>
    )
  }
  return null
}

// ── Legacy project grading (inline criteria, no levels) ─────────────────────

function GradePanel({ sub, onDone }: { sub: ProjectRow; onDone: () => void }) {
  const rubric = sub.assessment.rubric ?? []
  const [scores, setScores]     = useState<Record<string, number>>(sub.rubricScores ?? {})
  const [feedback, setFeedback] = useState(sub.feedback ?? "")
  const [saving, setSaving]     = useState(false)

  const earned = rubric.reduce((s, c) => s + Math.min(scores[c.id] ?? 0, c.maxPoints), 0)
  const total  = rubric.reduce((s, c) => s + c.maxPoints, 0)
  const pct    = total > 0 ? Math.round((earned / total) * 1000) / 10 : 0
  const willPass = pct >= sub.assessment.course.componentPassMark

  async function submit() {
    setSaving(true)
    const res = await fetch(`/api/instructor/submissions/${sub.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ rubricScores: scores, feedback }),
    })
    const d = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok) return toast.error(d.error ?? "Could not save the grade.")
    toast.success(
      d.passed
        ? `Passed at ${d.pct}%.${d.courseCompleted ? " Certificate issued." : ""}`
        : d.mayResubmit ? `Returned at ${d.pct}% — the student can resubmit.` : `Failed at ${d.pct}%.`,
    )
    onDone()
  }

  return (
    <div className="rounded-[14px] border border-[#DFE2ED] bg-white p-4">
      <p className={cn(metaCls, "mb-2")}>Criteria</p>
      <div className="space-y-2">
        {rubric.map(c => (
          <div key={c.id} className="flex items-center gap-3">
            <label htmlFor={`lg-${sub.id}-${c.id}`} className="flex-1 min-w-0 text-[14px] font-bold text-[#171C35] truncate">{c.criterion}</label>
            <input
              id={`lg-${sub.id}-${c.id}`}
              type="number" min={0} max={c.maxPoints} value={scores[c.id] ?? ""}
              onChange={e => {
                const raw = Number(e.target.value)
                // Clamp here as well as on the server, so the running total the
                // grader sees always matches the mark that gets stored.
                const next = Number.isNaN(raw) ? 0 : Math.min(Math.max(raw, 0), c.maxPoints)
                setScores(s => ({ ...s, [c.id]: next }))
              }}
              className="w-20 px-2.5 py-1.5 text-[14px] font-bold text-right bg-white border border-[#DFE2ED] rounded-[9px] outline-none focus:border-[#6655DF]"
            />
            <span className="w-12 text-[13px] font-bold text-[#8A90A6] shrink-0">/ {c.maxPoints}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#F0EFFA]">
        <span className="text-[14px] font-bold text-[#171C35]">{earned} / {total} marks</span>
        <span className={cn(
          "px-2.5 py-1 rounded-full text-[12px] font-extrabold",
          willPass ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700",
        )}>
          {pct}% — {willPass ? "pass" : `below ${sub.assessment.course.componentPassMark}%`}
        </span>
      </div>

      <div className="mt-4">
        <label htmlFor={`lg-fb-${sub.id}`} className={cn(metaCls, "block mb-1.5")}>Feedback</label>
        <textarea
          id={`lg-fb-${sub.id}`}
          value={feedback} onChange={e => setFeedback(e.target.value)} rows={3}
          placeholder={willPass ? "What worked well?" : "What has to change before they resubmit?"}
          className="w-full px-3 py-2 text-[14px] bg-white border border-[#DFE2ED] rounded-[10px] outline-none focus:border-[#6655DF] resize-y"
        />
      </div>

      <div className="flex justify-end gap-2 mt-3">
        <button
          type="button" onClick={submit} disabled={saving}
          className="inline-flex items-center gap-1.5 px-5 py-2 rounded-[10px] text-[14px] font-bold bg-[#6655DF] text-white hover:bg-[#2C2368] disabled:opacity-50 cursor-pointer"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          {saving ? "Saving…" : "Submit grade"}
        </button>
      </div>
    </div>
  )
}

// ── Plain assignment review (no rubric attached) ─────────────────────────────

function SimpleReview({ sub, onDone }: { sub: AssignmentRow; onDone: () => void }) {
  const [points, setPoints]     = useState(sub.points?.toString() ?? "")
  const [feedback, setFeedback] = useState(sub.feedback ?? "")
  const [saving, setSaving]     = useState<"accept" | "return" | null>(null)

  async function decide(accept: boolean) {
    setSaving(accept ? "accept" : "return")
    const res = await fetch(`/api/instructor/assignment-submissions/${sub.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accept, feedback, points: points.trim() === "" ? null : Number(points) }),
    })
    const d = await res.json().catch(() => ({}))
    setSaving(null)
    if (!res.ok) return toast.error(d.error ?? "Could not save the review.")
    toast.success(accept ? "Accepted." : "Returned for revision.")
    onDone()
  }

  return (
    <div className="rounded-[14px] border border-[#DFE2ED] bg-white p-4 space-y-3">
      {sub.maxPoints != null && (
        <div className="flex items-center gap-2">
          <label htmlFor={`pts-${sub.id}`} className="text-[14px] font-bold text-[#171C35]">Points</label>
          <input
            id={`pts-${sub.id}`} type="number" min={0} max={sub.maxPoints} value={points}
            onChange={e => setPoints(e.target.value)}
            className="w-20 px-2.5 py-1.5 text-[14px] font-bold text-right bg-white border border-[#DFE2ED] rounded-[9px] outline-none focus:border-[#6655DF]"
          />
          <span className="text-[13px] font-bold text-[#8A90A6]">/ {sub.maxPoints}</span>
        </div>
      )}
      <div>
        <label htmlFor={`fb-${sub.id}`} className={cn(metaCls, "block mb-1.5")}>Feedback</label>
        <textarea
          id={`fb-${sub.id}`} rows={3} value={feedback} onChange={e => setFeedback(e.target.value)}
          className="w-full px-3 py-2 text-[14px] bg-white border border-[#DFE2ED] rounded-[10px] outline-none focus:border-[#6655DF] resize-y"
        />
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button" onClick={() => decide(false)} disabled={saving !== null}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[14px] font-bold border border-[#DFE2ED] text-[#69708A] hover:border-amber-400 hover:text-amber-700 disabled:opacity-50 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" /> {saving === "return" ? "Returning…" : "Return for revision"}
        </button>
        <button
          type="button" onClick={() => decide(true)} disabled={saving !== null}
          className="inline-flex items-center gap-1.5 px-5 py-2 rounded-[10px] text-[14px] font-bold bg-[#6655DF] text-white hover:bg-[#2C2368] disabled:opacity-50 cursor-pointer"
        >
          <CheckCircle2 className="w-3.5 h-3.5" /> {saving === "accept" ? "Accepting…" : "Accept"}
        </button>
      </div>
    </div>
  )
}

// ── Project queue ────────────────────────────────────────────────────────────

const PROJECT_PILL: Record<ProjectRow["status"], string> = {
  IN_PROGRESS:       "bg-[#F0EFFA] text-[#69708A]",
  SUBMITTED:         "bg-sky-50 text-sky-700",
  GRADED:            "bg-emerald-50 text-emerald-700",
  CHANGES_REQUESTED: "bg-amber-50 text-amber-700",
}

function ProjectQueue() {
  const [rows, setRows]       = useState<ProjectRow[]>([])
  const [rubrics, setRubrics] = useState<Rubrics>({})
  const [loading, setLoading] = useState(true)
  const [scope, setScope]     = useState<"pending" | "all">("pending")
  const [openId, setOpenId]   = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/instructor/submissions?status=${scope === "all" ? "all" : "pending"}`)
      const d   = await res.json()
      if (res.ok) { setRows(d.submissions ?? []); setRubrics(d.rubrics ?? {}) }
      else toast.error(d.error ?? "Could not load submissions.")
    } finally {
      setLoading(false)
    }
  }, [scope])

  useEffect(() => { load() }, [load])

  async function grantAttempt(sub: ProjectRow) {
    const res = await fetch(`/api/instructor/submissions/${sub.id}`, { method: "POST" })
    const d   = await res.json().catch(() => ({}))
    if (!res.ok) return toast.error(d.error ?? "Could not grant an attempt.")
    toast.success(`Attempt ${d.voidedAttemptNo} voided — ${sub.student.name} has another try.`)
    load()
  }

  function exportCsv() {
    downloadCsv(
      `project-grades-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Learner", "Email", "Programme", "Project", "Attempt", "Status", "Score", "Out of", "Percent", "Grade band", "Rubric", "Submitted", "Released"],
      rows.map(s => {
        const v = s.rubricVersionId ? rubrics[s.rubricVersionId] : undefined
        const released = s.status === "GRADED" || s.status === "CHANGES_REQUESTED"
        return [
          s.student.name, s.student.email, s.assessment.course.title, s.assessment.title, s.attemptNo,
          s.status.replace("_", " ").toLowerCase(),
          released ? s.score : "", released ? s.maxScore : "",
          released && s.maxScore ? Math.round(((s.score ?? 0) / s.maxScore) * 1000) / 10 : "",
          released ? s.gradeBand ?? "" : "",
          v && s.rubricMarks ? `${v.title} v${v.version}` : "",
          s.submittedAt?.slice(0, 10), released ? s.gradedAt?.slice(0, 10) : "",
        ]
      }),
    )
  }

  return (
    <div className="rounded-[18px] border border-[#DFE2ED] bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-[#F0EFFA] flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[14px] font-bold text-[#171C35]">Project submissions</h2>
          <p className="text-[12px] font-bold text-[#8A90A6] mt-0.5">Marked against each project&apos;s rubric</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton onClick={exportCsv} disabled={rows.length === 0} />
          <ScopeToggle scope={scope} setScope={setScope} pendingLabel="Awaiting grading" />
        </div>
      </div>

      <QueueState loading={loading} empty={rows.length === 0} emptyText={scope === "pending" ? "Nothing awaiting grading." : "No submissions yet."} />

      {!loading && rows.length > 0 && (
        <ul className="divide-y divide-[#F0EFFA]">
          {rows.map(sub => {
            const open    = openId === sub.id
            const version = sub.rubricVersionId ? rubrics[sub.rubricVersionId] : undefined
            const marked  = sub.rubricMarks && version
            return (
              <li key={sub.id}>
                <div className="px-5 py-4">
                  <div className="flex flex-wrap items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[14px] font-bold text-[#171C35]">{sub.student.name}</p>
                        <span className={cn(pillCls, PROJECT_PILL[sub.status])}>
                          {sub.status.replace("_", " ").toLowerCase()}
                        </span>
                        {sub.status === "SUBMITTED" && sub.markingDraft && (
                          <span className={cn(pillCls, "bg-[#EEECFF] text-[#6655DF]")}>draft saved</span>
                        )}
                        <span className={metaCls}>Attempt {sub.attemptNo}</span>
                      </div>
                      <p className={cn(metaCls, "mt-1.5 truncate")}>
                        {sub.assessment.course.title} · {sub.assessment.title} · {fmtWhen(sub.submittedAt)}
                        {version ? ` · ${version.title}` : ""}
                      </p>
                      {!open && <div className="mt-2.5"><FileChips files={sub.files} /></div>}
                      {sub.status !== "SUBMITTED" && sub.maxScore ? (
                        <p className="text-[13px] font-bold text-[#69708A] mt-2">
                          {sub.score}/{sub.maxScore} marks
                          {sub.gradeBand ? ` · ${sub.gradeBand}` : ""} ·{" "}
                          <span className={sub.passed ? "text-emerald-700" : "text-amber-700"}>
                            {sub.passed ? "passed" : "not passed"}
                          </span>
                        </p>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {sub.status === "SUBMITTED" ? (
                        <button
                          type="button" onClick={() => setOpenId(open ? null : sub.id)}
                          aria-expanded={open}
                          className="px-4 py-2 rounded-[10px] text-[14px] font-bold bg-[#6655DF] text-white hover:bg-[#2C2368] cursor-pointer"
                        >
                          {open ? "Close" : sub.markingDraft ? "Continue marking" : "Mark"}
                        </button>
                      ) : (
                        <button
                          type="button" onClick={() => setOpenId(open ? null : sub.id)}
                          aria-expanded={open}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[14px] font-bold border border-[#DFE2ED] text-[#69708A] hover:border-[#6655DF] hover:text-[#6655DF] cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> {open ? "Close" : "Review"}
                        </button>
                      )}
                      <button
                        type="button" onClick={() => grantAttempt(sub)}
                        title="Void their earliest failed attempt to free one up"
                        aria-label={`Grant ${sub.student.name} another attempt`}
                        className="w-9 h-9 flex items-center justify-center rounded-[10px] border border-[#DFE2ED] text-[#69708A] hover:border-[#6655DF] hover:text-[#6655DF] cursor-pointer"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {open && (
                  <MarkingWorkspace work={<WorkPanel title="Submission" files={sub.files} note={sub.note} />}>
                    {sub.status === "SUBMITTED" ? (
                      version ? (
                        <RubricMarker
                          rubric={version}
                          initial={sub.markingDraft}
                          endpoint={`/api/instructor/submissions/${sub.id}/rubric`}
                          kind="project"
                          componentPassMark={sub.assessment.course.componentPassMark}
                          onSaved={r => { if (r.released) setOpenId(null); load() }}
                        />
                      ) : (
                        <GradePanel sub={sub} onDone={() => { setOpenId(null); load() }} />
                      )
                    ) : marked ? (
                      <RubricGrid rubric={version!} marks={sub.rubricMarks} />
                    ) : (
                      <div className="rounded-[14px] border border-[#DFE2ED] bg-white p-4">
                        <p className={cn(metaCls, "mb-1")}>Feedback given</p>
                        <p className="text-[13.5px] text-[#171C35] whitespace-pre-line">{sub.feedback || "— none —"}</p>
                      </div>
                    )}
                  </MarkingWorkspace>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

// ── Assignment queue ─────────────────────────────────────────────────────────

const ASSIGNMENT_PILL: Record<AssignmentRow["status"], string> = {
  SUBMITTED: "bg-sky-50 text-sky-700",
  RETURNED:  "bg-amber-50 text-amber-700",
  ACCEPTED:  "bg-emerald-50 text-emerald-700",
}

function AssignmentQueue() {
  const [rows, setRows]       = useState<AssignmentRow[]>([])
  const [rubrics, setRubrics] = useState<Rubrics>({})
  const [loading, setLoading] = useState(true)
  const [scope, setScope]     = useState<"pending" | "all">("pending")
  const [openId, setOpenId]   = useState<string | null>(null)
  const [remark, setRemark]   = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/instructor/assignment-submissions?status=${scope === "all" ? "all" : "pending"}`)
      const d   = await res.json()
      if (res.ok) { setRows(d.submissions ?? []); setRubrics(d.rubrics ?? {}) }
      else toast.error(d.error ?? "Could not load submissions.")
    } finally {
      setLoading(false)
    }
  }, [scope])

  useEffect(() => { load() }, [load])

  function exportCsv() {
    downloadCsv(
      `assignment-grades-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Learner", "Email", "Programme", "Lesson", "Assignment", "Status", "Score", "Out of", "Grade band", "Rubric", "Submitted", "Released"],
      rows.map(s => {
        const v = s.rubricVersionId ? rubrics[s.rubricVersionId] : undefined
        const released = s.status !== "SUBMITTED"
        return [
          s.student.name, s.student.email, s.course.title, s.lessonTitle, s.blockTitle,
          s.status.toLowerCase(),
          released ? s.points : "", released ? (v?.totalPoints ?? s.maxPoints) : "",
          released ? s.gradeBand ?? "" : "",
          v && s.rubricMarks ? `${v.title} v${v.version}` : "",
          s.submittedAt.slice(0, 10), released ? s.gradedAt?.slice(0, 10) : "",
        ]
      }),
    )
  }

  return (
    <div className="rounded-[18px] border border-[#DFE2ED] bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-[#F0EFFA] flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[14px] font-bold text-[#171C35]">Assignment submissions</h2>
          <p className="text-[12px] font-bold text-[#8A90A6] mt-0.5">In-lesson assignments, with or without a rubric</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton onClick={exportCsv} disabled={rows.length === 0} />
          <ScopeToggle scope={scope} setScope={setScope} pendingLabel="Awaiting review" />
        </div>
      </div>

      <QueueState loading={loading} empty={rows.length === 0} emptyText={scope === "pending" ? "Nothing awaiting review." : "No submissions yet."} />

      {!loading && rows.length > 0 && (
        <ul className="divide-y divide-[#F0EFFA]">
          {rows.map(sub => {
            const open    = openId === sub.id
            const version = sub.rubricVersionId ? rubrics[sub.rubricVersionId] : undefined
            const released = sub.status !== "SUBMITTED"
            const showMarker = version && (!released || remark === sub.id)
            const maxPts = version?.totalPoints ?? sub.maxPoints
            return (
              <li key={sub.id}>
                <div className="px-5 py-4 flex flex-wrap items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[14px] font-bold text-[#171C35]">{sub.student.name}</p>
                      <span className={cn(pillCls, ASSIGNMENT_PILL[sub.status])}>{sub.status.toLowerCase()}</span>
                      {sub.markingDraft && <span className={cn(pillCls, "bg-[#EEECFF] text-[#6655DF]")}>draft saved</span>}
                      {version && <span className={cn(pillCls, "bg-[#F5F6FB] text-[#69708A]")}>rubric</span>}
                    </div>
                    <p className={cn(metaCls, "mt-1.5 truncate")}>
                      {sub.course.title} · {sub.lessonTitle} · {sub.blockTitle} · {fmtWhen(sub.submittedAt)}
                    </p>
                    {released && sub.points != null && (
                      <p className="text-[13px] font-bold text-[#69708A] mt-2">
                        {sub.points}{maxPts ? `/${maxPts}` : ""} marks{sub.gradeBand ? ` · ${sub.gradeBand}` : ""}
                      </p>
                    )}
                  </div>
                  <button
                    type="button" onClick={() => { setOpenId(open ? null : sub.id); setRemark(null) }}
                    aria-expanded={open}
                    className={cn(
                      "shrink-0 px-4 py-2 rounded-[10px] text-[14px] font-bold cursor-pointer",
                      released
                        ? "border border-[#DFE2ED] text-[#69708A] hover:border-[#6655DF] hover:text-[#6655DF]"
                        : "bg-[#6655DF] text-white hover:bg-[#2C2368]",
                    )}
                  >
                    {open ? "Close" : released ? "Review" : sub.markingDraft ? "Continue marking" : version ? "Mark" : "Review"}
                  </button>
                </div>

                {open && (
                  <MarkingWorkspace
                    work={<WorkPanel title="Submission" text={sub.text} linkUrl={sub.linkUrl} files={sub.files} />}
                  >
                    {showMarker ? (
                      <RubricMarker
                        key={`${sub.id}-${remark ?? "new"}`}
                        rubric={version!}
                        initial={sub.markingDraft ?? (remark === sub.id ? sub.rubricMarks : null)}
                        endpoint={`/api/instructor/assignment-submissions/${sub.id}/rubric`}
                        kind="assignment"
                        onSaved={r => { if (r.released) { setOpenId(null); setRemark(null) } load() }}
                      />
                    ) : version && sub.rubricMarks ? (
                      <div className="space-y-3">
                        <RubricGrid rubric={version} marks={sub.rubricMarks} />
                        <button
                          type="button" onClick={() => setRemark(sub.id)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[14px] font-bold border border-[#DFE2ED] text-[#69708A] hover:border-[#6655DF] hover:text-[#6655DF] cursor-pointer"
                        >
                          <PencilLine className="w-3.5 h-3.5" /> Revise marks
                        </button>
                      </div>
                    ) : (
                      <SimpleReview sub={sub} onDone={() => { setOpenId(null); load() }} />
                    )}
                  </MarkingWorkspace>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

// ── Entry ────────────────────────────────────────────────────────────────────

/** Marking, shared by the administrator and instructor dashboards. The APIs
 *  scope an instructor to their own programmes and let an admin see
 *  everything, so the same component serves both. */
export default function GradingQueue() {
  const [tab, setTab] = useState<"projects" | "assignments">("projects")
  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="Submission type" className="flex gap-1 bg-[#F5F6FB] rounded-[12px] p-1 w-fit">
        {(["projects", "assignments"] as const).map(t => (
          <button
            key={t} role="tab" type="button" aria-selected={tab === t} onClick={() => setTab(t)}
            className={cn(
              "px-4 py-1.5 rounded-[9px] text-[13px] font-semibold capitalize transition-colors cursor-pointer",
              tab === t ? "bg-white text-[#171C35] shadow-sm" : "text-[#69708A] hover:text-[#171C35]",
            )}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "projects" ? <ProjectQueue /> : <AssignmentQueue />}
    </div>
  )
}
