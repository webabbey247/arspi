"use client";

import * as React from "react";
import withLayout from "@/hooks/useLayout";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import {
  getPrograms,
  getProgramLookups,
  type PublicProgram,
  type ProgramLookup,
} from "@/services/public-program.service";
import PageHero from "@/components/sections/PageHero";

const PAGE_SIZE = 20;

// ── Filter accordion (matches careers/workshops pattern) ──────────────────────

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

// ── Page ─────────────────────────────────────────────────────────────────────

const ProgramsPage = () => {
  const [programs, setPrograms] = React.useState<PublicProgram[]>([]);
  const [loading, setLoading]   = React.useState(true);
  const [page, setPage]         = React.useState(1);
  const [filtersOpen, setFiltersOpen] = React.useState(false);

  // Lookup-table options (Levels / Pricing tabs in admin)
  const [levelOptionsList,   setLevelOptionsList]   = React.useState<ProgramLookup[]>([])
  const [pricingOptionsList, setPricingOptionsList] = React.useState<ProgramLookup[]>([])

  // Filter state — store ids for managed lookups
  const [categoryFilter, setCategoryFilter] = React.useState<string[]>([])
  const [priceFilter,    setPriceFilter]    = React.useState<string[]>([])
  const [levelFilter,    setLevelFilter]    = React.useState<string[]>([])

  React.useEffect(() => {
    setLoading(true);
    Promise.all([
      getPrograms().then(setPrograms).catch(() => setPrograms([])),
      getProgramLookups("levels").then(setLevelOptionsList).catch(() => setLevelOptionsList([])),
      getProgramLookups("pricing").then(setPricingOptionsList).catch(() => setPricingOptionsList([])),
    ]).finally(() => setLoading(false));
  }, []);

  // Derived filter options with counts. Counts are drawn from the loaded
  // programs against the new managed-lookup relations (programLevel/Format/Pricing).
  const categories = React.useMemo(() => {
    const counts = new Map<string, { label: string; count: number }>();
    for (const p of programs) {
      if (!p.category) continue;
      const entry = counts.get(p.category.id);
      if (entry) entry.count++;
      else counts.set(p.category.id, { label: p.category.name, count: 1 });
    }
    return Array.from(counts.entries()).map(([id, { label, count }]) => ({ id, label, count }));
  }, [programs]);

  const levelOptions = React.useMemo(
    () => levelOptionsList.map(o => ({
      id:    o.id,
      label: o.name,
      count: programs.filter(p => p.programLevel?.id === o.id).length,
    })),
    [levelOptionsList, programs],
  );

  const priceOptions = React.useMemo(
    () => pricingOptionsList.map(o => ({
      id:    o.id,
      label: o.name,
      count: programs.filter(p => p.programPricing?.id === o.id).length,
    })),
    [pricingOptionsList, programs],
  );

  const hasActiveFilter =
    categoryFilter.length > 0 || priceFilter.length > 0 ||
    levelFilter.length > 0

  function clearFilters() {
    setCategoryFilter([])
    setPriceFilter([])
    setLevelFilter([])
  }

  function passesFilters(p: PublicProgram): boolean {
    return (categoryFilter.length === 0 || (!!p.category       && categoryFilter.includes(p.category.id)))
      && (levelFilter.length    === 0   || (!!p.programLevel   && levelFilter.includes(p.programLevel.id)))
      && (priceFilter.length    === 0   || (!!p.programPricing && priceFilter.includes(p.programPricing.id)))
  }

  const filtered   = programs.filter(passesFilters)
  const total      = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const startIdx   = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const endIdx     = Math.min(page * PAGE_SIZE, total)
  const pages      = pageWindow(page, totalPages)

  React.useEffect(() => { setPage(1) }, [
    categoryFilter, priceFilter, levelFilter,
  ])

  return (
    <>
      {/* Hero */}
      <PageHero
        tagline="Professional Certificate Academy"
        captionTextOne="Build "
        highlightText="Expert Sessions"
        captionTextTwo="Earn a Global Certificate"
        description="Short-term professional certification programs — typically 1 to 4 months — combining theoretical knowledge with applied learning across six key discipline areas."
        pageType="programs"
        imageUrl="/images/about-arps.webp"
      />

      {/* How it works — process flow */}
      {/* <section className="bg-white px-8 md:px-16 py-16 md:py-20 border-t border-[#e8e8e8]">
       <div className="max-w-350 mx-auto flex flex-col lg:flex-col items-center gap-12">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-14">
          <div>
            <p className="font-body text-[0.65rem] tracking-[0.15em] uppercase text-[#0474C4] font-medium mb-3">
              How It Works
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-normal text-[#111] leading-tight">
              Your learning journey
            </h2>
          </div>
          <p className="font-body text-[0.8125rem] text-[#777] max-w-xs leading-relaxed">
            From expert instruction to a globally recognised certificate — four clear steps.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0">
          {[
            {
              step: "01",
              icon: (
                <>
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </>
              ),
              title: "Expert Facilitators",
              desc: "Learn from practising researchers and academic professionals",
            },
            {
              step: "02",
              icon: (
                <>
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <path d="M8 21h8M12 17v4" />
                </>
              ),
              title: "Live Virtual Sessions",
              desc: "Real-time cohort instruction and interactive discussions via Zoom",
            },
            {
              step: "03",
              icon: (
                <>
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </>
              ),
              title: "Self-Paced Access",
              desc: "Recorded lectures available 24/7 — learn around your schedule",
            },
            {
              step: "04",
              icon: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />,
              title: "Verified Certificate",
              desc: "Earn a digitally signed certificate with QR code verification",
            },
          ].map(({ step, icon, title, desc }, i, arr) => (
            <div key={step} className="relative flex flex-col lg:flex-row items-start lg:items-stretch">
              <div className="flex-1 px-0 lg:pr-8 pb-10 lg:pb-0 pt-0 flex flex-col gap-5">
                <div className="flex items-center gap-3">
                  <span className="font-body text-[0.65rem] tracking-[0.15em] font-semibold text-[#0474C4]">
                    {step}
                  </span>
                  {i < arr.length - 1 && (
                    <div className="hidden lg:block flex-1 border-t border-dashed border-[#0474C4]/20" />
                  )}
                </div>
                <div className="w-11 h-11 rounded-full border border-[#0474C4]/20 bg-[#0474C4]/5 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-[#0474C4]" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    {icon}
                  </svg>
                </div>
                <div>
                  <h3 className="font-heading text-[1rem] font-normal text-[#111] mb-1.5 leading-snug">{title}</h3>
                  <p className="font-body text-[0.78rem] text-[#777] font-light leading-relaxed">{desc}</p>
                </div>
              </div>
              {i < arr.length - 1 && (
                <div className="lg:hidden absolute left-[0.4rem] top-[2.2rem] bottom-0 w-px border-l border-dashed border-[#0474C4]/20" />
              )}
            </div>
          ))}
        </div>
        </div>
      </section> */}

      {/* Programs — sidebar + grid */}
      <section className="bg-white px-4 md:px-16 pb-20 pt-10 w-full border-t border-[#e8e8e8]">
        <div className="max-w-350 mx-auto flex flex-col lg:flex-row gap-8 w-full">

          {/* Left sidebar */}
          <aside className="lg:w-72 shrink-0">
            <div className="lg:sticky lg:top-32 px-0">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-heading text-[1rem] tracking-[-0.005em] font-semibold text-[#0474C4]">
                    Filters
                  </h3>
                  <button
                    type="button"
                    onClick={() => setFiltersOpen(o => !o)}
                    aria-expanded={filtersOpen}
                    aria-controls="programs-filter-options"
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
                id="programs-filter-options"
                className={`flex-col ${filtersOpen ? "flex" : "hidden"} sm:flex`}
              >
                <FilterAccordion
                  title="Category"
                  options={categories}
                  selected={categoryFilter}
                  onToggle={id => setCategoryFilter(toggleIn(categoryFilter, id))}
                  defaultOpen
                />
                {priceOptions.length > 0 && (
                  <FilterAccordion
                    title="Price"
                    options={priceOptions}
                    selected={priceFilter}
                    onToggle={id => setPriceFilter(toggleIn(priceFilter, id))}
                    defaultOpen
                  />
                )}
                {levelOptions.length > 0 && (
                  <FilterAccordion
                    title="Level"
                    options={levelOptions}
                    selected={levelFilter}
                    onToggle={id => setLevelFilter(toggleIn(levelFilter, id))}
                  />
                )}
              </div>
            </div>
          </aside>

          {/* Right — grid + pagination */}
          <div className="flex-1 min-w-0 flex flex-col gap-6">

            {/* Count */}
            {!loading && (
              <p className="font-body text-[0.8125rem] text-slate-500">
                {total !== 0 && (
                  <>Showing <span className="font-medium text-ink">{startIdx}–{endIdx}</span> of <span className="font-medium text-ink">{total}</span> {total === 1 ? "program" : "programs"}</>
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
                {paginated.map((prog) => {
                  const initials = prog.instructor.name
                    .split(" ").filter(Boolean).slice(0, 2)
                    .map(w => w[0]?.toUpperCase() ?? "").join("");
                  const price = prog.price > 0 ? `$${prog.price.toLocaleString()}` : "Free";
                  const level = prog.level.charAt(0) + prog.level.slice(1).toLowerCase();

                  return (
                    <Link
                      // href={`/programs/${prog.slug}`}
                      href="#"
                      key={prog.id}
                      className="group bg-white rounded-sm overflow-hidden transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(13,27,42,0.1)]"
                    >
                      <div className="relative aspect-16/10 overflow-hidden bg-slate-100">
                        <Image
                          src={prog.thumbnail || "/images/dummy/course-1.jpg"}
                          alt={prog.title}
                          fill
                          className="object-cover transition-transform duration-400 group-hover:scale-[1.04]"
                        />
                        {prog.featured && (
                          <span className="absolute top-3 left-3 bg-[#C8A96E] text-[#0D1B2A] text-[0.65rem] font-medium tracking-widest uppercase px-2.5 py-1 rounded-sm">
                            Featured
                          </span>
                        )}
                        <span className="absolute bottom-3 right-3 bg-[#071639] text-[#F7F3ED] font-body text-[0.78rem] font-medium tracking-[0.06em] px-3.5 py-1.5 rounded-sm">
                          {price}
                        </span>
                      </div>

                      <div className="px-5 pt-[1.3rem] pb-6">
                        {/* <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-full bg-[#0474C4] text-white font-body text-[0.8125rem] font-medium flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <span className="font-body text-[0.8125rem] font-normal text-slate-600 truncate">
                            {prog.instructor.name}
                          </span>
                        </div> */}

                        <h3 className="font-heading text-[1.02rem] font-normal text-[#071639] leading-[1.35] mb-4 line-clamp-2">
                          {prog.title}
                        </h3>
                        <p className="font-body text-[0.8125rem] text-slate-500 leading-relaxed line-clamp-2">
                          {prog.excerpt}
                          </p>
              

                        <div className="flex gap-[1.2rem] items-center mt-4">
                          {prog.duration && (
                            <>
                              <span className="flex items-center gap-1.25 text-[0.78rem] text-[#637AA3] font-light">
                                <svg className="w-3.5 h-3.5 opacity-50" viewBox="0 0 16 16" fill="none">
                                  <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2" />
                                  <path d="M8 5v3.5l2 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                                </svg>
                                {prog.duration.length > 1 ? `${prog.duration} hrs` : `${prog.duration} hr`}
                              </span>
                              <span className="w-0.75 h-0.75 rounded-full bg-slate-400/30" />
                            </>
                          )}
                          <span className="flex items-center gap-1.25 text-[0.78rem] text-[#637AA3] font-light">
                            <svg className="w-3.5 h-3.5 opacity-50" viewBox="0 0 16 16" fill="none">
                              <rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                              <path d="M5 7h6M5 10h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                            </svg>
                            {level}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded p-10 text-center">
                <p className="font-heading text-[1rem] font-semibold text-ink mb-1.5">
                  {programs.length === 0 ? "No programs available" : "No programs match your filters"}
                </p>
                <p className="font-body text-[0.8125rem] text-slate-500">
                  {hasActiveFilter ? "Try clearing some filters to see more results." : "Check back soon — new programs are added regularly."}
                </p>
              </div>
            )}

            {/* Pagination footer */}
            {!loading && paginated.length > 0 && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-2">
                <p className="font-body text-[0.8125rem] text-slate-500">
                  Showing <span className="font-medium text-ink">{startIdx}–{endIdx}</span>{" "}
                  of <span className="font-medium text-ink">{total}</span> {total === 1 ? "program" : "programs"}
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
    </>
  );
};

export default withLayout(ProgramsPage);
