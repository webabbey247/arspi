"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

export type DropdownItem =
  | { type: "separator" }
  | {
      label: string
      /** Second line under the label, for items that need explaining. */
      description?: string
      icon?: React.ReactNode
      danger?: boolean
      /** Right-aligned trailing content, e.g. a count badge. */
      trailing?: React.ReactNode
      onSelect?: () => void
    }

/**
 * Click-to-open menu: closes on outside click, on Escape, and on scroll.
 *
 * The panel renders through a portal with fixed positioning rather than
 * `absolute` inside the trigger, because the sidebar is a flex column with its
 * own overflow — an absolutely positioned menu at the bottom of it would be
 * clipped. Fixed positioning escapes that; dismissing on scroll is the price,
 * since a fixed panel can't follow its anchor.
 */
export function DropdownMenu({
  triggerLabel, trigger, items,
  className, triggerClassName, activeTriggerClassName,
  align = "left", side = "bottom", menuWidth = "w-56",
  header, onBeforeOpen,
}: {
  triggerLabel: string
  trigger: React.ReactNode
  items: DropdownItem[]
  className?: string
  triggerClassName?: string
  activeTriggerClassName?: string
  align?: "left" | "right"
  side?: "top" | "bottom"
  menuWidth?: string
  /** Optional title row above the items. */
  header?: React.ReactNode
  /** Runs before opening; return false to suppress the menu — used where a
   *  native affordance (the Web Share sheet) should win when it exists. */
  onBeforeOpen?: () => boolean | Promise<boolean>
}) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState<{ top: number; left?: number; right?: number; width: number } | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef    = useRef<HTMLDivElement>(null)

  /** Measured on open rather than in an effect — the trigger is already laid
   *  out by the time the click lands. */
  async function toggle() {
    if (open) { setOpen(false); return }
    if (onBeforeOpen && (await onBeforeOpen()) === false) return
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return
    // Estimate the panel height so a "top" menu can sit above the trigger.
    // Two-line items are taller, so measure them as such or the flip lands short.
    const rows = items.reduce(
      (n, i) => n + ("type" in i ? 9 : i.description ? 58 : 40),
      (header ? 32 : 0) + 12,
    )
    const openUp = side === "top" || rect.bottom + rows > window.innerHeight - 8
    // Anchor with `right` rather than a translateX, so a right-aligned panel
    // can't be pushed off the left edge when the trigger sits in a narrow
    // left-hand column — the browser keeps an inset-anchored box on screen.
    setCoords({
      top:   openUp ? Math.max(8, rect.top - rows - 6) : rect.bottom + 6,
      ...(align === "right"
        ? { right: Math.max(8, window.innerWidth - rect.right) }
        : { left:  Math.min(rect.left, window.innerWidth - 8) }),
      width: rect.width,
    })
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      const t = e.target as Node
      if (triggerRef.current?.contains(t) || menuRef.current?.contains(t)) return
      setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { setOpen(false); triggerRef.current?.focus() }
    }
    function dismiss() { setOpen(false) }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    window.addEventListener("resize", dismiss)
    window.addEventListener("scroll", dismiss, true)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
      window.removeEventListener("resize", dismiss)
      window.removeEventListener("scroll", dismiss, true)
    }
  }, [open])

  return (
    <div className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        aria-label={triggerLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(triggerClassName, open && activeTriggerClassName)}
      >
        {trigger}
      </button>

      {open && coords && createPortal(
        <div
          ref={menuRef}
          role="menu"
          aria-label={triggerLabel}
          style={{
            top: coords.top,
            ...(coords.right !== undefined ? { right: coords.right } : { left: coords.left }),
            minWidth: coords.width,
            maxWidth: "calc(100vw - 16px)",
          }}
          className={cn(
            "fixed z-100 rounded-[12px] border border-[#DFE2ED] bg-white py-1.5",
            "shadow-[0_14px_38px_rgba(23,28,53,0.18)]",
            menuWidth,
          )}
        >
          {header && (
            <div className="px-3.5 pt-1 pb-2 text-[11px] tracking-[0.12em] uppercase font-extrabold text-[#8A90A6]">
              {header}
            </div>
          )}
          {items.map((item, i) =>
            "type" in item ? (
              <div key={`sep-${i}`} className="my-1 h-px bg-[#F0EFFA]" />
            ) : (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                onClick={() => { setOpen(false); item.onSelect?.() }}
                className={cn(
                  "w-full flex gap-2.5 px-3.5 text-left transition-colors cursor-pointer",
                  item.description ? "items-start py-2.5" : "items-center py-2",
                  item.danger ? "hover:bg-red-50" : "hover:bg-[#F5F6FB]",
                )}
              >
                {item.icon && (
                  <span className={cn(
                    "shrink-0",
                    item.description && "mt-0.5",
                    item.danger ? "text-red-400" : "text-[#8A90A6]",
                  )}>
                    {item.icon}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className={cn(
                    "block text-[14px] font-bold",
                    item.danger ? "text-red-600" : "text-[#171C35]",
                  )}>
                    {item.label}
                  </span>
                  {item.description && (
                    <span className="block text-[12px] text-[#8A90A6] mt-0.5">{item.description}</span>
                  )}
                </span>
                {item.trailing}
              </button>
            ),
          )}
        </div>,
        document.body,
      )}
    </div>
  )
}

export default DropdownMenu
