/**
 * Turns an untrusted "where to go next" value (e.g. ?callbackUrl=) into a
 * same-origin path, or null.
 *
 * A prefix check like `startsWith("/") && !startsWith("//")` is not enough:
 * browsers treat "/\evil.com" (and tab/newline variants) as "//evil.com",
 * an off-site URL. Resolving against our own origin and comparing origins is.
 */
export function safeInternalPath(raw: string | null | undefined, origin: string): string | null {
  if (!raw || !raw.startsWith("/")) return null
  if (/[\\\u0000-\u001f]/.test(raw)) return null
  try {
    const url = new URL(raw, origin)
    if (url.origin !== origin) return null
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return null
  }
}
