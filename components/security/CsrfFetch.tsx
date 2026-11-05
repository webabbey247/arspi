"use client"

import { CSRF_COOKIE, CSRF_HEADER } from "@/lib/csrf-shared"

/**
 * Attaches the CSRF token to every same-origin state-changing fetch.
 *
 * Done by wrapping `window.fetch` once rather than by editing every call
 * site. There are around thirty mutating fetches across the app and more will
 * be written; a rule that has to be remembered each time is a rule that will
 * eventually be forgotten, and the failure mode is a 403 in production.
 *
 * Two deliberate limits:
 *
 *  - Only same-origin requests are touched. Adding a custom header to a
 *    cross-origin request turns it into a preflighted one, which would break
 *    third-party uploads for no benefit — they carry no cookies of ours.
 *  - Safe methods are left alone, since the proxy never challenges them.
 *
 * The patch is installed at module scope so it is in place as soon as this
 * chunk evaluates, rather than after an effect has run.
 */

const SAFE = new Set(["GET", "HEAD", "OPTIONS"])

function readToken(): string | null {
  const match = document.cookie.match(
    new RegExp("(?:^|;\\s*)" + CSRF_COOKIE + "=([^;]*)"),
  )
  return match ? decodeURIComponent(match[1]) : null
}

function sameOrigin(input: RequestInfo | URL): boolean {
  try {
    const href =
      typeof input === "string" ? input
      : input instanceof URL ? input.href
      : input.url
    return new URL(href, window.location.origin).origin === window.location.origin
  } catch {
    // An unparseable input is not something we should be adding headers to.
    return false
  }
}

declare global {
  interface Window { __csrfFetchPatched?: boolean }
}

if (typeof window !== "undefined" && !window.__csrfFetchPatched) {
  window.__csrfFetchPatched = true

  const original = window.fetch.bind(window)

  window.fetch = function patchedFetch(input: RequestInfo | URL, init?: RequestInit) {
    const method = (
      init?.method ?? (input instanceof Request ? input.method : "GET")
    ).toUpperCase()

    if (SAFE.has(method) || !sameOrigin(input)) return original(input, init)

    const token = readToken()
    if (!token) return original(input, init)

    const headers = new Headers(
      init?.headers ?? (input instanceof Request ? input.headers : undefined),
    )
    // An explicit header from the caller wins, so this can always be overridden.
    if (!headers.has(CSRF_HEADER)) headers.set(CSRF_HEADER, token)

    return original(input, { ...init, headers })
  }
}

/** Renders nothing: importing it is what installs the patch. */
export default function CsrfFetch() {
  return null
}
