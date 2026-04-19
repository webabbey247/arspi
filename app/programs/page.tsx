"use client";

import * as React from "react";
import withLayout from "@/hooks/useLayout";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getPrograms, type PublicProgram } from "@/services/public-program.service";

const PAGE_SIZE = 16;

const ProgramsPage = () => {
  const [programs, setPrograms]     = React.useState<PublicProgram[]>([]);
  const [loading, setLoading]       = React.useState(true);
  const [activeCat, setActiveCat]   = React.useState("all");
  const [page, setPage]             = React.useState(1);

  React.useEffect(() => {
    setLoading(true);
    getPrograms()
      .then(setPrograms)
      .catch(() => setPrograms([]))
      .finally(() => setLoading(false));
  }, []);

  // Reset to page 1 whenever the category filter changes
  React.useEffect(() => { setPage(1); }, [activeCat]);

  // Unique categories derived from loaded programs
  const categories = React.useMemo(() => {
    const seen = new Set<string>();
    const cats: { id: string; name: string }[] = [];
    for (const p of programs) {
      if (p.category && !seen.has(p.category.id)) {
        seen.add(p.category.id);
        cats.push({ id: p.category.id, name: p.category.name });
      }
    }
    return cats;
  }, [programs]);

  const filtered = activeCat === "all"
    ? programs
    : programs.filter((p) => p.category?.id === activeCat);

  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage    = Math.min(page, totalPages);
  const paginated   = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <>
      {/* Hero */}
      <section className="bg-[#071639] relative overflow-hidden px-8 md:px-16 py-24 w-full">
        <div className="absolute inset-0 bg-grid-ink pointer-events-none" />
        <div className="absolute -top-24 right-0 w-125 h-125 rounded-full bg-[#0474C4]/8 blur-[100px] pointer-events-none" />
        <div className="relative z-10 max-w-200 w-full">
          <div className="flex flex-col gap-4 items-start w-full">
            <p className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#EBF3FC] inline-flex items-center gap-2">
              <span className="block w-8 h-px bg-[#EBF3FC]" />
              Professional Certificate Academy
            </p>
            <h1 className="font-heading text-[2.25rem] md:text-[3rem] tracking-[-0.015em] md:tracking-[-0.02em] leading-[1.2] md:leading-[1.1] font-bold text-white max-w-lg">
              Build <em className="italic text-[#0474C4]">Expert Sessions</em>
              <br />
              Earn a Global Certificate
            </h1>
            <p className="font-body text-[1.125rem] tracking-[-0.01em] leading-[1.65] font-light text-[#EBF3FC] max-w-lg">
              Short-term professional certification programs — typically 1 to 4
              months — combining theoretical knowledge with applied learning
              across six key discipline areas.
            </p>
          </div>

          {/* Stats */}
          <div className="flex gap-8 flex-wrap pt-8 mt-8 border-t border-[#0474C4]/15">
            {[
              { value: "40+",  label: "Certificate Programs" },
              { value: "1–4",  label: "Months Duration" },
              { value: "100%", label: "Online & Flexible" },
              { value: "120+", label: "Countries Served" },
            ].map((s) => (
              <div key={s.label}>
                <span className="block font-heading text-[1.75rem] tracking-[-0.01em] leading-[1.1] font-semibold text-[#EBF3FC]">
                  {s.value}
                </span>
                <span className="font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium text-[#EBF3FC]">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features strip */}
      <section className="bg-[#06457F] py-12 px-8 md:px-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-b border-[#C8A96E]/10">
        {[
          {
            icon: (
              <>
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <path d="M8 21h8M12 17v4" />
              </>
            ),
            title: "Live Virtual Sessions",
            desc: "Real-time instruction with cohort interaction via Zoom",
          },
          {
            icon: (
              <>
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </>
            ),
            title: "Self-Paced Access",
            desc: "Recorded lectures available 24/7 for flexible learning",
          },
          {
            icon: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />,
            title: "Verified Certificate",
            desc: "Digitally signed certificate with QR verification",
          },
          {
            icon: (
              <>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </>
            ),
            title: "Expert Facilitators",
            desc: "Led by practising researchers and academic professionals",
          },
        ].map(({ icon, title, desc }) => (
          <div key={title} className="py-[1.8rem] px-6 flex items-start gap-4">
            <div className="w-10 h-10 rounded-[8px] bg-[#C8A96E]/8 border border-[#C8A96E]/15 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-[#F7F3ED]" strokeWidth="1.6" strokeLinecap="round">
                {icon}
              </svg>
            </div>
            <div>
              <div className="font-heading text-[0.9rem] font-normal text-[#F7F3ED] mb-0.75">{title}</div>
              <div className="text-[0.78rem] text-[#F7F3ED]/35 font-light leading-normal">{desc}</div>
            </div>
          </div>
        ))}
      </section>

      {/* Programs grid */}
      <section className="bg-white px-8 md:px-16 py-16 w-full">
        <div className="max-w-350 mx-auto flex flex-col gap-10">

          {/* Filter bar */}
          <div className="bg-white/97 sticky top-17 z-30 backdrop-blur py-3 flex items-center gap-2.5 overflow-x-auto w-full">
            <span className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#637AA3] mr-2 shrink-0">
              Filter:
            </span>
            <button
              onClick={() => setActiveCat("all")}
              className={`font-body text-[0.75rem] tracking-[0.05em] leading-normal font-medium px-4 py-1.5 rounded-full border transition-all whitespace-nowrap shrink-0 ${
                activeCat === "all"
                  ? "bg-[#0474C4] text-[#EBF3FC] border-[#0474C4]"
                  : "bg-transparent text-slate-500 border-[#0474C4]/25 hover:border-[#0474C4] hover:text-[#0474C4]"
              }`}
            >
              All Programs
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCat(cat.id)}
                className={`font-body text-[0.75rem] tracking-[0.05em] leading-normal font-medium px-4 py-1.5 rounded-full border transition-all whitespace-nowrap shrink-0 ${
                  activeCat === cat.id
                    ? "bg-[#0474C4] text-[#EBF3FC] border-[#0474C4]"
                    : "bg-transparent text-slate-500 border-[#0474C4]/25 hover:border-[#0474C4] hover:text-[#0474C4]"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Count + loading */}
          {!loading && (
            <p className="text-[0.78rem] text-[#637AA3]">
              {filtered.length === 0
                ? "No programs found."
                : `Showing ${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(safePage * PAGE_SIZE, filtered.length)} of ${filtered.length} program${filtered.length !== 1 ? "s" : ""}`}
            </p>
          )}

          {/* Grid */}
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
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
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {paginated.map((prog) => {
                const initials = prog.instructor.name
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((w) => w[0]?.toUpperCase() ?? "")
                  .join("");
                const price = prog.price > 0 ? `$${prog.price.toLocaleString()}` : "Free";
                const level = prog.level.charAt(0) + prog.level.slice(1).toLowerCase();

                return (
                  <Link
                    href={`/programs/${prog.slug}`}
                    key={prog.id}
                    className="group bg-white rounded-sm overflow-hidden border border-[#0474C4]/15 transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(13,27,42,0.1)]"
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

                    <div className="px-5 pt-[1.3rem] pb-[1.5rem]">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-[#0474C4] text-white font-body text-[0.8125rem] font-medium flex items-center justify-center shrink-0">
                          {initials}
                        </div>
                        <span className="font-body text-[0.8125rem] tracking-[0em] font-normal text-slate-600 truncate">
                          {prog.instructor.name}
                        </span>
                      </div>

                      <h3 className="font-heading text-[1.02rem] font-normal text-[#071639] leading-[1.35] mb-4 line-clamp-2">
                        {prog.title}
                      </h3>

                      <div className="flex gap-[1.2rem] items-center">
                        {prog.duration && (
                          <>
                            <span className="flex items-center gap-1.25 text-[0.78rem] text-[#637AA3] font-light">
                              <svg className="w-3.5 h-3.5 opacity-50" viewBox="0 0 16 16" fill="none">
                                <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2" />
                                <path d="M8 5v3.5l2 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                              </svg>
                              {prog.duration}
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
            <div className="py-16 text-center text-slate-400 text-sm">
              No programs found in this category.
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 pt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="w-9 h-9 flex items-center justify-center rounded border border-[#0474C4]/20 text-[#637AA3] transition-all hover:border-[#0474C4] hover:text-[#0474C4] disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => {
                const isActive = n === safePage;
                const show = n === 1 || n === totalPages || Math.abs(n - safePage) <= 1;
                const showEllipsisBefore = n === safePage - 2 && safePage > 3;
                const showEllipsisAfter  = n === safePage + 2 && safePage < totalPages - 2;

                if (showEllipsisBefore || showEllipsisAfter) {
                  return (
                    <span key={n} className="w-9 h-9 flex items-center justify-center text-[#637AA3] text-sm">
                      …
                    </span>
                  );
                }
                if (!show) return null;
                return (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`w-9 h-9 flex items-center justify-center rounded border font-body text-[0.82rem] transition-all ${
                      isActive
                        ? "bg-[#0474C4] border-[#0474C4] text-white font-semibold"
                        : "border-[#0474C4]/20 text-[#637AA3] hover:border-[#0474C4] hover:text-[#0474C4]"
                    }`}
                  >
                    {n}
                  </button>
                );
              })}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="w-9 h-9 flex items-center justify-center rounded border border-[#0474C4]/20 text-[#637AA3] transition-all hover:border-[#0474C4] hover:text-[#0474C4] disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default withLayout(ProgramsPage);
