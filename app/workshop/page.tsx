"use client";

import * as React from "react";
import Link from "next/link";
import { Calendar, ChevronRight, Clock, DollarSign, GraduationCap, MapPin, Monitor, User, Users } from "lucide-react";
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

const WorkshopPage = () => {
  const [active, setActive]       = React.useState("all")
  const [modalOpen, setModalOpen] = React.useState(false)
  const [modalEvent, setModalEvent] = React.useState<PublicWorkshop | null>(null)
  const [workshops, setWorkshops] = React.useState<PublicWorkshop[]>([])
  const [loading, setLoading]     = React.useState(true)

  React.useEffect(() => {
    fetch("/api/workshops/public")
      .then(r => r.json())
      .then(d => setWorkshops(d.workshops ?? []))
      .finally(() => setLoading(false))
  }, [])

  const now = new Date()
  const upcoming = workshops.filter(w => !w.date || new Date(w.date) >= now)
  const past     = workshops.filter(w => !!w.date && new Date(w.date) < now)

  const featured = upcoming.find(w => w.featured) ?? upcoming[0]

  const visible = active === "all"
    ? upcoming
    : upcoming.filter(w => {
        if (active === "free") return w.type === "FREE"
        if (active === "paid") return w.type === "PAID"
        return w.category === active
      })

  function openModal(w: PublicWorkshop) {
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


          {/* Featured event */}
          {featured && (
            active === "all" ||
            (active === "free" && featured.type === "FREE") ||
            (active === "paid" && featured.type === "PAID") ||
            active === featured.category
          ) && (
            <div className="grid lg:grid-cols-[1fr_340px] border border-[#0474C4]/25 rounded-sm overflow-hidden mb-6 bg-sky-pale hover:border-[#0474C4]/50 transition-colors">
              <div className="p-8 md:p-10">

                <div className="flex gap-2 mb-5 flex-wrap">
                  <Badge className={`font-body text-[0.6875rem] tracking-[0.05em] font-medium border-0 p-2 ${featured.type === "FREE" ? "bg-emerald-600/10 text-emerald-600" : "bg-[#0474C4]/10 text-[#0474C4]"}`}>
                    {featured.type === "FREE" ? "Free" : "Paid"}
                  </Badge>
                  <Badge className="font-body text-[0.6875rem] tracking-[0.05em] font-medium bg-[#0474C4]/10 text-[#0474C4] border-0 p-2">
                    Featured
                  </Badge>
                  <Badge className="font-body text-[0.6875rem] tracking-[0.05em] font-medium bg-[#FEF3C7] text-[#B45309] border-0 p-2">
                    {CATEGORY_LABEL[featured.category] ?? featured.category}
                  </Badge>
                  {featured.level && (
                    <Badge className={`font-body text-[0.6875rem] tracking-[0.05em] font-medium border-0 p-2 ${LEVEL_COLOR[featured.level] ?? "bg-slate-100 text-slate-600"}`}>
                      <GraduationCap className="h-3 w-3 mr-1 inline-block" />
                      {LEVEL_LABEL[featured.level] ?? featured.level}
                    </Badge>
                  )}
                </div>

                <h3 className="font-heading text-[1.375rem] tracking-[-0.005em] leading-[1.3] font-medium text-ink mb-3">
                  {featured.title}
                </h3>

                <p className="font-body text-[1rem] tracking-[-0.005em] leading-[1.7] font-normal text-slate-600 mb-6 max-w-lg">
                  {featured.description}
                </p>

                <div className="flex gap-6 flex-wrap mb-6">
                  {[
                    { icon: Calendar, val: fmtDate(featured.date) },
                    { icon: Clock,    val: fmtTime(featured.startTime, featured.endTime, featured.timezone) },
                    { icon: featured.medium === "IN_PERSON" ? MapPin : Monitor, val: fmtDelivery(featured.medium, featured.onlinePlatform, featured.venueCity) },
                    { icon: Users,    val: `${featured.capacity} Seats Available` },
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
                    onClick={() => featured && openModal(featured)}
                  >
                    {featured.type === "FREE" ? "Register Free" : "Enrol Now"} <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="h-12 rounded-[32px] py-2.5 px-5 font-body text-[0.875rem] tracking-[0.02em] font-medium text-[#0474C4] hover:text-white bg-white border hover:border-none border-[#0474C4] hover:bg-[#06457f]"
                  >
                    Add to Calendar
                  </Button>
                </div>

              </div>
              {/* Right panel */}
              <div className="bg-[#0474C4] p-8 flex flex-col">
                <div className="font-heading text-[3rem] tracking-[-0.02em] leading-[1.1] font-bold text-[#A8C4EC]">
                  {featured.date ? new Date(featured.date).getDate().toString().padStart(2, "0") : "—"}
                </div>

                <div className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-white/35 mb-6">
                  {featured.date
                    ? new Date(featured.date).toLocaleDateString("en-GB", { month: "long", year: "numeric" })
                    : "Date TBA"}
                </div>

                <div className="flex flex-col gap-3 mb-6 flex-1">
                  {[
                    { icon: Clock,      label: "Duration",    value: featured.duration    },
                    { icon: User,       label: "Level", value: featured.level },
                    { icon: DollarSign, label: "Fee",         value: featured.type === "FREE" ? "Free" : `$${featured.fee}` },
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
                      {featured.capacity > 0 ? Math.round((featured.registered / featured.capacity) * 100) : 0}%
                    </span>
                  </div>
                  <div className="h-1 bg-white/8 rounded-full">
                    <div
                      className="h-full bg-[#0474C4] rounded-full"
                      style={{ width: `${featured.capacity > 0 ? Math.round((featured.registered / featured.capacity) * 100) : 0}%` }}
                    />
                  </div>
                  <div className="font-body text-[0.75rem] tracking-[0em] leading-normal font-normal text-white/80 mt-1">
                    {featured.registered} of {featured.capacity} seats registered
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
                .filter(w => !(featured && w.id === featured.id && (active === "all" || active === "free")))
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
                        className={`font-body text-[0.8125rem] tracking-[0.02em] font-medium px-5 py-2.5 rounded-sm ${
                          w.type === "FREE" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-[#0474C4] hover:bg-[#06457f] text-white"
                        }`}
                        onClick={() => openModal(w)}
                      >
                        {w.type === "FREE" ? "Register Free" : "Enrol Now"} <ChevronRight className="h-4 w-4" />
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
