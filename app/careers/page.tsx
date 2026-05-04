"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronDown, ChevronRight, MapPin, Search } from "lucide-react"
import withLayout from "@/hooks/useLayout"
import PageHero from "@/components/sections/PageHero"

// ── Types ────────────────────────────────────────────────────────────────────

type CareerType      = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP" | "TEMPORARY"
type ExperienceLevel = "ENTRY" | "JUNIOR" | "MID" | "SENIOR" | "LEAD" | "EXECUTIVE"

type PublicCareer = {
  id:              string
  title:           string
  slug:            string
  department:      string
  type:            CareerType
  experienceLevel: ExperienceLevel
  location:        string
  remote:          boolean
  salaryMin:       number | null
  salaryMax:       number | null
  currency:        string
  description:     string
  applyEmail:      string | null
  closingDate:     string | null
  createdAt:       string
}

const TYPE_LABEL: Record<CareerType, string> = {
  FULL_TIME:  "Full-time",
  PART_TIME:  "Part-time",
  CONTRACT:   "Contract",
  INTERNSHIP: "Internship",
  TEMPORARY:  "Temporary",
}

const LEVEL_LABEL: Record<ExperienceLevel, string> = {
  ENTRY:     "Entry",
  JUNIOR:    "Junior",
  MID:       "Mid-Level",
  SENIOR:    "Senior",
  LEAD:      "Lead",
  EXECUTIVE: "Executive",
}

// ── Accordion ────────────────────────────────────────────────────────────────

function FilterAccordion({
  title,
  options,
  selected,
  onToggle,
  defaultOpen = false,
}: {
  title:       string
  options:     { id: string; label: string }[]
  selected:    string[]
  onToggle:    (id: string) => void
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
        <span className="font-body text-[0.875rem] font-semibold text-ink group-hover:text-[#0474C4] transition-colors">
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

// ── Helpers ──────────────────────────────────────────────────────────────────

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

// ── Page ─────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20

const CareersPage = () => {
  const [careers, setCareers] = React.useState<PublicCareer[]>([])
  const [loading, setLoading] = React.useState(true)

  // Search inputs
  const [keywordQuery,  setKeywordQuery]  = React.useState("")
  const [locationQuery, setLocationQuery] = React.useState("")

  // Accordion checkbox filters
  const [departmentFilter, setDepartmentFilter] = React.useState<string[]>([])
  const [experienceFilter, setExperienceFilter] = React.useState<string[]>([])
  const [typeFilter,       setTypeFilter]       = React.useState<string[]>([])
  const [locationFilter,   setLocationFilter]   = React.useState<string[]>([])

  const [page, setPage] = React.useState(1)

  React.useEffect(() => {
    fetch("/api/careers/public")
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => setCareers(d.careers ?? []))
      .catch(() => setCareers([]))
      .finally(() => setLoading(false))
  }, [])

  function toggleIn<T extends string>(arr: T[], value: T): T[] {
    return arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]
  }

  // Derive unique department + location options from the loaded data
  const departments = React.useMemo(
    () => Array.from(new Set(careers.map(c => c.department).filter(Boolean))).sort(),
    [careers]
  )
  const locations = React.useMemo(
    () => Array.from(new Set(careers.map(c => c.location).filter(Boolean))).sort(),
    [careers]
  )

  function passesFilters(c: PublicCareer): boolean {
    const kw = keywordQuery.trim().toLowerCase()
    const lq = locationQuery.trim().toLowerCase()
    const matchesKeyword = !kw
      || c.title.toLowerCase().includes(kw)
      || c.department.toLowerCase().includes(kw)
      || TYPE_LABEL[c.type].toLowerCase().includes(kw)
      || LEVEL_LABEL[c.experienceLevel].toLowerCase().includes(kw)
    const matchesLocationQuery = !lq || c.location.toLowerCase().includes(lq)

    return matchesKeyword
      && matchesLocationQuery
      && (departmentFilter.length === 0 || departmentFilter.includes(c.department))
      && (experienceFilter.length === 0 || experienceFilter.includes(c.experienceLevel))
      && (typeFilter.length === 0       || typeFilter.includes(c.type))
      && (locationFilter.length === 0   || locationFilter.includes(c.location))
  }

  const filtered   = careers.filter(passesFilters)
  const total      = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const startIdx   = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const endIdx     = Math.min(page * PAGE_SIZE, total)

  // Reset to page 1 when any filter changes
  React.useEffect(() => { setPage(1) }, [
    keywordQuery, locationQuery,
    departmentFilter, experienceFilter, typeFilter, locationFilter,
  ])

  const window = pageWindow(page, totalPages)

  return (
    <>
      {/* Hero */}
       <PageHero
                             tagline="Join the team"
                             captionTextOne="Open "
                             highlightText="Roles"
                             captionTextTwo="at ARPS Institute"
                             description="Help us build the future of research and learning. Browse current openings and apply directly."
                             pageType="careers"
                             imageUrl="/images/about-arps.webp"
                           />
                 
      
      {/* <section className="bg-[#071639] relative overflow-hidden px-8 md:px-16 py-24 w-full">
        <div className="absolute inset-0 bg-grid-ink pointer-events-none" />
        <div className="absolute -top-24 right-0 w-125 h-125 rounded-full bg-[#0474C4]/8 blur-[100px] pointer-events-none" />
        <div className="relative z-10 max-w-190">
          <p className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#EBF3FC] inline-flex items-center gap-2">
            <span className="block w-8 h-px bg-[#EBF3FC]" />
            Join the team
          </p>
          <h1 className="font-heading text-[2.25rem] md:text-[3rem] tracking-[-0.015em] md:tracking-[-0.02em] leading-[1.2] md:leading-[1.1] font-bold text-white">
            Open <em className="italic text-[#0474C4]">Roles</em>
            <br />at ARPS Institute
          </h1>
          <p className="font-body text-[1.125rem] tracking-[-0.01em] leading-[1.65] font-light text-[#EBF3FC] max-w-lg mt-3">
            Help us build the future of research and learning. Browse current openings and apply directly.
          </p>
        </div>
      </section> */}

      {/* Search container */}
      {/* <section className="relative w-full -mt-10">
        <div className="max-w-240 mx-auto p-[2.4rem] bg-[#0474C4]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={keywordQuery}
                onChange={e => setKeywordQuery(e.target.value)}
                placeholder="Type to Search: e.g Team Member"
                className="w-full h-11 pl-9 pr-3 rounded border border-[#0474C4]/20 bg-white font-body text-[0.875rem] text-ink outline-none focus:border-[#0474C4] placeholder:text-slate-400"
              />
            </label>
            <label className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={locationQuery}
                onChange={e => setLocationQuery(e.target.value)}
                placeholder="Zip Code or City, State"
                className="w-full h-11 pl-9 pr-3 rounded border border-[#0474C4]/20 bg-white font-body text-[0.875rem] text-ink outline-none focus:border-[#0474C4] placeholder:text-slate-400"
              />
            </label>
          </div>
        </div>
      </section> */}

      {/* Body — sidebar + cards */}
      <section className="bg-white px-8 md:px-16 pb-16 w-full mt-10">
        <div className="max-w-350 mx-auto flex flex-col lg:flex-row gap-8">

          {/* Left sidebar — w-100 */}
          <aside className="lg:w-100 shrink-0">
            <div className="bg-white  p-5 lg:sticky lg:top-32">
              <h3 className="font-heading text-[1rem] tracking-[-0.005em] font-semibold text-[#0474C4] mb-2">
                Search filters
              </h3>

              <div className="flex flex-col">
                <FilterAccordion
                  title="Department"
                  options={departments.map(d => ({ id: d, label: d }))}
                  selected={departmentFilter}
                  onToggle={(id) => setDepartmentFilter(toggleIn(departmentFilter, id))}
                />
                <FilterAccordion
                  title="Experience"
                  options={Object.entries(LEVEL_LABEL).map(([id, label]) => ({ id, label }))}
                  selected={experienceFilter}
                  onToggle={(id) => setExperienceFilter(toggleIn(experienceFilter, id))}
                />
                <FilterAccordion
                  title="Type"
                  options={Object.entries(TYPE_LABEL).map(([id, label]) => ({ id, label }))}
                  selected={typeFilter}
                  onToggle={(id) => setTypeFilter(toggleIn(typeFilter, id))}
                />
                <FilterAccordion
                  title="Location"
                  options={locations.map(l => ({ id: l, label: l }))}
                  selected={locationFilter}
                  onToggle={(id) => setLocationFilter(toggleIn(locationFilter, id))}
                />
              </div>
            </div>
          </aside>

          {/* Right — cards list */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white  h-24 animate-pulse" />
                ))}
              </div>
            ) : paginated.length === 0 ? (
              <div className="bg-white p-10 text-center flex flex-col gap-2 items-center justify-center w-full h-full">
                <p className="font-heading text-[1rem] font-semibold text-ink mb-1.5">
                  {careers.length === 0 ? "No open roles right now" : "No roles match your search"}
                </p>
                <p className="font-body text-[0.8125rem] text-slate-500">
                  Try adjusting your search or clearing some filters.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {paginated.map(c => (
                  <div
                    key={c.id}
                    className="bg-white border border-[#0474C4]/22 rounded hover:border-[#0474C4]/55 transition-all px-5 py-4 flex items-center justify-between gap-4"
                  >
                    {/* Left — job title + department | location */}
                    <div className="flex flex-col min-w-0">
                      <h3 className="font-heading text-[1rem] tracking-[-0.005em] leading-[1.3] font-medium text-ink mb-1 truncate">
                        {c.title}
                      </h3>
                      <p className="font-body text-[0.8125rem] text-slate-500 truncate">
                        {c.department} <span className="text-slate-300 mx-1.5">|</span> {c.location}
                      </p>
                    </div>

                    {/* Right — Apply button → single career page */}
                    <Link
                      href={`/careers/${c.slug}`}
                      className="inline-flex items-center gap-1 font-body text-[0.8125rem] tracking-[0.02em] font-medium px-4 py-2 rounded bg-[#0474C4] text-white hover:bg-[#06457f] transition-colors shrink-0"
                    >
                      Apply
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination footer — Showing X-Y of N jobs + windowed pagination */}
            {!loading && paginated.length > 0 && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-6">
                <p className="font-body text-[0.8125rem] text-slate-500">
                  Showing <span className="font-medium text-ink">{startIdx}-{endIdx}</span>{" "}
                  of <span className="font-medium text-ink">{total}</span> {total === 1 ? "job" : "jobs"}
                </p>

                {totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={page === 1}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      className="font-body text-[0.75rem] tracking-[0.05em] uppercase font-medium px-3 py-1.5 rounded border border-[#0474C4]/20 text-slate-500 hover:border-[#0474C4] hover:text-[#0474C4] disabled:opacity-40 disabled:hover:border-[#0474C4]/20 disabled:hover:text-slate-500 cursor-pointer disabled:cursor-not-allowed"
                    >
                      Prev
                    </button>
                    {window.map((p, i) =>
                      p === "…" ? (
                        <span key={`ellipsis-${i}`} className="font-body text-[0.8125rem] text-slate-400 px-2">…</span>
                      ) : (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPage(p)}
                          className={`min-w-8 h-8 rounded font-body text-[0.8125rem] font-medium cursor-pointer transition-colors ${
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
                      className="font-body text-[0.75rem] tracking-[0.05em] uppercase font-medium px-3 py-1.5 rounded border border-[#0474C4]/20 text-slate-500 hover:border-[#0474C4] hover:text-[#0474C4] disabled:opacity-40 disabled:hover:border-[#0474C4]/20 disabled:hover:text-slate-500 cursor-pointer disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  )
}

export default withLayout(CareersPage)
