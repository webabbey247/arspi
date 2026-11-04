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

/** Loading state for My Workshops. Mirrors the page: header, next-up
 *  spotlight, the activity card (hero figure + segmented bar + figures), the
 *  filter toolbar and the card grid. */
export function MyWorkshopsSkeleton() {
  return (
    <div className="max-w-350 mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="mb-6 space-y-2.5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>

      {/* Next-up spotlight */}
      <Skeleton className="h-45 w-full rounded-[20px] mb-6" />

      {/* Activity card */}
      <div className="rounded-[18px] border border-[#DFE2ED] bg-white overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-[#F0EFFA] flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-52" />
          </div>
          <div className="hidden sm:flex -space-x-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="w-10 h-10 rounded-[10px]" />)}
          </div>
        </div>
        <div className="px-5 py-5 grid gap-6 lg:grid-cols-[auto_1fr_auto] lg:items-center">
          <div className="space-y-2.5">
            <Skeleton className="h-12 w-20" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div>
            <Skeleton className="h-2 w-full rounded-full" />
            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-4 w-28" />)}
            </div>
          </div>
          <div className="flex gap-3">
            {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-16 w-24 rounded-[12px]" />)}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-5">
        <div className="flex gap-1.5">
          {["w-16", "w-24", "w-22", "w-24"].map((w, i) => (
            <Skeleton key={i} className={`h-9 rounded-full ${w}`} />
          ))}
        </div>
        <div className="lg:ml-auto flex items-center gap-2">
          <Skeleton className="h-9.5 w-full lg:w-60 rounded-[10px]" />
          <Skeleton className="h-9.5 w-28 rounded-[10px] shrink-0" />
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-[16px] border border-[#DFE2ED] bg-white overflow-hidden flex flex-col">
            <Skeleton className="w-full aspect-video rounded-none" />
            <div className="px-4 pt-3.5 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-2/5" />
            </div>
            <div className="px-4 pt-3 grid grid-cols-2 gap-3">
              {Array.from({ length: 2 }).map((_, j) => (
                <div key={j} className="space-y-1.5">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
            <div className="px-4 py-3.5 mt-3 flex gap-2">
              <Skeleton className="h-9 flex-1 rounded-[10px]" />
              <Skeleton className="h-9 flex-1 rounded-[10px]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Loading state for My Certificates — the dark hero, the search field and the
 *  certificate grid, matching the real card's two-part face/actions split. */
export function MyCertificatesSkeleton() {
  return (
    <div className="max-w-350 mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Hero */}
      <div className="relative rounded-[22px] overflow-hidden mb-6 px-5 sm:px-8 py-7 sm:py-9 bg-[#171C35]">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="space-y-2.5">
            <Skeleton className="h-3 w-20 bg-white/10" />
            <Skeleton className="h-10 w-72 max-w-full bg-white/10" />
            <Skeleton className="h-4 w-96 max-w-full bg-white/10" />
          </div>
          <div className="flex gap-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-26 rounded-[14px] bg-white/10" />
            ))}
          </div>
        </div>
        <Skeleton className="h-8 w-72 max-w-full rounded-full mt-5 bg-white/10" />
      </div>

      <Skeleton className="h-9.5 w-full sm:w-72 rounded-[10px] mb-5" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-[18px] border border-[#DFE2ED] bg-white overflow-hidden flex flex-col">
            {/* Certificate face */}
            <div className="px-5 pt-5 pb-6 bg-[#171C35] space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-40 bg-white/10" />
                  <Skeleton className="h-3 w-16 bg-white/10" />
                </div>
                <Skeleton className="w-12 h-12 rounded-full bg-white/10" />
              </div>
              <Skeleton className="h-5 w-11/12 bg-white/10" />
              <Skeleton className="h-5 w-2/3 bg-white/10" />
              <div className="flex gap-4 pt-3">
                {Array.from({ length: 2 }).map((_, j) => <Skeleton key={j} className="h-8 w-24 bg-white/10" />)}
              </div>
            </div>
            {/* Actions */}
            <div className="px-4 py-3.5 flex items-center gap-2 mt-auto">
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
              {Array.from({ length: 2 }).map((_, j) => <Skeleton key={j} className="w-9 h-9 rounded-[10px] shrink-0" />)}
              <Skeleton className="h-9 w-16 rounded-[10px] shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Settings while it loads: page header, the identity banner (aurora strip,
 *  avatar overlapping it, name and four facts), the tab switch, then the
 *  "Profile" panel's two columns — at-a-glance beside the contact tiles. */
export function SettingsSkeleton() {
  return (
    <div className="w-full">
      <div className="px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        <div className="max-w-400 mx-auto space-y-2.5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 pb-10 pt-5">
        <div className="max-w-400 mx-auto">

          {/* Identity banner */}
          <div className="overflow-hidden rounded-[16px] border border-[#DFE2ED] bg-white">
            <div className="h-24 bg-[#0E1230]" />
            <div className="px-4 sm:px-5 pb-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex min-w-0 items-end gap-4">
                  <Skeleton className="relative z-10 -mt-8 h-16 w-16 shrink-0 rounded-[18px] ring-4 ring-white" />
                  <div className="min-w-0 pb-0.5 space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-6 w-48 max-w-full" />
                      <Skeleton className="h-6 w-24 rounded-full" />
                    </div>
                    <Skeleton className="h-3.5 w-44 max-w-full" />
                  </div>
                </div>
                <Skeleton className="h-9 w-32 shrink-0 self-start rounded-[10px] sm:self-auto" />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4 border-t border-[#F0EFFA] pt-4 sm:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="min-w-0 space-y-2">
                    <Skeleton className="h-2.5 w-16" />
                    <Skeleton className="h-4 w-24 max-w-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-5 flex w-full gap-1 rounded-[14px] border border-[#DFE2ED] bg-white p-1 sm:inline-flex sm:w-auto">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="min-w-0 flex-1 rounded-[11px] px-3 py-2 sm:w-36 sm:flex-none sm:px-4 space-y-1.5">
                <Skeleton className="h-3.5 w-20 max-w-full" />
                <Skeleton className="h-3 w-28 max-w-full" />
              </div>
            ))}
          </div>

          {/* Profile panel */}
          <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
            {[0, 1].map(col => (
              <div key={col} className="rounded-[16px] border border-[#DFE2ED] bg-white overflow-hidden">
                <div className="flex items-start gap-3 px-4 sm:px-5 py-4 border-b border-[#F0EFFA]">
                  <Skeleton className="h-9 w-9 shrink-0 rounded-[11px]" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-44 max-w-full" />
                  </div>
                  {col === 0 && <Skeleton className="h-22 w-22 rounded-full shrink-0" />}
                </div>
                <div className="px-4 sm:px-5 py-5">
                  {col === 0 ? (
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="min-w-0 space-y-2">
                          <Skeleton className="h-2.5 w-16" />
                          <Skeleton className="h-4 w-24 max-w-full" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid gap-2.5">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full rounded-[12px]" />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
