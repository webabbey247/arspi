import type { Editor } from "@tiptap/react"

/**
 * Link handling shared by the rich-text editors.
 *
 * The Link extension was already configured in components/ui/RichTextEditor,
 * but nothing ever called `setLink` — so the only way a link could appear was
 * by pasting HTML that already contained one. There was no way to select the
 * words "UNESCO guidelines" and point them at a page.
 */

/** Schemes the editor will write. Anything else — `javascript:` above all —
 *  is refused here, and `lib/sanitize.ts` refuses it again on render. Two
 *  layers, because this one is only as trustworthy as the client running it. */
const ALLOWED_SCHEMES = ["http:", "https:", "mailto:", "tel:"]

/** Normalises what someone types into a URL, or null if it cannot be one.
 *  A bare "example.com" becomes "https://example.com", because that is what
 *  the author meant and a relative link to /example.com is never what they
 *  wanted. */
export function normaliseLinkHref(raw: string): string | null {
  const input = raw.trim()
  if (!input) return null

  const withScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(input) ? input : `https://${input}`

  let url: URL
  try {
    url = new URL(withScheme)
  } catch {
    return null
  }
  if (!ALLOWED_SCHEMES.includes(url.protocol)) return null
  // A scheme on its own ("https://") is not a destination.
  if (!url.hostname && url.protocol !== "mailto:" && url.protocol !== "tel:") return null
  return url.toString()
}

export const LINK_EXTENSION_OPTIONS = {
  openOnClick: false,
  autolink: true,
  // Belt and braces with normaliseLinkHref: this also covers autolink and
  // pasted content, which never pass through the prompt.
  protocols: ["http", "https", "mailto", "tel"] as string[],
  HTMLAttributes: {
    class: "text-[#6655DF] underline underline-offset-2",
    rel: "noopener noreferrer nofollow",
    target: "_blank",
  },
}

export type LinkPromptResult = "set" | "removed" | "cancelled" | "invalid"

/**
 * Prompts for a URL and applies it to the current selection.
 *
 * Submitting an empty value removes the link, which is the behaviour people
 * expect from every editor that does this with a prompt. Returns what
 * happened so the caller can report an invalid URL in its own idiom rather
 * than this module reaching for a toast.
 */
export function promptForLink(editor: Editor): LinkPromptResult {
  const existing = (editor.getAttributes("link").href as string | undefined) ?? ""
  const raw = window.prompt("Link URL — leave empty to remove the link", existing)

  // `null` is dismissal; "" is a deliberate clear.
  if (raw === null) return "cancelled"

  if (raw.trim() === "") {
    editor.chain().focus().extendMarkRange("link").unsetLink().run()
    return "removed"
  }

  const href = normaliseLinkHref(raw)
  if (!href) return "invalid"

  // extendMarkRange so editing an existing link replaces the whole thing
  // rather than splitting it at the caret.
  editor.chain().focus().extendMarkRange("link").setLink({ href }).run()
  return "set"
}
