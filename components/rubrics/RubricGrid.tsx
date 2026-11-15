"use client"

import { Dialog as DialogPrimitive } from "radix-ui"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  cellFor, gradeBandFor, rangeLabel, sortedLevels,
  type RubricContent, type RubricMarks,
} from "@/lib/rubric"

const metaCls = "text-[11px] tracking-[0.12em] uppercase font-extrabold text-[#8A90A6]"

/**
 * Read-only rubric. Without `marks` it's the rubric as a learner sees it
 * before submitting (and as staff preview it); with `marks` each criterion's
 * chosen level is highlighted, with the score and the marker's comment, and
 * the total and grade band sit at the foot.
 *
 * A table from md up; below that each criterion becomes a stacked card so the
 * descriptors stay readable on a phone instead of scrolling sideways.
 */
export function RubricGrid({
  rubric, marks, className,
}: {
  rubric: Pick<RubricContent, "title" | "levels" | "criteria" | "gradeBands" | "totalPoints" | "passMark">
  marks?: RubricMarks | null
  className?: string
}) {
  const levels = sortedLevels(rubric.levels)
  const markFor = (key: string) => marks?.criteria.find(m => m.key === key)
  const band = marks ? (marks.gradeBand ?? gradeBandFor(rubric.gradeBands, marks.total)?.label ?? null) : null

  return (
    <div className={cn("space-y-4", className)}>
      {/* ── Table (md and up) ─────────────────────────────────────────── */}
      <div className="hidden md:block overflow-x-auto rounded-[14px] border border-[#DFE2ED]">
        <table className="w-full text-[13px] border-collapse">
          <caption className="sr-only">{rubric.title}</caption>
          <thead>
            <tr className="bg-[#F5F6FB]">
              <th scope="col" className="w-[18%] px-3 py-2.5 text-left text-[12px] font-extrabold text-[#171C35] border-b border-[#DFE2ED]">Criteria</th>
              {levels.map(l => (
                <th key={l.key} scope="col" className="px-3 py-2.5 text-left text-[12px] font-extrabold text-[#171C35] border-b border-l border-[#DFE2ED]">
                  {l.label}
                </th>
              ))}
              <th scope="col" className="w-[9%] px-3 py-2.5 text-right text-[12px] font-extrabold text-[#171C35] border-b border-l border-[#DFE2ED]">Points</th>
            </tr>
          </thead>
          <tbody>
            {rubric.criteria.map(c => {
              const m = markFor(c.key)
              return [
                <tr key={c.key} className="align-top">
                  <th scope="row" className="px-3 py-3 text-left font-bold text-[#171C35] border-t border-[#DFE2ED] bg-[#FAFAFF]">
                    {c.title}
                    <span className="block text-[11.5px] font-semibold text-[#8A90A6] mt-0.5">{c.maxPoints} pts</span>
                  </th>
                  {levels.map(l => {
                    const cell = cellFor(c, l.key)
                    const chosen = m?.level === l.key
                    return (
                      <td
                        key={l.key}
                        className={cn(
                          "relative px-3 py-3 border-t border-l border-[#DFE2ED] text-[#171C35]",
                          chosen && "bg-emerald-50/70 outline-2 -outline-offset-2 outline-emerald-600",
                        )}
                        aria-label={chosen ? `Selected: ${l.label}` : undefined}
                      >
                        <p className="leading-snug">{cell?.descriptor}</p>
                        {cell && (
                          <p className="mt-2 text-[12px] font-bold text-[#6655DF]">{rangeLabel(cell)}</p>
                        )}
                      </td>
                    )
                  })}
                  <td className="px-3 py-3 text-right font-bold whitespace-nowrap border-t border-l border-[#DFE2ED] text-[#171C35]">
                    {m ? `${m.score} / ${c.maxPoints}` : `${c.maxPoints}`}
                  </td>
                </tr>,
                m?.comment?.trim() ? (
                  <tr key={`${c.key}-comment`}>
                    <td colSpan={levels.length + 2} className="px-3 py-2.5 border-t border-[#F0EFFA] bg-white">
                      <p className={cn(metaCls, "mb-0.5")}>Comment</p>
                      <p className="text-[13px] text-[#171C35] whitespace-pre-line">{m.comment}</p>
                    </td>
                  </tr>
                ) : null,
              ]
            })}
          </tbody>
          <tfoot>
            <tr className="bg-[#F5F6FB]">
              <th scope="row" colSpan={levels.length + 1} className="px-3 py-2.5 text-left font-extrabold text-[#171C35] border-t border-[#DFE2ED]">
                Total{band ? <span className="ml-2 font-bold text-[#6655DF]">· {band}</span> : null}
              </th>
              <td className="px-3 py-2.5 text-right font-extrabold whitespace-nowrap border-t border-l border-[#DFE2ED] text-[#171C35]">
                {marks ? `${marks.total} / ${rubric.totalPoints}` : `${rubric.totalPoints} pts`}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ── Stacked cards (phones) ─────────────────────────────────────── */}
      <div className="md:hidden space-y-3">
        {rubric.criteria.map(c => {
          const m = markFor(c.key)
          return (
            <section key={c.key} className="rounded-[14px] border border-[#DFE2ED] overflow-hidden">
              <header className="flex items-start justify-between gap-3 px-3.5 py-2.5 bg-[#FAFAFF] border-b border-[#DFE2ED]">
                <h4 className="text-[14px] font-bold text-[#171C35]">{c.title}</h4>
                <span className="text-[13px] font-bold text-[#171C35] whitespace-nowrap">
                  {m ? `${m.score} / ${c.maxPoints}` : `${c.maxPoints} pts`}
                </span>
              </header>
              <ul>
                {levels.map(l => {
                  const cell = cellFor(c, l.key)
                  const chosen = m?.level === l.key
                  return (
                    <li
                      key={l.key}
                      className={cn(
                        "px-3.5 py-2.5 border-b border-[#F0EFFA] last:border-none",
                        chosen && "bg-emerald-50 border-l-4 border-l-emerald-600",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[13px] font-extrabold text-[#171C35]">
                          {l.label}{chosen && <span className="sr-only"> (selected)</span>}
                        </span>
                        {cell && <span className="text-[12px] font-bold text-[#6655DF] whitespace-nowrap">{rangeLabel(cell)}</span>}
                      </div>
                      {cell?.descriptor && <p className="text-[13px] text-[#69708A] mt-1 leading-snug">{cell.descriptor}</p>}
                    </li>
                  )
                })}
              </ul>
              {m?.comment?.trim() && (
                <div className="px-3.5 py-2.5 bg-white border-t border-[#DFE2ED]">
                  <p className={cn(metaCls, "mb-0.5")}>Comment</p>
                  <p className="text-[13px] text-[#171C35] whitespace-pre-line">{m.comment}</p>
                </div>
              )}
            </section>
          )
        })}
        <div className="flex items-center justify-between rounded-[12px] bg-[#F5F6FB] px-3.5 py-2.5">
          <span className="text-[14px] font-extrabold text-[#171C35]">Total{band ? ` · ${band}` : ""}</span>
          <span className="text-[14px] font-extrabold text-[#171C35]">
            {marks ? `${marks.total} / ${rubric.totalPoints}` : `${rubric.totalPoints} pts`}
          </span>
        </div>
      </div>

      {marks?.overallComment?.trim() && (
        <div className="rounded-[12px] border border-[#F0EFFA] bg-[#FAFAFF] px-3.5 py-3">
          <p className={cn(metaCls, "mb-1")}>Overall comment</p>
          <p className="text-[13.5px] text-[#171C35] whitespace-pre-line">{marks.overallComment}</p>
        </div>
      )}

      {!marks && <GradeBandTable rubric={rubric} />}
    </div>
  )
}

/** The grade bands and pass mark, as a compact list. */
export function GradeBandTable({
  rubric,
}: { rubric: Pick<RubricContent, "gradeBands" | "passMark" | "totalPoints"> }) {
  const bands = [...rubric.gradeBands].sort((a, b) => b.min - a.min)
  return (
    <div className="rounded-[14px] border border-[#DFE2ED] overflow-hidden">
      <div className="px-3.5 py-2.5 bg-[#F5F6FB] flex items-center justify-between gap-2 border-b border-[#DFE2ED]">
        <span className="text-[12px] font-extrabold text-[#171C35]">Grade bands</span>
        <span className="text-[12px] font-bold text-[#69708A]">Pass mark {rubric.passMark} / {rubric.totalPoints}</span>
      </div>
      <ul>
        {bands.map(b => (
          <li key={b.label} className="px-3.5 py-2 border-b border-[#F0EFFA] last:border-none flex flex-col sm:flex-row sm:items-baseline gap-x-3 gap-y-0.5">
            <span className="text-[13px] font-bold text-[#171C35] sm:w-36 shrink-0">{b.label}</span>
            <span className="text-[12.5px] font-bold text-[#6655DF] sm:w-20 shrink-0">{b.min} to {b.max}</span>
            {b.meaning && <span className="text-[12.5px] text-[#69708A]">{b.meaning}</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Right-hand slide-over for showing a rubric beside whatever opened it. Built
 * on the Radix dialog so focus is trapped, Esc closes it and screen readers
 * announce it as a dialog.
 */
export function RubricSidePanel({
  open, onOpenChange, title, subtitle, children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-200 bg-[#171C35]/40" />
        <DialogPrimitive.Content
          className="fixed inset-y-0 right-0 z-200 w-full max-w-5xl bg-white shadow-2xl flex flex-col outline-none"
        >
          <div className="shrink-0 bg-[linear-gradient(135deg,#241C61,#6756DF)] px-5 py-4 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <DialogPrimitive.Title className="text-[16px] font-extrabold text-white">{title}</DialogPrimitive.Title>
              {subtitle
                ? <DialogPrimitive.Description className="text-[12px] text-white/75 mt-0.5">{subtitle}</DialogPrimitive.Description>
                : <DialogPrimitive.Description className="sr-only">Rubric details</DialogPrimitive.Description>}
            </div>
            <DialogPrimitive.Close
              aria-label="Close"
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </DialogPrimitive.Close>
          </div>
          <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-5">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
