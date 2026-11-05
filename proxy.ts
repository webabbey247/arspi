import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { getSessionSecret } from "@/lib/auth-secret"
import { getAuthEnv } from "@/lib/env"
import { sessionPayloadSchema } from "@/types/session"
import {
  CSRF_COOKIE, CSRF_HEADER, SAFE_METHODS,
  isCsrfExempt, issueCsrfToken, isValidCsrfToken, verifyDoubleSubmit,
} from "@/lib/csrf"

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
/** Attaches a CSRF cookie when the request has none, or when the one it has
 *  does not verify. Readable by script on purpose — the client has to be able
 *  to echo it back in a header, which is what a cross-site page cannot do. */
async function withCsrfCookie(req: NextRequest, res: NextResponse): Promise<NextResponse> {
  const existing = req.cookies.get(CSRF_COOKIE)?.value
  if (await isValidCsrfToken(existing)) return res

  res.cookies.set(CSRF_COOKIE, await issueCsrfToken(), {
    httpOnly: false,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    path:     "/",
  })
  return res
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // ── API: CSRF only. An API request must never be redirected to /login —
  //    callers want a status code, not an HTML page — so the role gate below
  //    does not apply here. Each route does its own authentication.
  if (pathname.startsWith("/api/")) {
    if (!SAFE_METHODS.has(req.method) && !isCsrfExempt(pathname)) {
      const ok = await verifyDoubleSubmit(
        req.cookies.get(CSRF_COOKIE)?.value,
        req.headers.get(CSRF_HEADER),
      )
      if (!ok) {
        return withCsrfCookie(req, NextResponse.json(
          { error: "Invalid or missing CSRF token. Reload the page and try again." },
          { status: 403 },
        ))
      }
    }
    return withCsrfCookie(req, NextResponse.next())
  }

  // ── Pages: only the dashboards are gated. The matcher is wide so that every
  //    page hands out a CSRF cookie, which means public pages reach here too
  //    and must be left alone.
  const gated = Object.keys(ROLE_ROUTES).some(
    prefix => pathname === prefix || pathname.startsWith(prefix + "/"),
  )
  if (!gated) return withCsrfCookie(req, NextResponse.next())

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
    if (await hasValidRefresh()) return withCsrfCookie(req, NextResponse.next())
    return withCsrfCookie(req, toLogin())
  }

  try {
    const { payload } = await jwtVerify(accessToken, getSessionSecret(), { algorithms: ["HS256"] })
    const parsed = sessionPayloadSchema.safeParse(payload)
    if (!parsed.success) throw new Error("Malformed session payload")

    for (const [prefix, allowed] of Object.entries(ROLE_ROUTES)) {
      if (pathname.startsWith(prefix) && !allowed.includes(parsed.data.role)) {
        return withCsrfCookie(req, NextResponse.redirect(new URL("/unauthorized", req.url)))
      }
    }
    return withCsrfCookie(req, NextResponse.next())
  } catch {
    // Expired or tampered access token — try the refresh token before giving up.
    if (await hasValidRefresh()) return withCsrfCookie(req, NextResponse.next())
    const res = toLogin()
    res.cookies.delete(env.accessCookieName)
    res.cookies.delete(env.refreshCookieName)
    res.cookies.delete(env.sessionCookieName)
    return withCsrfCookie(req, res)
  }
}

export const config = {
  // Deliberately wide. The role gate still only applies to the dashboard
  // prefixes (see `gated` above), but every page response has to be able to
  // hand out a CSRF cookie, or a visitor who lands straight on a public form
  // would have no token to send. Static assets and image optimisation are
  // excluded because they change nothing and are requested constantly.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpe?g|gif|svg|webp|ico|css|js|woff2?|txt|xml)$).*)",
  ],
}
