import { sanitizeRich } from "@/lib/sanitize"
import RichTextView from "@/components/ui/RichTextView"

/**
 * Renders a field that may hold either plain text or HTML from the rich-text
 * editor (programme overview, module descriptions, FAQ answers…).
 *
 * HTML is sanitised before it's injected — the same allow-list the lesson
 * viewer uses — so stored markup can't run scripts. Plain text keeps its line
 * breaks. Works in server and client components alike, but in a client
 * component it ships the sanitiser to the browser: where the data comes from
 * the server, sanitise it there and use <RichTextView> instead.
 */
export default function RichText(props: {
  value: string | null | undefined
  className?: string
  /** Wrapper element for plain text; HTML always renders in a div. */
  as?: "div" | "p"
}) {
  return <RichTextView {...props} value={sanitizeRich(props.value)} />
}
