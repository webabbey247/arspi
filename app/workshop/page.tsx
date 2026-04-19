"use client";

import * as React from "react";
import Link from "next/link";
import { Calendar, ChevronRight, Clock, DollarSign, GraduationCap, MapPin, Monitor, User, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import withLayout from "@/hooks/useLayout";
import WorkshopRegistrationForm from "@/components/forms/WorkshopRegistrationForm";

type PublicWorkshop = {
  id:             string
  title:          string
  description:    string
  type:           "FREE" | "PAID"
  category:       "SHORT_COURSE" | "WEBINAR" | "MASTERCLASS" | "CONFERENCE" | "WORKSHOP"
  fee:            number
  date:           string | null
  startTime:      string
  endTime:        string
  timezone:       string
  duration:       number
  level:          string
  facilitator:    string
  medium:         string
  onlinePlatform: string | null
  onlineLink:     string | null
  venueAddress:   string | null
  venueCity:      string | null
  venueState:     string | null
  venueCountry:   string | null
  capacity:       number
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
  BEGINNER:     "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED:     "Advanced",
}

const LEVEL_COLOR: Record<string, string> = {
  BEGINNER:     "bg-emerald-600/10 text-emerald-700",
  INTERMEDIATE: "bg-amber-500/10 text-amber-700",
  ADVANCED:     "bg-red-600/10 text-red-700",
}

const cats = [
  { id: "all",          label: "All Events"   },
  { id: "free",         label: "Free"         },
  { id: "paid",         label: "Paid"         },
  { id: "SHORT_COURSE", label: "Short Course" },
  { id: "WEBINAR",      label: "Webinar"      },
  { id: "MASTERCLASS",  label: "Masterclass"  },
  { id: "CONFERENCE",   label: "Conference"   },
  { id: "WORKSHOP",     label: "Workshop"     },
]

const CATEGORY_LABEL: Record<string, string> = {
  SHORT_COURSE: "Short Course",
  WEBINAR:      "Webinar",
  MASTERCLASS:  "Masterclass",
  CONFERENCE:   "Conference",
  WORKSHOP:     "Workshop",
}

// ── Workshop Detail Modal ────────────────────────────────────────────────────

function WorkshopDetailModal({
  workshop,
  onClose,
  onRegister,
}: {
  workshop: PublicWorkshop
  onClose:    () => void
  onRegister: (w: PublicWorkshop) => void
}) {
  const isPaid = workshop.fee > 0

  return (
    <div
      className="fixed inset-0 bg-[#181C2C]/70 z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-[#EBF3FC] rounded-lg w-full max-w-2xl shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#0474C4] p-7 flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex gap-2 flex-wrap">
              <Badge className={`font-body text-[0.6875rem] tracking-[0.05em] font-medium border-0 p-2 ${isPaid ? "bg-white/20 text-white" : "bg-emerald-400/20 text-emerald-100"}`}>
                {isPaid ? "Paid" : "Free"}
              </Badge>
              <Badge className="font-body text-[0.6875rem] tracking-[0.05em] font-medium bg-white/15 text-white/80 border-0 p-2">
                {CATEGORY_LABEL[workshop.category] ?? workshop.category}
              </Badge>
              {workshop.level && (
                <Badge className="font-body text-[0.6875rem] tracking-[0.05em] font-medium bg-white/15 text-white/80 border-0 p-2">
                  <GraduationCap className="h-3 w-3 mr-1 inline-block" />
                  {LEVEL_LABEL[workshop.level] ?? workshop.level}
                </Badge>
              )}
            </div>
            <h2 className="font-heading text-[1.5rem] tracking-[-0.01em] leading-tight font-semibold text-white">
              {workshop.title}
            </h2>
            <p className="font-body text-[0.8125rem] text-white/70">
              {fmtDate(workshop.date)} · {fmtTime(workshop.startTime, workshop.endTime, workshop.timezone)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/40 hover:text-white bg-white/10 hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition-colors shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-7 flex flex-col gap-6">
          {/* Description */}
          <p className="font-body text-[0.9375rem] leading-[1.7] text-slate-600">
            {workshop.description}
          </p>

          {/* Key details grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { icon: Calendar, label: "Date",       value: fmtDate(workshop.date) },
              { icon: Clock,    label: "Time",       value: fmtTime(workshop.startTime, workshop.endTime, workshop.timezone) },
              { icon: workshop.medium === "IN_PERSON" ? MapPin : Monitor,
                                label: "Delivery",   value: fmtDelivery(workshop.medium, workshop.onlinePlatform, workshop.venueCity) },
              { icon: GraduationCap, label: "Level", value: LEVEL_LABEL[workshop.level] ?? workshop.level },
              { icon: User,     label: "Facilitator",value: workshop.facilitator || "TBA" },
              { icon: Clock,    label: "Duration",   value: `${workshop.duration} hrs` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-white rounded-md px-4 py-3 flex flex-col gap-0.5 border border-[#0474C4]/12">
                <span className="font-body text-[0.6875rem] tracking-[0.06em] uppercase font-medium text-slate-400 flex items-center gap-1.5">
                  <Icon className="h-3 w-3 text-[#0474C4]" />
                  {label}
                </span>
                <span className="font-body text-[0.875rem] font-medium text-ink leading-snug">
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* Capacity bar */}
          <div className="bg-white rounded-md px-4 py-3 border border-[#0474C4]/12">
            <div className="flex justify-between items-center mb-2">
              <span className="font-body text-[0.75rem] tracking-[0.06em] uppercase font-medium text-slate-400 flex items-center gap-1.5">
                <Users className="h-3 w-3 text-[#0474C4]" /> Availability
              </span>
              <span className="font-body text-[0.75rem] font-medium text-slate-500">
                {workshop.registered} / {workshop.capacity} registered
              </span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0474C4] rounded-full transition-all"
                style={{ width: `${workshop.capacity > 0 ? Math.min(100, Math.round((workshop.registered / workshop.capacity) * 100)) : 0}%` }}
              />
            </div>
            <p className="font-body text-[0.75rem] text-slate-400 mt-1.5">
              {Math.max(0, workshop.capacity - workshop.registered)} seats remaining
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-7 pb-7 pt-4 border-t border-[#0474C4]/15 flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="font-body text-[0.75rem] text-slate-400">Registration fee</span>
            <span className={`font-heading text-[1.375rem] font-semibold tracking-[-0.01em] ${isPaid ? "text-[#0474C4]" : "text-emerald-600"}`}>
              {isPaid ? `$${workshop.fee}` : "Free"}
            </span>
          </div>
          <Button
            className={`h-12 rounded-[32px] py-2.5 px-6 font-body text-[0.875rem] tracking-[0.02em] font-medium text-white ${
              isPaid ? "bg-[#0474C4] hover:bg-[#06457f]" : "bg-emerald-600 hover:bg-emerald-700"
            }`}
            onClick={() => {
              onClose()
              onRegister(workshop)
            }}
          >
            {isPaid ? "Enrol Now" : "Register Free"}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

const WorkshopPage = () => {
  const [active, setActive]       = React.useState("all")
  const [modalOpen, setModalOpen] = React.useState(false)
  const [modalEvent, setModalEvent] = React.useState<PublicWorkshop | null>(null)
  const [detailOpen, setDetailOpen]       = React.useState(false)
  const [detailWorkshop, setDetailWorkshop] = React.useState<PublicWorkshop | null>(null)
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

  const visible = active === "all"
    ? upcoming
    : upcoming.filter(w => {
        if (active === "free") return w.type === "FREE"
        if (active === "paid") return w.type === "PAID"
        return w.category === active
      })

  function openDetail(w: PublicWorkshop) {
    setDetailWorkshop(w)
    setDetailOpen(true)
  }

  function openRegistration(w: PublicWorkshop) {
    setModalEvent(w)
    setModalOpen(true)
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
            <br />
            Open to All
          </h1>

          <p className="font-body text-[1.125rem] tracking-[-0.01em] leading-[1.65] font-light text-[#EBF3FC] max-w-lg">
            Join ARPS Institute&apos;s live workshops and short learning events
            — ranging from free introductory sessions to premium in-depth boot
            camps. Led by expert facilitators, built for immediate application.
          </p>
        </div>
      </section>

      {/* Filter bar */}
      <div className="sticky top-17 z-30 bg-sky-light/97 backdrop-blur border-b border-[#0474C4]/25 px-8 md:px-16 py-3 flex items-center gap-2.5 overflow-x-auto w-full">
        <span className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#637AA3] mr-2 shrink-0">
          Filter:
        </span>
        {cats.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActive(cat.id)}
            className={`font-body text-[0.75rem] tracking-[0.05em] leading-normal font-medium px-4 py-1.5 rounded-full border transition-all whitespace-nowrap shrink-0 ${active === cat.id
                ? "bg-[#0474C4] text-[#EBF3FC] border-[#0474C4]"
                : "bg-sky-pale text-slate-500 border-[#0474C4]/25 hover:border-[#0474C4] hover:text-ink"
              }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

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
          {nearest && (
            active === "all" ||
            (active === "free" && nearest.type === "FREE") ||
            (active === "paid" && nearest.type === "PAID") ||
            active === nearest.category
          ) && (
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

                <div className="flex gap-6 flex-wrap mb-6">
                  {[
                    { icon: Calendar, val: fmtDate(nearest.date) },
                    { icon: Clock,    val: fmtTime(nearest.startTime, nearest.endTime, nearest.timezone) },
                    { icon: nearest.medium === "IN_PERSON" ? MapPin : Monitor, val: fmtDelivery(nearest.medium, nearest.onlinePlatform, nearest.venueCity) },
                    { icon: Users,    val: `${nearest.capacity} Seats Available` },
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
                  <Button
                    className="h-12 rounded-[32px] py-2.5 px-5 font-body text-[0.875rem] tracking-[0.02em] font-medium text-[#EBF3FC] bg-[#0474C4] hover:bg-[#06457f]"
                    onClick={() => openRegistration(nearest)}
                  >
                    {nearest.type === "FREE" ? "Register Free" : "Enrol Now"} <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

              </div>
              {/* Right panel */}
              <div className="bg-[#0474C4] p-8 flex flex-col">
                <div className="font-heading text-[3rem] tracking-[-0.02em] leading-[1.1] font-bold text-[#A8C4EC]">
                  {nearest.date ? new Date(nearest.date).getDate().toString().padStart(2, "0") : "—"}
                </div>

                <div className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-white/35 mb-6">
                  {nearest.date
                    ? new Date(nearest.date).toLocaleDateString("en-GB", { month: "long", year: "numeric" })
                    : "Date TBA"}
                </div>

                <div className="flex flex-col gap-3 mb-6 flex-1">
                  {[
                    { icon: Clock,      label: "Duration", value: nearest.duration    },
                    { icon: User,       label: "Level",    value: nearest.level },
                    { icon: DollarSign, label: "Fee",      value: nearest.type === "FREE" ? "Free" : `$${nearest.fee}` },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-md bg-white/10 border border-[#0474C4]/15 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="h-3 w-3 text-white" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-body text-[0.6875rem] capitalize tracking-[0.05em] font-medium text-white/60">
                          {label}
                        </span>
                        <span className="font-body text-[0.875rem] capitalize tracking-[0em] leading-[1.6] font-normal text-white/80">
                          {label === "Duration" ? `${value} hrs` : value}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mb-4">
                  <div className="flex justify-between mb-1.5">
                    <span className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-white/80">
                      Registered
                    </span>
                    <span className="font-body text-[0.75rem] tracking-[0.07em] font-medium text-white/80">
                      {nearest.capacity > 0 ? Math.round((nearest.registered / nearest.capacity) * 100) : 0}%
                    </span>
                  </div>
                  <div className="h-1 bg-white/8 rounded-full">
                    <div
                      className="h-full bg-[#EBF3FC]/40 rounded-full"
                      style={{ width: `${nearest.capacity > 0 ? Math.round((nearest.registered / nearest.capacity) * 100) : 0}%` }}
                    />
                  </div>
                  <div className="font-body text-[0.75rem] tracking-[0em] leading-normal font-normal text-white/80 mt-1">
                    {nearest.registered} of {nearest.capacity} seats registered
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Events grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white/90 border border-[#0474C4]/10 rounded-sm h-64 animate-pulse" />
              ))
            ) : (
              visible
                .filter(w => !(nearest && w.id === nearest.id && (
                  active === "all" ||
                  (active === "free" && nearest.type === "FREE") ||
                  (active === "paid" && nearest.type === "PAID") ||
                  active === nearest.category
                )))
                .map((w) => (
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
                          { icon: Users,    val: `${w.capacity} seats · ${w.capacity - w.registered} remaining` },
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
                      <Button
                        className="font-body text-[0.8125rem] tracking-[0.02em] font-medium px-5 py-2.5 rounded-sm bg-[#0474C4] hover:bg-[#06457f] text-white"
                        onClick={() => openDetail(w)}
                      >
                        Learn More <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </section>

      {/* Past events */}
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
                    {p.type === "FREE" ? "Free" : "Paid"} · {CATEGORY_LABEL[p.category] ?? p.category} · {p.duration}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>
      )}

{/* Workshop Detail Modal */}
{detailOpen && detailWorkshop && (
  <WorkshopDetailModal
    workshop={detailWorkshop}
    onClose={() => setDetailOpen(false)}
    onRegister={(w) => {
      setDetailOpen(false)
      openRegistration(w)
    }}
  />
)}

{/* Registration Modal */}
{modalOpen && modalEvent && (
  <WorkshopRegistrationForm
    modalEvent={{
      id:    modalEvent.id,
      title: modalEvent.title,
      date:  fmtDate(modalEvent.date),
      time:  fmtTime(modalEvent.startTime, modalEvent.endTime, modalEvent.timezone),
      fee:   modalEvent.fee,
    }}
    setModalOpen={setModalOpen}
  />
)}
    </>
  );
};

export default withLayout(WorkshopPage);
