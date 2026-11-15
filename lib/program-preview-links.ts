/** Links for the "preview as…" feature. No server imports, so both the
 *  public page (server) and the student player (client) can use them. */

export type PreviewRole = "ADMIN" | "INSTRUCTOR"

/** The programme dashboard each staff role comes back to from a preview. */
export function staffProgramHref(role: string, slug: string) {
  return role === "INSTRUCTOR" ? `/instructor/programs/${slug}` : `/administrator/programs/${slug}`
}

/** Opens the public page in Draft Mode (latest content, drafts included). */
export function publicPreviewHref(slug: string) {
  return `/api/preview/public?slug=${encodeURIComponent(slug)}`
}

/** The read-only student player for staff. */
export function studentPreviewHref(role: string, slug: string) {
  return `${staffProgramHref(role, slug)}/preview`
}

/** Leaves the public preview (turns Draft Mode off). */
export function exitPublicPreviewHref(slug: string) {
  return `/api/preview/exit?slug=${encodeURIComponent(slug)}`
}
