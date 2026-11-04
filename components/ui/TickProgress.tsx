import { cn } from "@/lib/utils"

type Tone = "brand" | "success" | "light"

/** Tick colours per tone. The track tick is a lighter step of the same hue as
 *  the filled one, so the bar reads as one scale rather than two colours. */
const TONES: Record<Tone, { on: string; off: string; shell: string; label: string; value: string }> = {
  brand:   { on: "bg-[#6655DF]", off: "bg-[#DEDAF7]", shell: "bg-white border-[#DFE2ED]", label: "text-[#69708A]", value: "text-[#171C35]" },
  success: { on: "bg-emerald-600", off: "bg-emerald-100", shell: "bg-white border-[#DFE2ED]", label: "text-[#69708A]", value: "text-[#171C35]" },
  // For dark surfaces — the hero banners.
  light:   { on: "bg-white", off: "bg-white/25", shell: "bg-white/10 border-white/15", label: "text-white/70", value: "text-white" },
}

/**
 * Segmented progress meter — a run of ticks rather than a continuous fill.
 *
 * Ticks quantise the value, which is honest here: "60%" of a course is really
 * "three of five lessons", and a bar of discrete marks says that where a
 * smooth fill implies a precision the underlying data doesn't have. The track
 * tick is a lighter step of the same hue (a meter, not two categories), and
 * the real value is always printed beside it rather than left to be estimated
 * from the marks.
 */
export function TickProgress({
  value,
  label,
  valueLabel,
  ticks = 44,
  tone = "brand",
  className,
}: {
  /** 0–100. Clamped. */
  value: number
  /** Caption on the left, e.g. "On progress". Omit for a bare bar. */
  label?: string
  /** Overrides the right-hand figure; defaults to the rounded percentage. */
  valueLabel?: string
  ticks?: number
  tone?: Tone
  className?: string
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)))
  const t = TONES[tone]

  // Round up so any progress at all lights the first tick — a learner who has
  // started should never see an empty bar.
  const filled = pct === 0 ? 0 : Math.max(1, Math.round((pct / 100) * ticks))

  return (
    <div className={className}>
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "Progress"}
        className={cn("flex items-stretch gap-[2px] rounded-[8px] border px-2 py-2 overflow-hidden", t.shell)}
      >
        {Array.from({ length: ticks }).map((_, i) => (
          <span
            key={i}
            aria-hidden="true"
            className={cn(
              "h-4 flex-1 rounded-[1px] transition-colors duration-300",
              i < filled ? t.on : t.off,
            )}
          />
        ))}
      </div>

      {(label || valueLabel || label === undefined) && (label !== undefined || valueLabel !== undefined) && (
        <div className="mt-1.5 flex items-center justify-between gap-3">
          {label && <span className={cn("text-[12px] font-bold", t.label)}>{label}</span>}
          <span className={cn("text-[12px] font-bold ml-auto tabular-nums", t.value)}>
            {valueLabel ?? `${pct}%`}
          </span>
        </div>
      )}
    </div>
  )
}

export default TickProgress

export type TickSegment = { key: string; label: string; value: number; hex: string }

/**
 * The same tick shell, but one whole split across categories rather than a
 * single value — the part-to-whole case.
 *
 * Ticks are allocated by largest remainder so the counts sum exactly to
 * `ticks`: naive rounding drops or invents a mark, and a bar that doesn't add
 * up is worse than one that's a tick off per category. Any category with a
 * non-zero value gets at least one tick, so a lone cancellation never
 * disappears. Colour alone never carries meaning here — the caller prints the
 * name and amount of every part beside the bar.
 */
export function TickSegments({
  parts, ticks = 44, className,
}: {
  parts: TickSegment[]
  ticks?: number
  className?: string
}) {
  const live  = parts.filter(p => p.value > 0)
  const total = live.reduce((sum, p) => sum + p.value, 0)
  if (total === 0 || live.length === 0) {
    return (
      <div className={cn("flex items-stretch gap-[2px] rounded-[8px] border border-[#DFE2ED] bg-white px-2 py-2", className)}>
        {Array.from({ length: ticks }).map((_, i) => (
          <span key={i} className="h-4 flex-1 rounded-[1px] bg-[#EEEFF5]" />
        ))}
      </div>
    )
  }

  // Largest remainder: floor everyone, then hand the leftovers to the biggest
  // fractional parts, so the allocation is exact.
  const exact  = live.map(p => (p.value / total) * ticks)
  const counts = exact.map(n => Math.max(1, Math.floor(n)))
  let used = counts.reduce((a, b) => a + b, 0)
  const order = exact
    .map((n, i) => ({ i, frac: n - Math.floor(n) }))
    .sort((a, b) => b.frac - a.frac)
  let k = 0
  while (used < ticks && order.length > 0) { counts[order[k % order.length].i]++; used++; k++ }
  while (used > ticks) {
    const shrinkable = counts.map((c, i) => ({ c, i })).filter(x => x.c > 1).sort((a, b) => b.c - a.c)
    if (shrinkable.length === 0) break
    counts[shrinkable[0].i]--; used--
  }

  const cells = live.flatMap((p, i) =>
    Array.from({ length: counts[i] }, (_, j) => ({ key: `${p.key}-${j}`, hex: p.hex, label: p.label, value: p.value })),
  )

  return (
    <div
      role="img"
      aria-label={live.map(p => `${p.label} ${p.value}`).join("; ")}
      className={cn("flex items-stretch gap-[2px] rounded-[8px] border border-[#DFE2ED] bg-white px-2 py-2 overflow-hidden", className)}
    >
      {cells.map(c => (
        <span
          key={c.key}
          title={`${c.label}: ${c.value}`}
          style={{ backgroundColor: c.hex }}
          className="h-4 flex-1 rounded-[1px]"
        />
      ))}
    </div>
  )
}
