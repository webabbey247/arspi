"use client";

import * as React from "react";
import withLayout from "@/hooks/useLayout";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import {
  getProjects,
  type PublicProject,
  type PublicTaxonomyItem,
} from "@/services/public-project.service";
import PageHero from "@/components/sections/PageHero";
import OrganizationsStrip from "@/components/sections/OrganizationsStrip";

const PAGE_SIZE = 20;

const STATUS_LABEL: Record<"ACTIVE" | "COMPLETE", string> = {
  ACTIVE:   "Active",
  COMPLETE: "Complete",
}

const STATUS_COLORS: Record<"ACTIVE" | "COMPLETE", string> = {
  ACTIVE:   "bg-amber-50 text-amber-700",
  COMPLETE: "bg-emerald-50 text-emerald-700",
}

// ── Filter accordion (matches programs/workshops pattern) ─────────────────────

function FilterAccordion({
  title,
  options,
  selected,
  onToggle,
  defaultOpen = false,
}: {
  title:        string
  options:      { id: string; label: string }[]
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
        <span className="font-body text-[0.875rem] font-semibold text-ink group-hover:text-[#0474C4] transition-colors">
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

// ── Pagination helper ─────────────────────────────────────────────────────────

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

function toggleIn<T extends string>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]
}

function fmtRange(start: string | null, end: string | null): string | null {
  if (!start && !end) return null
  const fmt = (d: string) => new Date(d).toLocaleDateString("en-GB", { month: "short", year: "numeric" })
  if (start && end) return `${fmt(start)} – ${fmt(end)}`
  if (start)        return `Started ${fmt(start)}`
  return end ? `Through ${fmt(end)}` : null
}

// ── Page ─────────────────────────────────────────────────────────────────────

const ResearchProjectsPage = () => {
  const [projects, setProjects]       = React.useState<PublicProject[]>([])
  const [divisions, setDivisions]     = React.useState<PublicTaxonomyItem[]>([])
  const [departments, setDepartments] = React.useState<PublicTaxonomyItem[]>([])
  const [services, setServices]       = React.useState<PublicTaxonomyItem[]>([])
  const [loading, setLoading]         = React.useState(true)
  const [page, setPage]               = React.useState(1)

  // Filter state
  const [statusFilter,     setStatusFilter]     = React.useState<string[]>([])
  const [divisionFilter,   setDivisionFilter]   = React.useState<string[]>([])
  const [departmentFilter, setDepartmentFilter] = React.useState<string[]>([])
  const [serviceFilter,    setServiceFilter]    = React.useState<string[]>([])

  React.useEffect(() => {
    setLoading(true)
    getProjects()
      .then(payload => {
        setProjects(payload.projects)
        setDivisions(payload.divisions)
        setDepartments(payload.departments)
        setServices(payload.services)
      })
      .catch(() => {
        setProjects([])
        setDivisions([])
        setDepartments([])
        setServices([])
      })
      .finally(() => setLoading(false))
  }, [])

  const divisionOptions   = React.useMemo(() => divisions.map(c    => ({ id: c.id, label: `${c.name} (${c.count})` })), [divisions])
  const departmentOptions = React.useMemo(() => departments.map(c  => ({ id: c.id, label: `${c.name} (${c.count})` })), [departments])
  const serviceOptions    = React.useMemo(() => services.map(c     => ({ id: c.id, label: `${c.name} (${c.count})` })), [services])

  const hasActiveFilter =
    statusFilter.length     > 0 ||
    divisionFilter.length   > 0 ||
    departmentFilter.length > 0 ||
    serviceFilter.length    > 0

  function clearFilters() {
    setStatusFilter([])
    setDivisionFilter([])
    setDepartmentFilter([])
    setServiceFilter([])
  }

  function passesFilters(p: PublicProject): boolean {
    return (statusFilter.length     === 0 || statusFilter.includes(p.status))
        && (divisionFilter.length   === 0 || (!!p.division   && divisionFilter.includes(p.division.id)))
        && (departmentFilter.length === 0 || (!!p.department && departmentFilter.includes(p.department.id)))
        && (serviceFilter.length    === 0 || p.services.some(s => serviceFilter.includes(s.id)))
  }

  const filtered   = projects.filter(passesFilters)
  const total      = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const startIdx   = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const endIdx     = Math.min(page * PAGE_SIZE, total)
  const pages      = pageWindow(page, totalPages)

  React.useEffect(() => { setPage(1) }, [
    statusFilter, divisionFilter, departmentFilter, serviceFilter,
  ])

  return (
    <>
      {/* Hero */}
      <PageHero
        tagline="Our Research"
        captionTextOne="Evidence-led "
        highlightText="Projects."
        captionTextTwo="Real-World Impact."
        description="Explore the research, evaluation, and policy projects we deliver in partnership with foundations, governments, and civil society organisations across Africa and beyond."
        pageType=""
        imageUrl="/images/about-arps.webp"
      />

      {/* Projects — sidebar + grid */}
      <section className="bg-white px-8 md:px-16 pb-20 pt-10 w-full border-t border-[#e8e8e8]">
        <div className="max-w-350 mx-auto flex flex-col lg:flex-row gap-8 w-full">

          {/* Left sidebar */}
          <aside className="lg:w-72 shrink-0">
            <div className="lg:sticky lg:top-32 px-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-heading text-[1rem] tracking-[-0.005em] font-semibold text-[#0474C4]">
                  Filters
                </h3>
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
                  title="Project Status"
                  options={[
                    { id: "ACTIVE",   label: "Active" },
                    { id: "COMPLETE", label: "Complete" },
                  ]}
                  selected={statusFilter}
                  onToggle={id => setStatusFilter(toggleIn(statusFilter, id))}
                  defaultOpen
                />
                <FilterAccordion
                  title="Division"
                  options={divisionOptions}
                  selected={divisionFilter}
                  onToggle={id => setDivisionFilter(toggleIn(divisionFilter, id))}
                  defaultOpen
                />
                <FilterAccordion
                  title="Department"
                  options={departmentOptions}
                  selected={departmentFilter}
                  onToggle={id => setDepartmentFilter(toggleIn(departmentFilter, id))}
                />
                <FilterAccordion
                  title="Services"
                  options={serviceOptions}
                  selected={serviceFilter}
                  onToggle={id => setServiceFilter(toggleIn(serviceFilter, id))}
                />
              </div>
            </div>
          </aside>

          {/* Right — grid + pagination */}
          <div className="flex-1 min-w-0 flex flex-col gap-6">

            {/* Count */}
            {!loading && (
              <p className="font-body text-[0.8125rem] text-slate-500">
                {total !== 0 && (
                  <>Showing <span className="font-medium text-ink">{startIdx}–{endIdx}</span> of <span className="font-medium text-ink">{total}</span> {total === 1 ? "project" : "projects"}</>
                )}
              </p>
            )}

            {/* Grid */}
            {loading ? (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-sm overflow-hidden border border-[#0474C4]/10 animate-pulse">
                    <div className="aspect-16/10 bg-slate-100" />
                    <div className="p-5 space-y-3">
                      <div className="h-3 bg-slate-100 rounded w-1/2" />
                      <div className="h-4 bg-slate-100 rounded w-full" />
                      <div className="h-3 bg-slate-100 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : paginated.length > 0 ? (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {paginated.map(proj => {
                  const range    = fmtRange(proj.startDate, proj.endDate)
                  const initials = proj.client.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("")

                  return (
                    <Link
                      href={`/our-research/research-projects/${proj.slug}`}
                      key={proj.id}
                      className="group bg-white rounded-sm overflow-hidden transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(13,27,42,0.1)]"
                    >
                      <div className="relative aspect-16/10 overflow-hidden bg-slate-100">
                        {proj.coverImage ? (
                          <Image
                            src={proj.coverImage}
                            alt={proj.title}
                            fill
                            className="object-cover transition-transform duration-400 group-hover:scale-[1.04]"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                          </div>
                        )}
                        <span className={`absolute top-3 left-3 text-[0.65rem] font-medium tracking-widest uppercase px-2.5 py-1 rounded-sm ${STATUS_COLORS[proj.status]}`}>
                          Project ({STATUS_LABEL[proj.status]})
                        </span>
                      </div>

                      <div className="px-5 pt-[1.3rem] pb-[1.5rem]">
                        <div className="flex items-center gap-2 mb-3">
                          {proj.clientLogo ? (
                            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-slate-200 bg-white shrink-0">
                              <Image src={proj.clientLogo} alt={proj.client} fill className="object-contain p-1" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[#0474C4] text-white font-body text-[0.8125rem] font-medium flex items-center justify-center shrink-0">
                              {initials || "—"}
                            </div>
                          )}
                          <span className="font-body text-[0.8125rem] font-normal text-slate-600 truncate">
                            {proj.client}
                          </span>
                        </div>

                        <h3 className="font-heading text-[1.02rem] font-normal text-[#071639] leading-[1.35] mb-4 line-clamp-2">
                          {proj.title}
                        </h3>

                        <div className="flex gap-[1.2rem] items-center flex-wrap">
                          {range && (
                            <>
                              <span className="flex items-center gap-1.25 text-[0.78rem] text-[#637AA3] font-light">
                                <svg className="w-3.5 h-3.5 opacity-50" viewBox="0 0 16 16" fill="none">
                                  <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                                  <path d="M2 6h12M5 1v3M11 1v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                                </svg>
                                {range}
                              </span>
                              {proj.division && <span className="w-0.75 h-0.75 rounded-full bg-slate-400/30" />}
                            </>
                          )}
                          {proj.division && (
                            <span className="flex items-center gap-1.25 text-[0.78rem] text-[#637AA3] font-light">
                              <svg className="w-3.5 h-3.5 opacity-50" viewBox="0 0 16 16" fill="none">
                                <path d="M3 4h10v8H3z M3 8h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                              </svg>
                              {proj.division.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="bg-white rounded p-10 text-center">
                <p className="font-heading text-[1rem] font-semibold text-ink mb-1.5">
                  {projects.length === 0 ? "No projects available" : "No projects match your filters"}
                </p>
                <p className="font-body text-[0.8125rem] text-slate-500">
                  {hasActiveFilter ? "Try clearing some filters to see more results." : "Check back soon — new projects are added regularly."}
                </p>
              </div>
            )}

            {/* Pagination footer */}
            {!loading && paginated.length > 0 && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-2">
                <p className="font-body text-[0.8125rem] text-slate-500">
                  Showing <span className="font-medium text-ink">{startIdx}–{endIdx}</span>{" "}
                  of <span className="font-medium text-ink">{total}</span> {total === 1 ? "project" : "projects"}
                </p>

                {totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={page === 1}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      className="font-body text-[0.75rem] tracking-[0.05em] uppercase font-medium px-3 py-1.5 rounded border border-[#0474C4]/20 text-slate-500 hover:border-[#0474C4] hover:text-[#0474C4] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Prev
                    </button>
                    {pages.map((p, i) =>
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
                      className="font-body text-[0.75rem] tracking-[0.05em] uppercase font-medium px-3 py-1.5 rounded border border-[#0474C4]/20 text-slate-500 hover:border-[#0474C4] hover:text-[#0474C4] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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

      {/* Organizations strip */}
      <OrganizationsStrip heading="Our Solutions" />
    </>
  )
}

export default withLayout(ResearchProjectsPage)
