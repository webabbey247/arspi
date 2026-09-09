import "server-only"
import { getAuthEnv } from "@/lib/env"

/**
 * Login-specific throttle: locks an email+IP pair out after N failed
 * attempts within a 15-minute window, for LOGIN_LOCKOUT_SECONDS. This is
 * stricter than the generic `lib/rate-limit.ts` window limiter (which only
 * caps total requests, success or fail) — a lockout only engages on genuine
 * credential failures, so a burst of *correct* logins from one IP never trips
 * it.
 *
 * ⚠ In-memory Map — only holds a limit on a single long-lived instance. On
 * serverless/multi-instance hosting it resets per-instance, so treat this as
 * defence in depth, not a hard security boundary.
 */

type Attempt = { count: number; firstAt: number; lockedUntil: number | null }

const attempts = new Map<string, Attempt>()
const WINDOW_MS = 15 * 60 * 1000

export type RateLimitKeys = readonly string[]

export function loginRateLimitKeys(email: string, req: Request): RateLimitKeys {
  const ip = clientIp(req)
  const keys = [`login:email:${email.trim().toLowerCase()}`]
  // A missing or spoofed header is untrusted, so the email key still holds the line on its own.
  if (ip) keys.push(`login:ip:${ip}`)
  return keys
}

function clientIp(req: Request): string | null {
  const forwarded = req.headers.get("x-forwarded-for")
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim()
    if (first) return first
  }
  return req.headers.get("x-real-ip")
}

export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterSeconds: number }

export function checkLoginRateLimit(keys: RateLimitKeys, now = Date.now()): RateLimitResult {
  let longestLock = 0

  for (const key of keys) {
    const entry = attempts.get(key)
    if (!entry) continue

    if (entry.lockedUntil && entry.lockedUntil > now) {
      longestLock = Math.max(longestLock, entry.lockedUntil - now)
      continue
    }

    // The lock or the window has elapsed; the slate is clean.
    if (entry.lockedUntil && entry.lockedUntil <= now) attempts.delete(key)
    else if (now - entry.firstAt > WINDOW_MS) attempts.delete(key)
  }

  if (longestLock > 0) {
    return { allowed: false, retryAfterSeconds: Math.ceil(longestLock / 1000) }
  }
  return { allowed: true }
}

/** Only genuine credential rejections should reach here — validation 400s,
 *  unverified-email 403s, and 5xx/timeouts must never count, or a transient
 *  bug locks users out of a working account. */
export function recordLoginFailure(keys: RateLimitKeys, now = Date.now()): void {
  const { loginMaxAttempts, loginLockoutSeconds } = getAuthEnv()

  for (const key of keys) {
    const entry = attempts.get(key)

    if (!entry || now - entry.firstAt > WINDOW_MS) {
      attempts.set(key, { count: 1, firstAt: now, lockedUntil: null })
      continue
    }

    entry.count += 1
    if (entry.count >= loginMaxAttempts) {
      entry.lockedUntil = now + loginLockoutSeconds * 1000
    }
  }
}

export function clearLoginAttempts(keys: RateLimitKeys): void {
  for (const key of keys) attempts.delete(key)
}
