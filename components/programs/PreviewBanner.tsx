import { cn } from "@/lib/utils"
import {
  exitPublicPreviewHref, publicPreviewHref, staffProgramHref, studentPreviewHref,
} from "@/lib/program-preview-links"

/**
 * The bar across the top of every "preview as…" view. Says what you're
 * looking at, switches between the public and student views, and gets you out.
 *
 * Plain anchors, not <Link>: the public option goes through a route handler
 * that sets the Draft Mode cookie, which client-side navigation or a prefetch
 * would skip (or, for the exit link, fire early and switch preview off).
 * No hooks, so it renders on both the server page and the client player.
 */
export default function PreviewBanner({
  slug, role, current, isDraft,
}: {
  slug: string
  role: string
  current: "public" | "student"
  /** The programme isn't published yet — say so on the public view. */
  isDraft?: boolean
}) {
  const exitHref = current === "public" ? exitPublicPreviewHref(slug) : staffProgramHref(role, slug)
  const tab = (active: boolean) => cn(
    "px-3 py-1 rounded-[7px] text-[12px] font-bold transition-colors no-underline",
    active ? "bg-white text-[#2C2368]" : "text-white/80 hover:text-white hover:bg-white/10",
  )

  return (
    <div
      role="region" aria-label="Preview mode"
      className="w-full shrink-0 bg-[linear-gradient(90deg,#2C2368,#6655DF)] text-white px-3 sm:px-4 py-2 flex flex-wrap items-center gap-x-3 gap-y-2"
    >
      <span className="text-[11px] tracking-[0.12em] uppercase font-extrabold text-white/70">Preview</span>
      <nav aria-label="Preview as" className="flex items-center gap-0.5 p-0.5 rounded-[9px] bg-white/10">
        <a href={publicPreviewHref(slug)} aria-current={current === "public" ? "page" : undefined} className={tab(current === "public")}>
          Public visitor
        </a>
        <a href={studentPreviewHref(role, slug)} aria-current={current === "student" ? "page" : undefined} className={tab(current === "student")}>
          Student
        </a>
      </nav>
      <span className="text-[12px] text-white/80 min-w-0">
        {current === "public"
          ? isDraft ? "This programme is a draft — the public can't see it yet." : "Showing the latest content, as the public sees it."
          : "Read-only: all chapters unlocked, nothing is saved or submitted."}
      </span>
      <a href={exitHref} className="ml-auto text-[12px] font-bold text-white underline underline-offset-2 hover:text-white/80">
        Exit preview
      </a>
    </div>
  )
}
