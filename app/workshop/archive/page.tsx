"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Calendar, ChevronDown, ChevronRight, Clock, MapPin, Monitor, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import withLayout from "@/hooks/useLayout";
import type { Facilitator } from "@/lib/workshop-helpers";
import PageHero from "@/components/sections/PageHero";

type PublicWorkshop = {
  id:             string
  slug:           string
  title:          string
  description:    string
  type:           "FREE" | "PAID"
  category:       "SHORT_COURSE" | "WEBINAR" | "MASTERCLASS" | "CONFERENCE" | "WORKSHOP"
  fee:            number
  date:           string | null
  startTime:      string
  endTime:        string
  timezone:       string
  duration:       number | null
  level:          string
  facilitator:    string
  facilitators:   Facilitator[]
  medium:         string
  onlinePlatform: string | null
  onlineLink:     string | null
  venueAddress:   string | null
  venueCity:      string | null
  venueState:     string | null
  venueCountry:   string | null
  capacity:       number | null
  registered:     number
  coverImage:     string | null
  featured:       boolean
}

function fmtDate(iso: string | null) {
  if (!iso) return "TBA"
  return new Date(iso).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
}

function fmtTime(startTime: string, endTime: string, tz: string) {
  if (!startTime) return "Time TBA"
  const tzAbbr = (() => {
    try {
      return new Intl.DateTimeFormat("en-US", { timeZone: tz || "UTC", timeZoneName: "short" })
        .formatToParts(new Date()).find(p => p.type === "timeZoneName")?.value ?? tz
    } catch { return tz || "UTC" }
  })()
  return endTime ? `${startTime} – ${endTime} · ${tzAbbr}` : `${startTime} · ${tzAbbr}`
}

function fmtDelivery(medium: string, platform: string | null, city: string | null) {
  if (medium === "IN_PERSON") return city ? `In Person · ${city}` : "In Person"
  return platform ? `${platform} · Online` : "Live Online"
}

const LEVEL_LABEL: Record<string, string> = {
  ALL:          "General",
  BEGINNER:     "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED:     "Advanced",
}

const LEVEL_COLOR: Record<string, string> = {
  BEGINNER:     "bg-emerald-600/10 text-emerald-700",
  INTERMEDIATE: "bg-amber-500/10 text-amber-700",
  ADVANCED:     "bg-red-600/10 text-red-700",
}

const CATEGORY_LABEL: Record<string, string> = {
  SHORT_COURSE: "Short Course",
  WEBINAR:      "Webinar",
  MASTERCLASS:  "Masterclass",
  CONFERENCE:   "Conference",
  WORKSHOP:     "Workshop",
}

type DurationBucket = "LT1" | "1to3" | "3to5" | "GT5"
type RecencyBucket  = "PAST_30" | "PAST_30_180" | "PAST_180_365" | "PAST_365_PLUS"

const RECENCY_LABEL: Record<RecencyBucket, string> = {
  PAST_30:        "Past 30 days",
  PAST_30_180:    "1–6 months ago",
  PAST_180_365:   "6–12 months ago",
  PAST_365_PLUS:  "Over a year ago",
}

function FilterAccordion({
  title,
  options,
  selected,
  onToggle,
  defaultOpen = false,
}: {
  title:        string
  options:      { id: string; label: string; count?: number }[]
  selected:     string[]
  onToggle:     (id: string) => void
  defaultOpen?: boolean
}) {
  const [open, setOpen] = React.useState(defaultOpen)

  return (
    <div className="border-b border-[#0474C4]/12 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-3.5 cursor-pointer group"
      >
        <span className="font-body text-[0.875rem] capitalize font-semibold text-ink group-hover:text-[#0474C4] transition-colors">
          {title}
          {selected.length > 0 && (
            <span className="ml-2 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-[#0474C4]/10 text-[0.6875rem] font-semibold text-[#0474C4]">
              {selected.length}
            </span>
          )}
        </span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul className="flex flex-col gap-1.5 pb-4">
          {options.length === 0 ? (
            <li className="font-body text-[0.75rem] text-slate-400">No options available</li>
          ) : options.map(opt => {
            const checked = selected.includes(opt.id)
            return (
              <li key={opt.id}>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggle(opt.id)}
                    className="h-3.5 w-3.5 accent-[#0474C4] cursor-pointer"
                  />
                  <span className={`font-body text-[0.855rem] ${checked ? "text-ink font-medium" : "text-slate-500 group-hover:text-ink"}`}>
                    {opt.label}
                    {typeof opt.count === "number" && (
                      <span className="ml-1 text-slate-400 font-normal">({opt.count})</span>
                    )}
                  </span>
                </label>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function pageWindow(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | "…")[] = [1]
  if (current > 3) pages.push("…")
  const start = Math.max(2, current - 1)
  const end   = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) pages.push(i)
  if (current < total - 2) pages.push("…")
  pages.push(total)
  return pages
}

const PAGE_SIZE = 12

function ArchiveCardSkeleton() {
  return (
    <div className="bg-white/90 border border-[#0474C4]/22 rounded overflow-hidden flex flex-col animate-pulse">
      <div className="relative h-36 sm:h-40 bg-slate-200">
        <div className="absolute top-3 left-3 h-5 w-16 bg-white/60 rounded" />
      </div>
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        <div className="flex gap-2 mb-3 flex-wrap">
          <div className="h-6 w-14 bg-slate-200 rounded" />
          <div className="h-6 w-20 bg-slate-200 rounded" />
          <div className="h-6 w-16 bg-slate-200 rounded" />
        </div>
        <div className="h-5 bg-slate-200 rounded mb-2" />
        <div className="h-5 w-3/4 bg-slate-200 rounded mb-2" />
        <div className="flex flex-col gap-1.5 mt-auto pt-3">
          {[140, 180, 160].map((w, i) => (
            <div key={i} className="h-3 bg-slate-200 rounded max-w-full" style={{ width: w }} />
          ))}
        </div>
      </div>
      <div className="px-4 sm:px-5 py-3 sm:py-3.5 border-t border-[#0474C4]/18 bg-[#EBF3FC] flex items-center justify-between gap-3">
        <div className="h-3 w-12 bg-slate-200 rounded" />
        <div className="h-9 w-24 sm:w-28 bg-slate-200 rounded" />
      </div>
    </div>
  )
}

function durationOf(w: PublicWorkshop, bucket: DurationBucket): boolean {
  if (w.duration === null) return false
  if (bucket === "LT1")  return w.duration < 1
  if (bucket === "1to3") return w.duration >= 1 && w.duration < 3
  if (bucket === "3to5") return w.duration >= 3 && w.duration < 5
  return w.duration >= 5
}

function recencyOf(w: PublicWorkshop, bucket: RecencyBucket, now: Date): boolean {
  if (!w.date) return false
  const days = Math.floor((now.getTime() - new Date(w.date).getTime()) / (24 * 60 * 60 * 1000))
  if (bucket === "PAST_30")       return days >= 0 && days <= 30
  if (bucket === "PAST_30_180")   return days > 30 && days <= 180
  if (bucket === "PAST_180_365")  return days > 180 && days <= 365
  return days > 365
}

const WorkshopArchivePage = () => {
  const [categoryFilter, setCategoryFilter] = React.useState<string[]>([])
  const [typeFilter,     setTypeFilter]     = React.useState<("FREE" | "PAID")[]>([])
  const [mediumFilter,   setMediumFilter]   = React.useState<("ONLINE" | "IN_PERSON")[]>([])
  const [durationFilter, setDurationFilter] = React.useState<DurationBucket[]>([])
  const [recencyFilter,  setRecencyFilter]  = React.useState<RecencyBucket[]>([])

  const [workshops, setWorkshops] = React.useState<PublicWorkshop[]>([])
  const [loading, setLoading]     = React.useState(true)
  const [filtersOpen, setFiltersOpen] = React.useState(false)

  React.useEffect(() => {
    fetch("/api/workshops/public")
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => setWorkshops(d.workshops ?? []))
      .catch(() => setWorkshops([]))
      .finally(() => setLoading(false))
  }, [])

  const now = React.useMemo(() => new Date(), [])

  // Only past, dated workshops belong in the archive
  const past = React.useMemo(() => workshops
    .filter(w => !!w.date && new Date(w.date) < now)
    .sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime()),
    [workshops, now])

  function toggleIn<T extends string>(arr: T[], value: T): T[] {
    return arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]
  }

  function passesFilters(w: PublicWorkshop): boolean {
    if (categoryFilter.length > 0 && !categoryFilter.includes(w.category)) return false
    if (typeFilter.length > 0 && !typeFilter.includes(w.type as "FREE" | "PAID")) return false
    if (mediumFilter.length > 0 && !mediumFilter.includes(w.medium as "ONLINE" | "IN_PERSON")) return false
    if (durationFilter.length > 0 && !durationFilter.some(b => durationOf(w, b))) return false
    if (recencyFilter.length > 0 && !recencyFilter.some(b => recencyOf(w, b, now))) return false
    return true
  }

  const filtered = past.filter(passesFilters)

  const [page, setPage] = React.useState(1)
  const total      = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const startIdx   = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const endIdx     = Math.min(page * PAGE_SIZE, total)
  const pages      = pageWindow(page, totalPages)

  React.useEffect(() => { setPage(1) }, [
    categoryFilter, typeFilter, mediumFilter, durationFilter, recencyFilter,
  ])

  const hasActiveFilter =
    categoryFilter.length > 0 || typeFilter.length > 0 || mediumFilter.length > 0 ||
    durationFilter.length > 0 || recencyFilter.length > 0

  function clearFilters() {
    setCategoryFilter([])
    setTypeFilter([])
    setMediumFilter([])
    setDurationFilter([])
    setRecencyFilter([])
  }

  // Per-option counts derived from past workshops only (so users see what's actually available)
  const categoryOptions = (
    [
      { id: "SHORT_COURSE", label: "Short Course" },
      { id: "WEBINAR",      label: "Webinar" },
      { id: "MASTERCLASS",  label: "Masterclass" },
      { id: "CONFERENCE",   label: "Conference" },
      { id: "WORKSHOP",     label: "Workshop" },
    ] as const
  ).map(o => ({ ...o, count: past.filter(w => w.category === o.id).length }))

  const typeOptions = (
    [
      { id: "FREE", label: "Free" },
      { id: "PAID", label: "Paid" },
    ] as const
  ).map(o => ({ ...o, count: past.filter(w => w.type === o.id).length }))

  const mediumOptions = (
    [
      { id: "ONLINE",    label: "Online" },
      { id: "IN_PERSON", label: "In-Person" },
    ] as const
  ).map(o => ({ ...o, count: past.filter(w => w.medium === o.id).length }))

  const durationOptions: { id: DurationBucket; label: string; count: number }[] = (
    [
      { id: "LT1",  label: "< 1 hr"   },
      { id: "1to3", label: "1–3 hrs" },
      { id: "3to5", label: "3–5 hrs" },
      { id: "GT5",  label: "5+ hrs"  },
    ] as const
  ).map(o => ({ ...o, count: past.filter(w => durationOf(w, o.id)).length }))

  const recencyOptions: { id: RecencyBucket; label: string; count: number }[] =
    (Object.keys(RECENCY_LABEL) as RecencyBucket[]).map(id => ({
      id,
      label: RECENCY_LABEL[id],
      count: past.filter(w => recencyOf(w, id, now)).length,
    }))

  return (
    <>
      <PageHero
        tagline="Workshop Library"
        captionTextOne="Past Workshops & "
        highlightText="Recorded Sessions"
        captionTextTwo="Archive"
        description="Browse the full catalogue of ARPS Institute workshops, masterclasses, and webinars that have already taken place. Many sessions are available on demand."
        pageType="workshops"
        imageUrl="/images/about-arps.webp"
      />

      <section className="bg-white px-4 sm:px-6 md:px-10 lg:px-16 py-10 sm:py-12 md:py-14 lg:py-16 w-full">
        <div className="max-w-350 mx-auto flex flex-col gap-6 sm:gap-7 md:gap-8 w-full">

          <div className="flex flex-col gap-1.5 sm:gap-2">
            <p className="font-body text-[0.6875rem] sm:text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#637AA3]">
              Archive
            </p>
            <h2 className="font-heading text-[1.375rem] sm:text-[1.5rem] md:text-[1.625rem] lg:text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-[#0474C4]">
              Workshop Library
            </h2>
            <p className="font-body text-[0.8125rem] sm:text-[0.875rem] tracking-[0em] leading-[1.6] font-normal text-[#637AA3]">
              Filter by category, format, or recency to find a recorded session.{" "}
              <Link href="/workshop" className="text-[#0474C4] hover:text-ink transition-colors">
                ← Back to upcoming workshops
              </Link>
            </p>
          </div>

          <div className="flex flex-col justify-start items-start w-full lg:flex-row gap-5 sm:gap-6 mt-2">

            <aside className="w-full lg:w-1/4 shrink-0">
              <div className="bg-transparent space-y-4 sm:space-y-5 px-0 py-2 lg:py-5 lg:sticky lg:top-32">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading text-[0.9375rem] sm:text-[1rem] tracking-[-0.005em] font-semibold text-[#0474C4]">Filters</h3>
                    <button
                      type="button"
                      onClick={() => setFiltersOpen(o => !o)}
                      aria-expanded={filtersOpen}
                      aria-controls="archive-filter-options"
                      aria-label={filtersOpen ? "Hide filters" : "Show filters"}
                      className="sm:hidden inline-flex items-center justify-center w-8 h-8 rounded border border-[#0474C4]/25 text-[#0474C4] hover:bg-[#0474C4]/8 transition-colors cursor-pointer"
                    >
                      <SlidersHorizontal className={`h-4 w-4 transition-transform ${filtersOpen ? "rotate-90" : ""}`} />
                    </button>
                  </div>
                  {hasActiveFilter && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="font-body text-[0.6875rem] uppercase tracking-[0.07em] font-medium text-slate-500 hover:text-[#0474C4] cursor-pointer"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                <div
                  id="archive-filter-options"
                  className={`flex-col ${filtersOpen ? "flex" : "hidden"} sm:flex`}
                >
                  <FilterAccordion
                    title="Category"
                    options={categoryOptions as { id: string; label: string; count: number }[]}
                    selected={categoryFilter}
                    onToggle={(id) => setCategoryFilter(toggleIn(categoryFilter, id))}
                    defaultOpen
                  />
                  <FilterAccordion
                    title="Type"
                    options={typeOptions as { id: string; label: string; count: number }[]}
                    selected={typeFilter}
                    onToggle={(id) => setTypeFilter(toggleIn(typeFilter, id as "FREE" | "PAID"))}
                  />
                  <FilterAccordion
                    title="Medium"
                    options={mediumOptions as { id: string; label: string; count: number }[]}
                    selected={mediumFilter}
                    onToggle={(id) => setMediumFilter(toggleIn(mediumFilter, id as "ONLINE" | "IN_PERSON"))}
                  />
                  <FilterAccordion
                    title="Duration"
                    options={durationOptions as { id: string; label: string; count: number }[]}
                    selected={durationFilter}
                    onToggle={(id) => setDurationFilter(toggleIn(durationFilter, id as DurationBucket))}
                  />
                  <FilterAccordion
                    title="Recency"
                    options={recencyOptions as { id: string; label: string; count: number }[]}
                    selected={recencyFilter}
                    onToggle={(id) => setRecencyFilter(toggleIn(recencyFilter, id as RecencyBucket))}
                  />
                </div>
              </div>
            </aside>

            <div className="lg:w-3/4 grow w-full min-w-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <ArchiveCardSkeleton key={i} />
                  ))
                ) : paginated.length === 0 ? (
                  <div className="sm:col-span-2 bg-white border border-[#0474C4]/15 rounded p-6 sm:p-8 md:p-10 text-center">
                    <p className="font-heading text-[0.9375rem] sm:text-[1rem] font-semibold text-ink mb-1.5">No archived workshops match your filters</p>
                    <p className="font-body text-[0.75rem] sm:text-[0.8125rem] text-slate-500">
                      {hasActiveFilter ? "Try clearing some filters to see more sessions." : "Nothing in the archive yet — check back as workshops conclude."}
                    </p>
                  </div>
                ) : (
                  paginated.map((w) => (
                    <div
                      key={w.id}
                      className="bg-white/90 border border-[#0474C4]/22 rounded overflow-hidden hover:border-[#0474C4]/55 hover:-translate-y-0.5 transition-all flex flex-col opacity-95 hover:opacity-100"
                    >
                      <div className="relative h-36 sm:h-40 bg-[#EBF3FC]">
                        {w.coverImage ? (
                          <Image
                            src={w.coverImage}
                            alt={w.title}
                            fill
                            sizes="(min-width: 1024px) 35vw, (min-width: 640px) 50vw, 100vw"
                            className="object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-[#0474C4]/40">
                            <Calendar className="h-9 w-9 sm:h-10 sm:w-10" />
                          </div>
                        )}
                        <span className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 font-body text-[0.625rem] sm:text-[0.6875rem] tracking-[0.05em] uppercase font-medium px-2 py-1 rounded bg-white/90 text-slate-600">
                          Archived
                        </span>
                      </div>

                      <div className="p-4 sm:p-5 flex flex-col flex-1">
                        <div className="flex gap-1.5 sm:gap-2 mb-3 flex-wrap">
                          <Badge className={`font-body text-[0.625rem] sm:text-[0.6875rem] tracking-[0.05em] font-medium border-0 p-1.5 sm:p-2 ${w.type === "FREE" ? "bg-emerald-600/10 text-emerald-600" : "bg-[#0474C4]/10 text-[#0474C4]"}`}>
                            {w.type === "FREE" ? "Free" : "Paid"}
                          </Badge>
                          <Badge className="font-body text-[0.625rem] sm:text-[0.6875rem] tracking-[0.05em] font-medium bg-[#FEF3C7] text-[#B45309] border-0 p-1.5 sm:p-2">
                            {CATEGORY_LABEL[w.category] ?? w.category}
                          </Badge>
                          {w.level && (
                            <Badge className={`font-body text-[0.625rem] sm:text-[0.6875rem] tracking-[0.05em] font-medium border-0 p-1.5 sm:p-2 ${LEVEL_COLOR[w.level] ?? "bg-slate-100 text-slate-600"}`}>
                              {LEVEL_LABEL[w.level] ?? w.level}
                            </Badge>
                          )}
                        </div>

                        <h3 className="font-heading text-[1.0625rem] sm:text-[1.125rem] md:text-[1.25rem] tracking-[-0.005em] leading-[1.3] font-medium text-ink mb-2 line-clamp-2">
                          {w.title}
                        </h3>

                        <div className="flex flex-col gap-1.5 mt-auto pt-3">
                          {[
                            { icon: Calendar, val: fmtDate(w.date) },
                            { icon: Clock,    val: fmtTime(w.startTime, w.endTime, w.timezone) },
                            { icon: w.medium === "IN_PERSON" ? MapPin : Monitor, val: fmtDelivery(w.medium, w.onlinePlatform, w.venueCity) },
                          ].map(({ icon: Icon, val }) => (
                            <div key={val} className="flex items-center gap-2 min-w-0">
                              <Icon className="h-3 w-3 text-[#0474C4] shrink-0" />
                              <span className="font-body text-[0.6875rem] sm:text-[0.75rem] tracking-[0em] leading-normal font-normal text-slate-400 truncate">
                                {val}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="px-4 sm:px-5 py-3 sm:py-3.5 border-t border-[#0474C4]/18 bg-[#EBF3FC] flex items-center justify-between gap-3">
                        <span className="font-body text-[0.625rem] sm:text-[0.6875rem] tracking-[0.07em] uppercase font-medium text-slate-500 shrink-0">
                          {w.duration !== null ? `${w.duration} hrs` : "Recording"}
                        </span>
                        <Link
                          href={`/workshop/${w.slug}`}
                          className="inline-flex items-center gap-1 font-body text-[0.75rem] sm:text-[0.8125rem] tracking-[0.02em] font-medium px-3 sm:px-5 py-2 sm:py-2.5 rounded bg-[#0474C4] hover:bg-[#06457f] text-white shrink-0"
                        >
                          View Details <ChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {!loading && paginated.length > 0 && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mt-6">
                  <p className="font-body text-[0.75rem] sm:text-[0.8125rem] text-slate-500">
                    Showing <span className="font-medium text-ink">{startIdx}-{endIdx}</span>{" "}
                    of <span className="font-medium text-ink">{total}</span> {total === 1 ? "workshop" : "workshops"}
                  </p>

                  {totalPages > 1 && (
                    <div className="flex flex-wrap items-center gap-1 w-full sm:w-auto">
                      <button
                        type="button"
                        disabled={page === 1}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        className="font-body text-[0.6875rem] sm:text-[0.75rem] tracking-[0.05em] uppercase font-medium px-2.5 sm:px-3 py-1.5 rounded border border-[#0474C4]/20 text-slate-500 hover:border-[#0474C4] hover:text-[#0474C4] disabled:opacity-40 disabled:hover:border-[#0474C4]/20 disabled:hover:text-slate-500 cursor-pointer disabled:cursor-not-allowed"
                      >
                        Prev
                      </button>
                      {pages.map((p, i) =>
                        p === "…" ? (
                          <span key={`ellipsis-${i}`} className="font-body text-[0.75rem] sm:text-[0.8125rem] text-slate-400 px-1.5 sm:px-2">…</span>
                        ) : (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setPage(p)}
                            className={`min-w-7 sm:min-w-8 h-7 sm:h-8 px-1.5 sm:px-2 rounded font-body text-[0.75rem] sm:text-[0.8125rem] font-medium cursor-pointer transition-colors ${
                              p === page
                                ? "bg-[#0474C4] text-white"
                                : "border border-[#0474C4]/20 text-slate-500 hover:border-[#0474C4] hover:text-[#0474C4]"
                            }`}
                          >
                            {p}
                          </button>
                        )
                      )}
                      <button
                        type="button"
                        disabled={page === totalPages}
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        className="font-body text-[0.6875rem] sm:text-[0.75rem] tracking-[0.05em] uppercase font-medium px-2.5 sm:px-3 py-1.5 rounded border border-[#0474C4]/20 text-slate-500 hover:border-[#0474C4] hover:text-[#0474C4] disabled:opacity-40 disabled:hover:border-[#0474C4]/20 disabled:hover:text-slate-500 cursor-pointer disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default withLayout(WorkshopArchivePage)
