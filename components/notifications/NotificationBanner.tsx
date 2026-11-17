"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { X, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { TypePill, TypeTile, timeAgo } from "@/components/notifications/meta"
import { markRead, useNotifications } from "@/components/notifications/store"

const DISMISS_KEY = "arspi:notification-banner:dismissed"

function readDismissed(): string | null {
  try { return localStorage.getItem(DISMISS_KEY) } catch { return null }
}
function writeDismissed(id: string) {
  try { localStorage.setItem(DISMISS_KEY, id) } catch { /* private mode: dismiss for this visit only */ }
}

/**
 * Dashboard banner for unread notifications (every role). Shows the newest
 * unread alert with its type, plus how many others are waiting. It reads the
 * same store as the bell, so marking read in either place updates both.
 *
 * Dismissing hides it until a newer alert arrives; it doesn't mark anything
 * read. Renders nothing when there's nothing unread.
 */
export default function NotificationBanner({ className }: { className?: string }) {
  const router = useRouter()
  const { items, unread } = useNotifications()
  // Safe to read storage up front: during hydration the store serves its
  // empty server snapshot, so the banner renders nothing on either side.
  const [dismissed, setDismissed] = useState<string | null>(() =>
    typeof window === "undefined" ? null : readDismissed())

  const latest = items.find(n => !n.read)
  if (!latest || unread === 0 || dismissed === latest.id) return null

  const others = unread - 1

  function open() {
    markRead([latest!.id])
    router.push(latest!.link ?? "/notifications")
  }

  function dismiss() {
    writeDismissed(latest!.id)
    setDismissed(latest!.id)
  }

  return (
    <section
      aria-label="Unread notifications"
      className={cn(
        "relative overflow-hidden rounded-[18px] border border-[#DCD8FB] bg-[linear-gradient(100deg,#F7F6FF_0%,#FFFFFF_70%)]",
        "pl-5 pr-12 py-4 sm:pr-14",
        className,
      )}
    >
      <span className="absolute left-0 top-0 bottom-0 w-1 bg-[#6655DF]" aria-hidden />

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <TypeTile type={latest.type} size="lg" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <TypePill type={latest.type} />
              <span className="text-[12px] font-bold text-[#8A90A6]">{timeAgo(latest.createdAt)}</span>
              {others > 0 && (
                <span className="text-[12px] font-bold text-[#6655DF]">
                  +{others} more unread
                </span>
              )}
            </div>
            <p className="mt-1 text-[14px] font-bold text-[#171C35] truncate">{latest.title}</p>
            {latest.body && (
              <p className="text-[13px] text-[#69708A] line-clamp-1">{latest.body}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 pl-14 sm:pl-0">
          <button
            type="button"
            onClick={open}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-[10px] bg-[#6655DF] text-white text-[13px] font-bold hover:bg-[#5546C9] cursor-pointer"
          >
            Open <ArrowRight className="w-3.5 h-3.5" />
          </button>
          {others > 0 ? (
            <Link
              href="/notifications"
              className="inline-flex items-center h-9 px-3.5 rounded-[10px] border border-[#DFE2ED] bg-white text-[13px] font-bold text-[#171C35] hover:border-[#6655DF] hover:text-[#6655DF] no-underline"
            >
              View all ({unread})
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => markRead()}
            className="h-9 px-2 text-[13px] font-bold text-[#69708A] hover:text-[#171C35] cursor-pointer"
          >
            {unread > 1 ? "Mark all read" : "Mark read"}
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={dismiss}
        aria-label="Hide until something new arrives"
        title="Hide until something new arrives"
        className="absolute top-3 right-3 grid place-items-center w-8 h-8 rounded-full text-[#8A90A6] hover:bg-[#EEECFF] hover:text-[#171C35] cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </section>
  )
}
