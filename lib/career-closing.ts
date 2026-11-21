const DAY_MS = 86_400_000

/**
 * A posting's closing date is the last day it takes applications. It's stored
 * as midnight UTC of that day, so it closes at the end of that day (UTC).
 * Shared by the public list, the posting page and the apply endpoint so they
 * always agree.
 */
export function isCareerClosed(closingDate: Date | string | null | undefined, now = Date.now()): boolean {
  if (!closingDate) return false
  const t = new Date(closingDate).getTime()
  return Number.isFinite(t) && now >= t + DAY_MS
}
