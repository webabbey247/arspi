import { cn } from "@/lib/utils"
import { publicPreviewHref, studentPreviewHref } from "@/lib/program-preview-links"

/**
 * "Preview as: Public | Student" — for admins and instructors on a programme's
 * dashboard page. The public view opens in a new tab (it's the real site, in
 * Draft Mode); the student view opens the read-only player in place.
 *
 * Plain anchors on purpose: the public link must hit its route handler to set
 * the Draft Mode cookie, and a <Link> prefetch would skip or pre-empt that.
 */
export default function PreviewAsSwitch({
  slug, role, tone = "light", className,
}: {
  slug: string
  role: "ADMIN" | "INSTRUCTOR"
  /** "dark" for the admin page's dark header bar. */
  tone?: "light" | "dark"
  className?: string
}) {
  const dark = tone === "dark"
  const item = cn(
    "px-2.5 py-1 rounded-[7px] text-[12px] font-semibold transition-colors no-underline whitespace-nowrap",
    dark ? "text-white/80 hover:text-white hover:bg-white/10" : "text-[#69708A] hover:text-[#6655DF] hover:bg-white",
  )
  return (
    <nav
      aria-label="Preview programme as"
      className={cn(
        "inline-flex items-center gap-0.5 p-0.5 rounded-[9px]",
        dark ? "bg-white/10" : "bg-[#F0EFFA] border border-[#DFE2ED]",
        className,
      )}
    >
      <span className={cn("px-2 text-[11px] font-bold uppercase tracking-[0.08em]", dark ? "text-white/60" : "text-[#8A90A6]")}>
        Preview as
      </span>
      <a href={publicPreviewHref(slug)} target="_blank" rel="noopener" className={item}>Public</a>
      <a href={studentPreviewHref(role, slug)} className={item}>Student</a>
    </nav>
  )
}
