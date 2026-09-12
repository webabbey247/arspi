/** Canonical origin for every absolute URL this app emits — metadata,
 *  canonicals, sitemap, robots, JSON-LD, OG images.
 *
 *  Set NEXT_PUBLIC_APP_URL per environment (it's the same var the OAuth
 *  redirect URIs and password-reset emails already build from). The fallback is
 *  the production domain rather than localhost so a missing env var degrades to
 *  "correct in production" instead of emitting localhost URLs into search
 *  results. */
export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "https://www.iarps.com").replace(/\/+$/, "")

export const SITE_NAME = "ARPS Institute"

export const SITE_DESCRIPTION =
  "Global professional certification programs, research training, software solutions, and institutional consulting for scholars and practitioners worldwide."

/** Resolves a site-relative path to an absolute URL. Pass-through for anything
 *  already absolute (e.g. an UploadThing CDN image). */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`
}

/** Strips tags/entities off rich text and clamps it to a length search engines
 *  will actually display, for use as a meta description. */
export function metaDescription(html: string | null | undefined, max = 160): string | undefined {
  if (!html) return undefined
  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
  if (!text) return undefined
  if (text.length <= max) return text
  // Cut on a word boundary so the snippet doesn't end mid-word.
  return `${text.slice(0, max - 1).replace(/\s+\S*$/, "")}…`
}

/** Organization schema — emitted once, site-wide, from the root layout. */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type":    "EducationalOrganization",
    name:        SITE_NAME,
    url:         SITE_URL,
    description: SITE_DESCRIPTION,
    logo:        absoluteUrl("/opengraph-image"),
  }
}
