import { sanitizeHtml } from "@/lib/sanitize"

/** Converts plain-text AI output into sanitized rich-text HTML for the Tiptap
 *  editors: blank-line-separated paragraphs, with consecutive "- "/"• " lines
 *  grouped into a bullet list. */
export function plainTextToHtml(text: string): string {
  const lines = text.split(/\r?\n/)
  const parts: string[] = []
  let list: string[] = []

  function flushList() {
    if (list.length) {
      parts.push(`<ul>${list.map(item => `<li>${item}</li>`).join("")}</ul>`)
      list = []
    }
  }

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) { flushList(); continue }
    const bullet = /^[-•]\s+(.*)/.exec(line)
    if (bullet) { list.push(bullet[1]); continue }
    flushList()
    parts.push(`<p>${line}</p>`)
  }
  flushList()

  return sanitizeHtml(parts.join("") || `<p>${text}</p>`)
}
