"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import {
  ClipboardCheck, FolderUp, Lock, CheckCircle2, Clock, AlertTriangle,
  FileText, X, Upload, Trophy,
} from "lucide-react"
import { useUploadThing } from "@/lib/uploadthing-client"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

// ── Types ────────────────────────────────────────────────────────────────────

type Criterion = { id: string; criterion: string; maxPoints: number }
/** Answer key is never present — the server strips it before serving. */
type ServedQuestion = { id: string; prompt: string; options: string[]; points: number }

type Blocked =
  | { reason: "not-enrolled" } | { reason: "grading-disabled" } | { reason: "already-passed" }
  | { reason: "in-progress"; attemptId: string }
  | { reason: "no-attempts-left"; used: number; max: number }
  | { reason: "cooldown"; availableAt: string }

type AttemptRow = {
  id: string; attemptNo: number; status: string; voided: boolean
  score: number | null; maxScore: number | null; passed: boolean | null
  feedback: string | null; submittedAt: string | null; gradedAt: string | null
}

type AssessmentRow = {
  id: string
  kind: "CHAPTER_QUIZ" | "PROJECT"
  title: string
  chapterId: string | null
  instructions: string | null
  questionCount: number | null
  rubric: Criterion[] | null
  attemptsUsed: number
  bestPct: number | null
  passed: boolean
  canAttempt: boolean
  blocked: Blocked | null
  attempts: AttemptRow[]
}

type Board = {
  gradingEnabled: boolean
  policy: {
    quizWeight: number; projectWeight: number; passMark: number
    componentPassMark: number; maxQuizAttempts: number
    attemptCooldownHours: number; maxProjectResubmissions: number
  }
  assessments: AssessmentRow[]
  grade: {
    quizMarks: number; projectMarks: number; finalMarks: number
    quizPct: number; projectPct: number; passed: boolean
  } | null
}

const metaCls = "text-[11px] tracking-[0.12em] uppercase font-extrabold text-[#8A90A6]"

function blockMessage(b: Blocked, cooldownHours: number): string {
  switch (b.reason) {
    case "already-passed":   return "Passed — nothing more to do here."
    case "in-progress":      return "You have an attempt open."
    case "no-attempts-left": return `No attempts left (${b.used} of ${b.max} used). Ask your instructor to grant another.`
    case "cooldown": {
      const when = new Date(b.availableAt)
      return `Available again ${when.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} (${cooldownHours}h between attempts).`
    }
    case "grading-disabled": return "Assessments aren't switched on for this programme."
    default:                 return "You can't sit this right now."
  }
}

// ── Quiz runner ──────────────────────────────────────────────────────────────

function QuizRunner({
  slug, attemptId, questions, onDone, onCancel,
}: {
  slug: string; attemptId: string; questions: ServedQuestion[]
  onDone: () => void; onCancel: () => void
}) {
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [saving, setSaving]   = useState(false)
  const [result, setResult]   = useState<{ score: number; maxScore: number; pct: number; passed: boolean } | null>(null)

  const answered = Object.keys(answers).length

  async function submit() {
    if (answered < questions.length) {
      const miss = questions.length - answered
      if (!window.confirm(`${miss} question${miss === 1 ? "" : "s"} unanswered — they'll score zero. Submit anyway?`)) return
    }
    setSaving(true)
    const res = await fetch(`/api/student/programs/${slug}/attempts/${attemptId}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ kind: "quiz", answers }),
    })
    const d = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok) return toast.error(d.error ?? "Could not submit.")
    setResult({ score: d.score, maxScore: d.maxScore, pct: d.pct, passed: d.passed })
    if (d.certificate) toast.success("Programme complete — your certificate has been issued.")
  }

  if (result) {
    return (
      <div className="rounded-[16px] border border-[#DFE2ED] bg-white p-6 text-center">
        <span className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3",
          result.passed ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600",
        )}>
          {result.passed ? <Trophy className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
        </span>
        <p className="text-[22px] font-extrabold text-[#171C35] leading-none">{result.pct}%</p>
        <p className="text-[14px] font-bold text-[#69708A] mt-1.5">{result.score} of {result.maxScore} marks</p>
        <p className={cn("text-[14px] font-bold mt-3", result.passed ? "text-emerald-700" : "text-amber-700")}>
          {result.passed ? "Passed." : "Not passed yet — revise and retake when the cooldown is up."}
        </p>
        <button
          type="button" onClick={onDone}
          className="mt-5 px-5 py-2.5 rounded-[10px] text-[14px] font-bold bg-[#6655DF] text-white hover:bg-[#2C2368] cursor-pointer"
        >
          Back to assessments
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-[16px] border border-[#DFE2ED] bg-white overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[#F0EFFA] flex items-center justify-between gap-3 sticky top-0 bg-white z-10">
        <span className="text-[14px] font-bold text-[#171C35]">{answered} of {questions.length} answered</span>
        <button type="button" onClick={onCancel} className="text-[14px] font-bold text-[#69708A] hover:text-[#171C35] cursor-pointer">
          Leave
        </button>
      </div>

      <div className="px-5 py-5 space-y-6">
        {questions.map((q, i) => (
          <div key={q.id}>
            <p className="text-[14px] font-bold text-[#171C35] leading-snug">
              {i + 1}. {q.prompt}
              <span className={cn(metaCls, "ml-2 normal-case tracking-normal")}>({q.points} {q.points === 1 ? "mark" : "marks"})</span>
            </p>
            <div className="mt-2.5 space-y-1.5">
              {q.options.map((opt, oi) => {
                const chosen = answers[q.id] === oi
                return (
                  <button
                    key={oi} type="button"
                    onClick={() => setAnswers(a => ({ ...a, [q.id]: oi }))}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-[10px] border text-left text-[14px] transition-colors cursor-pointer",
                      chosen ? "border-[#6655DF] bg-[#EEECFF] text-[#2C2368] font-bold" : "border-[#DFE2ED] text-[#171C35] hover:border-[#6655DF]",
                    )}
                  >
                    <span className={cn(
                      "w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center shrink-0",
                      chosen ? "border-[#6655DF]" : "border-[#C9CCDD]",
                    )}>
                      {chosen && <span className="w-2 h-2 rounded-full bg-[#6655DF]" />}
                    </span>
                    {opt}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="px-5 py-4 border-t border-[#F0EFFA] bg-[#FAFAFF] flex justify-end">
        <button
          type="button" onClick={submit} disabled={saving}
          className="px-5 py-2.5 rounded-[10px] text-[14px] font-bold bg-[#6655DF] text-white hover:bg-[#2C2368] disabled:opacity-50 cursor-pointer"
        >
          {saving ? "Submitting…" : "Submit answers"}
        </button>
      </div>
    </div>
  )
}

// ── Project submitter ────────────────────────────────────────────────────────

function ProjectSubmitter({
  slug, attemptId, rubric, onDone, onCancel,
}: {
  slug: string; attemptId: string; rubric: Criterion[] | null
  onDone: () => void; onCancel: () => void
}) {
  const [files, setFiles]   = useState<{ url: string; name: string; size?: number }[]>([])
  const [note, setNote]     = useState("")
  const [busy, setBusy]     = useState(false)
  const { startUpload, isUploading } = useUploadThing("projectUploader")

  async function pick(list: FileList | null) {
    if (!list?.length) return
    const uploaded = await startUpload(Array.from(list))
    if (!uploaded?.length) return toast.error("Upload failed.")
    setFiles(f => [...f, ...uploaded.map(u => ({ url: u.url, name: u.name, size: u.size }))])
  }

  async function submit() {
    if (files.length === 0) return toast.error("Attach at least one file.")
    setBusy(true)
    const res = await fetch(`/api/student/programs/${slug}/attempts/${attemptId}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ kind: "project", files, note: note.trim() || undefined }),
    })
    const d = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) return toast.error(d.error ?? "Could not submit.")
    toast.success("Submitted — your instructor will grade it.")
    onDone()
  }

  return (
    <div className="rounded-[16px] border border-[#DFE2ED] bg-white overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[#F0EFFA] flex items-center justify-between">
        <span className="text-[14px] font-bold text-[#171C35]">Submit your project</span>
        <button type="button" onClick={onCancel} className="text-[14px] font-bold text-[#69708A] hover:text-[#171C35] cursor-pointer">Leave</button>
      </div>

      <div className="px-5 py-5 space-y-4">
        {rubric && rubric.length > 0 && (
          <div className="rounded-[12px] bg-[#FAFAFF] border border-[#F0EFFA] px-4 py-3">
            <p className={cn(metaCls, "mb-2")}>You&apos;ll be marked on</p>
            <ul className="space-y-1">
              {rubric.map(c => (
                <li key={c.id} className="flex items-center justify-between text-[13.5px] text-[#171C35]">
                  <span>{c.criterion}</span>
                  <span className="font-bold text-[#69708A]">{c.maxPoints}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <label className={cn(metaCls, "block mb-1.5")}>Files</label>
          <label className="flex flex-col items-center justify-center gap-2 py-7 rounded-[12px] border border-dashed border-[#C9CCDD] hover:border-[#6655DF] cursor-pointer transition-colors">
            <Upload className="w-5 h-5 text-[#6655DF]" />
            <span className="text-[14px] font-bold text-[#6655DF]">
              {isUploading ? "Uploading…" : "Choose files"}
            </span>
            <input type="file" multiple className="hidden" disabled={isUploading} onChange={e => pick(e.target.files)} />
          </label>

          {files.length > 0 && (
            <ul className="mt-2.5 space-y-1.5">
              {files.map((f, i) => (
                <li key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-[10px] border border-[#DFE2ED] bg-[#FAFAFF]">
                  <FileText className="w-3.5 h-3.5 text-[#6655DF] shrink-0" />
                  <span className="flex-1 min-w-0 text-[13.5px] font-bold text-[#171C35] truncate">{f.name}</span>
                  <button
                    type="button" onClick={() => setFiles(x => x.filter((_, j) => j !== i))}
                    aria-label={`Remove ${f.name}`}
                    className="w-6 h-6 flex items-center justify-center rounded-full text-[#8A90A6] hover:bg-red-50 hover:text-red-500 cursor-pointer shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <label className={cn(metaCls, "block mb-1.5")}>
            Note <span className="normal-case tracking-normal font-normal text-[#8A90A6]">(optional)</span>
          </label>
          <textarea
            value={note} onChange={e => setNote(e.target.value)} rows={3}
            placeholder="Anything your instructor should know."
            className="w-full px-3 py-2 text-[14px] bg-white border border-[#DFE2ED] rounded-[10px] outline-none focus:border-[#6655DF] resize-y"
          />
        </div>
      </div>

      <div className="px-5 py-4 border-t border-[#F0EFFA] bg-[#FAFAFF] flex justify-end">
        <button
          type="button" onClick={submit} disabled={busy || isUploading || files.length === 0}
          className="px-5 py-2.5 rounded-[10px] text-[14px] font-bold bg-[#6655DF] text-white hover:bg-[#2C2368] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {busy ? "Submitting…" : "Submit project"}
        </button>
      </div>
    </div>
  )
}

// ── Board ────────────────────────────────────────────────────────────────────

export default function StudentAssessments({ slug }: { slug: string }) {
  const [board, setBoard]   = useState<Board | null>(null)
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState<
    | { kind: "quiz"; attemptId: string; questions: ServedQuestion[] }
    | { kind: "project"; attemptId: string; rubric: Criterion[] | null }
    | null
  >(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/student/programs/${slug}/assessments`)
      const d   = await res.json()
      if (res.ok) setBoard(d)
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => { load() }, [load])

  async function start(a: AssessmentRow) {
    const res = await fetch(`/api/student/programs/${slug}/assessments/${a.id}/attempts`, { method: "POST" })
    const d   = await res.json().catch(() => ({}))
    if (!res.ok) return toast.error(d.error ?? "Could not start.")
    if (a.kind === "CHAPTER_QUIZ") {
      setActive({ kind: "quiz", attemptId: d.attempt.id, questions: (d.attempt.questions ?? []) as ServedQuestion[] })
    } else {
      setActive({ kind: "project", attemptId: d.attempt.id, rubric: a.rubric })
    }
  }

  if (loading) {
    return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-[16px]" />)}</div>
  }

  if (!board?.gradingEnabled) {
    return (
      <div className="rounded-[16px] border border-dashed border-[#DFE2ED] bg-white px-4 py-12 text-center">
        <ClipboardCheck className="w-8 h-8 text-[#C9CCDD] mx-auto mb-2.5" />
        <p className="text-[14px] font-bold text-[#171C35]">This programme isn&apos;t graded.</p>
        <p className="text-[13px] text-[#69708A] mt-1">Finish every lesson to earn your certificate.</p>
      </div>
    )
  }

  if (active) {
    return active.kind === "quiz"
      ? <QuizRunner slug={slug} attemptId={active.attemptId} questions={active.questions}
          onDone={() => { setActive(null); load() }} onCancel={() => { setActive(null); load() }} />
      : <ProjectSubmitter slug={slug} attemptId={active.attemptId} rubric={active.rubric}
          onDone={() => { setActive(null); load() }} onCancel={() => { setActive(null); load() }} />
  }

  const { policy, grade } = board

  return (
    <div className="space-y-5">
      {/* Grade summary */}
      <div className="rounded-[16px] border border-[#DFE2ED] bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-[#F0EFFA]">
          <h3 className="text-[14px] font-bold text-[#171C35]">Your grade</h3>
          <p className="text-[12px] font-bold text-[#8A90A6] mt-0.5">
            Pass needs {policy.passMark}/100 overall and at least {policy.componentPassMark}% in each half.
          </p>
        </div>
        <div className="px-5 py-4 grid grid-cols-3 gap-3">
          {[
            { label: `Quizzes / ${policy.quizWeight}`,  marks: grade?.quizMarks ?? 0,    pct: grade?.quizPct ?? 0 },
            { label: `Project / ${policy.projectWeight}`, marks: grade?.projectMarks ?? 0, pct: grade?.projectPct ?? 0 },
            { label: "Final / 100", marks: grade?.finalMarks ?? 0, pct: null },
          ].map(s => (
            <div key={s.label} className="rounded-[12px] bg-[#FAFAFF] border border-[#F0EFFA] px-3.5 py-3">
              <p className="text-[20px] font-extrabold text-[#171C35] leading-none">{Math.round(s.marks * 10) / 10}</p>
              <p className={cn(metaCls, "mt-1.5")}>{s.label}</p>
              {s.pct !== null && <p className="text-[11px] font-bold text-[#8A90A6] mt-1">{Math.round(s.pct)}%</p>}
            </div>
          ))}
        </div>
        {grade && (
          <p className={cn(
            "px-5 py-2.5 text-[13.5px] font-bold border-t",
            grade.passed ? "bg-emerald-50 border-emerald-100 text-emerald-800" : "bg-amber-50 border-amber-100 text-amber-800",
          )}>
            {grade.passed ? "You've passed this programme." : "Not passing yet — keep going."}
          </p>
        )}
      </div>

      {board.assessments.length === 0 ? (
        <div className="rounded-[16px] border border-dashed border-[#DFE2ED] bg-white px-4 py-12 text-center">
          <p className="text-[14px] font-bold text-[#171C35]">No assessments published yet.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {board.assessments.map(a => {
            const maxAttempts = a.kind === "PROJECT" ? policy.maxProjectResubmissions + 1 : policy.maxQuizAttempts
            const latest = [...a.attempts].reverse().find(t => !t.voided)
            return (
              <li key={a.id} className="rounded-[16px] border border-[#DFE2ED] bg-white p-4">
                <div className="flex items-start gap-3.5">
                  <span className={cn(
                    "w-10 h-10 rounded-[11px] flex items-center justify-center shrink-0",
                    a.passed ? "bg-emerald-50 text-emerald-600"
                      : a.kind === "PROJECT" ? "bg-amber-50 text-amber-600" : "bg-[#EEECFF] text-[#6655DF]",
                  )}>
                    {a.passed ? <CheckCircle2 className="w-4.5 h-4.5" />
                      : a.kind === "PROJECT" ? <FolderUp className="w-4.5 h-4.5" /> : <ClipboardCheck className="w-4.5 h-4.5" />}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-bold text-[#171C35]">{a.title}</p>
                    <p className={cn(metaCls, "mt-1")}>
                      {a.kind === "PROJECT" ? "Project" : `${a.questionCount} questions`} ·
                      {" "}attempt {a.attemptsUsed}/{maxAttempts}
                      {a.bestPct !== null ? ` · best ${a.bestPct}%` : ""}
                    </p>
                    {a.instructions && <p className="text-[13.5px] text-[#69708A] mt-2 leading-snug">{a.instructions}</p>}

                    {latest?.feedback && (
                      <div className="mt-2.5 rounded-[10px] bg-[#FAFAFF] border border-[#F0EFFA] px-3 py-2">
                        <p className={cn(metaCls, "mb-1")}>Instructor feedback</p>
                        <p className="text-[13.5px] text-[#171C35] whitespace-pre-line">{latest.feedback}</p>
                      </div>
                    )}

                    {!a.canAttempt && a.blocked && (
                      <p className={cn(
                        "flex items-center gap-1.5 text-[13px] font-bold mt-2.5",
                        a.passed ? "text-emerald-700" : "text-[#8A90A6]",
                      )}>
                        {a.passed ? <CheckCircle2 className="w-3.5 h-3.5" />
                          : a.blocked.reason === "cooldown" ? <Clock className="w-3.5 h-3.5" />
                          : <Lock className="w-3.5 h-3.5" />}
                        {blockMessage(a.blocked, policy.attemptCooldownHours)}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0">
                    {a.canAttempt ? (
                      <button
                        type="button" onClick={() => start(a)}
                        className="px-4 py-2 rounded-[10px] text-[14px] font-bold bg-[#6655DF] text-white hover:bg-[#2C2368] cursor-pointer"
                      >
                        {a.attemptsUsed > 0 ? "Retake" : "Start"}
                      </button>
                    ) : a.blocked?.reason === "in-progress" ? (
                      <button
                        type="button" onClick={() => start(a)}
                        className="px-4 py-2 rounded-[10px] text-[14px] font-bold border border-[#6655DF] text-[#6655DF] hover:bg-[#EEECFF] cursor-pointer"
                      >
                        Resume
                      </button>
                    ) : null}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
