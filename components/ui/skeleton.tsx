import { cn } from "@/lib/utils"

/** Base shimmering block. Compose with a width/height className. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-[#F0EEE9]", className)} />
}

/** Desktop `<tbody>` loading state — `rows` shimmering bars, each spanning the full
 *  column width via `colSpan`. Drop in wherever a table currently renders a single
 *  `<tr><td colSpan={N}>Loading…</td></tr>` row. */
export function TableSkeletonRows({ colSpan, rows = 5 }: { colSpan: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b border-[#F0EEE9] last:border-none">
          <td colSpan={colSpan} className="px-4 py-3">
            <Skeleton className="h-9 w-full" />
          </td>
        </tr>
      ))}
    </>
  )
}

/** Mobile stacked-card loading state — mirrors the `md:hidden` card list markup
 *  these pages render below the table. Drop in wherever that list currently shows a
 *  single centered "Loading…" div. */
export function SkeletonCardList({ rows = 4 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-4 py-4 border-b border-[#F0EEE9] last:border-none flex flex-col gap-2.5">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </>
  )
}

/** Full-page loading state for single-record detail pages (a career, program, user,
 *  workshop, …) — a header block plus a few content blocks. Return this in place of
 *  the page's current `if (loading) return <div>Loading…</div>` early return. */
export function DetailPageSkeleton() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-350 mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Skeleton className="w-14 h-14 rounded-[12px] shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-3.5 w-1/4" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-[14px]" />)}
      </div>
      <Skeleton className="h-48 rounded-[14px]" />
    </div>
  )
}

/** Small nested loader for a sub-section within an already-loaded page (an
 *  applicants/enrollments/registrations list, etc.) — `rows` shimmering bars inside
 *  the section's own container. */
export function InlineSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="p-4 space-y-2.5">
      {Array.from({ length: rows }).map((_, i) => <Skeleton key={i} className="h-8 w-full rounded-[8px]" />)}
    </div>
  )
}

/** One label+input pair for a form skeleton. Compose several inside the field grid a
 *  settings/profile form already uses. */
export function FormFieldSkeleton() {
  return (
    <div className="flex flex-col gap-1.5">
      <Skeleton className="h-2.5 w-20" />
      <Skeleton className="h-9 w-full rounded-[10px]" />
    </div>
  )
}
