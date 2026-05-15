import { NextRequest, NextResponse } from "next/server"

/** Fixed-window in-memory rate limiter.
 *
 *  Trade-offs:
 *  - On Vercel/serverless, each instance keeps its own counter, so the
 *    effective rate is per-instance — still raises attack cost but isn't
 *    a hard ceiling. Swap this module's `hits` Map for an Upstash/Redis
 *    backend if you need strict global limits.
 *  - On standalone Node (cPanel / `next start`), counters are shared
 *    across the whole process.
 */

type Entry = { count: number; resetAt: number }
const hits = new Map<string, Entry>()

function cleanupIfBig() {
  if (hits.size < 1000) return
  const now = Date.now()
  for (const [key, entry] of hits) {
    if (entry.resetAt <= now) hits.delete(key)
  }
}

export type RateLimitResult = {
  allowed:     boolean
  remaining:   number
  retryAfter:  number // seconds until window resets
}

export function rateLimit(opts: {
  key:      string
  limit:    number
  windowMs: number
}): RateLimitResult {
  cleanupIfBig()
  const now   = Date.now()
  const entry = hits.get(opts.key)

  if (!entry || entry.resetAt <= now) {
    hits.set(opts.key, { count: 1, resetAt: now + opts.windowMs })
    return { allowed: true, remaining: opts.limit - 1, retryAfter: Math.ceil(opts.windowMs / 1000) }
  }

  if (entry.count >= opts.limit) {
    return { allowed: false, remaining: 0, retryAfter: Math.ceil((entry.resetAt - now) / 1000) }
  }

  entry.count++
  return { allowed: true, remaining: opts.limit - entry.count, retryAfter: Math.ceil((entry.resetAt - now) / 1000) }
}

/** Pull the client IP from forwarded headers; fall back to a constant so
 *  unidentifiable callers all share a single bucket (worst case: limit applies
 *  globally to anonymous-source traffic, which is fine). */
export function getClientIp(req: NextRequest | Request): string {
  const h = "headers" in req ? req.headers : (req as Request).headers
  const xff = h.get("x-forwarded-for")
  if (xff) return xff.split(",")[0]!.trim()
  const real = h.get("x-real-ip")
  if (real) return real.trim()
  return "unknown"
}

/** Returns a 429 response if the caller has exceeded the limit, else null.
 *  Usage at the top of a route handler:
 *    const limited = enforceRateLimit(req, { name: "login", limit: 10, windowMs: 15 * 60_000 })
 *    if (limited) return limited
 */
export function enforceRateLimit(
  req: NextRequest | Request,
  opts: { name: string; limit: number; windowMs: number; extraKey?: string },
): NextResponse | null {
  const ip  = getClientIp(req)
  const key = `${opts.name}:${ip}${opts.extraKey ? `:${opts.extraKey}` : ""}`
  const r   = rateLimit({ key, limit: opts.limit, windowMs: opts.windowMs })
  if (r.allowed) return null

  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: {
        "Retry-After":           String(r.retryAfter),
        "X-RateLimit-Limit":     String(opts.limit),
        "X-RateLimit-Remaining": "0",
      },
    },
  )
}
