import { getSessionSecret } from "@/lib/auth-secret"
import { CSRF_COOKIE, CSRF_HEADER, SAFE_METHODS } from "@/lib/csrf-shared"

/**
 * CSRF protection: signed double-submit cookie.
 *
 * Until now the only thing standing between a cross-site page and a
 * state-changing request was `SameSite=Lax` on the auth cookies. Lax does stop
 * cross-site POST/PUT/PATCH/DELETE on current browsers, but it is one layer,
 * it is the browser's to enforce rather than ours, and it does nothing about a
 * same-site attacker on another subdomain.
 *
 * The token is `<nonce>.<hmac(nonce)>`:
 *
 *  - it travels in a cookie that JavaScript *can* read (that is the point of
 *    double-submit) and in the `x-csrf-token` header on every unsafe request;
 *  - the server requires both to be present, identical, and correctly signed.
 *
 * A cross-site attacker can make the browser send the cookie but cannot read
 * it to set the header, because reading it needs same-origin script access.
 * The HMAC is what makes this better than a bare double-submit: a subdomain
 * that can write cookies for the parent domain still cannot mint a value that
 * verifies, because it does not have the signing key.
 *
 * Everything here uses Web Crypto so it runs unchanged in the Edge proxy.
 */

// Re-exported so server-side callers need only one import.
export { CSRF_COOKIE, CSRF_HEADER, SAFE_METHODS }

/** Paths whose callers are not our browser code and so cannot send a header.
 *  Each one must carry its own authentication:
 *   - Stripe webhooks are verified by signature in the handler;
 *   - UploadThing's route is driven by their SDK and signs its own callbacks.
 *  Nothing should be added here without an equivalent guarantee. */
const EXEMPT_PREFIXES = ["/api/webhooks/", "/api/uploadthing"]

export function isCsrfExempt(pathname: string): boolean {
  return EXEMPT_PREFIXES.some(p => pathname === p || pathname.startsWith(p))
}

const encoder = new TextEncoder()
let keyPromise: Promise<CryptoKey> | undefined

function signingKey(): Promise<CryptoKey> {
  // Cached: importKey is not free and this runs on every unsafe request.
  return (keyPromise ??= crypto.subtle.importKey(
    "raw",
    getSessionSecret() as unknown as ArrayBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  ))
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = ""
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

async function sign(nonce: string): Promise<string> {
  const sig = await crypto.subtle.sign("HMAC", await signingKey(), encoder.encode(nonce))
  return toBase64Url(new Uint8Array(sig))
}

/** A fresh token. The nonce is 32 bytes of CSPRNG output. */
export async function issueCsrfToken(): Promise<string> {
  const nonce = toBase64Url(crypto.getRandomValues(new Uint8Array(32)))
  return `${nonce}.${await sign(nonce)}`
}

/** Length-independent, value-independent comparison. `===` on secrets leaks
 *  how long a common prefix was through timing. */
function timingSafeEqual(a: string, b: string): boolean {
  const aBytes = encoder.encode(a)
  const bBytes = encoder.encode(b)
  // Compare a fixed number of bytes either way so the loop count does not
  // depend on the inputs; the length check is folded into the result.
  let diff = aBytes.length ^ bBytes.length
  const len = Math.max(aBytes.length, bBytes.length)
  for (let i = 0; i < len; i++) {
    diff |= (aBytes[i] ?? 0) ^ (bBytes[i] ?? 0)
  }
  return diff === 0
}

/** True when the token is well-formed and carries our signature. */
export async function isValidCsrfToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false
  const dot = token.indexOf(".")
  if (dot <= 0 || dot === token.length - 1) return false

  const nonce = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  return timingSafeEqual(sig, await sign(nonce))
}

/** The full check for an unsafe request: the header and the cookie must both
 *  be present, be the same token, and verify. */
export async function verifyDoubleSubmit(
  cookieValue: string | undefined | null,
  headerValue: string | undefined | null,
): Promise<boolean> {
  if (!cookieValue || !headerValue) return false
  if (!timingSafeEqual(cookieValue, headerValue)) return false
  return isValidCsrfToken(cookieValue)
}
