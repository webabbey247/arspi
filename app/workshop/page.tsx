"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Calendar, ChevronRight, Clock, GraduationCap, MapPin, Monitor, Users } from "lucide-react";
import { initialsOf } from "@/lib/workshop-helpers";
import { Badge } from "@/components/ui/badge";
import withLayout from "@/hooks/useLayout";
import type { Facilitator } from "@/lib/workshop-helpers";

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

function FilterCheckboxGroup({
  label,
  options,
  selected,
  onAll,
  onToggle,
}: {
  label:    string
  options:  { id: string; label: string }[]
  selected: string[]
  onAll:    () => void
  onToggle: (id: string) => void
}) {
  const isAll = selected.length === 0
  return (
    <div>
      <p className="font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium text-slate-500 mb-2">{label}</p>
      <ul className="flex flex-col gap-1.5">
        <li>
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={isAll}
              onChange={onAll}
              className="h-3.5 w-3.5 accent-[#0474C4] cursor-pointer"
            />
            <span className={`font-body text-[0.8125rem] ${isAll ? "text-ink font-medium" : "text-slate-500 group-hover:text-ink"}`}>
              All
            </span>
          </label>
        </li>
        {options.map(opt => {
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
                <span className={`font-body text-[0.8125rem] ${checked ? "text-ink font-medium text-lg" : "text-slate-500 group-hover:text-ink"}`}>
                  {opt.label}
                </span>
              </label>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

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

  return (
    <>
      {/* Hero */}
      <section className="bg-[#071639] relative overflow-hidden px-8 md:px-16 py-24 w-full">
        <div className="absolute inset-0 bg-grid-ink pointer-events-none" />
        <div className="absolute -top-24 right-0 w-125 h-125 rounded-full bg-[#0474C4]/8 blur-[100px] pointer-events-none" />
        <div className="relative z-10 max-w-190">
          <p className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#EBF3FC] inline-flex items-center gap-2">
            <span className="block w-8 h-px bg-[#EBF3FC]" />
            Live Learning Events
          </p>
      <h1 className="font-heading text-[2.25rem] md:text-[3rem] tracking-[-0.015em] md:tracking-[-0.02em] leading-[1.2] md:leading-[1.1] font-bold text-white">
            Workshops &amp;
            <em className="italic text-[#0474C4]">Expert Sessions</em>
            {/* <br />
            Open to All */}
          </h1>

          <p className="font-body text-[1.125rem] tracking-[-0.01em] leading-[1.65] font-light text-[#EBF3FC] max-w-lg">
            Join ARPS Institute&apos;s live workshops and short learning events
            — ranging from free introductory sessions to premium in-depth boot
            camps. Led by expert facilitators, built for immediate application.
          </p>
        </div>
      </section>

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
      <section className="bg-white px-8 md:px-16 py-16 w-full">
        <div className="max-w-350 mx-auto flex flex-col gap-8 w-full">
          <div className="flex flex-col gap-2">

            <p className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#637AA3]">
              Coming Up
            </p>

<h2 className="font-heading text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-[#0474C4]">
  Upcoming Workshops &amp; Events
</h2>
            <p className="font-body text-[0.875rem] tracking-[0em] leading-[1.6] font-normal text-[#637AA3]">
              Register now to secure your seat — free events fill up fast.
            </p>

          </div>


          {/* Nearest upcoming event — spotlight */}
          {spotlightVisible && nearest && (
            <div className="grid lg:grid-cols-[1fr_340px] border border-[#0474C4]/25 rounded-sm overflow-hidden mb-6 bg-sky-pale hover:border-[#0474C4]/50 transition-colors">
              <div className="p-8 md:p-10">

                <div className="flex gap-2 mb-5 flex-wrap">
                  <Badge className={`font-body text-[0.6875rem] tracking-[0.05em] font-medium border-0 p-2 ${nearest.type === "FREE" ? "bg-emerald-600/10 text-emerald-600" : "bg-[#0474C4]/10 text-[#0474C4]"}`}>
                    {nearest.type === "FREE" ? "Free" : "Paid"}
                  </Badge>
                  <Badge className="font-body text-[0.6875rem] tracking-[0.05em] font-medium bg-amber-500/10 text-amber-700 border-0 p-2">
                    Next Up
                  </Badge>
                  <Badge className="font-body text-[0.6875rem] tracking-[0.05em] font-medium bg-[#FEF3C7] text-[#B45309] border-0 p-2">
                    {CATEGORY_LABEL[nearest.category] ?? nearest.category}
                  </Badge>
                  {nearest.level && (
                    <Badge className={`font-body text-[0.6875rem] tracking-[0.05em] font-medium border-0 p-2 ${LEVEL_COLOR[nearest.level] ?? "bg-slate-100 text-slate-600"}`}>
                      <GraduationCap className="h-3 w-3 mr-1 inline-block" />
                      {LEVEL_LABEL[nearest.level] ?? nearest.level}
                    </Badge>
                  )}
                </div>

                <h3 className="font-heading text-[1.375rem] tracking-[-0.005em] leading-[1.3] font-medium text-ink mb-3">
                  {nearest.title}
                </h3>

                <p className="font-body text-[1rem] tracking-[-0.005em] leading-[1.7] font-normal text-slate-600 mb-6 max-w-lg">
                  {nearest.description}
                </p>

                {(nearest.facilitators.length > 0 || nearest.facilitator) && (
                  <div className="mb-6">
                    <span className="font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium text-slate-400 mb-2 block">
                      {nearest.facilitators.length > 1 ? "Facilitators" : "Facilitator"}
                    </span>
                    {nearest.facilitators.length > 0 ? (
                      <ul className="flex flex-wrap gap-x-5 gap-y-3">
                        {nearest.facilitators.map((f, i) => (
                          <li key={i} className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-full overflow-hidden bg-[#EBF3FC] border border-[#0474C4]/20 flex items-center justify-center shrink-0">
                              {f.image ? (
                                <Image src={f.image} alt={f.fullName} width={36} height={36} className="object-cover w-full h-full" />
                              ) : (
                                <span className="font-body text-[0.75rem] font-semibold text-[#0474C4]">
                                  {initialsOf(f.fullName)}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-col leading-tight">
                              <span className="font-body text-[0.875rem] font-medium text-ink">{f.fullName}</span>
                              {(f.jobTitle || f.company) && (
                                <span className="font-body text-[0.75rem] text-slate-500">
                                  {[f.jobTitle, f.company].filter(Boolean).join(" · ")}
                                </span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="font-body text-[0.875rem] font-medium text-ink">{nearest.facilitator}</span>
                    )}
                  </div>
                )}

                <div className="flex gap-6 flex-wrap mb-6">
                  {[
                    { icon: Calendar, val: fmtDate(nearest.date) },
                    { icon: Clock,    val: fmtTime(nearest.startTime, nearest.endTime, nearest.timezone) },
                    { icon: nearest.medium === "IN_PERSON" ? MapPin : Monitor, val: fmtDelivery(nearest.medium, nearest.onlinePlatform, nearest.venueCity) },
                    ...(nearest.capacity !== null
                      ? [{ icon: Users, val: `${Math.max(0, nearest.capacity - nearest.registered)} of ${nearest.capacity} seats available` }]
                      : []),
                  ].map(({ icon: Icon, val }) => (
                    <div key={val} className="flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5 text-[#0474C4] shrink-0" />
                      <span className="font-body text-[0.875rem] tracking-[0em] leading-normal font-normal text-slate-500">
                        {val}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 flex-wrap">
                  <Link
                    href={`/workshop/${nearest.slug}`}
                    className="inline-flex items-center h-12 rounded py-2.5 px-5 font-body text-[0.875rem] tracking-[0.02em] font-medium text-[#EBF3FC] bg-[#0474C4] hover:bg-[#06457f]"
                  >
                    Learn More <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>

              </div>
              {/* Right panel — cover image */}
              <div className="relative bg-[#EBF3FC] min-h-60 lg:min-h-full">
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
                    <Calendar className="h-12 w-12" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Filters (left) + cards (right) — 2-col split for the rest of upcoming */}
          <div className="flex flex-col lg:flex-row gap-6 mt-2">

            {/* Left sidebar — w-1/4 on lg, full width on smaller */}
            <aside className="lg:w-1/4 shrink-0">
              <div className="bg-white border border-[#0474C4]/15 rounded-sm p-5 space-y-5 lg:sticky lg:top-32">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading text-[1rem] tracking-[-0.005em] font-semibold text-[#0474C4]">Filters</h3>
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

                {/* Category */}
                <FilterCheckboxGroup
                  label="Category"
                  options={[
                    { id: "SHORT_COURSE", label: "Short Course" },
                    { id: "WEBINAR",      label: "Webinar" },
                    { id: "MASTERCLASS",  label: "Masterclass" },
                    { id: "CONFERENCE",   label: "Conference" },
                    { id: "WORKSHOP",     label: "Workshop" },
                  ]}
                  selected={categoryFilter}
                  onAll={() => setCategoryFilter([])}
                  onToggle={(id) => setCategoryFilter(toggleIn(categoryFilter, id))}
                />

                {/* Type */}
                <FilterCheckboxGroup
                  label="Type"
                  options={[
                    { id: "FREE", label: "Free" },
                    { id: "PAID", label: "Paid" },
                  ]}
                  selected={typeFilter}
                  onAll={() => setTypeFilter([])}
                  onToggle={(id) => setTypeFilter(toggleIn(typeFilter, id as "FREE" | "PAID"))}
                />

                {/* Medium */}
                <FilterCheckboxGroup
                  label="Medium"
                  options={[
                    { id: "ONLINE",    label: "Online" },
                    { id: "IN_PERSON", label: "In-Person" },
                  ]}
                  selected={mediumFilter}
                  onAll={() => setMediumFilter([])}
                  onToggle={(id) => setMediumFilter(toggleIn(mediumFilter, id as "ONLINE" | "IN_PERSON"))}
                />

                {/* Duration */}
                <FilterCheckboxGroup
                  label="Duration"
                  options={[
                    { id: "LT1",  label: "< 1 hr" },
                    { id: "1to3", label: "1–3 hrs" },
                    { id: "3to5", label: "3–5 hrs" },
                    { id: "GT5",  label: "5+ hrs" },
                  ]}
                  selected={durationFilter}
                  onAll={() => setDurationFilter([])}
                  onToggle={(id) => setDurationFilter(toggleIn(durationFilter, id as DurationBucket))}
                />

                {/* Date range */}
                <FilterCheckboxGroup
                  label="Date range"
                  options={[
                    { id: "PAST_60_PLUS", label: "Past 60+ days" },
                    { id: "PAST_60",      label: "Past 60 days" },
                    { id: "30_TO_60",     label: "30–60 days away" },
                    { id: "60_PLUS",      label: "60+ days away" },
                  ]}
                  selected={dateFilter}
                  onAll={() => setDateFilter([])}
                  onToggle={(id) => setDateFilter(toggleIn(dateFilter, id as DateBucket))}
                />
              </div>
            </aside>

            {/* Right — w-3/4 cards grid */}
            <div className="lg:w-3/4 grow">
              <div className="grid md:grid-cols-2 gap-5">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-white/90 border border-[#0474C4]/10 rounded-sm h-64 animate-pulse" />
                  ))
                ) : cardWorkshops.length === 0 ? (
                  <div className="md:col-span-2 bg-white border border-[#0474C4]/15 rounded-sm p-10 text-center">
                    <p className="font-heading text-[1rem] font-semibold text-ink mb-1.5">No workshops match your filters</p>
                    <p className="font-body text-[0.8125rem] text-slate-500">
                      {hasActiveFilter ? "Try clearing some filters to see more events." : "Check back soon — new events are added regularly."}
                    </p>
                  </div>
                ) : (
                  cardWorkshops.map((w) => (
                  <div
                    key={w.id}
                    className="bg-white/90 border border-[#0474C4]/25 rounded-sm overflow-hidden hover:border-[#0474C4]/55 hover:-translate-y-0.5 transition-all flex flex-col"
                  >
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex gap-2 mb-3 flex-wrap">
                        <Badge className={`font-body text-[0.6875rem] tracking-[0.05em] font-medium border-0 p-2 ${w.type === "FREE" ? "bg-emerald-600/10 text-emerald-600" : "bg-[#0474C4]/10 text-[#0474C4]"}`}>
                          {w.type === "FREE" ? "Free" : "Paid"}
                        </Badge>
                        <Badge className="font-body text-[0.6875rem] tracking-[0.05em] font-medium bg-[#FEF3C7] text-[#B45309] border-0 p-2">
                          {CATEGORY_LABEL[w.category] ?? w.category}
                        </Badge>
                        {w.level && (
                          <Badge className={`font-body text-[0.6875rem] tracking-[0.05em] font-medium border-0 p-2 ${LEVEL_COLOR[w.level] ?? "bg-slate-100 text-slate-600"}`}>
                            {LEVEL_LABEL[w.level] ?? w.level}
                          </Badge>
                        )}
                      </div>

                      <h3 className="font-heading text-[1.375rem] tracking-[-0.005em] leading-[1.3] font-medium text-ink mb-2">
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
                          <div key={val} className="flex items-center gap-2">
                            <Icon className="h-3 w-3 text-[#0474C4] shrink-0" />
                            <span className="font-body text-[0.75rem] tracking-[0em] leading-normal font-normal text-slate-400">
                              {val}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="px-5 py-3.5 border-t border-[#0474C4]/18 bg-[#EBF3FC] flex items-center justify-between">
                      <span className={`font-heading text-[1.375rem] tracking-[-0.005em] leading-[1.3] font-medium ${w.type === "FREE" ? "text-emerald-600" : "text-[#0474C4]"}`}>
                        {w.type === "FREE" ? "Free" : `$${w.fee}`}
                      </span>
                      <Link
                        href={`/workshop/${w.slug}`}
                        className="inline-flex items-center font-body text-[0.8125rem] tracking-[0.02em] font-medium px-5 py-2.5 rounded-sm bg-[#0474C4] hover:bg-[#06457f] text-white"
                      >
                        Learn More <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                ))
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Past events — hidden */}
      {/*
      {past.length > 0 && (
        <section className="bg-[#EDF2FB] px-8 md:px-16 py-16 w-full">
          <div className="max-w-350 mx-auto flex flex-col gap-12 w-full">

            <div className="flex flex-col gap-2">
              <p className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#637AA3]">
                Archive
              </p>
              <h2 className="font-heading text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-[#0474C4]">
                Past Workshops
              </h2>
              <p className="font-body text-[0.875rem] tracking-[0em] leading-[1.6] font-normal text-[#637AA3]">
                Recordings are available for most past events.{" "}
                <Link href="#" className="text-[#0474C4] hover:text-ink transition-colors">
                  Access the library →
                </Link>
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {past.map((p) => (
                <div
                  key={p.id}
                  className="bg-white border border-[#0474C4]/22 rounded-sm p-4 opacity-70 hover:opacity-100 transition-opacity"
                >
                  <div className="font-body text-[0.75rem] tracking-[0.05em] font-medium text-slate-400 mb-1.5">
                    {fmtDate(p.date)}
                  </div>
                  <div className="font-body text-[0.875rem] tracking-[0em] leading-[1.6] font-normal text-ink mb-2">
                    {p.title}
                  </div>
                  <div className="font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium text-slate-400">
                    {p.type === "FREE" ? "Free" : "Paid"} · {CATEGORY_LABEL[p.category] ?? p.category}{p.duration !== null ? ` · ${p.duration} hrs` : ""}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>
      )}
      */}

    </>
  );
};

export default withLayout(WorkshopPage);
