import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { getSessionSecret } from "@/lib/auth-secret"
import { getAuthEnv } from "@/lib/env"
import { sessionPayloadSchema } from "@/types/session"

// Maps route prefix → roles that are allowed in. Each role is confined to its
// own dashboard — an ADMIN cannot browse /instructor or /student, etc. Kept
// in lockstep with the exact-match checks in requireRole() (lib/session.ts).
const ROLE_ROUTES: Record<string, string[]> = {
  "/administrator": ["ADMIN"],
  "/instructor":    ["INSTRUCTOR"],
  "/student":       ["USER"],
}

/** This is a fast, cheap pre-filter — not the sole security boundary. It only
 *  ever verifies JWT signatures (Edge-safe via `jose`, no DB access); the
 *  authoritative check is `requireRole()` (lib/session.ts) in each layout,
 *  which does the real DB-backed lookup on the refresh-token fallback and
 *  persists rotated cookies. A request let through here with only a valid
 *  refresh token still gets the real role check one layer in. */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const env = getAuthEnv()
  const accessToken  = req.cookies.get(env.accessCookieName)?.value
  const refreshToken = req.cookies.get(env.refreshCookieName)?.value

  function toLogin() {
    const login = new URL("/login", req.url)
    login.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(login)
  }

  async function hasValidRefresh(): Promise<boolean> {
    if (!refreshToken) return false
    try {
      await jwtVerify(refreshToken, getSessionSecret(), { algorithms: ["HS256"] })
      return true
    } catch {
      return false
    }
  }

  if (!accessToken) {
    // No access token — the browser may still have a live refresh token (the
    // access token is only 15 min). Let the request through; the layout's
    // getSession() will do the real refresh (DB lookup + rotated cookies).
    if (await hasValidRefresh()) return NextResponse.next()
    return toLogin()
  }

  try {
    const { payload } = await jwtVerify(accessToken, getSessionSecret(), { algorithms: ["HS256"] })
    const parsed = sessionPayloadSchema.safeParse(payload)
    if (!parsed.success) throw new Error("Malformed session payload")

    for (const [prefix, allowed] of Object.entries(ROLE_ROUTES)) {
      if (pathname.startsWith(prefix) && !allowed.includes(parsed.data.role)) {
        return NextResponse.redirect(new URL("/unauthorized", req.url))
      }
    }
    return NextResponse.next()
  } catch {
    // Expired or tampered access token — try the refresh token before giving up.
    if (await hasValidRefresh()) return NextResponse.next()
    const res = toLogin()
    res.cookies.delete(env.accessCookieName)
    res.cookies.delete(env.refreshCookieName)
    res.cookies.delete(env.sessionCookieName)
    return res
  }
}

export const config = {
  matcher: [
    "/administrator",  "/administrator/:path*",
    "/instructor",     "/instructor/:path*",
    "/student",        "/student/:path*",
  ],
}
