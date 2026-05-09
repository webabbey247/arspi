"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Calendar, ChevronDown, ChevronRight, Clock, GraduationCap, MapPin, Monitor, Users } from "lucide-react";
import { initialsOf } from "@/lib/workshop-helpers";
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

// ── Filter checkbox group (sidebar) ──────────────────────────────────────────

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
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
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

// ── Pagination helper ───────────────────────────────────────────────────────

/** Build a windowed page list with ellipses around the current page */
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

// ── Skeleton placeholders ───────────────────────────────────────────────────

function SpotlightSkeleton() {
  return (
    <div className="grid lg:grid-cols-[1fr_340px] border border-[#0474C4]/25 rounded overflow-hidden mb-6 bg-sky-pale animate-pulse">
      <div className="p-5 sm:p-6 md:p-8 lg:p-10 order-2 lg:order-1">
        <div className="flex gap-2 mb-4 sm:mb-5 flex-wrap">
          <div className="h-6 w-16 bg-slate-200 rounded" />
          <div className="h-6 w-20 bg-slate-200 rounded" />
          <div className="h-6 w-24 bg-slate-200 rounded" />
          <div className="h-6 w-20 bg-slate-200 rounded" />
        </div>
        <div className="h-6 sm:h-7 bg-slate-200 rounded mb-2" />
        <div className="h-6 sm:h-7 w-3/4 bg-slate-200 rounded mb-4 sm:mb-5" />
        <div className="space-y-2 mb-5 sm:mb-6 max-w-lg">
          <div className="h-3.5 sm:h-4 bg-slate-200 rounded" />
          <div className="h-3.5 sm:h-4 w-11/12 bg-slate-200 rounded" />
          <div className="h-3.5 sm:h-4 w-3/4 bg-slate-200 rounded" />
        </div>
        <div className="mb-5 sm:mb-6">
          <div className="h-3 w-20 bg-slate-200 rounded mb-2" />
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-slate-200 shrink-0" />
            <div className="space-y-1.5 min-w-0">
              <div className="h-3 w-32 bg-slate-200 rounded" />
              <div className="h-3 w-24 bg-slate-200 rounded" />
            </div>
          </div>
        </div>
        <div className="flex gap-3 sm:gap-4 md:gap-6 flex-wrap mb-5 sm:mb-6">
          {[80, 120, 100, 110].map((w, i) => (
            <div key={i} className="h-3 bg-slate-200 rounded" style={{ width: w }} />
          ))}
        </div>
        <div className="h-11 sm:h-12 w-full sm:w-32 bg-slate-200 rounded" />
      </div>
      <div className="bg-[#EBF3FC] min-h-48 sm:min-h-60 lg:min-h-full order-1 lg:order-2" />
    </div>
  )
}

function WorkshopCardSkeleton() {
  return (
    <div className="bg-white/90 border border-[#0474C4]/25 rounded overflow-hidden flex flex-col animate-pulse">
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        <div className="flex gap-2 mb-3 flex-wrap">
          <div className="h-6 w-14 bg-slate-200 rounded" />
          <div className="h-6 w-20 bg-slate-200 rounded" />
          <div className="h-6 w-16 bg-slate-200 rounded" />
        </div>
        <div className="h-5 bg-slate-200 rounded mb-2" />
        <div className="h-5 w-3/4 bg-slate-200 rounded mb-2" />
        <div className="flex flex-col gap-1.5 mt-auto pt-3">
          {[140, 180, 160, 130].map((w, i) => (
            <div key={i} className="h-3 bg-slate-200 rounded max-w-full" style={{ width: w }} />
          ))}
        </div>
      </div>
      <div className="px-4 sm:px-5 py-3 sm:py-3.5 border-t border-[#0474C4]/18 bg-[#EBF3FC] flex items-center justify-between gap-3">
        <div className="h-6 w-16 bg-slate-200 rounded" />
        <div className="h-9 w-24 sm:w-28 bg-slate-200 rounded" />
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20

type DurationBucket = "LT1" | "1to3" | "3to5" | "GT5"
type DateBucket     = "PAST_60_PLUS" | "PAST_60" | "30_TO_60" | "60_PLUS"

const WorkshopPage = () => {
  // Sidebar filter state — multi-select; empty array = no filter (All)
  const [categoryFilter, setCategoryFilter] = React.useState<string[]>([])
  const [typeFilter,     setTypeFilter]     = React.useState<("FREE" | "PAID")[]>([])
  const [mediumFilter,   setMediumFilter]   = React.useState<("ONLINE" | "IN_PERSON")[]>([])
  const [durationFilter, setDurationFilter] = React.useState<DurationBucket[]>([])
  const [dateFilter,     setDateFilter]     = React.useState<DateBucket[]>([])

  const [workshops, setWorkshops] = React.useState<PublicWorkshop[]>([])
  const [loading, setLoading]     = React.useState(true)

  React.useEffect(() => {
    fetch("/api/workshops/public")
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => setWorkshops(d.workshops ?? []))
      .catch(() => setWorkshops([]))
      .finally(() => setLoading(false))
  }, [])

  const now = new Date()

  // Sort upcoming by date ascending (no-date workshops go last), past descending
  const upcoming = workshops
    .filter(w => !w.date || new Date(w.date) >= now)
    .sort((a, b) => {
      if (!a.date && !b.date) return 0
      if (!a.date) return 1
      if (!b.date) return -1
      return new Date(a.date).getTime() - new Date(b.date).getTime()
    })

  const past = workshops
    .filter(w => !!w.date && new Date(w.date) < now)
    .sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime())

  // The nearest upcoming event is always the spotlight — no "featured" flag needed
  const nearest = upcoming[0] ?? null

  // Toggle helpers: add/remove a value from a string-array filter
  function toggleIn<T extends string>(arr: T[], value: T): T[] {
    return arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]
  }

  function durationMatches(w: PublicWorkshop): boolean {
    if (durationFilter.length === 0) return true
    if (w.duration === null) return false
    return durationFilter.some(bucket => {
      if (bucket === "LT1")  return w.duration! < 1
      if (bucket === "1to3") return w.duration! >= 1 && w.duration! < 3
      if (bucket === "3to5") return w.duration! >= 3 && w.duration! < 5
      if (bucket === "GT5")  return w.duration! >= 5
      return false
    })
  }

  function dateMatches(w: PublicWorkshop): boolean {
    if (dateFilter.length === 0) return true
    if (!w.date) return false
    const wd = new Date(w.date)
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const diffDays = Math.floor((wd.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
    return dateFilter.some(b => {
      if (b === "PAST_60_PLUS") return diffDays < -60
      if (b === "PAST_60")      return diffDays >= -60 && diffDays <= 0
      if (b === "30_TO_60")     return diffDays >= 30 && diffDays <= 60
      if (b === "60_PLUS")      return diffDays > 60
      return false
    })
  }

  function passesFilters(w: PublicWorkshop): boolean {
    return (categoryFilter.length === 0 || categoryFilter.includes(w.category))
      && (typeFilter.length === 0 || typeFilter.includes(w.type as "FREE" | "PAID"))
      && (mediumFilter.length === 0 || mediumFilter.includes(w.medium as "ONLINE" | "IN_PERSON"))
      && durationMatches(w)
      && dateMatches(w)
  }

  // When a date bucket is selected, draw from all workshops (so past buckets surface past events).
  // Otherwise default to the upcoming list.
  const baseList = dateFilter.length > 0 ? workshops : upcoming
  const filteredCards     = baseList.filter(passesFilters)
  const spotlightVisible  = !!nearest && dateFilter.length === 0 && passesFilters(nearest)
  const cardWorkshops     = filteredCards.filter(w => !(spotlightVisible && nearest && w.id === nearest.id))

  const [page, setPage] = React.useState(1)
  const total            = cardWorkshops.length
  const totalPages       = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const paginated        = cardWorkshops.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const startIdx         = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const endIdx           = Math.min(page * PAGE_SIZE, total)
  const pages            = pageWindow(page, totalPages)

  // Reset to page 1 when any filter changes
  React.useEffect(() => { setPage(1) }, [
    categoryFilter, typeFilter, mediumFilter, durationFilter, dateFilter,
  ])

  const hasActiveFilter =
    categoryFilter.length > 0 || typeFilter.length > 0 || mediumFilter.length > 0 ||
    durationFilter.length > 0 || dateFilter.length > 0

  function clearFilters() {
    setCategoryFilter([])
    setTypeFilter([])
    setMediumFilter([])
    setDurationFilter([])
    setDateFilter([])
  }

  // Per-option counts — drawn from the same baseList the filter applies to,
  // so the numbers reflect what would actually surface on selection.
  const categoryOptions = (
    [
      { id: "SHORT_COURSE", label: "Short Course" },
      { id: "WEBINAR",      label: "Webinar" },
      { id: "MASTERCLASS",  label: "Masterclass" },
      { id: "CONFERENCE",   label: "Conference" },
      { id: "WORKSHOP",     label: "Workshop" },
    ] as const
  ).map(o => ({ ...o, count: baseList.filter(w => w.category === o.id).length }))

  const typeOptions = (
    [
      { id: "FREE", label: "Free" },
      { id: "PAID", label: "Paid" },
    ] as const
  ).map(o => ({ ...o, count: baseList.filter(w => w.type === o.id).length }))

  const mediumOptions = (
    [
      { id: "ONLINE",    label: "Online" },
      { id: "IN_PERSON", label: "In-Person" },
    ] as const
  ).map(o => ({ ...o, count: baseList.filter(w => w.medium === o.id).length }))

  const durationOptions: { id: DurationBucket; label: string; count: number }[] = (
    [
      { id: "LT1",  label: "< 1 hr"   },
      { id: "1to3", label: "1–3 hrs" },
      { id: "3to5", label: "3–5 hrs" },
      { id: "GT5",  label: "5+ hrs"  },
    ] as const
  ).map(o => {
    const count = baseList.filter(w => {
      if (w.duration === null) return false
      if (o.id === "LT1")  return w.duration < 1
      if (o.id === "1to3") return w.duration >= 1 && w.duration < 3
      if (o.id === "3to5") return w.duration >= 3 && w.duration < 5
      return w.duration >= 5
    }).length
    return { ...o, count }
  })

  // Date buckets always count against the full workshops list, since the past
  // buckets only make sense relative to all events (not just upcoming).
  const dateOptions: { id: DateBucket; label: string; count: number }[] = (
    [
      { id: "PAST_60_PLUS", label: "Past 60+ days"   },
      { id: "PAST_60",      label: "Past 60 days"    },
      { id: "30_TO_60",     label: "30–60 days away" },
      { id: "60_PLUS",      label: "60+ days away"   },
    ] as const
  ).map(o => {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const count = workshops.filter(w => {
      if (!w.date) return false
      const diffDays = Math.floor((new Date(w.date).getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
      if (o.id === "PAST_60_PLUS") return diffDays < -60
      if (o.id === "PAST_60")      return diffDays >= -60 && diffDays <= 0
      if (o.id === "30_TO_60")     return diffDays >= 30 && diffDays <= 60
      return diffDays > 60
    }).length
    return { ...o, count }
  })

  return (
    <>
      {/* Hero */}
        <PageHero
                  tagline="Live Learning Events"
                  captionTextOne="Workshops & "
                  highlightText="Expert Sessions"
                  captionTextTwo="Open to All"
                  description="Join ARPS Institute's live workshops and short learning events — ranging from free introductory sessions to premium in-depth boot camps. Led by expert facilitators, built for immediate application."
                  pageType="workshops"
                  imageUrl="/images/workshop-page-banner.jpg"
                />
      

      {/* Filter bar — hidden in favour of the sidebar checkboxes */}
      {/*
      <div className="sticky top-17 z-30 bg-sky-light/97 backdrop-blur border-b border-[#0474C4]/25 px-8 md:px-16 py-3 flex items-center gap-2.5 overflow-x-auto w-full">
        <span className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#637AA3] mr-2 shrink-0">
          Filter:
        </span>
        {cats.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setPill(cat.id)}
            className={`font-body text-[0.75rem] tracking-[0.05em] leading-normal font-medium px-4 py-1.5 rounded-full border transition-all whitespace-nowrap shrink-0 ${active === cat.id
                ? "bg-[#0474C4] text-[#EBF3FC] border-[#0474C4]"
                : "bg-sky-pale text-slate-500 border-[#0474C4]/25 hover:border-[#0474C4] hover:text-ink"
              }`}
          >
            {cat.label}
          </button>
        ))}
      </div>
      */}

      {/* Events */}
      <section className="bg-white px-4 sm:px-6 md:px-10 lg:px-16 py-10 sm:py-12 md:py-14 lg:py-16 w-full">
        <div className="max-w-350 mx-auto flex flex-col gap-6 sm:gap-7 md:gap-8 w-full">
          <div className="flex flex-col gap-1.5 sm:gap-2">

            <p className="font-body text-[0.6875rem] sm:text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#637AA3]">
              Coming Up
            </p>

            <h2 className="font-heading text-[1.375rem] sm:text-[1.5rem] md:text-[1.625rem] lg:text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-[#0474C4]">
              Upcoming Workshops &amp; Events
            </h2>
            <p className="font-body text-[0.8125rem] sm:text-[0.875rem] tracking-[0em] leading-[1.6] font-normal text-[#637AA3]">
              Register now to secure your seat — free events fill up fast.
            </p>

          </div>


          {/* Nearest upcoming event — spotlight (skeleton while loading) */}
          {loading && <SpotlightSkeleton />}
          {!loading && spotlightVisible && nearest && (
            <div className="grid lg:grid-cols-[1fr_340px] border border-[#0474C4]/25 rounded overflow-hidden mb-6 bg-sky-pale hover:border-[#0474C4]/50 transition-colors">
              <div className="p-5 sm:p-6 md:p-8 lg:p-10 order-2 lg:order-1">

                <div className="flex gap-1.5 sm:gap-2 mb-4 sm:mb-5 flex-wrap">
                  <Badge className={`font-body text-[0.625rem] sm:text-[0.6875rem] tracking-[0.05em] font-medium border-0 p-1.5 sm:p-2 ${nearest.type === "FREE" ? "bg-emerald-600/10 text-emerald-600" : "bg-[#0474C4]/10 text-[#0474C4]"}`}>
                    {nearest.type === "FREE" ? "Free" : "Paid"}
                  </Badge>
                  <Badge className="font-body text-[0.625rem] sm:text-[0.6875rem] tracking-[0.05em] font-medium bg-amber-500/10 text-amber-700 border-0 p-1.5 sm:p-2">
                    Next Up
                  </Badge>
                  <Badge className="font-body text-[0.625rem] sm:text-[0.6875rem] tracking-[0.05em] font-medium bg-[#FEF3C7] text-[#B45309] border-0 p-1.5 sm:p-2">
                    {CATEGORY_LABEL[nearest.category] ?? nearest.category}
                  </Badge>
                  {nearest.level && (
                    <Badge className={`font-body text-[0.625rem] sm:text-[0.6875rem] tracking-[0.05em] font-medium border-0 p-1.5 sm:p-2 ${LEVEL_COLOR[nearest.level] ?? "bg-slate-100 text-slate-600"}`}>
                      <GraduationCap className="h-3 w-3 mr-1 inline-block" />
                      {LEVEL_LABEL[nearest.level] ?? nearest.level}
                    </Badge>
                  )}
                </div>

                <h3 className="font-heading text-[1.125rem] sm:text-[1.25rem] md:text-[1.375rem] tracking-[-0.005em] leading-[1.3] font-medium text-ink mb-2.5 sm:mb-3">
                  {nearest.title}
                </h3>

                <p className="font-body text-[0.875rem] sm:text-[0.9375rem] md:text-[1rem] tracking-[-0.005em] leading-[1.7] font-normal text-slate-600 mb-5 sm:mb-6 max-w-lg line-clamp-3"  dangerouslySetInnerHTML={{ __html: nearest.description }} />

                {(nearest.facilitators.length > 0 || nearest.facilitator) && (
                  <div className="mb-5 sm:mb-6">
                    <span className="font-body text-[0.625rem] sm:text-[0.6875rem] tracking-[0.07em] uppercase font-medium text-slate-400 mb-2 block">
                      {nearest.facilitators.length > 1 ? "Facilitators" : "Facilitator"}
                    </span>
                    {nearest.facilitators.length > 0 ? (
                      <ul className="flex flex-wrap gap-x-4 sm:gap-x-5 gap-y-3">
                        {nearest.facilitators.map((f, i) => (
                          <li key={i} className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden bg-[#EBF3FC] border border-[#0474C4]/20 flex items-center justify-center shrink-0">
                              {f.image ? (
                                <Image src={f.image} alt={f.fullName} width={36} height={36} className="object-cover w-full h-full" />
                              ) : (
                                <span className="font-body text-[0.6875rem] sm:text-[0.75rem] font-semibold text-[#0474C4]">
                                  {initialsOf(f.fullName)}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-col leading-tight min-w-0">
                              <span className="font-body text-[0.8125rem] sm:text-[0.875rem] font-medium text-ink truncate">{f.fullName}</span>
                              {(f.jobTitle || f.company) && (
                                <span className="font-body text-[0.6875rem] sm:text-[0.75rem] text-slate-500 truncate">
                                  {[f.jobTitle, f.company].filter(Boolean).join(" · ")}
                                </span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="font-body text-[0.8125rem] sm:text-[0.875rem] font-medium text-ink">{nearest.facilitator}</span>
                    )}
                  </div>
                )}

                <div className="flex gap-x-4 sm:gap-x-5 md:gap-x-6 gap-y-2 sm:gap-y-3 flex-wrap mb-5 sm:mb-6">
                  {[
                    { icon: Calendar, val: fmtDate(nearest.date) },
                    { icon: Clock,    val: fmtTime(nearest.startTime, nearest.endTime, nearest.timezone) },
                    { icon: nearest.medium === "IN_PERSON" ? MapPin : Monitor, val: fmtDelivery(nearest.medium, nearest.onlinePlatform, nearest.venueCity) },
                    ...(nearest.capacity !== null
                      ? [{ icon: Users, val: `${Math.max(0, nearest.capacity - nearest.registered)} of ${nearest.capacity} seats available` }]
                      : []),
                  ].map(({ icon: Icon, val }) => (
                    <div key={val} className="flex items-center gap-2 min-w-0">
                      <Icon className="h-3.5 w-3.5 text-[#0474C4] shrink-0" />
                      <span className="font-body text-[0.8125rem] sm:text-[0.875rem] tracking-[0em] leading-normal font-normal text-slate-500">
                        {val}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 flex-wrap">
                  <Link
                    href={`/workshop/${nearest.slug}`}
                    className="inline-flex items-center justify-center gap-1 h-11 sm:h-12 rounded py-2.5 px-5 w-full sm:w-auto font-body text-[0.8125rem] sm:text-[0.875rem] tracking-[0.02em] font-medium text-[#EBF3FC] bg-[#0474C4] hover:bg-[#06457f]"
                  >
                    Learn More <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>

              </div>
              {/* Right panel — cover image */}
              <div className="relative bg-[#EBF3FC] min-h-48 sm:min-h-60 lg:min-h-full order-1 lg:order-2">
                {nearest.coverImage ? (
                  <Image
                    src={nearest.coverImage}
                    alt={nearest.title}
                    fill
                    sizes="(min-width: 1024px) 340px, 100vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-[#0474C4]/40">
                    <Calendar className="h-10 w-10 sm:h-12 sm:w-12" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Filters (left) + cards (right) — 2-col split for the rest of upcoming */}
          <div className="flex flex-col justify-start items-start w-full lg:flex-row gap-5 sm:gap-6 mt-2">

            {/* Left sidebar — w-1/4 on lg, full width on smaller */}
            <aside className="w-full lg:w-1/4 shrink-0">
              <div className="bg-transparent space-y-4 sm:space-y-5 px-0 py-2 lg:py-5 lg:sticky lg:top-32">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading text-[0.9375rem] sm:text-[1rem] tracking-[-0.005em] font-semibold text-[#0474C4]">Filters</h3>
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

                <div className="flex flex-col">
                  <FilterAccordion
                    title="Category"
                    options={categoryOptions as { id: string; label: string; count: number }[]}
                    selected={categoryFilter}
                    onToggle={(id) => setCategoryFilter(toggleIn(categoryFilter, id))}
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
                    title="Date range"
                    options={dateOptions as { id: string; label: string; count: number }[]}
                    selected={dateFilter}
                    onToggle={(id) => setDateFilter(toggleIn(dateFilter, id as DateBucket))}
                  />
                </div>
              </div>
            </aside>

            {/* Right — w-3/4 cards grid */}
            <div className="lg:w-3/4 grow w-full min-w-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <WorkshopCardSkeleton key={i} />
                  ))
                ) : paginated.length === 0 ? (
                  <div className="sm:col-span-2 bg-white flex flex-col justify-center items-center p-6 sm:p-8 md:p-10 text-center">
                    <p className="font-heading text-[0.9375rem] sm:text-[1rem] font-semibold text-ink mb-1.5">No workshops match your filters</p>
                    <p className="font-body text-[0.75rem] sm:text-[0.8125rem] text-slate-500">
                      {hasActiveFilter ? "Try clearing some filters to see more events." : "Check back soon — new events are added regularly."}
                    </p>
                  </div>
                ) : (
                  paginated.map((w) => (
                  <div
                    key={w.id}
                    className="bg-white/90 border border-[#0474C4]/25 rounded overflow-hidden hover:border-[#0474C4]/55 hover:-translate-y-0.5 transition-all flex flex-col"
                  >
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

                      <h3 className="font-heading text-[1.125rem] sm:text-[1.25rem] md:text-[1.375rem] tracking-[-0.005em] leading-[1.3] font-medium text-ink mb-2 line-clamp-2">
                        {w.title}
                      </h3>

                      <div className="flex flex-col gap-1.5 mt-auto pt-3">
                        {[
                          { icon: Calendar, val: fmtDate(w.date) },
                          { icon: Clock,    val: fmtTime(w.startTime, w.endTime, w.timezone) },
                          { icon: w.medium === "IN_PERSON" ? MapPin : Monitor, val: fmtDelivery(w.medium, w.onlinePlatform, w.venueCity) },
                          ...(w.capacity !== null
                            ? [{ icon: Users, val: `${w.capacity} seats · ${Math.max(0, w.capacity - w.registered)} remaining` }]
                            : []),
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
                      <span className={`font-heading text-[1.125rem] sm:text-[1.25rem] md:text-[1.375rem] tracking-[-0.005em] leading-[1.3] font-medium ${w.type === "FREE" ? "text-emerald-600" : "text-[#0474C4]"}`}>
                        {w.type === "FREE" ? "Free" : `$${w.fee}`}
                      </span>
                      <Link
                        href={`/workshop/${w.slug}`}
                        className="inline-flex items-center gap-1 font-body text-[0.75rem] sm:text-[0.8125rem] tracking-[0.02em] font-medium px-3 sm:px-5 py-2 sm:py-2.5 rounded bg-[#0474C4] hover:bg-[#06457f] text-white shrink-0"
                      >
                        Learn More <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                ))
                )}
              </div>

              {/* Pagination footer — Showing X-Y of N workshops + windowed pagination */}
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

      {past.length > 0 && (
        <section className="bg-[#EDF2FB] px-4 sm:px-6 md:px-10 lg:px-16 py-10 sm:py-12 md:py-14 lg:py-16 w-full">
          <div className="max-w-350 mx-auto flex flex-col gap-8 sm:gap-10 md:gap-12 w-full">

            <div className="flex flex-col gap-1.5 sm:gap-2">
              <p className="font-body text-[0.6875rem] sm:text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#637AA3]">
                Archive
              </p>
              <h2 className="font-heading text-[1.375rem] sm:text-[1.5rem] md:text-[1.625rem] lg:text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-[#0474C4]">
                Past Workshops
              </h2>
              <p className="font-body text-[0.8125rem] sm:text-[0.875rem] tracking-[0em] leading-[1.6] font-normal text-[#637AA3]">
                Recordings are available for most past events.{" "}
                <Link href="/workshop/archive" className="text-[#0474C4] hover:text-ink transition-colors">
                  Access the library →
                </Link>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {past.map((p) => (
                <div
                  key={p.id}
                  className="bg-white border border-[#0474C4]/22 rounded p-4 sm:p-4 opacity-70 hover:opacity-100 transition-opacity"
                >
                  <div className="font-body text-[0.6875rem] sm:text-[0.75rem] tracking-[0.05em] font-medium text-slate-400 mb-1.5">
                    {fmtDate(p.date)}
                  </div>
                  <div className="font-body text-[0.8125rem] sm:text-[0.875rem] tracking-[0em] leading-[1.6] font-normal text-ink mb-2 line-clamp-2">
                    {p.title}
                  </div>
                  <div className="font-body text-[0.625rem] sm:text-[0.6875rem] tracking-[0.07em] uppercase font-medium text-slate-400">
                    {p.type === "FREE" ? "Free" : "Paid"} · {CATEGORY_LABEL[p.category] ?? p.category}{p.duration !== null ? ` · ${p.duration} hrs` : ""}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>
      )}
     

    </>
  );
};

export default withLayout(WorkshopPage);
