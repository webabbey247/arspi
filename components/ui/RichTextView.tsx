import { cn } from "@/lib/utils"

export const HAS_TAG = /<\/?[a-z][\s\S]*?>/i

/** Paragraph spacing, lists and links for HTML from the rich-text editor,
 *  sized relative to whatever text styles the caller passes. */
export const PROSE =
  "[&_p]:mb-[0.85em] [&_p:last-child]:mb-0 " +
  "[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 [&_ul]:mb-[0.85em] [&_ol]:mb-[0.85em] [&_li]:mb-[0.3em] " +
  "[&_strong]:font-semibold [&_b]:font-semibold [&_em]:italic " +
  "[&_a]:underline [&_a]:underline-offset-2 " +
  "[&_h2]:font-semibold [&_h3]:font-semibold [&_h2]:mt-[1em] [&_h3]:mt-[1em] [&_h2]:mb-[0.4em] [&_h3]:mb-[0.4em] " +
  "[&_blockquote]:border-l-2 [&_blockquote]:pl-4 [&_blockquote]:italic"

/**
 * Renders plain text or HTML that has ALREADY been sanitised on the server
 * (see `sanitizeRich` in lib/sanitize). It doesn't import the sanitiser, so
 * client components using it don't ship sanitize-html to the browser.
 *
 * Only pass values that went through the sanitiser. For anything else, use
 * <RichText>, which sanitises itself.
 */
export default function RichTextView({
  value, className, as: Tag = "div",
}: {
  value: string | null | undefined
  className?: string
  /** Wrapper element for plain text; HTML always renders in a div. */
  as?: "div" | "p"
}) {
  if (!value?.trim()) return null
  if (HAS_TAG.test(value)) {
    return <div className={cn(PROSE, className)} dangerouslySetInnerHTML={{ __html: value }} />
  }
  return <Tag className={cn("whitespace-pre-line", className)}>{value}</Tag>
}
