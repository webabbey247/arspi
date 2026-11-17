import "server-only"
import { getAuthEnv } from "@/lib/env"
import { getClientIp } from "@/lib/rate-limit"

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

/**
 * Three counters per attempt:
 *  - email + IP: the normal lockout (LOGIN_MAX_ATTEMPTS)
 *  - IP:         stops one client spraying many accounts
 *  - email:      a much higher ceiling (×EMAIL_ONLY_FACTOR) that only catches
 *                guessing spread across many IPs. Keeping it high is what stops
 *                a stranger locking someone out with a few wrong passwords.
 * The IP comes from getClientIp, which ignores client-forged
 * X-Forwarded-For values.
 */
const EMAIL_ONLY_FACTOR = 5

export function loginRateLimitKeys(email: string, req: Request): RateLimitKeys {
  const ip = getClientIp(req)
  const e = email.trim().toLowerCase()
  return [`login:email-ip:${e}:${ip}`, `login:ip:${ip}`, `login:email:${e}`]
}

const thresholdFor = (key: string, base: number) =>
  key.startsWith("login:email:") ? base * EMAIL_ONLY_FACTOR : base

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
    if (entry.count >= thresholdFor(key, loginMaxAttempts)) {
      entry.lockedUntil = now + loginLockoutSeconds * 1000
    }
  }
}

export function clearLoginAttempts(keys: RateLimitKeys): void {
  for (const key of keys) attempts.delete(key)
}
