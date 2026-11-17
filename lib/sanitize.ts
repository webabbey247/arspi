import sanitizeHtmlLib from "sanitize-html"

// Tags/attributes this app's Tiptap editors can actually produce: StarterKit
// (paragraphs, headings, marks, lists, blockquote, code, hr) + the Link
// extension (components/ui/RichTextEditor.tsx). Kept close to DOMPurify's old
// default "html" profile, which this replaces — see git history for why
// (isomorphic-dompurify pulls in jsdom, whose html-encoding-sniffer dependency
// does a CJS require() of the ESM-only @exodus/bytes package, which fails at
// runtime on Vercel regardless of bundler config — a real Node.js CJS/ESM
// limitation, not something serverExternalPackages can work around).
const ALLOWED_TAGS = [
  "p", "br", "hr",
  "strong", "b", "em", "i", "u", "s", "strike", "del", "code", "pre", "sup", "sub",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li", "blockquote",
  "a", "span", "div",
  "table", "thead", "tbody", "tr", "th", "td",
]

const ALLOWED_ATTRIBUTES = {
  a: ["href", "name", "target", "rel", "class"],
}

/** The only classes stored content uses: the link styling the editors apply.
 *  Any other class is dropped — with Tailwind on the page, an arbitrary class
 *  like "fixed inset-0 z-50" would let authored content draw a fake overlay
 *  over the real UI. */
const ALLOWED_CLASSES = {
  a: ["text-[#6655DF]", "text-[#0474C4]", "underline", "underline-offset-2"],
}

/** Sanitize HTML stored in the DB (Tiptap rich-text output) before rendering
 *  via dangerouslySetInnerHTML. Strips <script>, on*= handlers, javascript: URIs,
 *  and any tags/attributes not on the allowlist above. */
export function sanitizeHtml(input: string | null | undefined): string {
  if (!input) return ""
  return sanitizeHtmlLib(input, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedClasses: ALLOWED_CLASSES,
    allowedSchemes: ["http", "https", "mailto", "tel"],
  })
}

const HAS_TAG = /<\/?[a-z][\s\S]*?>/i

/**
 * For fields that hold plain text OR editor HTML: sanitises the HTML and
 * leaves plain text untouched (React escapes it when rendered as text, and
 * running it through the sanitiser would mangle characters like `<` or `&`).
 * Pair with <RichTextView> in client components.
 */
export function sanitizeRich<T extends string | null | undefined>(value: T): T {
  if (!value || !HAS_TAG.test(value)) return value
  return sanitizeHtml(value) as T
}
