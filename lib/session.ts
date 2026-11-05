import "server-only"
import { cookies } from "next/headers"
import { headers } from "next/headers"
import { jwtVerify, SignJWT } from "jose"
import { redirect } from "next/navigation"
import { z } from "zod"
import { db } from "@/lib/db"
import { openSession, isSessionLive, touchSession, revokeSession } from "@/services/session.service"
import { getAuthEnv } from "@/lib/env"
import { getSessionSecret } from "@/lib/auth-secret"
import { signSessionCookie, verifySessionCookie } from "@/lib/session-cookie"
import { sessionPayloadSchema } from "@/types/session"

export type { SessionPayload } from "@/types/session"
import type { SessionPayload } from "@/types/session"

/**
 * All cookie reads and writes live here — no cookie names or options inline
 * anywhere else.
 *
 * Three cookies (this app has no separate auth service, so it both issues and
 * verifies all three itself):
 *   access  — signed JWT, 15 min, the credential every API route re-verifies
 *             before a mutation. Short-lived on purpose: if it leaks, the
 *             window of use is small, and a disabled/deleted/role-changed
 *             user is locked out within 15 minutes instead of up to 30 days.
 *   refresh — signed JWT, 1d or 30d ("remember me"), used only to silently
 *             mint a new access token (and itself rotates on each use).
 *   session — HMAC-signed copy of SessionPayload for rendering (name, role,
 *             email) with the refresh token's lifetime, so layouts don't need
 *             to touch the access/refresh tokens just to show who's logged in.
 */

const ACCESS_MAX_AGE_SECONDS = 15 * 60
const REFRESH_MAX_AGE_SECONDS = { short: 24 * 60 * 60, remember: 30 * 24 * 60 * 60 }

const cookieOptions = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === "production",
  sameSite: "lax",
} as const

const refreshClaimsSchema = z.object({
  sub:      z.string(),
  remember: z.boolean(),
  /** Device-session row id. Optional: tokens minted before user_sessions
   *  existed carry no sid, and are adopted on their next refresh rather than
   *  being rejected, which would sign every active user out at deploy. */
  sid:      z.string().optional(),
})
type RefreshClaims = z.infer<typeof refreshClaimsSchema>

function refreshMaxAge(remember: boolean): number {
  return remember ? REFRESH_MAX_AGE_SECONDS.remember : REFRESH_MAX_AGE_SECONDS.short
}

async function signAccessToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + ACCESS_MAX_AGE_SECONDS)
    .sign(getSessionSecret())
}

async function signRefreshToken(claims: RefreshClaims): Promise<string> {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + refreshMaxAge(claims.remember))
    .sign(getSessionSecret())
}

/** Best-effort client description for the session row. Both values are
 *  self-reported and are only ever shown back to the account that created
 *  them — never used to make a decision. */
async function describeClient(): Promise<{ userAgent: string | null; ipAddress: string | null }> {
  try {
    const h = await headers()
    const fwd = h.get("x-forwarded-for")
    return {
      userAgent: h.get("user-agent"),
      // The left-most entry is the client; the rest are proxies.
      ipAddress: fwd ? fwd.split(",")[0].trim() : h.get("x-real-ip"),
    }
  } catch {
    return { userAgent: null, ipAddress: null }
  }
}

/** Writes all three cookies after a fresh login, and opens the device-session
 *  row whose id travels in the refresh token as `sid`. */
export async function createSession(payload: SessionPayload, rememberMe = false): Promise<void> {
  const env = getAuthEnv()
  const maxAgeSeconds = refreshMaxAge(rememberMe)

  const client = await describeClient()
  let sid: string | undefined
  try {
    // null when session tracking is not available yet; the token simply
    // carries no sid, exactly like a pre-table login.
    sid = (await openSession({
      userId:    payload.sub,
      userAgent: client.userAgent,
      ipAddress: client.ipAddress,
      expiresAt: new Date(Date.now() + maxAgeSeconds * 1000),
    })) ?? undefined
  } catch (err) {
    // Session listing is a convenience; it must never be the reason a correct
    // password fails to log someone in.
    console.error("[createSession] could not open a device session", err)
  }

  const [accessToken, refreshToken, sessionCookie] = await Promise.all([
    signAccessToken(payload),
    signRefreshToken({ sub: payload.sub, remember: rememberMe, sid }),
    signSessionCookie(payload, env.sessionSecret),
  ])

  const jar = await cookies()
  jar.set(env.accessCookieName, accessToken, { ...cookieOptions, path: "/", maxAge: ACCESS_MAX_AGE_SECONDS })
  jar.set(env.refreshCookieName, refreshToken, { ...cookieOptions, path: "/", maxAge: refreshMaxAge(rememberMe) })
  jar.set(env.sessionCookieName, sessionCookie, { ...cookieOptions, path: "/", maxAge: refreshMaxAge(rememberMe) })
}

/** Clears all three auth cookies. Options (path in particular) must match
 *  what they were set with, or the cookies survive. */
export async function clearSession(): Promise<void> {
  const env = getAuthEnv()
  const jar = await cookies()

  // Revoke the row too: clearing cookies only ends this browser, and a copied
  // refresh token would otherwise keep working until it expired.
  const sid = await getCurrentSessionId()
  if (sid) {
    const claims = await readRefreshClaims()
    if (claims) await revokeSession(claims.sub, sid).catch(() => {})
  }

  jar.set(env.accessCookieName, "", { ...cookieOptions, path: "/", maxAge: 0 })
  jar.set(env.refreshCookieName, "", { ...cookieOptions, path: "/", maxAge: 0 })
  jar.set(env.sessionCookieName, "", { ...cookieOptions, path: "/", maxAge: 0 })
}

/** Looks up a user fresh from the DB for the refresh path, so a role change or
 *  a disabled/deleted account takes effect within one refresh cycle instead of
 *  surviving for the access token's full (short) remaining lifetime. */
async function loadSessionPayload(userId: string): Promise<SessionPayload | null> {
  const user = await db.user.findUnique({
    where:   { id: userId },
    include: { profile: { select: { firstName: true, lastName: true } } },
  })
  if (!user || user.status !== "ACTIVE") return null

  return {
    sub:       user.id,
    email:     user.email,
    role:      user.role,
    firstName: user.profile?.firstName ?? null,
    lastName:  user.profile?.lastName  ?? null,
  }
}

type RefreshedSession = { payload: SessionPayload; refreshClaims: RefreshClaims }

/** Verifies the refresh cookie and re-derives the session from the DB.
 *  Read-only — callers decide whether it's safe to persist new cookies. */
async function verifyRefresh(): Promise<RefreshedSession | null> {
  const env = getAuthEnv()
  const jar = await cookies()
  const token = jar.get(env.refreshCookieName)?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, getSessionSecret(), { algorithms: ["HS256"] })
    const parsed = refreshClaimsSchema.safeParse(payload)
    if (!parsed.success) return null

    const session = await loadSessionPayload(parsed.data.sub)
    if (!session) return null

    // A revoked or expired device session must not be able to refresh — this
    // is what makes "sign out other sessions" actually end them.
    if (parsed.data.sid && !(await isSessionLive(parsed.data.sid, parsed.data.sub))) {
      return null
    }

    return { payload: session, refreshClaims: parsed.data }
  } catch {
    return null
  }
}

/** The verified session, or null. Tries the access token first; if it's
 *  missing/expired, falls back to a read-only refresh-token verification (DB
 *  lookup, no cookies written) so rendering still sees the user as logged in.
 *  Safe to call from Server Components. Never persists a refreshed token —
 *  use `getSessionAndRefresh()` from a Route Handler or Server Action for
 *  that, or the cookies simply refresh on the next API call. */
export async function getSession(): Promise<SessionPayload | null> {
  const env = getAuthEnv()
  const jar = await cookies()
  const accessToken = jar.get(env.accessCookieName)?.value

  if (accessToken) {
    try {
      const { payload } = await jwtVerify(accessToken, getSessionSecret(), { algorithms: ["HS256"] })
      const parsed = sessionPayloadSchema.safeParse(payload)
      if (parsed.success) return parsed.data
    } catch {
      // fall through to refresh
    }
  }

  const refreshed = await verifyRefresh()
  return refreshed?.payload ?? null
}

/** Same as `getSession()`, but when the access token had expired and the
 *  refresh token carried the session, this also rotates and persists new
 *  access/refresh/session cookies. Only call from a Route Handler or Server
 *  Action — writing cookies during a Server Component render throws. */
export async function getSessionAndRefresh(): Promise<SessionPayload | null> {
  const env = getAuthEnv()
  const jar = await cookies()
  const accessToken = jar.get(env.accessCookieName)?.value

  if (accessToken) {
    try {
      const { payload } = await jwtVerify(accessToken, getSessionSecret(), { algorithms: ["HS256"] })
      const parsed = sessionPayloadSchema.safeParse(payload)
      if (parsed.success) return parsed.data
    } catch {
      // fall through to refresh
    }
  }

  const refreshed = await verifyRefresh()
  if (!refreshed) return null

  const { payload, refreshClaims } = refreshed
  const maxAge = refreshMaxAge(refreshClaims.remember)
  const expiresAt = new Date(Date.now() + maxAge * 1000)

  // Adopt a pre-table token by opening a row for it now, rather than refusing
  // it; otherwise shipping this would sign out everyone currently logged in.
  let sid = refreshClaims.sid
  try {
    if (sid) {
      await touchSession(sid, expiresAt)
    } else {
      const client = await describeClient()
      sid = (await openSession({
        userId:    payload.sub,
        userAgent: client.userAgent,
        ipAddress: client.ipAddress,
        expiresAt,
      })) ?? undefined
    }
  } catch (err) {
    console.error("[getSessionAndRefresh] device session bookkeeping failed", err)
  }

  const [newAccessToken, newRefreshToken, newSessionCookie] = await Promise.all([
    signAccessToken(payload),
    signRefreshToken({ ...refreshClaims, sid }), // rotated — same window, extended from now
    signSessionCookie(payload, env.sessionSecret),
  ])
  jar.set(env.accessCookieName, newAccessToken, { ...cookieOptions, path: "/", maxAge: ACCESS_MAX_AGE_SECONDS })
  jar.set(env.refreshCookieName, newRefreshToken, { ...cookieOptions, path: "/", maxAge })
  jar.set(env.sessionCookieName, newSessionCookie, { ...cookieOptions, path: "/", maxAge })

  return payload
}

/** Reads the session cookie directly — the cheapest possible check, for
 *  rendering only (e.g. a header that just shows a name). Never falls back to
 *  the access/refresh tokens, so prefer `getSession()` for anything that
 *  gates a route. */
export async function readDisplaySession(): Promise<SessionPayload | null> {
  const env = getAuthEnv()
  const jar = await cookies()
  return verifySessionCookie(jar.get(env.sessionCookieName)?.value, env.sessionSecret)
}

/** The refresh cookie's claims, or null. Read-only. */
async function readRefreshClaims(): Promise<RefreshClaims | null> {
  const env = getAuthEnv()
  const jar = await cookies()
  const token = jar.get(env.refreshCookieName)?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, getSessionSecret(), { algorithms: ["HS256"] })
    const parsed = refreshClaimsSchema.safeParse(payload)
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

/** The device-session row id for this request, so the sessions list can mark
 *  which row is "this device". Null for a token minted before the table. */
export async function getCurrentSessionId(): Promise<string | null> {
  const claims = await readRefreshClaims()
  return claims?.sid ?? null
}

/** Redirects to /login if not authenticated. */
export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession()
  if (!session) redirect("/login")
  return session
}

/** Redirects to /unauthorized if the user's role doesn't match. */
export async function requireRole(role: SessionPayload["role"]): Promise<SessionPayload> {
  const session = await requireAuth()
  if (session.role !== role) redirect("/unauthorized")
  return session
}
