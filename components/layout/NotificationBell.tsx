"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog as DialogPrimitive } from "radix-ui"
import { Bell, X, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  TypeTile, fetchNotifications, markNotificationsRead, relatedTo, timeAgo,
  type NotificationItem,
} from "@/components/notifications/meta"

/**
 * The workspace bell. Opens a right-hand drawer with the latest alerts —
 * "a programme is ready for approval" (admins), "a programme was assigned to
 * you" (instructors) — and a link to the full Notifications page.
 *
 * Refreshes every minute, when the tab regains focus, and whenever anything
 * marks notifications read. The drawer is a Radix dialog: focus is trapped,
 * Esc closes it, and screen readers announce it.
 */
export default function NotificationBell({ className }: { className?: string }) {
  const router = useRouter()
  const [items, setItems]   = useState<NotificationItem[]>([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen]     = useState(false)
  const [tab, setTab]       = useState<"all" | "unread">("all")

  const load = useCallback(() => fetchNotifications(30).then(d => {
    if (!d) return
    setItems(d.items)
    setUnread(d.unread)
  }), [])

  useEffect(() => {
    load()
    const t = setInterval(load, 60_000)
    window.addEventListener("focus", load)
    window.addEventListener("notifications:changed", load)
    return () => {
      clearInterval(t)
      window.removeEventListener("focus", load)
      window.removeEventListener("notifications:changed", load)
    }
  }, [load])

  function markRead(ids?: string[]) {
    setItems(cur => cur.map(n => (!ids || ids.includes(n.id) ? { ...n, read: true } : n)))
    setUnread(u => (ids ? Math.max(0, u - ids.filter(id => items.some(n => n.id === id && !n.read)).length) : 0))
    markNotificationsRead(ids)
  }

  function openItem(n: NotificationItem) {
    if (!n.read) markRead([n.id])
    setOpen(false)
    if (n.link) router.push(n.link)
  }

  const shown = tab === "unread" ? items.filter(n => !n.read) : items

  return (
    <DialogPrimitive.Root open={open} onOpenChange={o => { setOpen(o); if (o) load() }}>
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
          className={cn(
            "relative w-9 h-9 inline-flex items-center justify-center rounded-[10px] text-[#69708A] hover:bg-[#EEECFF] hover:text-[#6655DF] cursor-pointer shrink-0",
            className,
          )}
        >
          <Bell className="w-4.5 h-4.5" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-4.5 h-4.5 px-1 rounded-full bg-[#E5484D] text-white text-[10px] font-extrabold leading-4.5 text-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-200 bg-[#171C35]/40" />
        <DialogPrimitive.Content className="fixed inset-y-0 right-0 z-200 w-full max-w-[440px] bg-white shadow-2xl flex flex-col outline-none">
          {/* Header */}
          <div className="relative shrink-0 px-5 pt-5 pb-4 border-b border-[#F0EFFA] overflow-hidden">
            <span aria-hidden className="pointer-events-none absolute -top-16 -right-16 w-44 h-44 rounded-full border border-[#EEECFF]" />
            <span aria-hidden className="pointer-events-none absolute -top-8 -right-8 w-28 h-28 rounded-full border border-[#EEECFF]" />
            <div className="relative flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] tracking-[0.12em] uppercase font-extrabold text-[#6655DF]">Inbox</p>
                <DialogPrimitive.Title className="text-[22px] font-extrabold tracking-[-0.02em] text-[#171C35] mt-0.5">Notifications</DialogPrimitive.Title>
                <DialogPrimitive.Description className="text-[13px] text-[#69708A] mt-0.5">
                  {unread > 0 ? `${unread} unread` : "You're all caught up."}
                </DialogPrimitive.Description>
              </div>
              <DialogPrimitive.Close aria-label="Close" className="w-8 h-8 rounded-full grid place-items-center text-[#69708A] hover:bg-[#F5F6FB] cursor-pointer">
                <X className="w-4 h-4" />
              </DialogPrimitive.Close>
            </div>
            <div className="relative mt-4 flex items-center justify-between gap-3">
              <div role="tablist" aria-label="Filter" className="flex gap-0.5 p-0.5 rounded-[10px] bg-[#F5F6FB]">
                {(["all", "unread"] as const).map(t => (
                  <button
                    key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
                    className={cn(
                      "px-3 py-1.5 rounded-[8px] text-[13px] font-bold cursor-pointer",
                      tab === t ? "bg-white text-[#171C35] shadow-sm" : "text-[#69708A] hover:text-[#171C35]",
                    )}
                  >
                    {t === "all" ? "All" : `Unread${unread ? ` (${unread})` : ""}`}
                  </button>
                ))}
              </div>
              {unread > 0 && (
                <button type="button" onClick={() => markRead()} className="text-[13px] font-bold text-[#171C35] hover:text-[#6655DF] cursor-pointer">
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {shown.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <Bell className="w-8 h-8 text-[#C9CCDD] mx-auto mb-2.5" />
                <p className="text-[14px] font-bold text-[#171C35]">{tab === "unread" ? "No unread notifications." : "No notifications yet."}</p>
              </div>
            ) : (
              <ul className="divide-y divide-[#F0EFFA]">
                {shown.map(n => {
                  const rel = relatedTo(n)
                  return (
                    <li key={n.id}>
                      <button
                        type="button" onClick={() => openItem(n)}
                        className={cn("w-full text-left px-5 py-4 flex gap-3 hover:bg-[#FAFAFF] cursor-pointer", !n.read && "bg-[#F7F6FF]")}
                      >
                        <TypeTile type={n.type} />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start justify-between gap-3">
                            <span className="text-[14px] font-bold text-[#171C35] leading-snug">{n.title}</span>
                            <span className="flex items-center gap-2 shrink-0 mt-0.5">
                              <span className="text-[11.5px] text-[#8A90A6] whitespace-nowrap">{timeAgo(n.createdAt)}</span>
                              <span className={cn("w-2 h-2 rounded-full", n.read ? "bg-transparent" : "bg-[#6655DF]")} aria-hidden />
                            </span>
                          </span>
                          {rel && <span className="block text-[12px] text-[#8A90A6] mt-0.5 truncate">{rel.label}</span>}
                          {n.body && <span className="block text-[13px] text-[#69708A] mt-1 leading-snug line-clamp-3">{n.body}</span>}
                          {!n.read && <span className="sr-only">Unread.</span>}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="shrink-0 p-4 border-t border-[#F0EFFA]">
            <button
              type="button"
              onClick={() => { setOpen(false); router.push("/notifications") }}
              className="w-full inline-flex items-center justify-center gap-1.5 py-3 rounded-[12px] bg-[#171C35] text-white text-[14px] font-bold hover:bg-[#2C2368] cursor-pointer"
            >
              View all notifications <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
