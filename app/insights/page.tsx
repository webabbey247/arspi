"use client";

import * as React from "react";
import Link from "next/link";
import { Clock, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import withLayout from "@/hooks/useLayout";
import { getInsights, type PublicInsight } from "@/services/public-insight.service";
import PageHero from "@/components/sections/PageHero";

const PAGE_SIZE = 9

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

function InsightCardSkeleton() {
  return (
    <div className="border border-[#0474C4]/15 rounded overflow-hidden flex flex-col animate-pulse">
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 w-20 bg-slate-200 rounded" />
          <div className="h-3 w-16 bg-slate-200 rounded" />
        </div>
        <div className="h-5 bg-slate-200 rounded mb-2" />
        <div className="h-5 w-3/4 bg-slate-200 rounded mb-4" />
        <div className="space-y-2 mb-5 flex-1">
          <div className="h-3 bg-slate-200 rounded" />
          <div className="h-3 bg-slate-200 rounded" />
          <div className="h-3 w-2/3 bg-slate-200 rounded" />
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-[#0474C4]/18 mt-auto">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-slate-200" />
            <div className="h-3 w-20 bg-slate-200 rounded" />
          </div>
          <div className="h-3 w-14 bg-slate-200 rounded" />
        </div>
      </div>
      <div className="px-6 pb-4">
        <div className="h-3 w-24 bg-slate-200 rounded" />
      </div>
    </div>
  )
}

 const InsightsPage =() => {
  const [activeCategory, setActiveCategory] = React.useState("All");
  const [insights, setInsights] = React.useState<PublicInsight[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);

  const loadInsights = React.useCallback(() => {
    setLoading(true);
    setError(null);

    getInsights()
      .then(setInsights)
      .catch((err: unknown) => {
        setInsights([]);
        setError(err instanceof Error ? err.message : "Failed to load insights");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  React.useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  const categories = React.useMemo(
    () => ["All", ...Array.from(new Set(insights.map((ins) => ins.category)))],
    [insights]
  );

  const featured = insights.filter((i) => i.featured);
  const filtered = insights.filter((ins) => {
    return activeCategory === "All" || ins.category === activeCategory;
  });
  const nonFeaturedFiltered = filtered.filter((ins) => !ins.featured);

  React.useEffect(() => { setPage(1) }, [activeCategory]);

  const total       = nonFeaturedFiltered.length;
  const totalPages  = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const paginated   = nonFeaturedFiltered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const startIdx    = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endIdx      = Math.min(page * PAGE_SIZE, total);
  const pageNumbers = pageWindow(page, totalPages);

  return (
    <>
      <PageHero
            tagline="Research & Knowledge Hub"
            captionTextOne="Insights, Research & "
            highlightText="Expert Perspectives"
            description="Articles, research highlights, practice guides, and news from the ARPS Institute team and our network of scholars and practitioners worldwide."
            pageType="insights"
            imageUrl="/images/insight-page-banner.jpg"
          />

        

      {/* Featured articles */}
      {activeCategory === "All" && featured.length >= 1 && (
  <section className="bg-white px-4 sm:px-6 md:px-10 lg:px-16 py-10 sm:py-12 md:py-14 lg:py-16 w-full">
    <div className="max-w-350 mx-auto flex flex-col gap-6 sm:gap-7 md:gap-8 w-full">
      <div className="flex flex-col gap-1.5 sm:gap-2">
        <p className="font-body text-[0.6875rem] sm:text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#637AA3]">
          Featured
        </p>
        <h2 className="font-heading text-[1.375rem] sm:text-[1.5rem] md:text-[1.625rem] lg:text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-[#0474C4]">
          Editor&apos;s Picks
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 md:gap-6 w-full">
        {featured.map((ins) => (
          <Link
            key={ins.slug}
            href={`/insights/${ins.slug}`}
            className="group bg-white/90 border border-[#0474C4]/50 rounded overflow-hidden hover:border-[#0474C4]/60 hover:-translate-y-0.5 transition-all no-underline flex flex-col"
          >
            <div className="h-1 bg-[#0474C4]" />

            <div className="p-5 sm:p-6 md:p-7 flex flex-col flex-1">

              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                <Badge className="font-body text-[0.625rem] sm:text-[0.6875rem] tracking-[0.05em] font-medium bg-[#0474C4]/10 text-[#0474C4] border-0 px-2 py-0.5">
                  {ins.category}
                </Badge>
                <span className="bg-[#0474C4] text-white font-body text-[0.625rem] sm:text-[0.6875rem] tracking-[0.07em] uppercase font-medium px-2 py-0.5 rounded">
                  Featured
                </span>
              </div>

              <h3 className="font-heading line-clamp-2 text-[1.125rem] sm:text-[1.25rem] md:text-[1.375rem] tracking-[-0.005em] leading-[1.3] font-medium text-[#262B40] mb-2.5 sm:mb-3 group-hover:text-[#0474C4] transition-colors">
                {ins.title}
              </h3>

              <p className="font-body text-[0.8125rem] sm:text-[0.875rem] tracking-[0em] leading-[1.6] font-normal text-slate-500 mb-4 sm:mb-5 flex-1 line-clamp-3">
                {ins.excerpt}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-[#0474C4]/18">
                <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-[#0474C4] flex items-center justify-center font-body text-[0.6875rem] font-medium text-[#EBF3FC] shrink-0">
                    {ins.authorInitials}
                  </div>
                  <div className="min-w-0">
                    <div className="font-body text-[0.75rem] sm:text-[0.8125rem] tracking-[0em] leading-normal font-medium text-ink truncate">
                      {ins.author}
                    </div>
                    <div className="font-body text-[0.625rem] sm:text-[0.6875rem] tracking-[0.05em] font-normal text-slate-400">
                      {ins.date}
                    </div>
                  </div>
                </div>

                <span className="flex items-center gap-1 font-body text-[0.6875rem] sm:text-[0.75rem] tracking-[0em] font-normal text-[#637AA3] shrink-0">
                  <Clock className="h-3 w-3" />
                  {ins.readTime}
                </span>
              </div>

            </div>
          </Link>
        ))}
      </div>

    </div>
  </section>
)}

      {/* All articles grid */}
      <section className="bg-sky-light px-4 sm:px-6 md:px-10 lg:px-16 py-10 sm:py-12 md:py-14 lg:py-16 w-full">
        <div className="max-w-350 mx-auto flex flex-col w-full">

          {/* Section header */}
          <div className="mb-6 sm:mb-7 md:mb-8">
            <p className="font-body text-[0.6875rem] sm:text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#637AA3] mb-1.5 sm:mb-2">
              {activeCategory === "All" ? "All Insights" : activeCategory}
            </p>
            <h2 className="font-heading text-[1.375rem] sm:text-[1.5rem] md:text-[1.625rem] lg:text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-[#0474C4]">
              {activeCategory === "All" ? "Latest Articles" : `${activeCategory} Articles`}
            </h2>
          </div>

          {error ? (
            <div className="text-center py-12 sm:py-16 md:py-20">
              <h3 className="font-serif text-lg sm:text-xl text-ink mb-2">Unable to load insights</h3>
              <p className="text-slate-400 font-light text-[0.8125rem] sm:text-sm">{error}</p>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <InsightCardSkeleton key={i} />
              ))}
            </div>
          ) : total === 0 ? (
            <div className="text-center py-12 sm:py-16 md:py-20">
              <h3 className="font-serif text-lg sm:text-xl text-ink mb-2">No articles yet</h3>
              <p className="text-slate-400 font-light text-[0.8125rem] sm:text-sm">
                {activeCategory === "All"
                  ? "Check back soon — new insights are published regularly."
                  : `No articles in ${activeCategory} yet.`}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {paginated.map((ins) => (
                  <Link
                    key={ins.slug}
                    href={`/insights/${ins.slug}`}
                    className="group border border-[#0474C4]/25 rounded overflow-hidden hover:border-[#0474C4]/55 hover:-translate-y-0.5 transition-all no-underline flex flex-col"
                  >
                    <div className="p-5 sm:p-6 flex flex-col flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 sm:mb-4">
                        <Badge className="font-body text-[0.625rem] sm:text-[0.6875rem] tracking-[0.05em] font-medium bg-[#0474C4]/10 text-[#0474C4] border-0 px-2 py-0.5">
                          {ins.category}
                        </Badge>
                        <div className="flex items-center gap-1 font-body text-[0.6875rem] sm:text-[0.75rem] tracking-[0em] font-normal text-[#637AA3] shrink-0">
                          <Clock className="h-3 w-3" />
                          {ins.readTime}
                        </div>
                      </div>
                      <h3 className="font-heading line-clamp-2 text-[1.125rem] sm:text-[1.25rem] md:text-[1.375rem] tracking-[-0.005em] leading-[1.3] font-medium text-[#262B40] mb-2.5 sm:mb-3 group-hover:text-[#0474C4] transition-colors">
                        {ins.title}
                      </h3>
                      <p className="font-body text-[0.8125rem] sm:text-[0.875rem] tracking-[0em] leading-[1.6] font-normal text-slate-500 mb-4 sm:mb-5 flex-1 line-clamp-3">
                        {ins.excerpt}
                      </p>
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 sm:pt-4 border-t border-[#0474C4]/18 mt-auto">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-full text-[#EBF3FC] bg-[#0474C4] flex items-center justify-center font-serif text-[0.6rem] text-sky shrink-0">
                            {ins.authorInitials}
                          </div>
                          <span className="text-[0.6875rem] sm:text-[0.72rem] text-slate-500 font-light truncate">{ins.author}</span>
                        </div>
                        <span className="text-[0.625rem] sm:text-[0.68rem] text-slate-400 shrink-0">{ins.date}</span>
                      </div>
                    </div>
                    <div className="px-5 sm:px-6 pb-4">
                      <span className="inline-flex items-center gap-1 text-[0.6875rem] sm:text-[0.72rem] text-[#0474C4] group-hover:gap-2 transition-all">
                        Read article <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination footer */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mt-6 sm:mt-8">
                <p className="font-body text-[0.75rem] sm:text-[0.8125rem] text-slate-500">
                  Showing <span className="font-medium text-ink">{startIdx}-{endIdx}</span>{" "}
                  of <span className="font-medium text-ink">{total}</span> {total === 1 ? "article" : "articles"}
                </p>

                {totalPages > 1 && (
                  <div className="flex flex-wrap items-center gap-1 w-full sm:w-auto justify-start sm:justify-end">
                    <button
                      type="button"
                      disabled={page === 1}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      className="font-body text-[0.6875rem] sm:text-[0.75rem] tracking-[0.05em] uppercase font-medium px-2.5 sm:px-3 py-1.5 rounded border border-[#0474C4]/20 text-slate-500 hover:border-[#0474C4] hover:text-[#0474C4] disabled:opacity-40 disabled:hover:border-[#0474C4]/20 disabled:hover:text-slate-500 cursor-pointer disabled:cursor-not-allowed"
                    >
                      Prev
                    </button>
                    {pageNumbers.map((p, i) =>
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
            </>
          )}
        </div>
      </section>

    
    </>
  );
}

export default withLayout(InsightsPage);