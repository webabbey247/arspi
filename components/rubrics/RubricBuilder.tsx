"use client"

import { useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { toast } from "sonner"
import { X, Plus, Trash2, ChevronUp, ChevronDown, Wand2, AlertTriangle, CheckCircle2, Eye } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  blankRubric, GENERIC_WRITTEN_RUBRIC, makeKey, suggestRanges, sumCriteria, validateRubric,
  type GradeBand, type RubricContent, type RubricCriterion, type RubricLevel, type RubricStatus,
} from "@/lib/rubric"
import { RubricGrid, RubricSidePanel } from "@/components/rubrics/RubricGrid"

const metaCls  = "text-[11px] tracking-[0.12em] uppercase font-extrabold text-[#8A90A6]"
const inputCls = "w-full px-3 py-2 text-[13px] bg-white border border-[#DFE2ED] rounded-[10px] text-[#171C35] outline-none placeholder:text-[#8A90A6] focus:border-[#6655DF] transition-colors"
const numCls   = "w-full px-2 py-1.5 text-[13px] font-bold text-center bg-white border border-[#DFE2ED] rounded-[8px] text-[#171C35] outline-none focus:border-[#6655DF]"
const iconBtn  = "w-7 h-7 flex items-center justify-center rounded-[8px] text-[#8A90A6] hover:bg-[#F0EFFA] hover:text-[#6655DF] disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v))
const num = (v: string) => (v.trim() === "" ? 0 : Number(v))

/** Re-spreads a criterion's ranges across the current levels, keeping each
 *  level's descriptor. Levels are ordered best first. */
function respread(c: RubricCriterion, levels: RubricLevel[]): RubricCriterion {
  const ranges = suggestRanges(c.maxPoints, levels.length)
  return {
    ...c,
    cells: levels.map((l, i) => ({
      level:      l.key,
      minPoints:  ranges[i]?.min ?? 0,
      maxPoints:  ranges[i]?.max ?? 0,
      descriptor: c.cells.find(x => x.level === l.key)?.descriptor ?? "",
    })),
  }
}

/** Scales grade bands proportionally to a new total, keeping them contiguous. */
function scaleBands(bands: GradeBand[], from: number, to: number): GradeBand[] {
  if (from <= 0 || to <= 0) return bands
  const sorted = [...bands].sort((a, b) => a.min - b.min)
  const out = sorted.map(b => ({ ...b, min: Math.round((b.min / from) * to) }))
  out[0].min = 0
  for (let i = 0; i < out.length; i++) out[i].max = i === out.length - 1 ? to : out[i + 1].min - 1
  return out.sort((a, b) => b.min - a.min)
}

export type BuilderTarget =
  | {
      mode: "create"
      /** Start from this content (e.g. the library rubric being customised). */
      initial?: RubricContent
      /** Create a copy owned by this programme instead of a library rubric. */
      courseId?: string
      courseTitle?: string
    }
  | {
      mode: "edit"; rubricId: string; status: RubricStatus; content: RubricContent
      version: number; markedCount: number
      /** Set when editing a programme's own copy. */
      courseId?: string | null
    }

export default function RubricBuilder({
  target, onClose, onSaved,
}: {
  target: BuilderTarget
  onClose: () => void
  /** Called with the saved rubric's id. */
  onSaved: (rubricId: string) => void
}) {
  const [r, setR] = useState<RubricContent>(() =>
    target.mode === "edit" ? clone(target.content) : clone(target.initial ?? blankRubric()),
  )
  // A programme's copy has no draft/archive lifecycle: it exists to be used.
  const scoped = !!target.courseId
  const [status, setStatus] = useState<RubricStatus>(target.mode === "edit" ? target.status : "DRAFT")
  const [saving, setSaving] = useState(false)
  const [showErrors, setShowErrors] = useState(false)
  const [preview, setPreview] = useState(false)

  const levels = useMemo(() => [...r.levels].sort((a, b) => a.order - b.order), [r.levels])
  const criteriaTotal = sumCriteria(r.criteria)
  const errors = useMemo(() => validateRubric(r), [r])
  const totalOk = criteriaTotal === r.totalPoints

  // ── Mutators ───────────────────────────────────────────────────────────────

  const update = (patch: Partial<RubricContent>) => setR(prev => ({ ...prev, ...patch }))

  function setLevels(next: RubricLevel[], respreadAll: boolean) {
    const ordered = next.map((l, i) => ({ ...l, order: i + 1 }))
    setR(prev => ({
      ...prev,
      levels: ordered,
      // Adding or removing a level breaks every criterion's coverage, so
      // re-spread the ranges; descriptors are kept.
      criteria: respreadAll ? prev.criteria.map(c => respread(c, ordered)) : prev.criteria.map(c => ({
        ...c,
        cells: ordered.map(l => c.cells.find(x => x.level === l.key) ?? { level: l.key, minPoints: 0, maxPoints: 0, descriptor: "" }),
      })),
    }))
  }

  function moveLevel(i: number, dir: -1 | 1) {
    const next = [...levels]
    const j = i + dir
    if (j < 0 || j >= next.length) return
    ;[next[i], next[j]] = [next[j], next[i]]
    setLevels(next, true)
  }

  function updateCriterion(i: number, patch: Partial<RubricCriterion>) {
    setR(prev => ({ ...prev, criteria: prev.criteria.map((c, k) => (k === i ? { ...c, ...patch } : c)) }))
  }

  function updateCell(ci: number, levelKey: string, patch: Partial<RubricCriterion["cells"][number]>) {
    setR(prev => ({
      ...prev,
      criteria: prev.criteria.map((c, k) => k !== ci ? c : {
        ...c, cells: c.cells.map(cell => (cell.level === levelKey ? { ...cell, ...patch } : cell)),
      }),
    }))
  }

  function moveCriterion(i: number, dir: -1 | 1) {
    setR(prev => {
      const next = [...prev.criteria]
      const j = i + dir
      if (j < 0 || j >= next.length) return prev
      ;[next[i], next[j]] = [next[j], next[i]]
      return { ...prev, criteria: next }
    })
  }

  function addCriterion() {
    const remaining = Math.max(r.totalPoints - criteriaTotal, 1)
    const key = makeKey(`criterion_${r.criteria.length + 1}`, r.criteria.map(c => c.key))
    const c = respread({ key, title: "", maxPoints: remaining, cells: [] }, levels)
    update({ criteria: [...r.criteria, c] })
  }

  function updateBand(i: number, patch: Partial<GradeBand>) {
    update({ gradeBands: r.gradeBands.map((b, k) => (k === i ? { ...b, ...patch } : b)) })
  }

  // ── Save ───────────────────────────────────────────────────────────────────

  async function save() {
    if (errors.length > 0) {
      setShowErrors(true)
      return toast.error(errors[0])
    }
    setSaving(true)
    const body = {
      ...r, levels: levels.map((l, i) => ({ ...l, order: i + 1 })),
      ...(scoped ? {} : { status }),
      ...(target.mode === "create" && target.courseId && { courseId: target.courseId }),
    }
    const res = await fetch(
      target.mode === "edit" ? `/api/programs/rubrics/${target.rubricId}` : "/api/programs/rubrics",
      {
        method: target.mode === "edit" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    )
    const d = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok) return toast.error(d.error ?? "Could not save the rubric.")
    toast.success(
      target.mode === "create" ? (scoped ? "Saved for this programme only." : "Rubric created.")
        : d.versioned ? `Saved as version ${d.version}. Work already marked keeps the earlier version.`
        : "Rubric updated.",
    )
    onSaved(target.mode === "edit" ? target.rubricId : d.rubric?.id)
    onClose()
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  // Portalled and stacked above the programme editor (z-100), which it can be
  // opened from.
  return createPortal(
    <div className="fixed inset-0 z-150 flex items-stretch sm:items-center justify-center bg-[#171C35]/45 sm:p-4">
      <div className="bg-white sm:rounded-[18px] shadow-2xl w-full max-w-6xl sm:max-h-[94vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-[linear-gradient(135deg,#241C61,#6756DF)] px-5 py-4 flex items-start justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <h2 className="text-[16px] font-extrabold text-white">
              {target.mode === "create"
                ? scoped ? "Customise rubric for this programme" : "New rubric"
                : `Edit ${scoped ? "programme " : ""}rubric · v${target.version}`}
            </h2>
            <p className="text-[12px] text-white/75 mt-0.5">
              {scoped
                ? `Changes apply to ${target.mode === "create" && target.courseTitle ? `"${target.courseTitle}"` : "this programme"} only. The library rubric stays as it is.`
                : "Analytic rubric: one level and score per criterion. Criteria must add up to the total."}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center shrink-0 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-5 space-y-6">
          {target.mode === "edit" && target.markedCount > 0 && (
            <p className="flex items-start gap-2 rounded-[12px] bg-amber-50 border border-amber-100 px-3.5 py-2.5 text-[13px] text-amber-800">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              {target.markedCount} piece{target.markedCount === 1 ? " of work has" : "s of work have"} been marked with this rubric.
              Saving creates a new version; past marks keep showing the version they were marked against.
            </p>
          )}

          {target.mode === "create" && !target.initial && (
            <div className="flex flex-wrap items-center gap-2 rounded-[12px] border border-dashed border-[#C9CCDD] px-3.5 py-3">
              <span className="text-[13px] font-bold text-[#171C35] mr-1">Start from</span>
              <button type="button" onClick={() => setR(blankRubric())} className="px-3 py-1.5 rounded-[9px] text-[12.5px] font-bold border border-[#DFE2ED] text-[#69708A] hover:border-[#6655DF] hover:text-[#6655DF] cursor-pointer">
                Blank
              </button>
              <button type="button" onClick={() => setR(clone(GENERIC_WRITTEN_RUBRIC))} className="px-3 py-1.5 rounded-[9px] text-[12.5px] font-bold border border-[#6655DF] text-[#6655DF] bg-[#EEECFF] hover:bg-[#E2DEFF] cursor-pointer">
                Generic written-assignment rubric
              </button>
            </div>
          )}

          {/* ── Details ─────────────────────────────────────────────────── */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="rb-title" className={cn(metaCls, "block mb-1.5")}>Title</label>
              <input id="rb-title" value={r.title} onChange={e => update({ title: e.target.value })} placeholder="e.g. Capstone report rubric" className={inputCls} />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="rb-desc" className={cn(metaCls, "block mb-1.5")}>Description <span className="normal-case tracking-normal font-normal">(optional)</span></label>
              <textarea id="rb-desc" rows={2} value={r.description ?? ""} onChange={e => update({ description: e.target.value })} placeholder="When to use this rubric." className={cn(inputCls, "resize-y")} />
            </div>
            <div className={cn("grid gap-3 md:col-span-2", scoped ? "grid-cols-2" : "grid-cols-3")}>
              <div>
                <label htmlFor="rb-total" className={cn(metaCls, "block mb-1.5")}>Total points</label>
                <input id="rb-total" type="number" min={1} value={r.totalPoints} onChange={e => update({ totalPoints: num(e.target.value) })} className={inputCls} />
              </div>
              <div>
                <label htmlFor="rb-pass" className={cn(metaCls, "block mb-1.5")}>Pass mark</label>
                <input id="rb-pass" type="number" min={0} value={r.passMark} onChange={e => update({ passMark: num(e.target.value) })} className={inputCls} />
              </div>
              {!scoped && <div>
                <label htmlFor="rb-status" className={cn(metaCls, "block mb-1.5")}>Status</label>
                <select id="rb-status" value={status} onChange={e => setStatus(e.target.value as RubricStatus)} className={inputCls}>
                  <option value="DRAFT">Draft</option>
                  <option value="ACTIVE">Active</option>
                  {target.mode === "edit" && <option value="ARCHIVED">Archived</option>}
                </select>
              </div>}
            </div>
            <label className="md:col-span-2 flex items-center gap-2 text-[13px] font-bold text-[#171C35] cursor-pointer">
              <input type="checkbox" checked={r.visibleToLearners} onChange={e => update({ visibleToLearners: e.target.checked })} className="w-4 h-4 accent-[#6655DF] cursor-pointer" />
              Learners can see this rubric before they submit
            </label>
          </section>

          {/* ── Levels ──────────────────────────────────────────────────── */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[14px] font-extrabold text-[#171C35]">Performance levels <span className="font-semibold text-[#8A90A6] text-[12px]">best first</span></h3>
              <button
                type="button"
                disabled={levels.length >= 8}
                onClick={() => setLevels([...levels, { key: makeKey("level", levels.map(l => l.key)), label: "", order: levels.length + 1 }], true)}
                className="inline-flex items-center gap-1 text-[12.5px] font-bold text-[#6655DF] hover:underline disabled:opacity-40 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add level
              </button>
            </div>
            <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {levels.map((l, i) => (
                <li key={l.key} className="flex items-center gap-1 rounded-[10px] border border-[#DFE2ED] bg-[#FAFAFF] pl-2.5 pr-1 py-1">
                  <span className="text-[11px] font-extrabold text-[#8A90A6] w-4">{i + 1}</span>
                  <input
                    aria-label={`Level ${i + 1} name`}
                    value={l.label}
                    onChange={e => setLevels(levels.map(x => (x.key === l.key ? { ...x, label: e.target.value } : x)), false)}
                    placeholder="Level name"
                    className="flex-1 min-w-0 px-2 py-1 text-[13px] font-bold bg-transparent outline-none text-[#171C35]"
                  />
                  <button type="button" aria-label="Move level up" className={iconBtn} disabled={i === 0} onClick={() => moveLevel(i, -1)}><ChevronUp className="w-3.5 h-3.5" /></button>
                  <button type="button" aria-label="Move level down" className={iconBtn} disabled={i === levels.length - 1} onClick={() => moveLevel(i, 1)}><ChevronDown className="w-3.5 h-3.5" /></button>
                  <button type="button" aria-label="Remove level" className={cn(iconBtn, "hover:bg-red-50 hover:text-red-500")} disabled={levels.length <= 2} onClick={() => setLevels(levels.filter(x => x.key !== l.key), true)}><Trash2 className="w-3.5 h-3.5" /></button>
                </li>
              ))}
            </ol>
            <p className="text-[12px] text-[#8A90A6] mt-1.5">Adding, removing or reordering a level re-spreads every criterion&apos;s point ranges. Descriptors are kept.</p>
          </section>

          {/* ── Criteria ────────────────────────────────────────────────── */}
          <section>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <h3 className="text-[14px] font-extrabold text-[#171C35]">Criteria</h3>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-extrabold",
                  totalOk ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600",
                )}
                aria-live="polite"
              >
                {totalOk ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                Running total {criteriaTotal} / {r.totalPoints}
                {!totalOk && (
                  <button type="button" onClick={() => update({ totalPoints: criteriaTotal, gradeBands: scaleBands(r.gradeBands, r.totalPoints, criteriaTotal) })} className="ml-1 underline underline-offset-2 cursor-pointer">
                    use {criteriaTotal}
                  </button>
                )}
              </span>
            </div>

            <div className="space-y-3">
              {r.criteria.map((c, ci) => (
                <div key={c.key} className="rounded-[14px] border border-[#DFE2ED] overflow-hidden">
                  <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 bg-[#FAFAFF] border-b border-[#DFE2ED]">
                    <input
                      aria-label={`Criterion ${ci + 1} title`}
                      value={c.title}
                      onChange={e => updateCriterion(ci, { title: e.target.value })}
                      placeholder="What you're assessing, e.g. Analysis and critical thinking"
                      className={cn(inputCls, "flex-1 min-w-55 font-bold")}
                    />
                    <label className="flex items-center gap-1.5 text-[12px] font-bold text-[#69708A]">
                      Max
                      <input
                        type="number" min={1} value={c.maxPoints}
                        onChange={e => {
                          const maxPoints = num(e.target.value)
                          // A new maximum invalidates the ranges; re-spread them.
                          updateCriterion(ci, respread({ ...c, maxPoints }, levels))
                        }}
                        className={cn(numCls, "w-20")}
                      />
                      pts
                    </label>
                    <div className="flex items-center">
                      <button type="button" title="Re-spread the point ranges" aria-label="Re-spread the point ranges" className={iconBtn} onClick={() => updateCriterion(ci, respread(c, levels))}><Wand2 className="w-3.5 h-3.5" /></button>
                      <button type="button" aria-label="Move criterion up" className={iconBtn} disabled={ci === 0} onClick={() => moveCriterion(ci, -1)}><ChevronUp className="w-3.5 h-3.5" /></button>
                      <button type="button" aria-label="Move criterion down" className={iconBtn} disabled={ci === r.criteria.length - 1} onClick={() => moveCriterion(ci, 1)}><ChevronDown className="w-3.5 h-3.5" /></button>
                      <button type="button" aria-label="Remove criterion" className={cn(iconBtn, "hover:bg-red-50 hover:text-red-500")} disabled={r.criteria.length <= 1} onClick={() => update({ criteria: r.criteria.filter((_, k) => k !== ci) })}><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>

                  <div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:[grid-template-columns:repeat(var(--cols),minmax(0,1fr))]"
                    style={{ "--cols": levels.length } as React.CSSProperties}
                  >
                    {levels.map(l => {
                      const cell = c.cells.find(x => x.level === l.key)
                      if (!cell) return null
                      const missing = showErrors && !cell.descriptor.trim()
                      return (
                        <div key={l.key} className="p-3 border-b sm:border-r border-[#F0EFFA] space-y-2">
                          <p className="text-[12px] font-extrabold text-[#171C35]">{l.label || "Unnamed level"}</p>
                          <div className="flex items-center gap-1.5">
                            <input aria-label={`${c.title || "Criterion"} ${l.label} minimum`} type="number" min={0} value={cell.minPoints} onChange={e => updateCell(ci, l.key, { minPoints: num(e.target.value) })} className={numCls} />
                            <span className="text-[12px] font-bold text-[#8A90A6]">to</span>
                            <input aria-label={`${c.title || "Criterion"} ${l.label} maximum`} type="number" min={0} value={cell.maxPoints} onChange={e => updateCell(ci, l.key, { maxPoints: num(e.target.value) })} className={numCls} />
                          </div>
                          <textarea
                            aria-label={`${c.title || "Criterion"} ${l.label} descriptor`}
                            rows={3}
                            value={cell.descriptor}
                            onChange={e => updateCell(ci, l.key, { descriptor: e.target.value })}
                            placeholder="What work at this level looks like"
                            className={cn(inputCls, "resize-y text-[12.5px] px-2.5", missing && "border-red-300 bg-red-50/40")}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button" onClick={addCriterion}
              disabled={r.criteria.length >= 30}
              className="mt-3 w-full py-2.5 rounded-[10px] border border-dashed border-[#C9CCDD] text-[13px] font-bold text-[#6655DF] hover:border-[#6655DF] hover:bg-[#FAFAFF] cursor-pointer transition-colors disabled:opacity-40"
            >
              + Add criterion
            </button>
          </section>

          {/* ── Grade bands ─────────────────────────────────────────────── */}
          <section>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <h3 className="text-[14px] font-extrabold text-[#171C35]">Grade bands</h3>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => update({ gradeBands: scaleBands(r.gradeBands, Math.max(...r.gradeBands.map(b => b.max), 1), r.totalPoints) })} className="text-[12.5px] font-bold text-[#6655DF] hover:underline cursor-pointer">
                  Fit to {r.totalPoints}
                </button>
                <button
                  type="button" disabled={r.gradeBands.length >= 10}
                  onClick={() => update({ gradeBands: [...r.gradeBands, { label: "", min: 0, max: 0, meaning: "" }] })}
                  className="inline-flex items-center gap-1 text-[12.5px] font-bold text-[#6655DF] hover:underline cursor-pointer disabled:opacity-40"
                >
                  <Plus className="w-3.5 h-3.5" /> Add band
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {r.gradeBands.map((b, i) => (
                <div key={i} className="grid grid-cols-[1fr_auto] sm:grid-cols-[180px_150px_1fr_auto] gap-2 items-center rounded-[10px] border border-[#DFE2ED] p-2">
                  <input aria-label={`Band ${i + 1} name`} value={b.label} onChange={e => updateBand(i, { label: e.target.value })} placeholder="e.g. Distinction" className={cn(inputCls, "font-bold")} />
                  <div className="flex items-center gap-1.5 order-3 sm:order-0 col-span-2 sm:col-span-1">
                    <input aria-label={`Band ${i + 1} minimum`} type="number" min={0} value={b.min} onChange={e => updateBand(i, { min: num(e.target.value) })} className={numCls} />
                    <span className="text-[12px] font-bold text-[#8A90A6]">to</span>
                    <input aria-label={`Band ${i + 1} maximum`} type="number" min={0} value={b.max} onChange={e => updateBand(i, { max: num(e.target.value) })} className={numCls} />
                  </div>
                  <input aria-label={`Band ${i + 1} meaning`} value={b.meaning ?? ""} onChange={e => updateBand(i, { meaning: e.target.value })} placeholder="What this band means (optional)" className={cn(inputCls, "order-4 sm:order-0 col-span-2 sm:col-span-1")} />
                  <button type="button" aria-label="Remove band" className={cn(iconBtn, "hover:bg-red-50 hover:text-red-500")} disabled={r.gradeBands.length <= 1} onClick={() => update({ gradeBands: r.gradeBands.filter((_, k) => k !== i) })}><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          </section>

          {showErrors && errors.length > 0 && (
            <div role="alert" className="rounded-[12px] border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-[13px] font-extrabold text-red-700 mb-1">Fix these before saving</p>
              <ul className="list-disc pl-5 space-y-0.5 text-[12.5px] text-red-700">
                {errors.slice(0, 12).map((e, i) => <li key={i}>{e}</li>)}
                {errors.length > 12 && <li>…and {errors.length - 12} more</li>}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 flex flex-wrap items-center gap-2 px-5 py-3.5 border-t border-[#DFE2ED] bg-[#FAFAFF]">
          <span className={cn("text-[12.5px] font-bold", errors.length ? "text-red-600" : "text-emerald-700")}>
            {errors.length ? `${errors.length} issue${errors.length === 1 ? "" : "s"} to fix` : "Ready to save"}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button type="button" onClick={() => setPreview(true)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[13px] font-bold border border-[#DFE2ED] text-[#69708A] hover:bg-white cursor-pointer">
              <Eye className="w-3.5 h-3.5" /> Preview
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-[10px] text-[13px] font-bold border border-[#DFE2ED] text-[#69708A] hover:bg-white cursor-pointer">
              Cancel
            </button>
            <button
              type="button" onClick={save} disabled={saving || (showErrors && errors.length > 0)}
              className="px-5 py-2 rounded-[10px] text-[13px] font-bold bg-[#6655DF] text-white hover:bg-[#2C2368] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {saving ? "Saving…" : target.mode === "create" ? (scoped ? "Save for this programme" : "Create rubric") : "Save changes"}
            </button>
          </div>
        </div>
      </div>

      <RubricSidePanel open={preview} onOpenChange={setPreview} title={r.title || "Untitled rubric"} subtitle="Preview — how markers and learners will see it">
        <RubricGrid rubric={{ ...r, levels }} />
      </RubricSidePanel>
    </div>,
    document.body,
  )
}
