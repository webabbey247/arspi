"use client"

import { useSyncExternalStore } from "react"
import { fetchNotifications, markNotificationsRead, type NotificationItem } from "@/components/notifications/meta"

// ── Shared store ─────────────────────────────────────────────────────────────
// The bell (mounted twice: desktop sidebar + mobile top bar) and the dashboard
// banner all read this one module-level store, so there is one request and one
// timer however many are on screen. Polling pauses while the tab is hidden.

type Snapshot = { items: NotificationItem[]; unread: number }
let snapshot: Snapshot = { items: [], unread: 0 }
const listeners = new Set<() => void>()
let timer: ReturnType<typeof setInterval> | null = null
let inflight: Promise<void> | null = null

function emit(next: Snapshot) {
  snapshot = next
  listeners.forEach(l => l())
}

/** Fetches once even if several readers ask at the same moment. */
export function refreshNotifications() {
  if (inflight) return inflight
  inflight = fetchNotifications(30)
    .then(d => { if (d) emit({ items: d.items, unread: d.unread }) })
    .finally(() => { inflight = null })
  return inflight
}

const onVisible = () => { if (document.visibilityState === "visible") refreshNotifications() }

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (listeners.size === 1) {
    refreshNotifications()
    // Poll only while someone can see the page.
    timer = setInterval(() => { if (document.visibilityState === "visible") refreshNotifications() }, 60_000)
    document.addEventListener("visibilitychange", onVisible)
    window.addEventListener("notifications:changed", refreshNotifications)
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) {
      if (timer) clearInterval(timer)
      timer = null
      document.removeEventListener("visibilitychange", onVisible)
      window.removeEventListener("notifications:changed", refreshNotifications)
    }
  }
}

const EMPTY: Snapshot = { items: [], unread: 0 }

/** Optimistic: every reader updates at once; the server write follows. */
export function markRead(ids?: string[]) {
  const { items, unread } = snapshot
  const cleared = items.filter(n => !n.read && (!ids || ids.includes(n.id))).length
  emit({
    items: items.map(n => (!ids || ids.includes(n.id) ? { ...n, read: true } : n)),
    unread: Math.max(0, unread - cleared),
  })
  markNotificationsRead(ids)
}

export function useNotifications() {
  return useSyncExternalStore(subscribe, () => snapshot, () => EMPTY)
}
