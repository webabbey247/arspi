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

/** Loading state for the student course player. Mirrors that page's real
 *  structure — dark chrome bar, media stage, lesson header, tab row and the
 *  course-content rail — so the layout doesn't jump when the data lands.
 *  `bg-white/10` overrides the base tint on the dark surfaces (cn() runs
 *  tailwind-merge, so the later background wins). */
export function CoursePlayerSkeleton() {
  return (
    <div className="h-full flex flex-col bg-[#0B0E24]">

      {/* Top bar */}
      <div className="shrink-0 h-14 flex items-center gap-3 px-3 sm:px-4 bg-[#12163A] border-b border-white/10">
        <Skeleton className="h-5 w-24 bg-white/10" />
        <Skeleton className="h-4 flex-1 max-w-80 bg-white/10" />
        <Skeleton className="h-8 w-8 rounded-full bg-white/10 shrink-0" />
        <Skeleton className="hidden sm:block h-4 w-24 bg-white/10 shrink-0" />
      </div>

      <div className="flex-1 flex min-h-0">

        {/* Stage column */}
        <div className="flex-1 min-w-0 overflow-hidden bg-[#F5F6FB]">
          <div className="w-full aspect-[21/7] min-h-45 bg-[#171C35] flex items-end p-5 sm:p-8">
            <div className="w-full space-y-3">
              <Skeleton className="h-3 w-48 bg-white/10" />
              <Skeleton className="h-9 w-2/3 bg-white/10" />
              <Skeleton className="h-6 w-40 rounded-full bg-white/10" />
            </div>
          </div>

          <div className="bg-white border-b border-[#DFE2ED]">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0 space-y-2.5">
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-9 w-36 rounded-[10px] shrink-0" />
            </div>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 flex gap-5 pb-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-4 w-20" />)}
            </div>
          </div>

          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-28 w-full rounded-[12px] mt-5" />
          </div>
        </div>

        {/* Course-content rail */}
        <div className="hidden lg:flex w-95 shrink-0 flex-col border-l border-[#DFE2ED] bg-white">
          <div className="shrink-0 h-12 flex items-center justify-between gap-2 px-4 border-b border-[#DFE2ED]">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-10" />
          </div>
          <div className="shrink-0 px-3.5 py-2.5 border-b border-[#DFE2ED]">
            <Skeleton className="h-8 w-full rounded-[9px]" />
          </div>
          <div className="flex-1 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="px-4 py-3 border-b border-[#F0EFFA] space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-24" />
                {/* First section renders expanded, matching the real rail. */}
                {i === 0 && (
                  <div className="pt-2 space-y-3">
                    {Array.from({ length: 3 }).map((_, j) => (
                      <div key={j} className="flex items-start gap-2.5">
                        <Skeleton className="h-4 w-4 rounded-[4px] mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/** Loading state for the student "My Learning" page. Mirrors its real
 *  structure — page title, resume hero, stat strip, filter/search toolbar and
 *  the card grid — so nothing re-flows once the enrolments land. */
export function MyLearningSkeleton() {
  return (
    <div className="max-w-350 mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

      {/* Page header */}
      <div className="mb-6 space-y-2.5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>

      {/* Resume hero */}
      <Skeleton className="h-55 w-full rounded-[20px] mb-6" />

      {/* Stat strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-[14px] border border-[#DFE2ED] bg-white px-4 py-3.5 flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-[11px] shrink-0" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-5 w-10" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-5">
        <div className="flex items-center gap-1.5">
          {["w-18", "w-24", "w-22", "w-23", "w-21"].map((w, i) => (
            <Skeleton key={i} className={`h-9 rounded-full ${w}`} />
          ))}
        </div>
        <div className="lg:ml-auto flex items-center gap-2">
          <Skeleton className="h-9.5 w-full lg:w-60 rounded-[10px]" />
          <Skeleton className="h-9.5 w-36 rounded-[10px] shrink-0" />
          <Skeleton className="h-9.5 w-18 rounded-[10px] shrink-0" />
        </div>
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-[16px] border border-[#DFE2ED] bg-white overflow-hidden flex flex-col">
            <Skeleton className="w-full aspect-video rounded-none" />
            <div className="px-4 pt-3.5 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="h-3 w-2/5" />
            </div>
            <div className="px-4 pb-4 pt-3 mt-auto space-y-2">
              <Skeleton className="h-1.5 w-full rounded-full" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3.5 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Loading state for the student dashboard home. Mirrors its real structure —
 *  greeting, stat row, continue hero + progress panel, activity feed, and the
 *  schedule row — so the layout holds steady while the data arrives. */
export function StudentHomeSkeleton() {
  return (
    <div className="max-w-350 mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

      {/* Greeting */}
      <div className="mb-8 space-y-2.5">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-10 w-80 max-w-full" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 mt-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="relative rounded-[16px] border border-[#DFE2ED] bg-white px-4 pt-7 pb-4">
            <Skeleton className="absolute -top-3.5 left-4 w-9 h-9 rounded-[11px]" />
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-4 w-28 mt-2.5" />
            <Skeleton className="h-3 w-24 mt-2" />
          </div>
        ))}
      </div>

      {/* Hero + progress + activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <Skeleton className="h-45 w-full rounded-[18px]" />
          <div className="rounded-[18px] border border-[#DFE2ED] bg-white p-5 space-y-5">
            <div className="flex items-center gap-6">
              <Skeleton className="w-28 h-28 rounded-full shrink-0" />
              <div className="grid grid-cols-3 gap-3 flex-1">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-[12px]" />)}
              </div>
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[18px] border border-[#DFE2ED] bg-white p-5 space-y-4">
          <Skeleton className="h-4 w-28" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="w-7 h-7 rounded-full shrink-0" />
              <div className="flex-1 min-w-0 space-y-1.5">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Schedule row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton className="lg:col-span-2 h-64 rounded-[18px]" />
        <Skeleton className="h-64 rounded-[18px]" />
      </div>
    </div>
  )
}
