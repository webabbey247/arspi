"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { MyWorkshopsSkeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { TickProgress, TickSegments } from "@/components/ui/TickProgress"

// ── Types ─────────────────────────────────────────────────────────────────────

type WorkshopCategory = "SHORT_COURSE" | "WEBINAR" | "MASTERCLASS" | "CONFERENCE" | "WORKSHOP"
type RegistrationStatus = "PENDING" | "CONFIRMED" | "CANCELLED"

type WorkshopDetail = {
  id:             string
  title:          string
  slug:           string
  description:    string
  category:       WorkshopCategory
  type:           "FREE" | "PAID"
  fee:            number
  date:           string | null
  startTime:      string
  endTime:        string
  timezone:       string
  duration:       number | null
  level:          string
  facilitator:    string
  facilitators:   unknown | null
  medium:         string
  onlinePlatform: string | null
  onlineLink:     string | null
  venueAddress:   string | null
  venueCity:      string | null
  venueState:     string | null
  venueCountry:   string | null
  coverImage:     string | null
  capacity:       number | null
  registered:     number
}

type Registration = {
  id:            string
  firstName:     string
  lastName:      string
  email:         string
  workshopTitle: string
  workshopDate:  string
  workshopTime:  string
  fee:           number
  status:        RegistrationStatus
  createdAt:     string
  workshop:      WorkshopDetail | null
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<WorkshopCategory, string> = {
  SHORT_COURSE: "Short Course",
  WEBINAR:      "Webinar",
  MASTERCLASS:  "Masterclass",
  CONFERENCE:   "Conference",
  WORKSHOP:     "Workshop",
}

const CATEGORY_COLORS: Record<WorkshopCategory, string> = {
  SHORT_COURSE: "bg-teal-50 text-teal-700",
  WEBINAR:      "bg-purple-50 text-purple-700",
  MASTERCLASS:  "bg-amber-50 text-amber-700",
  CONFERENCE:   "bg-rose-50 text-rose-700",
  WORKSHOP:     "bg-blue-50 text-blue-700",
}

const STATUS_COLORS: Record<RegistrationStatus, string> = {
  CONFIRMED: "bg-emerald-50 text-emerald-700",
  PENDING:   "bg-amber-50 text-amber-700",
  CANCELLED: "bg-red-50 text-red-500",
}

const ALL_STATUSES  = ["All", "Confirmed", "Pending", "Cancelled"]
const ALL_CATEGORIES = ["All", "Short Course", "Webinar", "Masterclass", "Conference", "Workshop"]

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

function fmtFee(fee: number) {
  return fee === 0 ? "Free" : `$${fee.toLocaleString()}`
}

/** Facilitators are stored as objects — { fullName, jobTitle, company, image } —
 *  not strings. The previous cast to `string[]` was a lie the type system
 *  couldn't catch: joining them produced "[object Object]", and rendering one
 *  directly as a React child threw "Objects are not valid as a React child",
 *  which is what broke the detail modal. Normalise to display strings here. */
function facilitatorsList(w: WorkshopDetail): string[] {
  const raw = w.facilitators
  if (Array.isArray(raw) && raw.length > 0) {
    const names = raw
      .map(entry => {
        if (typeof entry === "string") return entry.trim()
        if (entry && typeof entry === "object") {
          const o = entry as Record<string, unknown>
          const name = [o.fullName, o.name].find(v => typeof v === "string" && v.trim())
          if (typeof name !== "string") return ""
          const title = typeof o.jobTitle === "string" ? o.jobTitle.trim() : ""
          return title ? `${title} ${name.trim()}` : name.trim()
        }
        return ""
      })
      .filter(Boolean)
    if (names.length > 0) return names
  }
  if (w.facilitator) return [w.facilitator]
  return []
}

/** A stored "link" is only a link if it actually parses as http(s). One of the
 *  seeded workshops holds the literal string "kkkkkkkk", which the browser
 *  resolves against the current path — so a Join button pointed at
 *  /student/kkkkkkkk and 404'd. Anything that fails this check is shown as
 *  plain text instead of being offered as a destination. */
function externalUrl(raw: string | null | undefined): string | null {
  const value = raw?.trim()
  if (!value) return null
  try {
    const u = new URL(value)
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null
  } catch {
    return null
  }
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function StudentWorkshopsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading]             = useState(true)
  const [search, setSearch]               = useState("")
  const [statusFilter, setStatusFilter]   = useState("All")
  const [catFilter, setCatFilter]         = useState("All")
  const [catOpen, setCatOpen]             = useState(false)
  const catRef                            = useRef<HTMLDivElement>(null)

  const fetchRegistrations = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch("/api/student/workshops")
      const d = await r.json()
      if (r.ok) setRegistrations(d.registrations ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRegistrations() }, [fetchRegistrations])

  useEffect(() => {
    function h(e: MouseEvent) {
      if (catRef.current && !catRef.current.contains(e.target as Node)) setCatOpen(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  const now = Date.now()
  const isUpcoming = (r: Registration) =>
    !!r.workshop?.date && new Date(r.workshop.date).getTime() >= now && r.status !== "CANCELLED"

  const filtered = registrations.filter(r => {
    const q = search.trim().toLowerCase()
    const matchSearch = !q ||
      r.workshopTitle.toLowerCase().includes(q) ||
      (r.workshop?.category && CATEGORY_LABELS[r.workshop.category].toLowerCase().includes(q)) ||
      (r.workshop ? facilitatorsList(r.workshop).join(" ").toLowerCase().includes(q) : false)
    const matchStatus = statusFilter === "All" || r.status === statusFilter.toUpperCase()
    const matchCat    = catFilter === "All" || (r.workshop && CATEGORY_LABELS[r.workshop.category] === catFilter)
    return matchSearch && matchStatus && matchCat
  })

  const upcoming = registrations.filter(isUpcoming)
    .sort((a, b) => new Date(a.workshop!.date!).getTime() - new Date(b.workshop!.date!).getTime())
  const nextUp = upcoming[0] ?? null

  const counts = {
    all:       registrations.length,
    upcoming:  upcoming.length,
    confirmed: registrations.filter(r => r.status === "CONFIRMED").length,
    pending:   registrations.filter(r => r.status === "PENDING").length,
    cancelled: registrations.filter(r => r.status === "CANCELLED").length,
    past:      registrations.filter(r => !isUpcoming(r) && r.status !== "CANCELLED").length,
  }

  /** Status palette, fixed and never themed — good / warning / critical.
   *  Amber sits below 3:1 on a light surface by design, so every segment is
   *  mitigated by a visible name and amount beside the bar rather than
   *  relying on colour alone. */
  const SPLIT = [
    { key: "confirmed", label: "Confirmed", value: counts.confirmed, hex: "#0ca30c" },
    { key: "pending",   label: "Pending",   value: counts.pending,   hex: "#fab219" },
    { key: "cancelled", label: "Cancelled", value: counts.cancelled, hex: "#d03b3b" },
  ].filter(part => part.value > 0)

  const splitTotal = SPLIT.reduce((sum, part) => sum + part.value, 0)
  const share = (v: number) => (splitTotal > 0 ? Math.round((v / splitTotal) * 100) : 0)
  const coverStrip = upcoming.filter(r => r.workshop?.coverImage).slice(0, 4)

  const metaCls = "text-[11px] tracking-[0.12em] uppercase font-extrabold text-[#8A90A6]"

  /** Days until a workshop — the number a student actually cares about. */
  function daysUntil(iso: string | null): number | null {
    if (!iso) return null
    const diff = new Date(iso).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)
    return Math.round(diff / 86_400_000)
  }

  if (loading) return <MyWorkshopsSkeleton />

  return (
    <div className="max-w-350 mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

      {/* Page header */}
      <div className="mb-6">
        <span className="block text-[12px] tracking-[0.12em] uppercase font-extrabold text-[#6655DF] mb-1.5">Learner</span>
        <h1 className="text-[clamp(28px,3.4vw,40px)] leading-[1.1] tracking-[-0.035em] font-extrabold text-[#171C35]">My Workshops</h1>
        <p className="text-[#69708A] text-[15px] mt-1.5 max-w-180">Sessions you&apos;ve registered for, past and upcoming</p>
      </div>

      {/* Next-up spotlight */}
      {nextUp?.workshop && (
        <section className="relative rounded-[20px] overflow-hidden mb-6 min-h-45 flex items-end">
          <div className="absolute inset-0">
            {nextUp.workshop.coverImage ? (
              <Image src={nextUp.workshop.coverImage} alt={nextUp.workshopTitle} fill sizes="100vw" className="object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#2C2368] via-[#4B3BA8] to-[#6655DF]" />
            )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B0E24] via-[#0B0E24]/85 to-[#0B0E24]/40" />

          <div className="relative w-full p-5 sm:p-7">
            <span className={cn(metaCls, "block text-white/75 mb-1.5")}>
              Next up{(() => {
                const d = daysUntil(nextUp.workshop.date)
                return d === null ? "" : d === 0 ? " · today" : d === 1 ? " · tomorrow" : ` · in ${d} days`
              })()}
            </span>
            <p className="text-[clamp(18px,2.2vw,26px)] leading-[1.15] tracking-[-0.03em] font-extrabold text-white max-w-2xl">
              {nextUp.workshopTitle}
            </p>
            <p className="text-[14px] font-bold text-white/70 mt-2">
              {fmtDate(nextUp.workshop.date)}
              {nextUp.workshop.startTime && ` · ${nextUp.workshop.startTime}`}
              {nextUp.workshop.timezone && ` ${nextUp.workshop.timezone}`}
            </p>

            <div className="flex flex-wrap items-center gap-2.5 mt-4">
              {nextUp.workshop.slug && (
                <Link
                  href={`/workshop/${nextUp.workshop.slug}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[12px] text-[14px] font-bold bg-white text-[#171C35] hover:bg-[#EEECFF] transition-colors no-underline"
                >
                  View details
                </Link>
              )}
              {externalUrl(nextUp.workshop.onlineLink) && nextUp.status === "CONFIRMED" && (
                <a
                  href={externalUrl(nextUp.workshop.onlineLink)!} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[12px] text-[14px] font-bold bg-[#6655DF] text-white hover:bg-[#2C2368] transition-colors no-underline"
                >
                  Join session
                </a>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Activity — hero figure + part-to-whole split.
          A thin segmented bar rather than a donut: the figures sit beside it in
          the list below, so printing them on the bar would add nothing. */}
      {registrations.length > 0 && (
        <section className="rounded-[18px] border border-[#DFE2ED] bg-white overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-[#F0EFFA] flex items-center justify-between gap-4">
            <div>
              <h2 className="text-[14px] font-bold text-[#171C35]">Workshop activity</h2>
              <p className="text-[12px] font-bold text-[#8A90A6] mt-0.5">Across every session you&apos;ve registered for</p>
            </div>

            {/* Covers of what's coming — overlapped, newest first */}
            {coverStrip.length > 0 && (
              <div className="hidden sm:flex items-center gap-2 shrink-0">
                <div className="flex -space-x-3">
                  {coverStrip.map(r => (
                    <span
                      key={r.id}
                      title={r.workshopTitle}
                      className="relative w-10 h-10 rounded-[10px] overflow-hidden ring-2 ring-white bg-[#F5F6FB]"
                    >
                      <Image src={r.workshop!.coverImage!} alt={r.workshopTitle} fill sizes="40px" className="object-cover" />
                    </span>
                  ))}
                </div>
                <span className={metaCls}>Coming up</span>
              </div>
            )}
          </div>

          <div className="px-5 py-5 grid gap-6 lg:grid-cols-[auto_1fr_auto] lg:items-center">

            {/* Hero figure — proportional figures, not tabular */}
            <div className="shrink-0">
              <p className="text-[52px] leading-none font-extrabold tracking-[-0.04em] text-[#171C35]">
                {counts.all}
              </p>
              <p className={cn(metaCls, "mt-2")}>Registrations</p>
            </div>

            {/* Thin segmented bar — 8px, rounded ends, 2px surface gaps */}
            <div className="min-w-0">
              <TickSegments parts={SPLIT} ticks={44} />

              {/* The figures live here, which is what lets the bar carry no text */}
              <ul className="flex flex-wrap gap-x-6 gap-y-2 mt-4">
                {SPLIT.map(part => (
                  <li key={part.key} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: part.hex }} />
                    <span className="text-[13.5px] font-bold text-[#171C35]">{part.label}</span>
                    <span className="text-[13.5px] font-bold text-[#69708A] tabular-nums">{part.value}</span>
                    <span className="text-[12px] font-bold text-[#8A90A6] tabular-nums">{share(part.value)}%</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Secondary figures */}
            <div className="flex gap-3 lg:gap-4 shrink-0">
              {[
                { label: "Upcoming", value: counts.upcoming },
                { label: "Attended", value: counts.past },
              ].map(k => (
                <div key={k.label} className="rounded-[12px] bg-[#FAFAFF] border border-[#F0EFFA] px-4 py-3 min-w-24">
                  <p className="text-[22px] font-extrabold text-[#171C35] leading-none">{k.value}</p>
                  <p className={cn(metaCls, "mt-1.5")}>{k.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-5">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {ALL_STATUSES.map(f => (
            <button
              key={f} type="button" onClick={() => setStatusFilter(f)}
              className={cn(
                "shrink-0 px-3.5 py-2 rounded-full text-[14px] font-bold border transition-colors cursor-pointer",
                statusFilter === f
                  ? "bg-[#6655DF] text-white border-[#6655DF]"
                  : "bg-white border-[#DFE2ED] text-[#69708A] hover:border-[#6655DF] hover:text-[#6655DF]",
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="lg:ml-auto flex items-center gap-2">
          <div className="relative flex-1 lg:w-60 lg:flex-none">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A90A6]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search workshops…"
              className="w-full pl-9 pr-3 py-2 text-[14px] font-bold bg-white border border-[#DFE2ED] rounded-[10px] text-[#171C35] outline-none placeholder:font-normal placeholder:text-[#8A90A6] focus:border-[#6655DF] transition-colors"
            />
          </div>

          <div ref={catRef} className="relative shrink-0">
            <button
              type="button" onClick={() => setCatOpen(o => !o)}
              aria-haspopup="menu" aria-expanded={catOpen}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[14px] font-bold border cursor-pointer transition-colors",
                catFilter !== "All"
                  ? "bg-[#6655DF] text-white border-[#6655DF]"
                  : "bg-white text-[#69708A] border-[#DFE2ED] hover:border-[#6655DF] hover:text-[#6655DF]",
              )}
            >
              {catFilter === "All" ? "Category" : catFilter}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={cn("transition-transform", catOpen && "rotate-180")}><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            {catOpen && (
              <div role="menu" className="absolute right-0 top-[calc(100%+6px)] z-30 bg-white border border-[#DFE2ED] rounded-[12px] shadow-[0_12px_32px_rgba(23,28,53,0.16)] py-1.5 min-w-44">
                {ALL_CATEGORIES.map(f => (
                  <button
                    key={f} type="button" onClick={() => { setCatFilter(f); setCatOpen(false) }}
                    className={cn(
                      "w-full flex items-center justify-between px-3.5 py-2 text-[14px] font-bold text-left cursor-pointer transition-colors",
                      catFilter === f ? "bg-[#EEECFF] text-[#6655DF]" : "text-[#171C35] hover:bg-[#F5F6FB]",
                    )}
                  >
                    {f}
                    {catFilter === f && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="rounded-[18px] border border-dashed border-[#DFE2ED] bg-white px-4 py-16 text-center">
          <span className="w-14 h-14 rounded-full bg-[#EEECFF] flex items-center justify-center mx-auto mb-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6655DF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </span>
          <p className="text-[15px] font-bold text-[#171C35]">
            {registrations.length === 0 ? "You haven't registered for any workshops." : "No workshops match those filters."}
          </p>
          {registrations.length === 0 && (
            <Link href="/workshop" className="mt-5 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-[10px] text-[14px] font-bold bg-[#6655DF] text-white hover:bg-[#2C2368] transition-colors no-underline">
              Browse workshops
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(reg => {
            const w = reg.workshop
            // A registration can outlive its workshop row (the title is kept
            // on the registration), and without a slug there is no public
            // page to send anyone to.
            const detailHref = w?.slug ? `/workshop/${w.slug}` : null
            const days = daysUntil(w?.date ?? null)
            const soon = days !== null && days >= 0 && days <= 7 && reg.status !== "CANCELLED"
            return (
              <article
                key={reg.id}
                className="group rounded-[16px] border border-[#DFE2ED] bg-white overflow-hidden hover:border-[#6655DF] hover:shadow-[0_10px_30px_rgba(102,85,223,0.12)] hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
              >
                <Link
                  href={detailHref ?? "#"}
                  aria-disabled={!detailHref}
                  onClick={e => { if (!detailHref) e.preventDefault() }}
                  className="relative block w-full aspect-video bg-[#F5F6FB] overflow-hidden text-left no-underline"
                >
                  {w?.coverImage ? (
                    <Image src={w.coverImage} alt={reg.workshopTitle} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover group-hover:scale-[1.04] transition-transform duration-500" />
                  ) : (
                    <span className="w-full h-full bg-gradient-to-br from-[#2C2368] via-[#4B3BA8] to-[#6655DF] flex items-center justify-center">
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.6"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                    </span>
                  )}
                  <span className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/55 to-transparent" />

                  <span className={cn(
                    "absolute top-2.5 left-2.5 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-[0.08em]",
                    STATUS_COLORS[reg.status],
                  )}>
                    {reg.status.toLowerCase()}
                  </span>
                  {soon && (
                    <span className="absolute top-2.5 right-2.5 inline-flex items-center px-2 py-0.5 rounded-full bg-[#6655DF] text-white text-[10px] font-extrabold uppercase tracking-[0.08em]">
                      {days === 0 ? "Today" : days === 1 ? "Tomorrow" : `In ${days}d`}
                    </span>
                  )}
                  {w && (
                    <span className={cn(
                      "absolute bottom-2.5 left-2.5 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-[0.08em] backdrop-blur-sm",
                      CATEGORY_COLORS[w.category],
                    )}>
                      {CATEGORY_LABELS[w.category]}
                    </span>
                  )}
                </Link>

                <div className="px-4 pt-3.5 flex-1 flex flex-col">
                  {detailHref ? (
                    <Link
                      href={detailHref}
                      className="text-left text-[14px] font-bold text-[#171C35] leading-snug line-clamp-2 group-hover:text-[#6655DF] transition-colors no-underline"
                    >
                      {reg.workshopTitle}
                    </Link>
                  ) : (
                    <p className="text-[14px] font-bold text-[#171C35] leading-snug line-clamp-2">{reg.workshopTitle}</p>
                  )}
                  {w && facilitatorsList(w).length > 0 && (
                    <p className={cn(metaCls, "mt-1.5 truncate")}>{facilitatorsList(w).join(", ")}</p>
                  )}

                  <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-3 text-[13px]">
                    <div>
                      <dt className={metaCls}>Date</dt>
                      <dd className="font-bold text-[#171C35] mt-0.5">{fmtDate(w?.date ?? null)}</dd>
                    </div>
                    <div>
                      <dt className={metaCls}>Fee</dt>
                      <dd className="font-bold text-[#171C35] mt-0.5">{fmtFee(w?.fee ?? reg.fee)}</dd>
                    </div>
                  </dl>

                  {/* How full the session is — a real ratio against a limit,
                      so it only appears where a capacity has been set. */}
                  {w && w.capacity !== null && w.capacity > 0 && (
                    <TickProgress
                      value={(w.registered / w.capacity) * 100}
                      ticks={26}
                      tone={w.registered >= w.capacity ? "success" : "brand"}
                      label={`${w.registered} of ${w.capacity} spots taken`}
                      valueLabel={w.registered >= w.capacity ? "Full" : `${w.capacity - w.registered} left`}
                      className="mt-3"
                    />
                  )}
                </div>

                <div className="px-4 py-3.5 mt-3 flex items-center gap-2">
                  {detailHref ? (
                    <Link
                      href={detailHref}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 rounded-[10px] text-[14px] font-bold border border-[#DFE2ED] text-[#69708A] hover:border-[#6655DF] hover:text-[#6655DF] transition-colors no-underline"
                    >
                      Details
                    </Link>
                  ) : (
                    <span className="flex-1 inline-flex items-center justify-center px-3 py-2 rounded-[10px] text-[14px] font-bold border border-[#F0EFFA] text-[#C9CCDD] cursor-not-allowed">
                      Details
                    </span>
                  )}
                  {externalUrl(w?.onlineLink) && reg.status === "CONFIRMED" && (
                    <a
                      href={externalUrl(w?.onlineLink)!} target="_blank" rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 rounded-[10px] text-[14px] font-bold bg-[#6655DF] text-white hover:bg-[#2C2368] transition-colors no-underline"
                    >
                      Join
                    </a>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}

    </div>
  )
}
