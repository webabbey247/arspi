"use client"

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

/**
 * Date field with a calendar popover.
 *
 * Built to sit beside SearchableSelect: the panel goes through a portal so a
 * scrolling ancestor can't clip it, flips above the trigger when there's no
 * room below, and closes on outside click, Escape or scroll.
 *
 * The value is an ISO `yyyy-mm-dd` string, not a Date, because that is what
 * the forms and the API already carry and converting at the edges avoids a
 * timezone round-trip. Dates are built and read in local time for the same
 * reason: `new Date("1990-05-20")` parses as UTC midnight, which in any
 * negative-offset timezone is the 19th.
 */

const MARGIN = 8
const GAP = 4
const PANEL_HEIGHT = 360
const PANEL_WIDTH = 300

/** `yyyy-mm-dd` → Date in local time, or null. */
export function parseISODate(value: string | null | undefined): Date | null {
  if (!value) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (!m) return null
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return Number.isNaN(d.getTime()) ? null : d
}

/** Date → `yyyy-mm-dd`, read in local time. */
export function toISODate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function DatePicker({
  value,
  onChange,
  label,
  placeholder = "Select a date",
  disabled,
  invalid,
  className,
  triggerClassName,
  fromYear,
  toYear,
  min,
  max,
}: {
  /** ISO `yyyy-mm-dd`, or "" for empty. */
  value: string
  onChange: (value: string) => void
  /** Announced to screen readers; the visible label sits outside. */
  label: string
  placeholder?: string
  disabled?: boolean
  invalid?: boolean
  className?: string
  triggerClassName?: string
  fromYear?: number
  toYear?: number
  /** ISO bounds; days outside are not selectable. */
  min?: string
  max?: string
}) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [box, setBox] = useState<{ top: number; left: number; width: number } | null>(null)

  const wrapper = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)

  const selected = parseISODate(value)
  const minDate = parseISODate(min)
  const maxDate = parseISODate(max)

  const place = useCallback(() => {
    const anchor = trigger.current?.getBoundingClientRect()
    if (!anchor) return
    const view = window.visualViewport
    const viewTop = view?.offsetTop ?? 0
    const viewBottom = view ? view.offsetTop + view.height : window.innerHeight

    const below = anchor.bottom + GAP
    const roomBelow = viewBottom - below - MARGIN
    const roomAbove = anchor.top - GAP - (viewTop + MARGIN)
    const downward = PANEL_HEIGHT <= roomBelow || roomBelow >= roomAbove

    const width = Math.min(Math.max(anchor.width, PANEL_WIDTH), window.innerWidth - MARGIN * 2)
    const top = downward ? below : Math.max(viewTop + MARGIN, anchor.top - GAP - PANEL_HEIGHT)
    const left = Math.min(Math.max(MARGIN, anchor.left), window.innerWidth - width - MARGIN)
    setBox({ top, left, width })
  }, [])

  // A portal panel can only be positioned once it has been laid out: its
  // height decides whether it opens downward or flips up, and that is
  // unknowable before the first paint. Measuring in the click handler (as
  // DropdownMenu does) works only for panels positioned purely from the
  // trigger; this one is not. The write is guarded by `open`, so it cannot
  // cascade.
  /* eslint-disable react-hooks/set-state-in-effect */
  useLayoutEffect(() => {
    if (open) place()
  }, [open, place])
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!open) return

    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node
      if (wrapper.current?.contains(target) || panel.current?.contains(target)) return
      setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { setOpen(false); trigger.current?.focus() }
    }
    // A fixed panel cannot follow its anchor, so closing is the honest response
    // to a scroll rather than letting it drift away from the field.
    function onScrollOrResize() { setOpen(false) }

    document.addEventListener("mousedown", onPointerDown)
    document.addEventListener("keydown", onKey)
    window.addEventListener("scroll", onScrollOrResize, true)
    window.addEventListener("resize", onScrollOrResize)
    return () => {
      document.removeEventListener("mousedown", onPointerDown)
      document.removeEventListener("keydown", onKey)
      window.removeEventListener("scroll", onScrollOrResize, true)
      window.removeEventListener("resize", onScrollOrResize)
    }
  }, [open])

  const shown = selected
    ? selected.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : null

  return (
    <div ref={wrapper} className={cn("relative", className)}>
      <button
        ref={trigger}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen(o => !o)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-[10px] border bg-[#FAFAFF] px-3.5 py-2.5 text-left text-[14px] outline-none transition-colors",
          "focus:border-[#6655DF] focus:ring-2 focus:ring-[#6655DF]/20",
          "disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
          invalid ? "border-red-300" : "border-[#DFE2ED]",
          triggerClassName,
        )}
      >
        <span className={cn("truncate", shown ? "text-[#171C35]" : "text-[#8A90A6]")}>
          {shown ?? placeholder}
        </span>
        <span className="flex shrink-0 items-center gap-1">
          {shown && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              aria-label={`Clear ${label.toLowerCase()}`}
              onClick={e => { e.stopPropagation(); onChange("") }}
              className="grid h-5 w-5 place-items-center rounded-full text-[#8A90A6] hover:bg-[#F0EFFA] hover:text-[#171C35] transition-colors"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden>
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </span>
          )}
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#8A90A6]" aria-hidden>
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </span>
      </button>

      {open && box && createPortal(
        <div
          ref={panel}
          role="dialog"
          aria-label={label}
          style={{ position: "fixed", top: box.top, left: box.left, width: box.width }}
          className="z-[70] rounded-[14px] border border-[#DFE2ED] bg-white shadow-[0_18px_44px_rgba(5,8,26,0.18)]"
        >
          <Calendar
            mode="single"
            selected={selected ?? undefined}
            defaultMonth={selected ?? (maxDate && maxDate < new Date() ? maxDate : undefined)}
            captionLayout={fromYear || toYear ? "dropdown" : "label"}
            startMonth={fromYear ? new Date(fromYear, 0) : undefined}
            endMonth={toYear ? new Date(toYear, 11) : undefined}
            disabled={[
              ...(minDate ? [{ before: minDate }] : []),
              ...(maxDate ? [{ after: maxDate }] : []),
            ]}
            onSelect={day => {
              if (!day) return
              onChange(toISODate(day))
              setOpen(false)
              trigger.current?.focus()
            }}
          />
        </div>,
        document.body,
      )}
    </div>
  )
}

export default DatePicker
