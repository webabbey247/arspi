"use client"
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { createPortal } from "react-dom"
/** Room left between the panel and the window edge when it flips up. */
const MARGIN = 8
const GAP = 4
/** The panel's height when full — the list's max height plus the search row. */
const PANEL_HEIGHT = 300
/** The list's `max-h-62` (15.5rem) in pixels. */
const LIST_MAX_HEIGHT = 248
/** Never squeeze the panel below this, even in a very short window. */
const MIN_PANEL_HEIGHT = 120
export type SelectOption = {
  value: string
  label: string
  /** Shown before the label — a flag, in practice. */
  leading?: string
  /** Shown right-aligned and dimmed — a dialling code, in practice. */
  trailing?: string
  /** Extra text matched by the search box but not displayed. */
  keywords?: string
}
/** Default trigger: matches the onboarding text inputs (`inputClass`). */
const DEFAULT_TRIGGER =
  "mt-1.5 flex h-11 w-full items-center gap-2 rounded-[10px] border bg-white px-3.5 text-left text-[14px] outline-none transition focus:border-[#6655DF] focus:ring-2 focus:ring-[#6655DF]/20"
function SearchGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function ChevronGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CheckGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/**
 * A select with a search box.
 *
 * Ported from the resolve-rite console, with its design tokens translated to
 * this project's palette. Behaviour is unchanged.
 *
 * The value is owned by the form; this component only reports changes. The
 * panel renders into `document.body`, so a scrolling ancestor can't clip it,
 * and it flips above the trigger when there's no room below. Keyboard:
 * type to filter, ↑/↓ to move, Enter to pick, Esc to close.
 */
export function SearchableSelect({
  options,
  value,
  onChange,
  label,
  placeholder,
  emptyMessage,
  searchPlaceholder = "Search",
  invalid,
  disabled,
  loading,
  triggerClassName,
  renderValue,
  className,
}: {
  options: readonly SelectOption[]
  value: string
  onChange: (value: string) => void
  /** Announced to screen readers — the visible label sits outside. */
  label: string
  placeholder?: string
  /** Shown when there are no options at all, as opposed to no matches. */
  emptyMessage?: string
  searchPlaceholder?: string
  invalid?: boolean
  disabled?: boolean
  loading?: boolean
  /** Replaces the default input-like trigger styling (e.g. an inline prefix). */
  triggerClassName?: string
  /** Custom rendering of the selected value inside the trigger. */
  renderValue?: (selected: SelectOption) => React.ReactNode
  /** Classes for the wrapper (e.g. `h-full` when embedded in an input group). */
  className?: string
}) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [active, setActive] = useState(0)
  const [box, setBox] = useState<{ top: number; left: number; width: number; maxHeight: number } | null>(null)
  const wrapper = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const searchBox = useRef<HTMLInputElement>(null)
  const listBox = useRef<HTMLUListElement>(null)
  /** False until the opening frame is over — see the scroll handler. */
  const settled = useRef(false)
  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return options
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(needle) ||
        (option.trailing ?? "").toLowerCase().includes(needle) ||
        (option.keywords ?? "").toLowerCase().includes(needle),
    )
  }, [options, query])
  const selected = options.find((option) => option.value === value)
  const place = useCallback(() => {
    const anchor = trigger.current?.getBoundingClientRect()
    if (!anchor) return
    // Natural height — search row plus the list up to its own max-height —
    // regardless of any cap a previous pass put on the panel.
    const height =
      panel.current && listBox.current
        ? panel.current.offsetHeight -
          listBox.current.clientHeight +
          Math.min(listBox.current.scrollHeight, LIST_MAX_HEIGHT)
        : PANEL_HEIGHT
    // The visible part of the window: on phones it shrinks while the on-screen keyboard is up.
    const view = window.visualViewport
    const viewTop = view?.offsetTop ?? 0
    const viewBottom = view ? view.offsetTop + view.height : window.innerHeight
    const below = anchor.bottom + GAP
    const roomBelow = viewBottom - below - MARGIN
    const roomAbove = anchor.top - GAP - (viewTop + MARGIN)
    // Below when it fits (or when below is the roomier side); otherwise above.
    // Either way the panel is capped to the room it has, so it never leaves the window.
    const downward = height <= roomBelow || roomBelow >= roomAbove
    const maxHeight = Math.max(MIN_PANEL_HEIGHT, downward ? roomBelow : roomAbove)
    const top = downward
      ? below
      : Math.max(viewTop + MARGIN, anchor.top - GAP - Math.min(height, maxHeight))
    // At least as wide as a usable list, never wider than the window.
    const width = Math.min(Math.max(anchor.width, 240), window.innerWidth - MARGIN * 2)
    setBox({
      top,
      left: Math.max(MARGIN, Math.min(anchor.left, window.innerWidth - width - MARGIN)),
      width,
      maxHeight,
    })
  }, [])
  // Measure before paint, and again next frame (opening can scroll the trigger into view).
  // A portal panel can only be positioned once it has been laid out: its
  // height decides whether it opens downward or flips up, and that is
  // unknowable before the first paint. Measuring in the click handler (as
  // DropdownMenu does) works only for panels positioned purely from the
  // trigger; this one is not. The write is guarded by `open`, so it cannot
  // cascade.
  /* eslint-disable react-hooks/set-state-in-effect */
  useLayoutEffect(() => {
    if (!open) return
    place()
    const frame = requestAnimationFrame(() => {
      place()
      settled.current = true
    })
    return () => {
      cancelAnimationFrame(frame)
      settled.current = false
    }
  }, [open, place])
  // Filtering changes the panel's height: re-anchor it (matters when it opened upward).
  // Same reason as above: the new height exists only once the filtered list
  // has rendered.
  useLayoutEffect(() => {
    if (open) place()
  }, [open, place, matches.length])
  /* eslint-enable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open) return
    const onDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (wrapper.current?.contains(target) || panel.current?.contains(target)) return
      setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      event.stopPropagation()
      setOpen(false)
      trigger.current?.focus()
    }
    // Touch devices scroll and resize the page on their own when the search box
    // takes focus (the on-screen keyboard), so there the panel follows its trigger
    // instead of closing.
    const touch = window.matchMedia("(pointer: coarse)").matches
    // Close when the page moves under it — except scrolling inside the list itself.
    const onScrollOrResize = (event: Event) => {
      if (!settled.current) return
      if (event.type === "scroll" && panel.current?.contains(event.target as Node)) return
      if (touch) {
        place()
        return
      }
      setOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey, true)
    window.addEventListener("scroll", onScrollOrResize, true)
    window.addEventListener("resize", onScrollOrResize)
    if (touch) window.visualViewport?.addEventListener("resize", onScrollOrResize)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey, true)
      window.removeEventListener("scroll", onScrollOrResize, true)
      window.removeEventListener("resize", onScrollOrResize)
      if (touch) window.visualViewport?.removeEventListener("resize", onScrollOrResize)
    }
  }, [open, place])
  // Opening puts the caret in the search box.
  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => searchBox.current?.focus(), 0)
    return () => clearTimeout(timer)
  }, [open])
  // Keep the highlighted row in view while arrowing.
  useEffect(() => {
    if (!open) return
    listBox.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" })
  }, [active, open])
  function choose(option: SelectOption) {
    onChange(option.value)
    setOpen(false)
    setQuery("")
    trigger.current?.focus()
  }

  function onSearchKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      setActive((i) => Math.min(i + 1, matches.length - 1))
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (event.key === "Enter") {
      event.preventDefault()
      const pick = matches[active]
      if (pick) choose(pick)
    }
  }

  const triggerClass =
    triggerClassName ??
    `${DEFAULT_TRIGGER} ${invalid ? "border-red-400" : "border-[#DFE2ED]"} ${
      disabled ? "cursor-not-allowed bg-[#FAFAFF] opacity-70" : "cursor-pointer"
    }`
  return (
    <div ref={wrapper} className={`relative ${className ?? ""}`}>
      <button
        ref={trigger}
        type="button"
        disabled={disabled}
        onClick={() => {
          setOpen((was) => !was)
          setQuery("")
          setActive(Math.max(0, options.findIndex((o) => o.value === value)))
        }}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-label={label}
        aria-invalid={invalid || undefined}
        className={triggerClass}
      >
        {selected ? (
          renderValue ? (
            renderValue(selected)
          ) : (
            <>
              {selected.leading ? <span aria-hidden>{selected.leading}</span> : null}
              <span className="min-w-0 flex-1 truncate text-[#171C35]">{selected.label}</span>
            </>
          )
        ) : value ? (
          // A stored value with no matching option (e.g. saved before the list loaded) still shows.
          <span className="min-w-0 flex-1 truncate text-[#171C35]">{value}</span>
        ) : (
          <span className="min-w-0 flex-1 truncate text-[#8A90A6]">
            {loading ? "Loading…" : (placeholder ?? "Select")}
          </span>
        )}
        <ChevronGlyph className="shrink-0 text-[#8A90A6]" />
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={panel}
              style={
                box
                  ? { top: box.top, left: box.left, width: box.width, maxHeight: box.maxHeight }
                  : { top: -9999, left: -9999 }
              }
              className="fixed z-[70] flex flex-col overflow-hidden rounded-xl border border-[#DFE2ED] bg-white shadow-lg"
            >
              <div className="flex shrink-0 items-center gap-2 border-b border-[#DFE2ED] px-3 py-2.5">
                <SearchGlyph className="shrink-0 text-[#8A90A6]" />
                <input
                  ref={searchBox}
                  autoFocus
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value)
                    setActive(0)
                  }}
                  onKeyDown={onSearchKeyDown}
                  placeholder={searchPlaceholder}
                  aria-label={searchPlaceholder}
                  aria-controls={`${id}-list`}
                  className="w-full border-0 bg-transparent text-option text-[#171C35] outline-none placeholder:text-[#8A90A6] max-md:text-[16px]"
                />
              </div>

              <ul ref={listBox} id={`${id}-list`} role="listbox" aria-label={label} className="max-h-62 min-h-0 overflow-y-auto overscroll-contain py-1">
                {matches.map((option, index) => {
                  const isSelected = option.value === value
                  return (
                    <li key={option.value} data-index={index}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onMouseEnter={() => setActive(index)}
                        onClick={() => choose(option)}
                        className={`flex min-h-10 w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left text-option md:min-h-0 ${
                          index === active ? "bg-[#F5F6FB]" : "bg-white"
                        }`}
                      >
                        {option.leading ? (
                          <span aria-hidden className="text-[16px] leading-none">
                            {option.leading}
                          </span>
                        ) : null}
                        <span className="min-w-0 flex-1 truncate text-[#171C35]">{option.label}</span>
                        {option.trailing ? (
                          <span className="shrink-0 text-body text-[#8A90A6]">{option.trailing}</span>
                        ) : null}
                        {isSelected ? <CheckGlyph className="shrink-0 text-[#6655DF]" /> : null}
                      </button>
                    </li>
                  )
                })}

                {matches.length === 0 ? (
                  <li className="px-3 py-6 text-center text-body text-[#8A90A6]">
                    {loading
                      ? "Loading…"
                      : options.length === 0
                        ? (emptyMessage ?? "Nothing to choose from.")
                        : `Nothing matches “${query}”.`}
                  </li>
                ) : null}
              </ul>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
