"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { FileText, Download, CheckCircle2, RotateCcw, Inbox, Unlock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

type Criterion = { id: string; criterion: string; maxPoints: number }
type SubFile   = { url: string; name: string; size?: number }

type Submission = {
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
  assessment: {
    id: string; title: string; rubric: Criterion[] | null
    course: { id: string; title: string; slug: string; componentPassMark: number }
  }
  student: { id: string; name: string; email: string }
}

const metaCls = "text-[11px] tracking-[0.12em] uppercase font-extrabold text-[#8A90A6]"

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

// ── Grading panel ────────────────────────────────────────────────────────────

function GradePanel({ sub, onDone }: { sub: Submission; onDone: () => void }) {
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
    <div className="border-t border-[#F0EFFA] bg-[#FAFAFF] px-5 py-4">
      {sub.note && (
        <div className="mb-4">
          <p className={cn(metaCls, "mb-1")}>Student&apos;s note</p>
          <p className="text-[13.5px] text-[#171C35] whitespace-pre-line">{sub.note}</p>
        </div>
      )}

      <p className={cn(metaCls, "mb-2")}>Rubric</p>
      <div className="space-y-2">
        {rubric.map(c => (
          <div key={c.id} className="flex items-center gap-3">
            <span className="flex-1 min-w-0 text-[14px] font-bold text-[#171C35] truncate">{c.criterion}</span>
            <input
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
        <label className={cn(metaCls, "block mb-1.5")}>Feedback</label>
        <textarea
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

// ── Queue ────────────────────────────────────────────────────────────────────

/** Project grading, shared by the administrator and instructor dashboards.
 *  The API scopes an instructor to their own programmes and lets an admin see
 *  everything, so the same component serves both. */
export default function GradingQueue() {
  const [rows, setRows]       = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [scope, setScope]     = useState<"pending" | "all">("pending")
  const [openId, setOpenId]   = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/instructor/submissions?status=${scope === "all" ? "all" : "pending"}`)
      const d   = await res.json()
      if (res.ok) setRows(d.submissions ?? [])
      else toast.error(d.error ?? "Could not load submissions.")
    } finally {
      setLoading(false)
    }
  }, [scope])

  useEffect(() => { load() }, [load])

  async function grantAttempt(sub: Submission) {
    const res = await fetch(`/api/instructor/submissions/${sub.id}`, { method: "POST" })
    const d   = await res.json().catch(() => ({}))
    if (!res.ok) return toast.error(d.error ?? "Could not grant an attempt.")
    toast.success(`Attempt ${d.voidedAttemptNo} voided — ${sub.student.name} has another try.`)
    load()
  }

  const STATUS_PILL: Record<Submission["status"], string> = {
    IN_PROGRESS:       "bg-[#F0EFFA] text-[#69708A]",
    SUBMITTED:         "bg-sky-50 text-sky-700",
    GRADED:            "bg-emerald-50 text-emerald-700",
    CHANGES_REQUESTED: "bg-amber-50 text-amber-700",
  }

  return (
    <div className="rounded-[18px] border border-[#DFE2ED] bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-[#F0EFFA] flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[14px] font-bold text-[#171C35]">Project submissions</h2>
          <p className="text-[12px] font-bold text-[#8A90A6] mt-0.5">Graded by hand against each project&apos;s rubric</p>
        </div>
        <div className="flex items-center gap-0.5 p-0.5 rounded-[10px] bg-[#F0EFFA]">
          {(["pending", "all"] as const).map(s => (
            <button
              key={s} type="button" onClick={() => setScope(s)}
              className={cn(
                "px-3.5 py-1.5 rounded-[8px] text-[14px] font-bold capitalize transition-colors cursor-pointer",
                scope === s ? "bg-white text-[#6655DF] shadow-sm" : "text-[#8A90A6] hover:text-[#6655DF]",
              )}
            >
              {s === "pending" ? "Awaiting grading" : "All"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="p-5 space-y-2.5">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-[12px]" />)}
        </div>
      ) : rows.length === 0 ? (
        <div className="px-5 py-14 text-center">
          <Inbox className="w-8 h-8 text-[#C9CCDD] mx-auto mb-2.5" />
          <p className="text-[14px] font-bold text-[#171C35]">
            {scope === "pending" ? "Nothing awaiting grading." : "No submissions yet."}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-[#F0EFFA]">
          {rows.map(sub => {
            const open = openId === sub.id
            return (
              <li key={sub.id}>
                <div className="px-5 py-4">
                  <div className="flex flex-wrap items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[14px] font-bold text-[#171C35]">{sub.student.name}</p>
                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-[0.08em]", STATUS_PILL[sub.status])}>
                          {sub.status.replace("_", " ").toLowerCase()}
                        </span>
                        <span className={metaCls}>Attempt {sub.attemptNo}</span>
                      </div>
                      <p className={cn(metaCls, "mt-1.5 truncate")}>
                        {sub.assessment.course.title} · {sub.assessment.title} · {fmtWhen(sub.submittedAt)}
                      </p>

                      {(sub.files ?? []).length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2.5">
                          {(sub.files ?? []).map((f, i) => (
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
                      )}

                      {sub.status !== "SUBMITTED" && sub.maxScore ? (
                        <p className="text-[13px] font-bold text-[#69708A] mt-2">
                          {sub.score}/{sub.maxScore} marks ·{" "}
                          <span className={sub.passed ? "text-emerald-700" : "text-amber-700"}>
                            {sub.passed ? "passed" : "not passed"}
                          </span>
                        </p>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {sub.status === "SUBMITTED" && (
                        <button
                          type="button" onClick={() => setOpenId(open ? null : sub.id)}
                          className="px-4 py-2 rounded-[10px] text-[14px] font-bold bg-[#6655DF] text-white hover:bg-[#2C2368] cursor-pointer"
                        >
                          {open ? "Close" : "Grade"}
                        </button>
                      )}
                      {sub.status !== "SUBMITTED" && (
                        <button
                          type="button" onClick={() => setOpenId(open ? null : sub.id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[14px] font-bold border border-[#DFE2ED] text-[#69708A] hover:border-[#6655DF] hover:text-[#6655DF] cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> {open ? "Close" : "Review"}
                        </button>
                      )}
                      <button
                        type="button" onClick={() => grantAttempt(sub)}
                        title="Void their earliest failed attempt to free one up"
                        className="w-9 h-9 flex items-center justify-center rounded-[10px] border border-[#DFE2ED] text-[#69708A] hover:border-[#6655DF] hover:text-[#6655DF] cursor-pointer"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {open && sub.status === "SUBMITTED" && (
                  <GradePanel sub={sub} onDone={() => { setOpenId(null); load() }} />
                )}
                {open && sub.status !== "SUBMITTED" && (
                  <div className="border-t border-[#F0EFFA] bg-[#FAFAFF] px-5 py-4">
                    <p className={cn(metaCls, "mb-1")}>Feedback given</p>
                    <p className="text-[13.5px] text-[#171C35] whitespace-pre-line">{sub.feedback || "— none —"}</p>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
