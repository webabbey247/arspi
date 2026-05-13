"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"

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

function facilitatorsList(w: WorkshopDetail): string[] {
  if (Array.isArray(w.facilitators) && w.facilitators.length > 0) return w.facilitators as string[]
  if (w.facilitator) return [w.facilitator]
  return []
}

// ── Workshop detail modal ──────────────────────────────────────────────────────

function WorkshopViewModal({ registration, onClose }: { registration: Registration; onClose: () => void }) {
  const w = registration.workshop

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/40">
      <div className="bg-white h-full w-full max-w-xl shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="bg-[#0474C4] px-6 py-5 shrink-0 relative">
          <button type="button" onClick={onClose} className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <div className="flex items-center gap-1.5 flex-wrap mb-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/20 text-white uppercase tracking-wider">
              Workshop
            </span>
            {w && (
              <>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${w.type === "FREE" ? "bg-emerald-400/20 text-emerald-100" : "bg-white/10 text-white/70"}`}>
                  {w.type === "FREE" ? "Free" : "Paid"}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-white/70 uppercase tracking-wider">
                  {CATEGORY_LABELS[w.category]}
                </span>
              </>
            )}
          </div>
          <h2 className="text-[18px] font-extrabold text-white leading-tight">
            {w?.title ?? registration.workshopTitle}
          </h2>
          <p className="text-[12px] text-white/80 mt-1">
            {w ? fmtDate(w.date) : registration.workshopDate}
            {(w?.startTime || registration.workshopTime) && (
              <> &middot; {w ? `${w.startTime}${w.endTime ? ` – ${w.endTime}` : ""} ${w.timezone}` : registration.workshopTime}</>
            )}
          </p>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Cover image */}
          {w?.coverImage && (
            <div className="relative w-full h-40 rounded-[12px] overflow-hidden border border-[#E5E2DC]">
              <Image src={w.coverImage} alt={w.title} fill className="object-cover" />
            </div>
          )}

          {/* Registration status */}
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-[10px] bg-[#F5F4F1]">
            <span className="text-[12px] font-semibold text-[#6B6560]">Registration status:</span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_COLORS[registration.status]}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${registration.status === "CONFIRMED" ? "bg-emerald-500" : registration.status === "PENDING" ? "bg-amber-400" : "bg-red-400"}`} />
              {registration.status.charAt(0) + registration.status.slice(1).toLowerCase()}
            </span>
            <span className="ml-auto text-[12px] text-[#A8A39C]">Fee: <span className="font-semibold text-[#1A1916]">{fmtFee(registration.fee)}</span></span>
          </div>

          {/* Date & time */}
          <Section title="Date & Time">
            <Row label="Date" value={w ? fmtDate(w.date) : registration.workshopDate} />
            <Row label="Time" value={w ? `${w.startTime} – ${w.endTime}` : registration.workshopTime} />
            {w && <Row label="Timezone" value={w.timezone} />}
            {w && w.duration !== null && <Row label="Duration" value={`${w.duration} hour${w.duration !== 1 ? "s" : ""}`} />}
          </Section>

          {/* Delivery */}
          {w && (
            <Section title="Delivery">
              <Row label="Mode" value={w.medium === "ONLINE" ? "Online" : "In-Person"} />
              {w.medium === "ONLINE" && w.onlinePlatform && <Row label="Platform" value={w.onlinePlatform} />}
              {w.medium === "ONLINE" && w.onlineLink && (
                <Row label="Link" value={
                  <a href={w.onlineLink} target="_blank" rel="noopener noreferrer" className="text-[#0474C4] underline underline-offset-2 break-all">
                    {w.onlineLink}
                  </a>
                } />
              )}
              {w.medium === "IN_PERSON" && (
                <Row label="Venue" value={[w.venueAddress, w.venueCity, w.venueState, w.venueCountry].filter(Boolean).join(", ")} />
              )}
            </Section>
          )}

          {/* Facilitators */}
          {w && facilitatorsList(w).length > 0 && (
            <Section title="Facilitators">
              <ul className="flex flex-wrap gap-1.5 pt-0.5">
                {facilitatorsList(w).map(name => (
                  <li key={name} className="px-2.5 py-1 bg-[#EBF5FF] rounded-full text-[12px] font-medium text-[#0474C4]">
                    {name}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Capacity */}
          {w && (
            <Section title="Capacity">
              <Row label="Total spots" value={String(w.capacity)} />
              <Row label="Registered" value={String(w.registered)} />
            </Section>
          )}

          {/* Description */}
          {w?.description && (
            <Section title="About this Workshop">
              <div
                className="text-[13px] text-[#6B6560] leading-relaxed prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: w.description }}
              />
            </Section>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-[#E5E2DC] shrink-0">
          <button onClick={onClose} className="px-4 py-2 rounded-[10px] text-[13px] font-semibold border border-[#E5E2DC] text-[#6B6560] hover:bg-[#F5F4F1] cursor-pointer">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-bold text-[#A8A39C] uppercase tracking-[0.4px] mb-2">{title}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 text-[13px]">
      <span className="text-[#A8A39C] w-24 shrink-0">{label}</span>
      <span className="text-[#1A1916] font-medium">{value || "—"}</span>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function StudentWorkshopsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading]             = useState(true)
  const [search, setSearch]               = useState("")
  const [statusFilter, setStatusFilter]   = useState("All")
  const [catFilter, setCatFilter]         = useState("All")
  const [viewReg, setViewReg]             = useState<Registration | null>(null)
  const [filterOpen, setFilterOpen]       = useState(false)
  const [catOpen, setCatOpen]             = useState(false)
  const filterRef                         = useRef<HTMLDivElement>(null)
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
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false)
      if (catRef.current && !catRef.current.contains(e.target as Node)) setCatOpen(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  const filtered = registrations.filter(r => {
    const matchSearch = !search ||
      r.workshopTitle.toLowerCase().includes(search.toLowerCase()) ||
      (r.workshop?.category && CATEGORY_LABELS[r.workshop.category].toLowerCase().includes(search.toLowerCase()))
    const matchStatus = statusFilter === "All" || r.status === statusFilter.toUpperCase()
    const matchCat    = catFilter === "All" || (r.workshop && CATEGORY_LABELS[r.workshop.category] === catFilter)
    return matchSearch && matchStatus && matchCat
  })

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-350 mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-[18px] font-extrabold text-[#1A1916]">My Workshops</h1>
        <p className="text-[#A8A39C] text-[13px] mt-0.5">Workshops you have registered for</p>
      </div>

      {/* Table card */}
      <div className="rounded-[14px] border border-[#E5E2DC] overflow-hidden">

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-3 sm:px-4 py-3 bg-white border-b border-[#E5E2DC]">
          <div className="relative w-full sm:w-64">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A39C]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search workshops…"
              className="w-full pl-8 pr-3 py-2 text-[13px] bg-white border border-[#E5E2DC] rounded-[10px] text-[#1A1916] outline-none placeholder:text-[#A8A39C] focus:border-[#C07C0A] transition-colors"
            />
          </div>

          <div className="sm:ml-auto flex flex-wrap items-center gap-2">
            {/* Status filter */}
            <div ref={filterRef} className="relative">
              <button
                onClick={() => { setFilterOpen(o => !o); setCatOpen(false) }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[13px] font-semibold border cursor-pointer transition-colors ${statusFilter !== "All" ? "bg-[#C07C0A] text-white border-[#C07C0A]" : "bg-white text-[#6B6560] border-[#E5E2DC] hover:border-[#C07C0A] hover:text-[#C07C0A]"}`}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
                Status
                {statusFilter !== "All" && <span className="ml-1 bg-white text-[#C07C0A] text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">{statusFilter}</span>}
              </button>
              {filterOpen && (
                <div className="absolute right-0 top-[calc(100%+6px)] z-20 bg-white border border-[#E5E2DC] rounded-xl shadow-lg py-1.5 min-w-36">
                  {ALL_STATUSES.map(f => (
                    <button key={f} onClick={() => { setStatusFilter(f); setFilterOpen(false) }}
                      className={`w-full flex items-center justify-between px-3.5 py-2 text-[13px] font-medium text-left cursor-pointer border-none transition-colors ${statusFilter === f ? "bg-[#FEF3C7] text-[#C07C0A]" : "bg-transparent text-[#1A1916] hover:bg-[#F5F4F1]"}`}
                    >
                      {f}
                      {statusFilter === f && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Category filter */}
            <div ref={catRef} className="relative">
              <button
                onClick={() => { setCatOpen(o => !o); setFilterOpen(false) }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[13px] font-semibold border cursor-pointer transition-colors ${catFilter !== "All" ? "bg-[#C07C0A] text-white border-[#C07C0A]" : "bg-white text-[#6B6560] border-[#E5E2DC] hover:border-[#C07C0A] hover:text-[#C07C0A]"}`}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                Category
                {catFilter !== "All" && <span className="ml-1 bg-white text-[#C07C0A] text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">{catFilter}</span>}
              </button>
              {catOpen && (
                <div className="absolute right-0 top-[calc(100%+6px)] z-20 bg-white border border-[#E5E2DC] rounded-xl shadow-lg py-1.5 min-w-40">
                  {ALL_CATEGORIES.map(f => (
                    <button key={f} onClick={() => { setCatFilter(f); setCatOpen(false) }}
                      className={`w-full flex items-center justify-between px-3.5 py-2 text-[13px] font-medium text-left cursor-pointer border-none transition-colors ${catFilter === f ? "bg-[#FEF3C7] text-[#C07C0A]" : "bg-transparent text-[#1A1916] hover:bg-[#F5F4F1]"}`}
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

        {/* Table — desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-[#FAFAF9] border-b border-[#E5E2DC]">
                {["Workshop", "Category", "Date", "Status", ""].map((col, i) => (
                  <th key={i} className="px-4 py-2.5 text-left text-[11px] font-bold text-[#A8A39C] tracking-[0.5px] uppercase whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-[#A8A39C] text-[13px]">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-[#A8A39C] text-[13px]">No workshops found.</td></tr>
              ) : filtered.map(reg => (
                <tr key={reg.id} className="border-b border-[#F0EEE9] last:border-none hover:bg-[#FAFAF9] transition-colors">

                  {/* Workshop */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {reg.workshop?.coverImage ? (
                        <div className="relative w-9 h-9 rounded-[8px] overflow-hidden shrink-0 border border-[#E5E2DC]">
                          <Image src={reg.workshop.coverImage} alt={reg.workshopTitle} fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="w-9 h-9 rounded-[8px] bg-[#F5F4F1] flex items-center justify-center shrink-0">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A8A39C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                          </svg>
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-[#1A1916] leading-tight line-clamp-1">{reg.workshopTitle}</p>
                        {reg.workshop && facilitatorsList(reg.workshop).length > 0 && (
                          <p className="text-[11px] text-[#A8A39C] mt-0.5">{facilitatorsList(reg.workshop).join(", ")}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3">
                    {reg.workshop ? (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${CATEGORY_COLORS[reg.workshop.category]}`}>
                        {CATEGORY_LABELS[reg.workshop.category]}
                      </span>
                    ) : (
                      <span className="text-[#A8A39C]">—</span>
                    )}
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3 text-[#6B6560]">
                    {reg.workshop ? fmtDate(reg.workshop.date) : reg.workshopDate}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_COLORS[reg.status]}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${reg.status === "CONFIRMED" ? "bg-emerald-500" : reg.status === "PENDING" ? "bg-amber-400" : "bg-red-400"}`} />
                      {reg.status.charAt(0) + reg.status.slice(1).toLowerCase()}
                    </span>
                  </td>

                  {/* Action — view only */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => setViewReg(reg)}
                        title="View details"
                        className="w-7 h-7 flex items-center justify-center rounded-[8px] border border-[#E5E2DC] bg-white text-[#6B6560] hover:border-[#C07C0A] hover:text-[#C07C0A] transition-colors cursor-pointer"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      </button>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cards — mobile */}
        <div className="md:hidden flex flex-col">
          {loading ? (
            <div className="px-4 py-10 text-center text-[#A8A39C] text-[13px]">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="px-4 py-10 text-center text-[#A8A39C] text-[13px]">No workshops found.</div>
          ) : filtered.map(reg => (
            <div key={reg.id} className="px-4 py-4 border-b border-[#F0EEE9] last:border-none flex flex-col gap-3">
              <div className="flex items-start gap-3">
                {reg.workshop?.coverImage ? (
                  <div className="relative w-10 h-10 rounded-[8px] overflow-hidden shrink-0 border border-[#E5E2DC]">
                    <Image src={reg.workshop.coverImage} alt={reg.workshopTitle} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-[8px] bg-[#F5F4F1] flex items-center justify-center shrink-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A8A39C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                    </svg>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[#1A1916] text-[14px] leading-tight">{reg.workshopTitle}</p>
                  {reg.workshop && facilitatorsList(reg.workshop).length > 0 && (
                    <p className="text-[12px] text-[#A8A39C] mt-0.5 line-clamp-1">{facilitatorsList(reg.workshop).join(", ")}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {reg.workshop && (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${CATEGORY_COLORS[reg.workshop.category]}`}>
                    {CATEGORY_LABELS[reg.workshop.category]}
                  </span>
                )}
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_COLORS[reg.status]}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${reg.status === "CONFIRMED" ? "bg-emerald-500" : reg.status === "PENDING" ? "bg-amber-400" : "bg-red-400"}`} />
                  {reg.status.charAt(0) + reg.status.slice(1).toLowerCase()}
                </span>
              </div>

              <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[12px]">
                <div>
                  <dt className="text-[10px] uppercase tracking-wide text-[#A8A39C] font-semibold">Date</dt>
                  <dd className="text-[#1A1916] font-medium">{reg.workshop ? fmtDate(reg.workshop.date) : reg.workshopDate}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-wide text-[#A8A39C] font-semibold">Fee</dt>
                  <dd className="text-[#1A1916] font-medium">{fmtFee(reg.fee)}</dd>
                </div>
              </dl>

              <div className="flex items-center justify-end gap-1.5 pt-1">
                <button
                  onClick={() => setViewReg(reg)}
                  aria-label="View details"
                  className="w-8 h-8 flex items-center justify-center rounded-[8px] border border-[#E5E2DC] bg-white text-[#6B6560] hover:border-[#C07C0A] hover:text-[#C07C0A] transition-colors cursor-pointer"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-3 sm:px-4 py-2.5 bg-[#FAFAF9] border-t border-[#E5E2DC]">
          <p className="text-[11px] text-[#A8A39C]">
            Showing <span className="font-semibold text-[#6B6560]">{filtered.length}</span> of{" "}
            <span className="font-semibold text-[#6B6560]">{registrations.length}</span>{" "}
            {registrations.length === 1 ? "entry" : "entries"}
          </p>
          {filtered.length < registrations.length && (
            <p className="text-[11px] text-[#C07C0A] font-semibold">{registrations.length - filtered.length} filtered out</p>
          )}
        </div>
      </div>

      {/* View modal */}
      {viewReg && (
        <WorkshopViewModal registration={viewReg} onClose={() => setViewReg(null)} />
      )}
    </div>
  )
}
