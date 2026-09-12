"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Clock, ArrowLeft, ArrowRight, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import withLayout from "@/hooks/useLayout";
import { getInsightBySlug, type PublicInsightDetailResponse } from "@/services/public-insight.service";
import { sanitizeHtml } from "@/lib/sanitize";

function InsightDetailSkeleton() {
  return (
    <>
      {/* Hero skeleton — mirrors the dark banner */}
      <section className="bg-[#071639] relative overflow-hidden px-4 sm:px-6 md:px-10 lg:px-16 pt-10 pb-6 md:pt-12 md:pb-10 lg:py-16 w-full">
        <div className="absolute inset-0 bg-grid-ink pointer-events-none" />
        <div className="absolute -top-24 right-0 w-125 h-125 rounded-full bg-[#0474C4]/8 blur-[100px] pointer-events-none" />
        <div className="relative z-10 max-w-350 mx-auto space-y-4 animate-pulse">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="h-5 w-20 sm:w-24 bg-white/15 rounded-full" />
            <div className="h-3 w-14 sm:w-16 bg-white/10 rounded" />
          </div>

          <div className="flex flex-col gap-4 sm:gap-6">
            <div className="flex flex-col gap-2 sm:gap-3 max-w-xl">
              <div className="h-7 sm:h-9 md:h-11 bg-white/15 rounded" />
              <div className="h-7 sm:h-9 md:h-11 w-5/6 bg-white/15 rounded" />
              <div className="h-7 sm:h-9 md:h-11 w-2/3 bg-white/15 rounded" />
            </div>

            <div className="flex flex-col gap-2 max-w-2xl">
              <div className="h-3.5 sm:h-4 bg-white/10 rounded" />
              <div className="h-3.5 sm:h-4 w-4/5 bg-white/10 rounded" />
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 py-3 sm:py-4 border-t border-[#0474C4]/15">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/15 shrink-0" />
            <div className="flex flex-col gap-1.5 min-w-0">
              <div className="h-3 w-24 sm:w-32 bg-white/15 rounded" />
              <div className="h-3 w-20 sm:w-24 bg-white/10 rounded" />
            </div>
            <div className="ml-auto h-3 w-14 sm:w-16 bg-white/10 rounded shrink-0" />
          </div>
        </div>
      </section>

      {/* Body skeleton — article + sidebar */}
      <div className="max-w-350 mx-auto px-4 sm:px-6 md:px-8 py-10 sm:py-12 md:py-14 lg:py-16 grid lg:grid-cols-[1fr_340px] gap-8 md:gap-10 lg:gap-14 justify-between items-start w-full">
        <article className="animate-pulse">
          <div className="space-y-3">
            <div className="h-4 bg-slate-200 rounded" />
            <div className="h-4 bg-slate-200 rounded" />
            <div className="h-4 w-11/12 bg-slate-200 rounded" />
            <div className="h-4 w-3/4 bg-slate-200 rounded" />

            <div className="h-7 w-2/3 bg-slate-200 rounded mt-8 mb-2" />

            <div className="h-4 bg-slate-200 rounded" />
            <div className="h-4 w-11/12 bg-slate-200 rounded" />
            <div className="h-4 bg-slate-200 rounded" />
            <div className="h-4 w-2/3 bg-slate-200 rounded" />

            <div className="h-7 w-1/2 bg-slate-200 rounded mt-8 mb-2" />

            <div className="h-4 bg-slate-200 rounded" />
            <div className="h-4 w-5/6 bg-slate-200 rounded" />
            <div className="h-4 w-3/4 bg-slate-200 rounded" />
          </div>

          {/* Share row */}
          <div className="mt-10 pt-8 border-t border-sapphire/20 flex items-center gap-4 flex-wrap">
            <div className="h-3 w-10 bg-slate-200 rounded" />
            {[80, 90, 80].map((w, i) => (
              <div key={i} className="h-7 bg-slate-200 rounded" style={{ width: w }} />
            ))}
          </div>

          {/* Prev / next */}
          <div className="mt-8 sm:mt-10 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {[0, 1].map(i => (
              <div key={i} className="border border-sapphire/20 rounded p-3.5 sm:p-4">
                <div className={`h-3 w-20 bg-slate-200 rounded mb-2 ${i === 1 ? "ml-auto" : ""}`} />
                <div className="h-4 bg-slate-200 rounded mb-1.5" />
                <div className={`h-4 w-3/4 bg-slate-200 rounded ${i === 1 ? "ml-auto" : ""}`} />
              </div>
            ))}
          </div>
        </article>

        <aside className="lg:sticky lg:top-16 flex flex-col gap-5 sm:gap-6 w-full animate-pulse">
          {/* About the author card */}
          <div className="bg-white border border-[#0474C4]/25 rounded p-5 flex flex-col gap-4">
            <div className="h-6 w-40 bg-slate-200 rounded" />
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-slate-200 rounded" />
                <div className="h-3 w-24 bg-slate-200 rounded" />
                <div className="h-3 bg-slate-200 rounded mt-2" />
                <div className="h-3 w-5/6 bg-slate-200 rounded" />
                <div className="h-3 w-2/3 bg-slate-200 rounded" />
              </div>
            </div>
          </div>

          {/* Deepen Your Practice card */}
          <div className="bg-ink rounded p-5">
            <div className="h-6 w-44 bg-white/15 rounded mb-3" />
            <div className="space-y-2 mb-4">
              <div className="h-3 bg-white/10 rounded" />
              <div className="h-3 w-5/6 bg-white/10 rounded" />
              <div className="h-3 w-2/3 bg-white/10 rounded" />
            </div>
            <div className="h-12 bg-white/15 rounded" />
          </div>
        </aside>
      </div>
    </>
  );
}

const InsightDetailPage = () => {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;

  const [payload, setPayload] = React.useState<PublicInsightDetailResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadInsight = React.useCallback(() => {
    if (!slug) return;

    setLoading(true);
    setNotFound(false);
    setError(null);

    getInsightBySlug(slug)
      .then(setPayload)
      .catch((err: unknown) => {
        const typedError = err as Error & { status?: number };
        if (typedError?.status === 404) {
          setNotFound(true);
          setPayload(null);
          return;
        }

        setPayload(null);
        setError(typedError?.message ?? "Failed to load insight");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [slug]);

  React.useEffect(() => {
    loadInsight();
  }, [loadInsight]);

  if (loading) {
    return <InsightDetailSkeleton />;
  }

  if (notFound || !payload) {
    return (
      <section className="bg-sky-light px-4 sm:px-6 md:px-10 lg:px-16 py-16 sm:py-20 md:py-24 w-full">
        <div className="max-w-200 mx-auto flex flex-col gap-3 sm:gap-4">
          <h1 className="font-heading text-[1.5rem] sm:text-[1.75rem] md:text-[2rem] text-[#262B40]">
            {notFound ? "Insight not found" : "Unable to load insight"}
          </h1>
          <p className="text-slate-500 text-[0.875rem] sm:text-base">
            {notFound
              ? "The article you are looking for does not exist or is not published."
              : (error ?? "Something went wrong while loading this insight.")}
          </p>
          <div>
            <Button asChild className="bg-[#0474C4] hover:bg-[#0474C4]/80 text-[#EBF3FC] rounded-[32px] px-5 py-2 text-[0.8125rem] sm:text-sm">
              <Link href="/insights">Back to Insights</Link>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  const ins = payload.insight;
  const prev = payload.prev;
  const next = payload.next;
  const related = payload.related;

  return (
    <>
      <section className="bg-[#071639] relative overflow-hidden px-4 sm:px-6 md:px-10 lg:px-16 pt-10 pb-6 md:pt-12 md:pb-10 lg:py-16 w-full">
        <div className="absolute inset-0 bg-grid-ink pointer-events-none" />
        <div className="absolute -top-24 right-0 w-125 h-125 rounded-full bg-[#0474C4]/8 blur-[100px] pointer-events-none" />
        <div className="relative z-10 max-w-350 mx-auto space-y-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <Badge className="font-body text-[0.625rem] sm:text-[0.6875rem] tracking-[0.05em] font-medium bg-[#0474C4]">
              {ins.category}
            </Badge>
            {ins.featured && (
              <span className="font-body text-[0.625rem] sm:text-[0.6875rem] tracking-[0.07em] uppercase font-medium text-slate-400">
                Featured
              </span>
            )}
          </div>

          <div className="flex flex-col gap-4 sm:gap-5 md:gap-6">
            <h1 className="font-heading text-[1.625rem] sm:text-[2rem] md:text-[2.5rem] lg:text-[3rem] tracking-[-0.015em] text-white md:tracking-[-0.02em] leading-[1.2] md:leading-[1.1] font-bold text-sky-light max-w-xl">
              {ins.title}
            </h1>

            <p className="font-body text-[0.9375rem] sm:text-[1rem] md:text-[1.125rem] tracking-[-0.01em] leading-[1.65] font-light text-[#EBF3FC]">
              {ins.excerpt}
            </p>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 py-3 sm:py-4 border-t border-[#0474C4]/15">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#0474C4] border border-[#0474C4]/50 flex items-center justify-center font-body text-[0.6875rem] font-medium text-[#EBF3FC] shrink-0">
              {ins.authorInitials}
            </div>

            <div className="flex flex-col justify-start items-start min-w-0">
              <span className="font-body text-[0.8125rem] sm:text-[0.875rem] tracking-[0em] leading-normal font-medium text-white/90 truncate max-w-full">
                {ins.author}
              </span>
              <span className="font-body text-[0.6875rem] sm:text-[0.75rem] tracking-[0em] leading-normal font-normal text-white/90">
                {ins.date} · {ins.readTime}
              </span>
            </div>

            <div className="ml-auto hidden sm:flex items-center gap-1.5 font-body text-[0.75rem] tracking-[0em] font-normal text-white/90 shrink-0">
              <Clock className="h-3 w-3" />
              {ins.readTime}
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-350 mx-auto px-4 sm:px-6 md:px-8 py-10 sm:py-12 md:py-14 lg:py-16 grid lg:grid-cols-[1fr_340px] gap-8 md:gap-10 lg:gap-14 justify-between items-start w-full">
        <article className="w-full min-w-0">
          <div
              className="prose prose-slate max-w-none font-body text-[0.9375rem] sm:text-[1rem] leading-[1.75] sm:leading-[1.8] text-[#1A1916] [&_h2]:tracking-[-0.01em] [&_h2]:leading-tight [&_h2]:font-heading [&_h2]:text-[#071639] [&_h2]:mt-6 sm:[&_h2]:mt-8 md:[&_h2]:mt-10 [&_h2]:mb-2 [&_h2]:text-[1.25rem] sm:[&_h2]:text-[1.5rem] md:[&_h2]:text-[1.75rem] [&_p]:mb-2 [&_ul]:list-disc [&_ul]:ml-5 sm:[&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-5 sm:[&_ol]:ml-6 [&_img]:max-w-full [&_img]:h-auto"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(ins.body) }}
          />
          <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-sapphire/20 flex items-center gap-2 sm:gap-3 md:gap-4 flex-wrap">
            <span className="text-[0.625rem] sm:text-[0.68rem] uppercase tracking-widest text-slate-400">
              Share:
            </span>
            {["LinkedIn", "Twitter/X", "Copy Link"].map((s) => (
              <button
                key={s}
                className="px-3 sm:px-4 py-1.5 text-[0.6875rem] sm:text-[0.72rem] border border-sapphire/25 rounded text-slate-500 hover:border-sapphire hover:text-sapphire transition-all"
              >
                {s}
              </button>
            ))}
          </div>

          <div className="mt-8 sm:mt-10 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {prev ? (
              <Link
                href={`/insights/${prev.slug}`}
                className="group border border-sapphire/20 rounded p-4 sm:p-4 hover:border-sapphire/50 transition-all no-underline"
              >
                <span className="flex items-center gap-2 font-body text-[0.6875rem] sm:text-[0.75rem] tracking-[0.07em] uppercase font-medium text-slate-400 mb-1.5">
                  <ArrowLeft className="h-3 w-3" />
                  Previous
                </span>
                <span className="font-body text-[0.8125rem] sm:text-[0.875rem] tracking-[0em] leading-[1.6] font-normal text-ink group-hover:text-sapphire transition-colors line-clamp-2">
                  {prev.title}
                </span>
              </Link>
            ) : (
              <div className="hidden sm:block" />
            )}

            {next ? (
              <Link
                href={`/insights/${next.slug}`}
                className="group border border-sapphire/20 rounded p-3.5 sm:p-4 hover:border-sapphire/50 transition-all no-underline sm:text-right"
              >
                <div className="flex items-center sm:justify-end gap-2 font-body text-[0.6875rem] sm:text-[0.75rem] tracking-[0.07em] uppercase font-medium text-slate-400 mb-1.5">
                  Next
                  <ArrowRight className="h-3 w-3" />
                </div>
                <div className="font-body text-[0.8125rem] sm:text-[0.875rem] tracking-[0em] leading-[1.6] font-normal text-ink group-hover:text-sapphire transition-colors line-clamp-2">
                  {next.title}
                </div>
              </Link>
            ) : (
              <div className="hidden sm:block" />
            )}
          </div>
        </article>

        <aside className="lg:sticky lg:top-16 flex flex-col gap-5 sm:gap-6 w-full">
          <div className="bg-white border border-[#0474C4]/25 rounded p-4 sm:p-5 flex flex-col gap-3 sm:gap-4">
            <div className="font-heading text-[1.125rem] sm:text-[1.25rem] md:text-[1.375rem] tracking-[-0.005em] leading-[1.3] font-medium text-[#0474C4]">
              About the Author
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#0474C4] flex items-center justify-center font-body text-[0.6875rem] font-medium text-[#EBF3FC] shrink-0">
                {ins.authorInitials}
              </div>

              <div className="min-w-0">
                <div className="font-body text-[0.8125rem] sm:text-[0.875rem] tracking-[0em] leading-normal font-medium text-ink">
                  {ins.author}
                </div>
                {ins.authorJobTitle ? (
                  <div className="font-body text-[0.6875rem] sm:text-[0.75rem] tracking-[0.05em] leading-normal font-normal text-slate-500 mt-1">
                    {ins.authorJobTitle}
                  </div>
                ) : null}

                <div className="font-body text-[0.8125rem] sm:text-[0.875rem] tracking-[0em] leading-[1.6] font-normal text-slate-600 mt-1">
                  {ins.authorBio ??
                    "Expert facilitator and researcher at ARPS Institute, contributing to professional education and capacity building worldwide."}
                </div>
              </div>
            </div>
          </div>

          {/* {related.length > 0 && (
            <div className="bg-white border border-[#0474C4]/25 rounded p-5">
              <div className="font-heading text-[1.375rem] tracking-[-0.005em] leading-[1.3] font-medium text-[#0474C4] mb-4">
                Related Articles
              </div>

              <div className="flex flex-col gap-0">
                {related.map((r) => (
                  <Link
                    key={r.slug}
                    href={`/insights/${r.slug}`}
                    className="group py-3 border-b border-[#0474C4]/18 last:border-b-0 no-underline block"
                  >
                    <h3 className="font-body text-[0.875rem] tracking-[0em] leading-[1.6] font-normal text-[#262B40] group-hover:text-[#0474C4] transition-colors mb-1">
                      {r.title}
                    </h3>

                    <div className="font-body text-[0.75rem] tracking-[0.05em] leading-normal font-normal text-slate-400">
                      {r.date} · {r.readTime}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )} */}

          <div className="bg-ink rounded p-4 sm:p-5">
            <div className="font-heading text-[1.125rem] sm:text-[1.25rem] md:text-[1.375rem] tracking-[-0.005em] leading-[1.3] font-medium text-[#0474C4] mb-2">
              Deepen Your Practice
            </div>
            <p className="font-body text-[0.8125rem] sm:text-[0.875rem] tracking-[0em] leading-[1.6] font-normal text-slate-600 mb-4">
              Explore our certificate programmes - designed to turn insight into
              applied expertise.
            </p>

            <Button
              className="font-body text-[0.75rem] tracking-[0.02em] font-medium w-full bg-[#0474C4] hover:bg-[#0474C4]/80 text-[#EBF3FC] rounded py-2 px-5"
              asChild
            >
              <Link href="/programs" className="flex items-center justify-center gap-1 h-11 sm:h-12 rounded">
                Browse Programs <ChevronRight className="h-4 w-4" />{" "}
              </Link>
            </Button>
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="bg-[#EDF2FB] px-4 sm:px-6 md:px-10 lg:px-16 py-10 sm:py-12 md:py-14 lg:py-16 w-full">
          <div className="max-w-350 mx-auto flex flex-col gap-8 sm:gap-10 md:gap-12 w-full">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 sm:gap-6">
              <div className="flex flex-col gap-1.5 sm:gap-2">
                <p className="font-body text-[0.6875rem] sm:text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#637AA3]">
                  Keep Reading
                </p>
                <h2 className="font-heading text-[1.375rem] sm:text-[1.5rem] md:text-[1.625rem] lg:text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-[#0474C4]">
                  More from ARPS Insights
                </h2>
              </div>
              <Button
                variant="default"
                asChild
                className="bg-[#0474C4] hover:bg-[#0474C4]/80 text-[#EBF3FC] rounded-[32px] px-4 sm:px-5 py-2 text-[0.8125rem] sm:text-sm self-start sm:self-auto"
              >
                <Link href="/insights">
                  All Articles <ChevronRight className="h-4 w-4" />{" "}
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/insights/${r.slug}`}
                  className="flex flex-col gap-3 sm:gap-4 group bg-white/90 border border-[#0474C4]/25 rounded p-5 sm:p-6 hover:border-[#0474C4]/55 hover:-translate-y-0.5 transition-all no-underline"
                >
                  <Badge className="font-body text-[0.625rem] sm:text-[0.6875rem] tracking-[0.05em] font-medium bg-[#0474C4]/10 text-[#0474C4] border-0 px-2 py-0.5 self-start">
                    {r.category}
                  </Badge>
                  <h3 className="font-heading line-clamp-2 text-[1.125rem] sm:text-[1.25rem] md:text-[1.375rem] tracking-[-0.005em] leading-[1.3] font-medium text-[#262B40] group-hover:text-[#0474C4] transition-colors">
                    {r.title}
                  </h3>
                  <div className="h-px bg-[#0474C4]/18 w-full" />
                  <div className="flex flex-wrap items-center justify-between gap-2 font-body text-[0.6875rem] sm:text-[0.75rem] tracking-[0em] leading-normal font-normal text-[#637AA3]">
                    <span className="truncate min-w-0">{r.author}</span>
                    <span className="flex items-center gap-1 shrink-0">
                      <Clock className="h-2.5 w-2.5" />
                      {r.readTime}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
};

export default withLayout(InsightDetailPage);
