import DOMPurify from "isomorphic-dompurify"

/** Sanitize HTML stored in the DB (Tiptap rich-text output) before rendering
 *  via dangerouslySetInnerHTML. Strips <script>, on*= handlers, javascript: URIs,
 *  and any tags/attributes not on DOMPurify's safe default allowlist. */
export function sanitizeHtml(input: string | null | undefined): string {
  if (!input) return ""
  return DOMPurify.sanitize(input, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ["target", "rel"],
  })
}
