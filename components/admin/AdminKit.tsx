"use client"

import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { DropdownMenu, type DropdownItem } from "@/components/ui/DropdownMenu"
import { TickSegments } from "@/components/ui/TickProgress"

/**
 * Shared vocabulary for the administrator workspace.
 *
 * The admin screens are a control room, not a brochure: dense, data-forward,
 * and read many times a day. So the decoration is confined to the page header
 * — one patterned band at the top — and everything below it stays quiet, with
 * hairline borders and a single accent. That keeps eighteen screens looking
 * like one product without making the tables harder to scan.
 */

// ── Tokens ───────────────────────────────────────────────────────────────────

export const ink    = "#171C35"
export const muted  = "#69708A"
export const faint  = "#8A90A6"
export const brand  = "#6655DF"

/** Uppercase micro-label, used for every field label and meta line. */
export const metaCls = "text-[11px] tracking-[0.12em] uppercase font-extrabold text-[#8A90A6]"

/** Faint dot grid for the header band. */
export const DOTS =
  "[background-image:radial-gradient(rgba(255,255,255,0.14)_1px,transparent_1px)] [background-size:18px_18px]"

/** Soft colour wash behind the dots. Animated only where motion is welcome. */
export const AURORA =
  "[background-image:radial-gradient(60%_80%_at_12%_20%,rgba(168,139,255,0.5),transparent_60%)," +
  "radial-gradient(50%_70%_at_88%_25%,rgba(97,196,255,0.4),transparent_60%)," +
  "radial-gradient(55%_90%_at_60%_100%,rgba(255,170,120,0.3),transparent_60%)]"

// ── Page header ──────────────────────────────────────────────────────────────

/**
 * The one decorated element per screen. `tone="band"` gives the dark patterned
 * hero used on landing screens; `tone="plain"` is the quiet version for list
 * screens, where a full-bleed band would push the table below the fold.
 */
export function AdminPageHeader({
  eyebrow = "Administrator", title, description, actions, stats, tone = "plain",
}: {
  eyebrow?: string
  title: string
  description?: string
  actions?: React.ReactNode
  /** Small figures rendered inside the band — landing screens only. */
  stats?: { label: string; value: React.ReactNode }[]
  tone?: "band" | "plain"
}) {
  if (tone === "plain") {
    return (
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <span className="block text-[12px] tracking-[0.12em] uppercase font-extrabold text-[#6655DF] mb-1.5">{eyebrow}</span>
          <h1 className="text-[clamp(28px,3.4vw,40px)] leading-[1.1] tracking-[-0.035em] font-extrabold text-[#171C35]">{title}</h1>
          {description && <p className="text-[#69708A] text-[15px] mt-1.5 max-w-180">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
      </div>
    )
  }

  return (
    <section className={cn("relative overflow-hidden rounded-[20px] bg-[#0E1230] px-5 sm:px-8 py-7 sm:py-9 mb-6", DOTS)}>
      <div className={cn("absolute inset-0 opacity-70 blur-2xl motion-safe:animate-[pulse_10s_ease-in-out_infinite]", AURORA)} />
      <div className="relative flex flex-wrap items-end justify-between gap-6">
        <div className="min-w-0">
          <span className="block text-[12px] tracking-[0.12em] uppercase font-extrabold text-[#A99BFF] mb-1.5">{eyebrow}</span>
          <h1 className="text-[clamp(28px,3.4vw,40px)] leading-[1.1] tracking-[-0.035em] font-extrabold text-white">{title}</h1>
          {description && <p className="text-white/60 text-[15px] mt-1.5 max-w-180">{description}</p>}
        </div>

        {stats && stats.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {stats.map(s => (
              <div key={s.label} className="rounded-[14px] bg-white/10 backdrop-blur-sm border border-white/15 px-4 py-3 min-w-26">
                <p className="text-[22px] font-extrabold text-white leading-none">{s.value}</p>
                <p className="text-[10px] tracking-[0.12em] uppercase font-extrabold text-white/50 mt-1.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </section>
  )
}

// ── Stat tile ────────────────────────────────────────────────────────────────

export type StatBreakdown = {
  label: string
  value: number
  tone?: "emerald" | "amber" | "slate" | "sky" | "rose"
}

/**
 * A distinct motif per tile, drawn with CSS gradients rather than an image.
 *
 * No raster asset: these stay crisp at any density, add nothing to the
 * bundle, and can be tinted from the same token as the tile's icon. The
 * shimmer is a slow drift on the wash behind the motif — the movement a GIF
 * would give, but it respects `prefers-reduced-motion` through `motion-safe:`
 * and can't desynchronise or loop-jump the way a looping image does.
 */
export type CardMotif = "dots" | "grid" | "hatch" | "rings" | "waves"

const MOTIFS: Record<CardMotif, string> = {
  // Dot grid — the default, quietest motif.
  dots:  "[background-image:radial-gradient(currentColor_1px,transparent_1px)] [background-size:12px_12px]",
  // Fine square grid.
  grid:  "[background-image:linear-gradient(currentColor_1px,transparent_1px),linear-gradient(90deg,currentColor_1px,transparent_1px)] [background-size:14px_14px]",
  // 45-degree hatch.
  hatch: "[background-image:repeating-linear-gradient(45deg,currentColor_0_1px,transparent_1px_8px)]",
  // Concentric arcs, radiating from the corner the icon sits in.
  rings: "[background-image:repeating-radial-gradient(circle_at_0%_0%,currentColor_0_1px,transparent_1px_12px)]",
  // Soft horizontal waves.
  waves: "[background-image:repeating-linear-gradient(0deg,currentColor_0_1px,transparent_1px_10px)]",
}

/** Swatch + chip colours per tone, and the hex the meter paints with. They
 *  are kept together so a chip can never drift from the segment it labels. */
const BREAKDOWN_TONES: Record<NonNullable<StatBreakdown["tone"]>, { chip: string; hex: string }> = {
  emerald: { chip: "bg-emerald-50 text-emerald-700", hex: "#059669" },
  amber:   { chip: "bg-amber-50 text-amber-700",     hex: "#D97706" },
  sky:     { chip: "bg-sky-50 text-sky-700",         hex: "#0284C7" },
  rose:    { chip: "bg-rose-50 text-rose-600",       hex: "#E11D48" },
  slate:   { chip: "bg-[#F0EFFA] text-[#69708A]",    hex: "#A9ADC4" },
}

/**
 * KPI tile.
 *
 * The breakdown is drawn as a segmented meter *and* listed as labelled
 * figures. The meter gives the proportion at a glance — 3 draft out of 40
 * reads very differently as a sliver than as the text "3 draft" — while the
 * figures beside it carry the exact numbers, so nothing depends on reading a
 * length or a colour. A tile with no breakdown simply omits the meter rather
 * than drawing a full bar that would imply a ratio it doesn't have.
 */
export function StatTile({
  href, icon, label, value, tone = "bg-[#EEECFF] text-[#6655DF]", breakdown, loading, hint,
  motif = "dots", accent = "text-[#6655DF]",
}: {
  href?: string
  icon: React.ReactNode
  label: string
  value: number | string
  /** Background + text classes for the icon chip. */
  tone?: string
  breakdown?: StatBreakdown[]
  loading?: boolean
  /** Replaces the breakdown row when there is nothing to split. */
  hint?: string
  /** Background motif. Vary it across a row so the tiles aren't four clones. */
  motif?: CardMotif
  /** Colour the motif and the wash are drawn in — match the icon's tone. */
  accent?: string
}) {
  const parts = (breakdown ?? []).filter(b => b.value > 0)
  const total = parts.reduce((sum, b) => sum + b.value, 0)

  const body = (
    <>
      {/* Motif + wash. aria-hidden and pointer-events-none: decoration only. */}
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 overflow-hidden rounded-[16px]",
          accent,
        )}
      >
        <span className={cn(
          "absolute -right-8 -top-8 w-40 h-40 opacity-[0.07] group-hover:opacity-[0.11] transition-opacity duration-300",
          MOTIFS[motif],
        )} />
        <span className="absolute -right-10 -top-14 w-44 h-44 rounded-full bg-current opacity-[0.045] blur-2xl motion-safe:animate-[pulse_7s_ease-in-out_infinite]" />
      </span>

      <span className={cn(
        "absolute -top-3.5 left-4 w-9 h-9 rounded-[11px] flex items-center justify-center border border-white shadow-sm",
        tone,
      )}>
        {icon}
      </span>

      {href && (
        <svg
          width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          className="absolute top-4 right-4 text-[#C9CCDD] group-hover:text-[#6655DF] group-hover:translate-x-0.5 transition-all"
        >
          <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
        </svg>
      )}

      {loading ? <Skeleton className="h-8 w-16" /> : (
        <p className="relative text-[30px] font-extrabold leading-none tracking-[-0.035em] text-[#171C35]">{value}</p>
      )}
      <p className="relative text-[14px] font-bold text-[#171C35] mt-2">{label}</p>

      {!loading && total > 0 && (
        <>
          {/* The same tick meter the learner workspace uses, so a proportion
              reads identically on both sides of the product. `bare` because
              the card already supplies the border. */}
          <TickSegments
            bare
            ticks={26}
            className="mt-3"
            parts={parts.map(b => ({
              key:   b.label,
              label: b.label,
              value: b.value,
              hex:   BREAKDOWN_TONES[b.tone ?? "slate"].hex,
            }))}
          />

          {/* The figures. The meter above carries no text, so these do. */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2.5">
            {parts.map(b => (
              <span key={b.label} className="inline-flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: BREAKDOWN_TONES[b.tone ?? "slate"].hex }}
                />
                <span className="text-[12px] font-bold text-[#171C35] tabular-nums">{b.value}</span>
                <span className="text-[12px] font-bold text-[#8A90A6]">{b.label}</span>
              </span>
            ))}
          </div>
        </>
      )}

      {!loading && total === 0 && hint && (
        <p className="text-[12px] font-bold text-[#8A90A6] mt-2.5">{hint}</p>
      )}
    </>
  )

  const cls = cn(
    "group relative isolate overflow-visible rounded-[16px] border border-[#DFE2ED] bg-white px-4 pt-7 pb-4 block no-underline transition-all",
    href && "hover:border-[#6655DF] hover:shadow-[0_8px_24px_rgba(102,85,223,0.1)] hover:-translate-y-0.5",
  )

  return href ? <Link href={href} className={cls}>{body}</Link> : <div className={cls}>{body}</div>
}

// ── Panel ────────────────────────────────────────────────────────────────────

/** A titled card. The unit every admin section is built from. */
export function Panel({
  icon, title, note, action, children, className, bodyClassName,
}: {
  icon?: React.ReactNode
  title: string
  note?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  bodyClassName?: string
}) {
  return (
    <section className={cn("min-w-0 rounded-[16px] border border-[#DFE2ED] bg-white overflow-hidden", className)}>
      <div className="flex items-start gap-3 px-4 sm:px-5 py-4 border-b border-[#F0EFFA]">
        {icon && (
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-[#EEECFF] text-[#6655DF]">{icon}</span>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-[14px] font-bold text-[#171C35]">{title}</h2>
          {note && <p className="text-[12px] font-bold text-[#8A90A6] mt-0.5">{note}</p>}
        </div>
        {action}
      </div>
      <div className={cn("px-4 sm:px-5 py-4", bodyClassName)}>{children}</div>
    </section>
  )
}

/** "View all" style link for a Panel's action slot. */
export function PanelLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="shrink-0 text-[14px] font-bold text-[#6655DF] hover:text-[#2C2368] transition-colors no-underline">
      {children}
    </Link>
  )
}

// ── Empty state ──────────────────────────────────────────────────────────────

export function EmptyState({
  icon, title, hint, action, className,
}: {
  icon?: React.ReactNode
  title: string
  hint?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("rounded-[16px] border border-dashed border-[#DFE2ED] bg-white px-4 py-14 text-center", className)}>
      {icon && (
        <span className="w-14 h-14 rounded-full bg-[#EEECFF] text-[#6655DF] flex items-center justify-center mx-auto mb-3">{icon}</span>
      )}
      <p className="text-[15px] font-bold text-[#171C35]">{title}</p>
      {hint && <p className="text-[13.5px] text-[#69708A] mt-1.5 max-w-sm mx-auto">{hint}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  )
}

// ── Status pill ──────────────────────────────────────────────────────────────

export type PillTone = "emerald" | "amber" | "slate" | "sky" | "rose" | "brand"

const PILL_TONES: Record<PillTone, string> = {
  emerald: "bg-emerald-50 text-emerald-700",
  amber:   "bg-amber-50 text-amber-700",
  sky:     "bg-sky-50 text-sky-700",
  rose:    "bg-rose-50 text-rose-600",
  brand:   "bg-[#EEECFF] text-[#6655DF]",
  slate:   "bg-[#F0EFFA] text-[#69708A]",
}

export function Pill({ tone = "slate", children }: { tone?: PillTone; children: React.ReactNode }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-[0.08em]",
      PILL_TONES[tone],
    )}>
      {children}
    </span>
  )
}

// ── Toolbar ──────────────────────────────────────────────────────────────────

/** Search + filters + actions, in one row above a table. Filters go on the
 *  left and actions on the right, so the eye lands on the data between them. */
export function Toolbar({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col lg:flex-row lg:items-center gap-3 mb-5", className)}>{children}</div>
  )
}

export function SearchInput({
  value, onChange, placeholder = "Search…", className,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <div className={cn("relative w-full lg:w-64", className)}>
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A90A6]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
      </svg>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-3 py-2 text-[14px] font-bold bg-white border border-[#DFE2ED] rounded-[10px] text-[#171C35] outline-none placeholder:font-normal placeholder:text-[#8A90A6] focus:border-[#6655DF] transition-colors"
      />
    </div>
  )
}

/** Filter chips with counts — the pattern used across the learner workspace. */
/** The filter glyph: three rules of decreasing width. Used on every filter
 *  trigger so a filter is recognisable before its label is read. */
export const filterGlyph = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2.2" strokeLinecap="round" aria-hidden>
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="6" y1="12" x2="18" y2="12" />
    <line x1="10" y1="18" x2="14" y2="18" />
  </svg>
)

/**
 * A filter as a labelled pill: glyph, the current selection, chevron.
 *
 * The trigger shows what is *selected* rather than the field name plus a
 * badge — "All states" reads as a state at a glance, where "Status · Active"
 * makes you assemble it. Built on the portal DropdownMenu, so it escapes a
 * scrolling ancestor's overflow and gets outside-click and Escape for free
 * instead of each screen hand-rolling its own listener.
 */
export function FilterSelect<T extends string>({
  label, value, options, onChange, menuWidth = "w-52", className,
}: {
  /** Describes the filter for screen readers, e.g. "Filter by status". */
  label: string
  value: T
  options: readonly { value: T; label: string }[]
  onChange: (value: T) => void
  menuWidth?: string
  className?: string
}) {
  const selected = options.find(o => o.value === value)
  // The first option is the "all" case by convention, so a non-default
  // selection can be shown as active without each caller saying which is which.
  const isDefault = options.length > 0 && options[0].value === value

  return (
    <DropdownMenu
      triggerLabel={label}
      align="left"
      menuWidth={menuWidth}
      className={className}
      triggerClassName={cn(
        "flex items-center gap-2 rounded-[10px] border bg-white px-3 py-2 text-[13px] font-bold",
        "cursor-pointer transition-colors whitespace-nowrap",
        isDefault
          ? "border-[#DFE2ED] text-[#171C35] hover:border-[#6655DF]"
          : "border-[#6655DF] text-[#6655DF]",
      )}
      activeTriggerClassName="border-[#6655DF]"
      trigger={
        <>
          <span className={isDefault ? "text-[#8A90A6]" : "text-[#6655DF]"}>{filterGlyph}</span>
          <span>{selected?.label ?? label}</span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="text-[#8A90A6]" aria-hidden>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </>
      }
      items={options.map(option => ({
        label:    option.label,
        onSelect: () => onChange(option.value),
        trailing: option.value === value
          ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6655DF"
                 strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )
          : undefined,
      }))}
    />
  )
}

export function FilterChips<T extends string>({
  options, value, onChange,
}: {
  options: { id: T; label: string; count?: number }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
      {options.map(o => {
        const active = value === o.id
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className={cn(
              "shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[14px] font-bold border transition-colors cursor-pointer",
              active
                ? "bg-[#6655DF] text-white border-[#6655DF]"
                : "bg-white border-[#DFE2ED] text-[#69708A] hover:border-[#6655DF] hover:text-[#6655DF]",
            )}
          >
            {o.label}
            {o.count !== undefined && (
              <span className={cn(
                "text-[11px] font-extrabold px-1.5 py-0.5 rounded-full leading-none",
                active ? "bg-white/20 text-white" : "bg-[#F0EFFA] text-[#69708A]",
              )}>
                {o.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/** Primary / secondary buttons, so every screen's actions match. */
export function AdminButton({
  as = "button", href, variant = "primary", children, ...rest
}: {
  as?: "button" | "link"
  href?: string
  variant?: "primary" | "secondary" | "danger"
  children: React.ReactNode
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const cls = cn(
    "inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[14px] font-bold transition-colors cursor-pointer no-underline disabled:opacity-50 disabled:cursor-not-allowed",
    variant === "primary"   && "bg-[#6655DF] text-white hover:bg-[#2C2368]",
    variant === "secondary" && "bg-white border border-[#DFE2ED] text-[#69708A] hover:border-[#6655DF] hover:text-[#6655DF]",
    variant === "danger"    && "bg-red-600 text-white hover:bg-red-700",
  )
  if (as === "link" && href) return <Link href={href} className={cls}>{children}</Link>
  return <button className={cls} {...rest}>{children}</button>
}

// ── Row actions ──────────────────────────────────────────────────────────────

/** Standard icon set for row menus, so "edit" looks the same on every screen. */
export const RowIcon = {
  analytics: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  view:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
  edit:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  publish:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  archive:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5" rx="1"/><line x1="10" y1="12" x2="14" y2="12"/></svg>,
  trash:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  download:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  copy:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  mail:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2 7 12 13 22 7"/></svg>,
  key:       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.5 12.5 7-7"/><path d="m16 7 2 2"/><path d="m19 4 2 2"/></svg>,
  user:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  ban:       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.9" y1="4.9" x2="19.1" y2="19.1"/></svg>,
}

/** Copies text and reports the outcome. Clipboard access can be refused (a
 *  non-secure origin, or a denied permission), so the failure is surfaced
 *  rather than leaving the menu looking as though it worked. */
export async function copyToClipboard(text: string, onOk: () => void, onFail: () => void) {
  try {
    await navigator.clipboard.writeText(text)
    onOk()
  } catch {
    onFail()
  }
}

/**
 * The "⋯" menu that replaces a row of icon buttons.
 *
 * A row of three or four unlabelled icons costs a hover to decode and eats
 * horizontal space in a table that is already wide. One trigger with named
 * items reads faster and leaves room for data. The panel portals out, so the
 * table's `overflow-x-auto` can't clip it.
 */
export function RowActions({
  label, items,
}: {
  /** Names the row, e.g. `Actions for ${title}` — the menu's accessible name. */
  label: string
  items: DropdownItem[]
}) {
  return (
    <DropdownMenu
      triggerLabel={label}
      align="right"
      menuWidth="w-52"
      triggerClassName="w-8 h-8 flex items-center justify-center rounded-[8px] border border-[#DFE2ED] bg-white text-[#69708A] hover:border-[#6655DF] hover:text-[#6655DF] cursor-pointer transition-colors"
      activeTriggerClassName="border-[#6655DF] text-[#6655DF] bg-[#EEECFF]"
      items={items}
      trigger={
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="1.9" /><circle cx="12" cy="12" r="1.9" /><circle cx="12" cy="19" r="1.9" />
        </svg>
      }
    />
  )
}

// ── Overflowing tab row ──────────────────────────────────────────────────────

/**
 * A horizontal tab strip that can be wider than its container.
 *
 * Deliberately NOT a carousel. A carousel pages through items and hides the
 * rest; for navigation that is worse than scrolling, because reaching the last
 * tab costs several clicks and the strip stops reading as a plain list. What a
 * scrolling strip actually lacks is an affordance — a tab clipped mid-word
 * reads as a rendering bug rather than as "there is more this way". So:
 *
 *  - a fade on whichever edge has more content, so the clip looks intentional;
 *  - nudge buttons that appear only on an edge that can still scroll, because
 *    a plain mouse wheel cannot scroll horizontally at all (trackpads and
 *    touch already can, and for them the buttons simply never show);
 *  - the selected tab is scrolled into view, which matters when something
 *    other than a click selects it.
 */
export function TabScroller({
  activeKey, children, className, ...rest
}: {
  /** Changes to this scroll the selected tab into view. */
  activeKey?: string
  children: React.ReactNode
  className?: string
} & React.HTMLAttributes<HTMLDivElement>) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [edges, setEdges] = React.useState({ left: false, right: false })
  const tabCount = React.Children.count(children)

  const measure = React.useCallback(() => {
    const el = ref.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    // 1px of slack: sub-pixel layout can leave scrollLeft just shy of max.
    setEdges({ left: el.scrollLeft > 1, right: el.scrollLeft < max - 1 })
  }, [])

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    measure()
    // The children are observed as well as the container: a strip with
    // overflow-x-auto does not change size when its content grows, so watching
    // the container alone would never notice a tab being added.
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    for (const child of Array.from(el.children)) ro.observe(child)
    return () => ro.disconnect()
    // Keyed on the child count, not on `children`: that array is rebuilt every
    // render, which would tear the observer down and recreate it each time.
  }, [measure, tabCount])

  React.useEffect(() => {
    const el = ref.current
    if (!el || !activeKey) return
    const active = el.querySelector('[aria-selected="true"]')
    active?.scrollIntoView({ inline: "nearest", block: "nearest", behavior: "smooth" })
  }, [activeKey])

  function nudge(dir: -1 | 1) {
    const el = ref.current
    if (!el) return
    el.scrollBy({ left: dir * Math.max(180, el.clientWidth * 0.6), behavior: "smooth" })
  }

  return (
    <div className={cn("relative", className)}>
      {/* role/aria-label land here, not on the wrapper: the scrolling element
          is the one that actually holds the tabs. */}
      <div
        {...rest}
        ref={ref}
        onScroll={measure}
        className="flex items-center gap-1 overflow-x-auto -mb-px [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>

      {(["left", "right"] as const).map(side => {
        const shown = edges[side]
        return (
          <React.Fragment key={side}>
            <span
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-y-0 w-14 transition-opacity duration-200",
                side === "left"
                  ? "left-0 bg-gradient-to-r from-white to-transparent"
                  : "right-0 bg-gradient-to-l from-white to-transparent",
                shown ? "opacity-100" : "opacity-0",
              )}
            />
            {shown && (
              <button
                type="button"
                onClick={() => nudge(side === "left" ? -1 : 1)}
                aria-label={side === "left" ? "Scroll tabs left" : "Scroll tabs right"}
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 w-6 h-6 grid place-items-center rounded-full",
                  "bg-white text-[#69708A] shadow-[0_1px_6px_rgba(13,16,45,0.18)]",
                  "hover:text-[#171C35] transition-colors cursor-pointer",
                  side === "left" ? "left-0" : "right-0",
                )}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                  {side === "left"
                    ? <polyline points="15 18 9 12 15 6" />
                    : <polyline points="9 18 15 12 9 6" />}
                </svg>
              </button>
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}
