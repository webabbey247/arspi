import { sanitizeHtml } from "@/lib/sanitize"
import { cn } from "@/lib/utils"

const HAS_TAG = /<\/?[a-z][\s\S]*?>/i

/** Paragraph spacing, lists and links for HTML from the rich-text editor,
 *  sized relative to whatever text styles the caller passes. */
const PROSE =
  "[&_p]:mb-[0.85em] [&_p:last-child]:mb-0 " +
  "[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 [&_ul]:mb-[0.85em] [&_ol]:mb-[0.85em] [&_li]:mb-[0.3em] " +
  "[&_strong]:font-semibold [&_b]:font-semibold [&_em]:italic " +
  "[&_a]:underline [&_a]:underline-offset-2 " +
  "[&_h2]:font-semibold [&_h3]:font-semibold [&_h2]:mt-[1em] [&_h3]:mt-[1em] [&_h2]:mb-[0.4em] [&_h3]:mb-[0.4em] " +
  "[&_blockquote]:border-l-2 [&_blockquote]:pl-4 [&_blockquote]:italic"

/**
 * Renders a field that may hold either plain text or HTML from the rich-text
 * editor (programme overview, module descriptions, FAQ answers…).
 *
 * HTML is sanitised before it's injected — the same allow-list the lesson
 * viewer uses — so stored markup can't run scripts. Plain text keeps its line
 * breaks. Works in server and client components alike.
 */
export default function RichText({
  value, className, as: Tag = "div",
}: {
  value: string | null | undefined
  className?: string
  /** Wrapper element for plain text; HTML always renders in a div. */
  as?: "div" | "p"
}) {
  if (!value?.trim()) return null
  if (HAS_TAG.test(value)) {
    return <div className={cn(PROSE, className)} dangerouslySetInnerHTML={{ __html: sanitizeHtml(value) }} />
  }
  return <Tag className={cn("whitespace-pre-line", className)}>{value}</Tag>
}
