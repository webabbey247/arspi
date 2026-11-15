"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Save, Send, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  cellFor, defaultScoreFor, gradeBandFor, rangeLabel, round2, sortedLevels,
  type CriterionMark, type RubricMarks, type RubricVersionView,
} from "@/lib/rubric"

const metaCls = "text-[11px] tracking-[0.12em] uppercase font-extrabold text-[#8A90A6]"

type Draft = Partial<RubricMarks> & { allowResubmit?: boolean }

export type MarkerResult = {
  released: boolean
  passed?: boolean
  pct?: number
  mayResubmit?: boolean
  courseCompleted?: boolean
  status?: string | null
}

/**
 * The facilitator's marking grid. One row per criterion: pick a level, adjust
 * the score inside that level's range, add a comment. Total and grade band
 * update as you go. "Save draft" keeps the work private; "Release to learner"
 * validates every row and publishes the marks.
 *
 * Levels are real radio inputs, so a criterion is a single tab stop with arrow
 * keys moving between levels, and screen readers announce the choice.
 */
export default function RubricMarker({
  rubric, initial, endpoint, kind, componentPassMark, onSaved,
}: {
  rubric: RubricVersionView
  /** A saved draft, or previously released marks being revised. */
  initial?: Draft | null
  /** PUT endpoint for draft/release. */
  endpoint: string
  kind: "assignment" | "project"
  /** Projects: the course's per-component pass %, which applies as well. */
  componentPassMark?: number
  onSaved: (result: MarkerResult) => void
}) {
  const levels = useMemo(() => sortedLevels(rubric.levels), [rubric.levels])

  const [marks, setMarks] = useState<Record<string, CriterionMark>>(() =>
    Object.fromEntries((initial?.criteria ?? []).map(m => [m.key, m])),
  )
  const [overall, setOverall] = useState(initial?.overallComment ?? "")
  const [allowResubmit, setAllowResubmit] = useState<boolean | null>(initial?.allowResubmit ?? null)
  const [busy, setBusy] = useState<"draft" | "release" | null>(null)
  const [scoreText, setScoreText] = useState<Record<string, string>>(() =>
    Object.fromEntries((initial?.criteria ?? []).map(m => [m.key, String(m.score)])),
  )

  const chosen = rubric.criteria.map(c => marks[c.key]).filter(Boolean)
  const total = round2(chosen.reduce((s, m) => s + (Number(m.score) || 0), 0))
  const complete = chosen.length === rubric.criteria.length
  const band = complete ? gradeBandFor(rubric.gradeBands, total) : null
  const pct = rubric.totalPoints > 0 ? (total / rubric.totalPoints) * 100 : 0
  const meetsRubric = total >= rubric.passMark
  const meetsCourse = componentPassMark === undefined || pct >= componentPassMark
  const passes = meetsRubric && meetsCourse
  // Assignments: return for revision by default when below the pass mark,
  // until the marker decides otherwise.
  const resubmit = allowResubmit ?? !meetsRubric

  function pickLevel(criterionKey: string, levelKey: string) {
    const c = rubric.criteria.find(x => x.key === criterionKey)
    const cell = c && cellFor(c, levelKey)
    if (!cell) return
    const existing = marks[criterionKey]
    // Keep the current score if it already fits the new level.
    const keep = existing && existing.score >= cell.minPoints && existing.score <= cell.maxPoints
    const score = keep ? existing.score : defaultScoreFor(cell)
    setScoreText(t => ({ ...t, [criterionKey]: String(score) }))
    setMarks(prev => ({
      ...prev,
      [criterionKey]: { key: criterionKey, level: levelKey, score, comment: prev[criterionKey]?.comment ?? "" },
    }))
  }

  function commitScore(criterionKey: string) {
    const m = marks[criterionKey]
    const c = rubric.criteria.find(x => x.key === criterionKey)
    const cell = m && c && cellFor(c, m.level)
    if (!m || !cell) return
    const raw = Number(scoreText[criterionKey])
    // The marker can't leave a score outside the chosen level's range.
    const score = Number.isFinite(raw) ? Math.min(Math.max(round2(raw), cell.minPoints), cell.maxPoints) : m.score
    setScoreText(t => ({ ...t, [criterionKey]: String(score) }))
    setMarks(prev => ({ ...prev, [criterionKey]: { ...m, score } }))
  }

  function setComment(criterionKey: string, comment: string) {
    setMarks(prev => prev[criterionKey] ? { ...prev, [criterionKey]: { ...prev[criterionKey], comment } } : prev)
  }

  async function save(action: "draft" | "release") {
    if (action === "release" && !complete) {
      const missing = rubric.criteria.find(c => !marks[c.key])
      return toast.error(`Choose a level for "${missing?.title}" before releasing.`)
    }
    if (action === "release" && rubric.criteria.some(c => !marks[c.key]?.comment?.trim())) {
      const ok = window.confirm("Some criteria have no comment. The guidance asks for at least one comment per criterion. Release anyway?")
      if (!ok) return
    }
    setBusy(action)
    const res = await fetch(endpoint, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        criteria: rubric.criteria.map(c => marks[c.key]).filter(Boolean),
        overallComment: overall,
        ...(kind === "assignment" && { allowResubmit: resubmit }),
      }),
    })
    const d = await res.json().catch(() => ({}))
    setBusy(null)
    if (!res.ok) return toast.error(d.error ?? "Could not save the marks.")

    if (action === "draft") {
      toast.success("Draft saved. The learner can't see it yet.")
    } else if (kind === "project") {
      toast.success(
        d.passed
          ? `Released — passed at ${d.pct}%.${d.courseCompleted ? " Certificate issued." : ""}`
          : d.mayResubmit ? `Released at ${d.pct}% — the learner can resubmit.` : `Released — not passed at ${d.pct}%.`,
      )
    } else {
      toast.success(d.status === "RETURNED" ? "Released and returned for revision." : "Released to the learner.")
    }
    onSaved({ released: action === "release", ...d })
  }

  return (
    <div className="space-y-4">
      <details className="rounded-[12px] border border-[#F0EFFA] bg-[#FAFAFF] px-3.5 py-2.5 group">
        <summary className="flex items-center gap-1.5 text-[13px] font-bold text-[#6655DF] cursor-pointer list-none">
          <Info className="w-3.5 h-3.5" /> Marking guidance
        </summary>
        <ul className="mt-2 space-y-1 text-[12.5px] text-[#69708A] list-disc pl-5">
          <li>Mark each criterion separately; a weakness in one should not lower the score in another.</li>
          <li>Choose the level first, then the score within its range: the top for a secure match, the bottom for a borderline one.</li>
          <li>Write at least one comment per criterion saying what was done well or what to improve next time.</li>
          <li>If the work does not follow the brief or is far outside the word range, cap Organisation and clarity at Satisfactory.</li>
        </ul>
      </details>

      {rubric.criteria.map(c => {
        const m = marks[c.key]
        const cell = m ? cellFor(c, m.level) : undefined
        const groupName = `crit-${rubric.id}-${c.key}`
        return (
          <fieldset key={c.key} className="rounded-[14px] border border-[#DFE2ED] overflow-hidden">
            <legend className="sr-only">{c.title}, out of {c.maxPoints} points</legend>
            <div className="flex items-start justify-between gap-3 px-3.5 py-2.5 bg-[#FAFAFF] border-b border-[#DFE2ED]" aria-hidden>
              <span className="text-[14px] font-bold text-[#171C35]">{c.title}</span>
              <span className="text-[13px] font-bold text-[#69708A] whitespace-nowrap">
                {m ? `${m.score} / ${c.maxPoints}` : `— / ${c.maxPoints}`}
              </span>
            </div>

            <div
              className="grid grid-cols-1 md:[grid-template-columns:repeat(var(--cols),minmax(0,1fr))]"
              style={{ "--cols": levels.length } as React.CSSProperties}
            >
              {levels.map(l => {
                const lc = cellFor(c, l.key)
                if (!lc) return null
                const selected = m?.level === l.key
                return (
                  <label
                    key={l.key}
                    className={cn(
                      "relative flex flex-col gap-1.5 px-3 py-3 cursor-pointer border-b md:border-b-0 md:border-r last:border-none border-[#F0EFFA] transition-colors",
                      "has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-2 has-[:focus-visible]:outline-[#6655DF]",
                      selected ? "bg-emerald-50 outline-2 -outline-offset-2 outline-emerald-600" : "hover:bg-[#FAFAFF]",
                    )}
                  >
                    <input
                      type="radio" name={groupName} value={l.key}
                      checked={selected}
                      onChange={() => pickLevel(c.key, l.key)}
                      className="sr-only"
                    />
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-extrabold text-[#171C35]">{l.label}</span>
                      <span className={cn(
                        "w-4 h-4 rounded-full border-2 shrink-0",
                        selected ? "border-emerald-600 bg-emerald-600 shadow-[inset_0_0_0_2px_white]" : "border-[#C9CCDD]",
                      )} aria-hidden />
                    </span>
                    <span className="text-[12.5px] text-[#69708A] leading-snug">{lc.descriptor}</span>
                    <span className="text-[12px] font-bold text-[#6655DF] mt-auto">{rangeLabel(lc)}</span>
                  </label>
                )
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3 px-3.5 py-3 border-t border-[#DFE2ED] bg-white">
              <div>
                <label htmlFor={`${groupName}-score`} className={cn(metaCls, "block mb-1")}>Score</label>
                <div className="flex items-center gap-2">
                  <input
                    id={`${groupName}-score`}
                    type="number" inputMode="decimal" step="0.5"
                    min={cell?.minPoints} max={cell?.maxPoints}
                    disabled={!cell}
                    value={scoreText[c.key] ?? ""}
                    onChange={e => setScoreText(t => ({ ...t, [c.key]: e.target.value }))}
                    onBlur={() => commitScore(c.key)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); commitScore(c.key) } }}
                    aria-describedby={`${groupName}-range`}
                    className="w-20 px-2.5 py-1.5 text-[14px] font-bold text-right bg-white border border-[#DFE2ED] rounded-[9px] outline-none focus:border-[#6655DF] disabled:bg-[#F5F6FB] disabled:text-[#8A90A6]"
                  />
                  <span id={`${groupName}-range`} className="text-[12px] font-bold text-[#8A90A6]">
                    {cell ? `${cell.minPoints}–${cell.maxPoints}` : "pick a level"}
                  </span>
                </div>
              </div>
              <div>
                <label htmlFor={`${groupName}-comment`} className={cn(metaCls, "block mb-1")}>Comment</label>
                <textarea
                  id={`${groupName}-comment`}
                  rows={2}
                  disabled={!m}
                  value={m?.comment ?? ""}
                  onChange={e => setComment(c.key, e.target.value)}
                  placeholder={m ? "What was done well, or what to improve next time" : "Pick a level first"}
                  className="w-full px-3 py-2 text-[13.5px] bg-white border border-[#DFE2ED] rounded-[10px] outline-none focus:border-[#6655DF] resize-y disabled:bg-[#F5F6FB]"
                />
              </div>
            </div>
          </fieldset>
        )
      })}

      <div>
        <label htmlFor={`overall-${rubric.id}`} className={cn(metaCls, "block mb-1.5")}>Overall comment</label>
        <textarea
          id={`overall-${rubric.id}`}
          value={overall} onChange={e => setOverall(e.target.value)} rows={3}
          placeholder="A summary the learner will read first."
          className="w-full px-3 py-2 text-[14px] bg-white border border-[#DFE2ED] rounded-[10px] outline-none focus:border-[#6655DF] resize-y"
        />
      </div>

      {/* Live total — announced politely as it changes. */}
      <div
        className="sticky bottom-0 -mx-1 px-1 pt-2 pb-1 bg-[#FAFAFF]"
        aria-live="polite"
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[12px] border border-[#DFE2ED] bg-white px-3.5 py-3">
          <span className="text-[15px] font-extrabold text-[#171C35]">{total} / {rubric.totalPoints}</span>
          <span className={cn(
            "px-2.5 py-1 rounded-full text-[12px] font-extrabold",
            !complete ? "bg-[#F0EFFA] text-[#69708A]"
              : passes ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700",
          )}>
            {!complete
              ? `${chosen.length} of ${rubric.criteria.length} criteria marked`
              : `${band?.label ?? "No band"} · ${passes ? "pass" : "below pass"}`}
          </span>
          <span className="text-[12px] font-bold text-[#8A90A6]">
            Pass mark {rubric.passMark}{kind === "project" && componentPassMark !== undefined ? ` and ${componentPassMark}% for the course` : ""}
          </span>

          {kind === "assignment" && (
            <label className="flex items-center gap-2 text-[13px] font-bold text-[#171C35] cursor-pointer sm:ml-auto">
              <input
                type="checkbox" checked={resubmit}
                onChange={e => setAllowResubmit(e.target.checked)}
                className="w-4 h-4 accent-[#6655DF] cursor-pointer"
              />
              Let the learner revise and resubmit
            </label>
          )}

          <div className={cn("flex items-center gap-2 w-full sm:w-auto", kind === "project" && "sm:ml-auto")}>
            <button
              type="button" onClick={() => save("draft")} disabled={busy !== null}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-[10px] text-[14px] font-bold border border-[#DFE2ED] text-[#69708A] hover:border-[#6655DF] hover:text-[#6655DF] disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" /> {busy === "draft" ? "Saving…" : "Save draft"}
            </button>
            <button
              type="button" onClick={() => save("release")} disabled={busy !== null || !complete}
              title={complete ? undefined : "Mark every criterion first"}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-[10px] text-[14px] font-bold bg-[#6655DF] text-white hover:bg-[#2C2368] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" /> {busy === "release" ? "Releasing…" : "Release to learner"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
