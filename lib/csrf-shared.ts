/**
 * The two names the CSRF cookie and header go by.
 *
 * Kept apart from lib/csrf.ts because that module reaches the signing secret
 * through lib/env, which is `server-only` — importing it from a client
 * component (CsrfFetch) would drag server code into the browser bundle and
 * fail the build. Constants have no such dependency, so both sides can share
 * them and neither has to hard-code a string the other might change.
 */

export const CSRF_COOKIE = "csrf_token"
export const CSRF_HEADER = "x-csrf-token"

/** Methods that must not change state, and so are never challenged. */
export const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"])
