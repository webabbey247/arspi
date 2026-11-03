"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { Plus, Trash2, Pencil, X, ClipboardCheck, FolderUp, GripVertical, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

// ── Types ────────────────────────────────────────────────────────────────────

export type Chapter = { id?: string; title: string }

type Question = {
  id: string; prompt: string; options: string[]; correctIndex: number; points: number
}
type Criterion = { id: string; criterion: string; maxPoints: number }

type Assessment = {
  id: string
  kind: "CHAPTER_QUIZ" | "PROJECT"
  title: string
  instructions: string | null
  chapterId: string | null
  questions: Question[] | null
  rubric: Criterion[] | null
  drawCount: number | null
  shuffleOptions: boolean
  orderIndex: number
}

const uid = () => crypto.randomUUID()

const metaCls = "text-[11px] tracking-[0.12em] uppercase font-extrabold text-[#8A90A6]"
const inputCls = "w-full px-3 py-2 text-[14px] bg-white border border-[#DFE2ED] rounded-[10px] text-[#171C35] outline-none placeholder:font-normal placeholder:text-[#8A90A6] focus:border-[#6655DF] transition-colors"

// ── Question editor ──────────────────────────────────────────────────────────

function QuestionCard({
  q, index, onChange, onRemove,
}: {
  q: Question; index: number; onChange: (next: Question) => void; onRemove: () => void
}) {
  return (
    <div className="rounded-[12px] border border-[#DFE2ED] bg-[#FAFAFF] p-3.5">
      <div className="flex items-start gap-2 mb-2.5">
        <GripVertical className="w-4 h-4 text-[#C9CCDD] mt-2 shrink-0" />
        <div className="flex-1 min-w-0">
          <label className={cn(metaCls, "block mb-1")}>Question {index + 1}</label>
          <textarea
            value={q.prompt}
            onChange={e => onChange({ ...q, prompt: e.target.value })}
            rows={2}
            placeholder="What are you asking?"
            className={cn(inputCls, "resize-y")}
          />
        </div>
        <button
          type="button" onClick={onRemove} aria-label="Remove question"
          className="w-7 h-7 mt-5 flex items-center justify-center rounded-[8px] text-[#8A90A6] hover:bg-red-50 hover:text-red-500 cursor-pointer transition-colors shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <label className={cn(metaCls, "block mb-1.5")}>Options — tick the correct one</label>
      <div className="space-y-1.5">
        {q.options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onChange({ ...q, correctIndex: i })}
              aria-label={`Mark option ${i + 1} correct`}
              className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 cursor-pointer transition-colors",
                q.correctIndex === i ? "bg-emerald-600 border-emerald-600" : "border-[#C9CCDD] hover:border-emerald-500",
              )}
            >
              {q.correctIndex === i && <span className="w-2 h-2 rounded-full bg-white" />}
            </button>
            <input
              value={opt}
              onChange={e => {
                const options = [...q.options]
                options[i] = e.target.value
                onChange({ ...q, options })
              }}
              placeholder={`Option ${i + 1}`}
              className={inputCls}
            />
            {q.options.length > 2 && (
              <button
                type="button"
                onClick={() => {
                  const options = q.options.filter((_, j) => j !== i)
                  // Keep the key pointing at the same answer after a removal.
                  const correctIndex = q.correctIndex === i ? 0
                    : q.correctIndex > i ? q.correctIndex - 1 : q.correctIndex
                  onChange({ ...q, options, correctIndex })
                }}
                aria-label={`Remove option ${i + 1}`}
                className="w-7 h-7 flex items-center justify-center rounded-[8px] text-[#8A90A6] hover:bg-red-50 hover:text-red-500 cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mt-2.5">
        {q.options.length < 8 && (
          <button
            type="button"
            onClick={() => onChange({ ...q, options: [...q.options, ""] })}
            className="text-[14px] font-bold text-[#6655DF] hover:text-[#2C2368] cursor-pointer"
          >
            + Add option
          </button>
        )}
        <label className="ml-auto flex items-center gap-2 text-[14px] font-bold text-[#69708A]">
          Marks
          <input
            type="number" min={0.25} step={0.25} value={q.points}
            onChange={e => onChange({ ...q, points: Number(e.target.value) || 1 })}
            className={cn(inputCls, "w-20 py-1")}
          />
        </label>
      </div>
    </div>
  )
}

// ── AI drafting ──────────────────────────────────────────────────────────────

/** Drafts questions (or a whole project brief) from the chapter's own written
 *  content. The route reads that content from the stored curriculum, so this
 *  only sends the knobs — never the material. */
function AiDraft({
  programId, kind, chapterId, disabled, onQuiz, onProject,
}: {
  programId: string
  kind: "CHAPTER_QUIZ" | "PROJECT"
  chapterId: string
  disabled?: boolean
  onQuiz:    (questions: Question[]) => void
  onProject: (p: { title: string; instructions: string; rubric: Criterion[] }) => void
}) {
  const [open, setOpen]         = useState(false)
  const [provider, setProvider] = useState<"anthropic" | "openai">("anthropic")
  const [count, setCount]       = useState(8)
  const [steer, setSteer]       = useState("")
  const [busy, setBusy]         = useState(false)

  async function run() {
    setBusy(true)
    try {
      const res = await fetch(`/api/programs/ai-generate/assessment?programId=${programId}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider, kind,
          chapterId: kind === "CHAPTER_QUIZ" ? chapterId : undefined,
          count,
          instruction: steer.trim() || undefined,
        }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) { toast.error(d.error ?? "Drafting failed."); return }

      if (kind === "CHAPTER_QUIZ") {
        onQuiz(d.questions as Question[])
        toast.success(
          d.dropped > 0
            ? `Added ${d.questions.length} questions (${d.dropped} discarded as unusable).`
            : `Added ${d.questions.length} questions — review before saving.`,
        )
      } else {
        onProject({ title: d.title, instructions: d.instructions, rubric: d.rubric as Criterion[] })
        toast.success(`Drafted a project worth ${d.rubricTotal} marks — review before saving.`)
      }
      setOpen(false)
    } finally {
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <button
        type="button" onClick={() => setOpen(true)} disabled={disabled}
        title={disabled ? "Pick a chapter first — the questions are drawn from its content" : undefined}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[14px] font-bold border border-[#6655DF] text-[#6655DF] hover:bg-[#EEECFF] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
      >
        <Sparkles className="w-3.5 h-3.5" />
        Draft with AI
      </button>
    )
  }

  return (
    <div className="rounded-[12px] border border-[#6655DF]/35 bg-[#FAFAFF] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[14px] font-bold text-[#171C35] flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#6655DF]" />
          Draft {kind === "CHAPTER_QUIZ" ? "questions" : "a project"} from this {kind === "CHAPTER_QUIZ" ? "chapter" : "programme"}
        </p>
        <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="text-[#8A90A6] hover:text-[#171C35] cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>

      {busy ? (
        <div className="py-6 flex flex-col items-center gap-2.5">
          <div className="w-7 h-7 border-2 border-[#6655DF]/25 border-t-[#6655DF] rounded-full animate-spin" />
          <p className="text-[13.5px] font-bold text-[#171C35]">Reading the material and drafting…</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            {([["anthropic", "Anthropic Claude"], ["openai", "GPT-4.1 mini"]] as const).map(([v, label]) => (
              <button
                key={v} type="button" onClick={() => setProvider(v)}
                className={cn(
                  "px-3 py-2 rounded-[10px] text-[14px] font-bold border cursor-pointer transition-colors",
                  provider === v ? "bg-[#6655DF] border-[#6655DF] text-white" : "bg-white border-[#DFE2ED] text-[#69708A] hover:border-[#6655DF]",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {kind === "CHAPTER_QUIZ" && (
            <label className="flex items-center gap-2 text-[14px] font-bold text-[#171C35]">
              How many questions
              <input
                type="number" min={1} max={20} value={count}
                onChange={e => setCount(Math.min(20, Math.max(1, Number(e.target.value) || 1)))}
                className={cn(inputCls, "w-20 py-1")}
              />
            </label>
          )}

          <textarea
            value={steer} onChange={e => setSteer(e.target.value)} rows={2}
            placeholder="Optional steer — e.g. focus on application rather than recall"
            className={cn(inputCls, "resize-y")}
          />

          <div className="flex justify-end">
            <button
              type="button" onClick={run}
              className="px-5 py-2 rounded-[10px] text-[14px] font-bold bg-[#6655DF] text-white hover:bg-[#2C2368] cursor-pointer"
            >
              Draft
            </button>
          </div>
          <p className="text-[12px] text-[#8A90A6]">
            Drafts are appended for you to review — nothing is saved until you hit save.
          </p>
        </>
      )}
    </div>
  )
}

// ── Editor modal ─────────────────────────────────────────────────────────────

function AssessmentModal({
  programId, chapters, existing, onClose, onSaved,
}: {
  programId: string
  chapters: Chapter[]
  existing: Assessment | "quiz" | "project"
  onClose: () => void
  onSaved: () => void
}) {
  const isNew = typeof existing === "string"
  const kind: "CHAPTER_QUIZ" | "PROJECT" =
    isNew ? (existing === "quiz" ? "CHAPTER_QUIZ" : "PROJECT") : existing.kind

  const [title, setTitle]               = useState(isNew ? "" : existing.title)
  const [instructions, setInstructions] = useState(isNew ? "" : existing.instructions ?? "")
  const [chapterId, setChapterId]       = useState(isNew ? (chapters[0]?.id ?? "") : existing.chapterId ?? "")
  const [questions, setQuestions]       = useState<Question[]>(isNew ? [] : existing.questions ?? [])
  const [rubric, setRubric]             = useState<Criterion[]>(isNew ? [] : existing.rubric ?? [])
  const [drawCount, setDrawCount]       = useState<string>(isNew ? "" : existing.drawCount?.toString() ?? "")
  const [shuffle, setShuffle]           = useState(isNew ? true : existing.shuffleOptions)
  const [saving, setSaving]             = useState(false)

  async function handleSave() {
    if (title.trim().length < 2) return toast.error("Give the assessment a title.")

    if (kind === "CHAPTER_QUIZ") {
      if (questions.length === 0) return toast.error("Add at least one question.")
      const bad = questions.find(q => !q.prompt.trim() || q.options.some(o => !o.trim()))
      if (bad) return toast.error("Every question needs a prompt and no blank options.")
      if (drawCount && Number(drawCount) > questions.length) {
        return toast.error("Questions per attempt can't exceed the pool size.")
      }
    } else if (rubric.length === 0 || rubric.some(c => !c.criterion.trim())) {
      return toast.error("Add at least one rubric criterion, with a name.")
    }

    setSaving(true)
    const payload = kind === "CHAPTER_QUIZ"
      ? {
          kind, title: title.trim(), instructions: instructions.trim() || null,
          chapterId: chapterId || null, questions,
          drawCount: drawCount ? Number(drawCount) : null, shuffleOptions: shuffle,
        }
      : { kind, title: title.trim(), instructions: instructions.trim() || null, rubric }

    const res = await fetch(
      isNew
        ? `/api/programs/${programId}/assessments`
        : `/api/programs/${programId}/assessments/${existing.id}`,
      {
        method:  isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      },
    )
    const data = await res.json().catch(() => ({}))
    setSaving(false)

    if (!res.ok) return toast.error(data.error ?? "Could not save.")
    if (!isNew && data.gradedAttempts > 0) {
      toast.success(`Saved. ${data.gradedAttempts} existing attempt(s) keep the questions they were served.`)
    } else {
      toast.success(isNew ? "Assessment created." : "Assessment updated.")
    }
    onSaved()
    onClose()
  }

  const poolMarks = questions.reduce((s, q) => s + (Number(q.points) || 0), 0)
  const rubricMarks = rubric.reduce((s, c) => s + (Number(c.maxPoints) || 0), 0)

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-[#171C35]/45 p-4">
      <div className="bg-white rounded-[18px] shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="bg-[linear-gradient(135deg,#241C61,#6756DF)] px-5 py-4 flex items-start justify-between gap-4 shrink-0">
          <div>
            <h2 className="text-[16px] font-extrabold text-white">
              {isNew ? "New" : "Edit"} {kind === "CHAPTER_QUIZ" ? "chapter quiz" : "project"}
            </h2>
            <p className="text-[12px] text-white/75 mt-0.5">
              {kind === "CHAPTER_QUIZ"
                ? "Auto-graded. Counts towards the quiz half of the final mark."
                : "Graded by hand against your rubric. Counts as the project half."}
            </p>
          </div>
          <button
            type="button" onClick={onClose} aria-label="Close"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          <div>
            <label className={cn(metaCls, "block mb-1.5")}>Title</label>
            <input
              value={title} onChange={e => setTitle(e.target.value)}
              placeholder={kind === "CHAPTER_QUIZ" ? "e.g. Chapter 2 check" : "e.g. Final capstone project"}
              className={inputCls}
            />
          </div>

          {kind === "CHAPTER_QUIZ" && (
            <div>
              <label className={cn(metaCls, "block mb-1.5")}>Chapter</label>
              <select value={chapterId} onChange={e => setChapterId(e.target.value)} className={inputCls}>
                <option value="">Not tied to a chapter</option>
                {chapters.filter(c => c.id).map((c, i) => (
                  <option key={c.id} value={c.id}>{i + 1}. {c.title}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className={cn(metaCls, "block mb-1.5")}>
              Instructions <span className="normal-case tracking-normal font-normal text-[#8A90A6]">(optional)</span>
            </label>
            <textarea
              value={instructions} onChange={e => setInstructions(e.target.value)} rows={3}
              placeholder="What the student should know before starting."
              className={cn(inputCls, "resize-y")}
            />
          </div>

          <AiDraft
            programId={programId}
            kind={kind}
            chapterId={chapterId}
            disabled={kind === "CHAPTER_QUIZ" && !chapterId}
            onQuiz={drafted => setQuestions(qs => [...qs, ...drafted])}
            onProject={p => {
              if (!title.trim()) setTitle(p.title)
              setInstructions(p.instructions)
              setRubric(r => [...r, ...p.rubric])
            }}
          />

          {kind === "CHAPTER_QUIZ" ? (
            <>
              <div className="flex flex-wrap items-center gap-4 rounded-[12px] bg-[#FAFAFF] border border-[#F0EFFA] px-4 py-3">
                <label className="flex items-center gap-2 text-[14px] font-bold text-[#171C35]">
                  Questions per attempt
                  <input
                    type="number" min={1} value={drawCount}
                    onChange={e => setDrawCount(e.target.value)}
                    placeholder="all"
                    className={cn(inputCls, "w-24 py-1")}
                  />
                </label>
                <label className="flex items-center gap-2 text-[14px] font-bold text-[#171C35] cursor-pointer">
                  <input type="checkbox" checked={shuffle} onChange={e => setShuffle(e.target.checked)} className="w-4 h-4 accent-[#6655DF] cursor-pointer" />
                  Shuffle options
                </label>
                <span className={cn(metaCls, "ml-auto")}>{questions.length} in pool · {poolMarks} marks</span>
              </div>
              <p className="text-[12px] text-[#8A90A6] -mt-2">
                Drawing fewer questions than the pool holds is what stops a retake being a memory test of the last attempt.
              </p>

              <div className="space-y-3">
                {questions.map((q, i) => (
                  <QuestionCard
                    key={q.id} q={q} index={i}
                    onChange={next => setQuestions(qs => qs.map(x => (x.id === q.id ? next : x)))}
                    onRemove={() => setQuestions(qs => qs.filter(x => x.id !== q.id))}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => setQuestions(qs => [...qs, { id: uid(), prompt: "", options: ["", ""], correctIndex: 0, points: 1 }])}
                className="w-full py-2.5 rounded-[10px] border border-dashed border-[#C9CCDD] text-[14px] font-bold text-[#6655DF] hover:border-[#6655DF] hover:bg-[#FAFAFF] cursor-pointer transition-colors"
              >
                + Add question
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <label className={metaCls}>Rubric</label>
                <span className={metaCls}>{rubricMarks} marks total</span>
              </div>
              <div className="space-y-2">
                {rubric.map(c => (
                  <div key={c.id} className="flex items-center gap-2">
                    <input
                      value={c.criterion}
                      onChange={e => setRubric(r => r.map(x => (x.id === c.id ? { ...x, criterion: e.target.value } : x)))}
                      placeholder="What you're assessing, e.g. Depth of analysis"
                      className={inputCls}
                    />
                    <input
                      type="number" min={1} value={c.maxPoints}
                      onChange={e => setRubric(r => r.map(x => (x.id === c.id ? { ...x, maxPoints: Number(e.target.value) || 1 } : x)))}
                      className={cn(inputCls, "w-24")}
                    />
                    <button
                      type="button" onClick={() => setRubric(r => r.filter(x => x.id !== c.id))}
                      aria-label="Remove criterion"
                      className="w-8 h-8 flex items-center justify-center rounded-[8px] text-[#8A90A6] hover:bg-red-50 hover:text-red-500 cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setRubric(r => [...r, { id: uid(), criterion: "", maxPoints: 10 }])}
                className="w-full py-2.5 rounded-[10px] border border-dashed border-[#C9CCDD] text-[14px] font-bold text-[#6655DF] hover:border-[#6655DF] hover:bg-[#FAFAFF] cursor-pointer transition-colors"
              >
                + Add criterion
              </button>
            </>
          )}
        </div>

        <div className="shrink-0 flex justify-end gap-2 px-5 py-4 border-t border-[#DFE2ED] bg-[#FAFAFF]">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-[10px] text-[14px] font-bold border border-[#DFE2ED] text-[#69708A] hover:bg-white cursor-pointer">
            Cancel
          </button>
          <button
            type="button" onClick={handleSave} disabled={saving}
            className="px-5 py-2 rounded-[10px] text-[14px] font-bold bg-[#6655DF] text-white hover:bg-[#2C2368] disabled:opacity-50 cursor-pointer"
          >
            {saving ? "Saving…" : isNew ? "Create" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Manager ──────────────────────────────────────────────────────────────────

type Policy = {
  gradingEnabled: boolean; quizWeight: number; projectWeight: number
  passMark: number; componentPassMark: number; maxQuizAttempts: number
  attemptCooldownHours: number; maxProjectResubmissions: number
}

/** Assessment authoring for one programme. Mounted on both the administrator
 *  and instructor programme pages — the API scopes an instructor to their own
 *  courses, so the same component is safe in either place.
 *
 *  Takes only the programme id: chapters and the grading policy come back
 *  from the same endpoint, so neither page has to thread the curriculum
 *  through to get here. */
export default function AssessmentManager({ programId }: { programId: string }) {
  const [rows, setRows]         = useState<Assessment[]>([])
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [policy, setPolicy]     = useState<Policy | null>(null)
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState<Assessment | "quiz" | "project" | null>(null)
  const [confirm, setConfirm]   = useState<Assessment | null>(null)
  const [saving, setSaving]     = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/programs/${programId}/assessments`)
      const d   = await res.json()
      if (res.ok) {
        setRows(d.assessments ?? [])
        setChapters(d.chapters ?? [])
        setPolicy(d.policy ?? null)
      }
    } finally {
      setLoading(false)
    }
  }, [programId])

  async function savePolicy(patch: Partial<Policy>) {
    setSaving(true)
    const res = await fetch(`/api/programs/${programId}/assessments`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(patch),
    })
    const d = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok) return toast.error(d.error ?? "Could not save.")
    setPolicy(d.policy)
    toast.success(
      patch.gradingEnabled === true  ? "Grading is on — students can now sit these."
      : patch.gradingEnabled === false ? "Grading is off."
      : "Policy saved.",
    )
  }

  useEffect(() => { load() }, [load])

  async function handleDelete() {
    if (!confirm) return
    const res = await fetch(`/api/programs/${programId}/assessments/${confirm.id}`, { method: "DELETE" })
    const d   = await res.json().catch(() => ({}))
    if (!res.ok) { toast.error(d.error ?? "Could not delete."); setConfirm(null); return }
    toast.success("Assessment deleted.")
    setConfirm(null)
    load()
  }

  const quizzes = rows.filter(r => r.kind === "CHAPTER_QUIZ")
  const project = rows.find(r => r.kind === "PROJECT") ?? null

  return (
    <div className="rounded-[18px] border border-[#DFE2ED] bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-[#F0EFFA] flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[14px] font-bold text-[#171C35]">Assessments & grading</h2>
          <p className="text-[12px] font-bold text-[#8A90A6] mt-0.5">
            Chapter quizzes carry 50 marks between them; the project carries the other 50.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button" onClick={() => setModal("quiz")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[14px] font-bold border border-[#DFE2ED] text-[#69708A] hover:border-[#6655DF] hover:text-[#6655DF] cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Quiz
          </button>
          <button
            type="button" onClick={() => setModal("project")} disabled={!!project}
            title={project ? "This programme already has a project" : undefined}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[14px] font-bold bg-[#6655DF] text-white hover:bg-[#2C2368] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Project
          </button>
        </div>
      </div>

      {/* Grading switch — without this the whole feature stays dark, since
          gradingEnabled defaults to false on every course. */}
      <div className={cn(
        "px-5 py-3 border-b flex flex-wrap items-center gap-3",
        policy?.gradingEnabled ? "bg-emerald-50 border-emerald-100" : "bg-amber-50 border-amber-100",
      )}>
        <button
          type="button"
          disabled={saving || !policy}
          onClick={() => savePolicy({ gradingEnabled: !policy?.gradingEnabled })}
          role="switch"
          aria-checked={!!policy?.gradingEnabled}
          className="flex items-center gap-2.5 cursor-pointer disabled:opacity-50"
        >
          <span className={cn(
            "relative w-9 h-5 rounded-full transition-colors shrink-0",
            policy?.gradingEnabled ? "bg-emerald-600" : "bg-[#C9CCDD]",
          )}>
            <span className={cn(
              "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
              policy?.gradingEnabled ? "translate-x-4" : "translate-x-0",
            )} />
          </span>
          <span className={cn("text-[14px] font-bold", policy?.gradingEnabled ? "text-emerald-800" : "text-amber-800")}>
            Grading {policy?.gradingEnabled ? "on" : "off"}
          </span>
        </button>
        <p className={cn("text-[13px] font-bold", policy?.gradingEnabled ? "text-emerald-700" : "text-amber-700")}>
          {policy?.gradingEnabled
            ? `Pass needs ${policy.passMark}/100 and ${policy.componentPassMark}% in each half · ${policy.maxQuizAttempts} quiz attempts · ${policy.attemptCooldownHours}h cooldown.`
            : "Students can't see these, and certificates still issue on lesson completion alone."}
        </p>
      </div>

      {loading ? (
        <div className="p-5 space-y-2.5">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-[12px]" />)}
        </div>
      ) : rows.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <ClipboardCheck className="w-8 h-8 text-[#C9CCDD] mx-auto mb-2.5" />
          <p className="text-[14px] font-bold text-[#171C35]">No assessments yet.</p>
          <p className="text-[13px] text-[#69708A] mt-1">Add a quiz per chapter and one project to grade this programme out of 100.</p>
        </div>
      ) : (
        <ul className="divide-y divide-[#F0EFFA]">
          {[...quizzes, ...(project ? [project] : [])].map(a => {
            const marks = a.kind === "CHAPTER_QUIZ"
              ? `${a.questions?.length ?? 0} questions`
              : `${a.rubric?.length ?? 0} criteria`
            const chapter = chapters.find(c => c.id === a.chapterId)
            return (
              <li key={a.id} className="px-5 py-3.5 flex items-center gap-3.5">
                <span className={cn(
                  "w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0",
                  a.kind === "PROJECT" ? "bg-amber-50 text-amber-600" : "bg-[#EEECFF] text-[#6655DF]",
                )}>
                  {a.kind === "PROJECT" ? <FolderUp className="w-4 h-4" /> : <ClipboardCheck className="w-4 h-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-bold text-[#171C35] truncate">{a.title}</p>
                  <p className={cn(metaCls, "mt-1 truncate")}>
                    {a.kind === "PROJECT" ? "Project" : chapter ? chapter.title : "Unlinked chapter"} · {marks}
                    {a.kind === "CHAPTER_QUIZ" && a.drawCount ? ` · draws ${a.drawCount}` : ""}
                  </p>
                </div>
                <button
                  type="button" onClick={() => setModal(a)} aria-label="Edit"
                  className="w-8 h-8 flex items-center justify-center rounded-[8px] border border-[#DFE2ED] text-[#69708A] hover:border-[#6655DF] hover:text-[#6655DF] cursor-pointer shrink-0"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button" onClick={() => setConfirm(a)} aria-label="Delete"
                  className="w-8 h-8 flex items-center justify-center rounded-[8px] border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 cursor-pointer shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {modal && (
        <AssessmentModal
          programId={programId} chapters={chapters} existing={modal}
          onClose={() => setModal(null)} onSaved={load}
        />
      )}

      {confirm && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-[#171C35]/45 p-4">
          <div className="bg-white rounded-[16px] shadow-2xl p-6 w-full max-w-sm">
            <p className="text-[14px] font-bold text-[#171C35]">Delete “{confirm.title}”?</p>
            <p className="text-[13px] text-[#69708A] mt-1.5">
              This is refused if any student has already attempted it, so no marks can be lost by accident.
            </p>
            <div className="flex gap-2 justify-end mt-5">
              <button type="button" onClick={() => setConfirm(null)} className="px-4 py-2 rounded-[10px] text-[14px] font-bold border border-[#DFE2ED] text-[#69708A] hover:bg-[#F5F6FB] cursor-pointer">Cancel</button>
              <button type="button" onClick={handleDelete} className="px-4 py-2 rounded-[10px] text-[14px] font-bold bg-red-600 text-white hover:bg-red-700 cursor-pointer">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
