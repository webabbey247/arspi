import "server-only"
import { cookies } from "next/headers"
import { jwtVerify, SignJWT } from "jose"
import { redirect } from "next/navigation"
import { z } from "zod"
import { db } from "@/lib/db"
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

const refreshClaimsSchema = z.object({ sub: z.string(), remember: z.boolean() })
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

/** Writes all three cookies after a fresh login. */
export async function createSession(payload: SessionPayload, rememberMe = false): Promise<void> {
  const env = getAuthEnv()
  const [accessToken, refreshToken, sessionCookie] = await Promise.all([
    signAccessToken(payload),
    signRefreshToken({ sub: payload.sub, remember: rememberMe }),
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
  const [newAccessToken, newRefreshToken, newSessionCookie] = await Promise.all([
    signAccessToken(payload),
    signRefreshToken(refreshClaims), // rotated — same "remember" window, extended from now
    signSessionCookie(payload, env.sessionSecret),
  ])
  const maxAge = refreshMaxAge(refreshClaims.remember)
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
