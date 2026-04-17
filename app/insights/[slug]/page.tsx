"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Clock, ArrowLeft, ArrowRight, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import withLayout from "@/hooks/useLayout";
import { getInsightBySlug, type PublicInsightDetailResponse } from "@/services/public-insight.service";

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
    return (
      <section className="bg-sky-light px-8 md:px-16 py-24 w-full">
        <div className="max-w-200 mx-auto text-slate-500">Loading insight...</div>
      </section>
    );
  }

  if (notFound || !payload) {
    return (
      <section className="bg-sky-light px-8 md:px-16 py-24 w-full">
        <div className="max-w-200 mx-auto flex flex-col gap-4">
          <h1 className="font-heading text-[2rem] text-[#262B40]">
            {notFound ? "Insight not found" : "Unable to load insight"}
          </h1>
          <p className="text-slate-500">
            {notFound
              ? "The article you are looking for does not exist or is not published."
              : (error ?? "Something went wrong while loading this insight.")}
          </p>
          <div>
            <Button asChild className="bg-[#0474C4] hover:bg-[#0474C4]/80 text-[#EBF3FC] rounded-[32px] px-5 py-2">
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
      <section className="bg-[#071639] relative overflow-hidden px-8 md:px-16 lg:py-16 pb-0 w-full">
        <div className="absolute inset-0 bg-grid-ink pointer-events-none" />
        <div className="absolute -top-24 right-0 w-125 h-125 rounded-full bg-[#0474C4]/8 blur-[100px] pointer-events-none" />
        <div className="relative z-10 max-w-200 mx-auto space-y-4">
          <div className="flex items-center gap-3 mb-6">
            <Badge className="font-body text-[0.6875rem] tracking-[0.05em] font-medium bg-[#0474C4]">
              {ins.category}
            </Badge>
            {ins.featured && (
              <span className="font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium text-slate-400">
                Featured
              </span>
            )}
          </div>

          <div className="flex flex-col gap-6">
            <h1 className="font-heading text-[2.25rem] md:text-[2.75rem] lg:text-[3rem] tracking-[-0.015em] text-white md:tracking-[-0.02em] leading-[1.2] md:leading-[1.1] font-bold text-sky-light">
              {ins.title}
            </h1>

            <p className="font-body text-[1.125rem] tracking-[-0.01em] leading-[1.65] font-light text-[#EBF3FC]">
              {ins.excerpt}
            </p>
          </div>

          <div className="flex items-center gap-4 py-4 border-t border-[#0474C4]/15">
            <div className="w-10 h-10 rounded-full bg-[#0474C4] border border-[#0474C4]/50 flex items-center justify-center font-body text-[0.6875rem] font-medium text-[#EBF3FC] shrink-0">
              {ins.authorInitials}
            </div>

            <div className="flex flex-col justify-start items-start">
              <span className="font-body text-[0.875rem] tracking-[0em] leading-normal font-medium text-white/90">
                {ins.author}
              </span>
              <span className="font-body text-[0.75rem] tracking-[0em] leading-normal font-normal text-white/90">
                {ins.date} · {ins.readTime}
              </span>
            </div>

            <div className="ml-auto flex items-center gap-1.5 font-body text-[0.75rem] tracking-[0em] font-normal text-white/90">
              <Clock className="h-3 w-3" />
              {ins.readTime}
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-300 mx-auto px-8 md:px-16 py-16 grid lg:grid-cols-[1fr_280px] gap-14 items-start w-full">
        <article>
          <div
            className="prose flex flex-col gap-2 prose-slate max-w-none prose-headings:text-[#262B40] prose-p:text-slate-600 prose-p:font-normal prose-p:font-body prose-p:text-[1rem] prose-p:tracking-[-0.005em] prose-p:leading-[1.7] prose-a:text-[#0474C4]"
            dangerouslySetInnerHTML={{ __html: ins.body }}
          />
          <div className="mt-10 pt-8 border-t border-sapphire/20 flex items-center gap-4 flex-wrap">
            <span className="text-[0.68rem] uppercase tracking-widest text-slate-400">
              Share:
            </span>
            {["LinkedIn", "Twitter/X", "Copy Link"].map((s) => (
              <button
                key={s}
                className="px-4 py-1.5 text-[0.72rem] border border-sapphire/25 rounded-sm text-slate-500 hover:border-sapphire hover:text-sapphire transition-all"
              >
                {s}
              </button>
            ))}
          </div>

          <div className="mt-10 grid grid-cols-2 gap-4">
            {prev ? (
              <Link
                href={`/insights/${prev.slug}`}
                className="group border border-sapphire/20 rounded-sm p-4 hover:border-sapphire/50 transition-all no-underline"
              >
                <span className="flex items-center gap-2 font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-slate-400 mb-1.5">
                  <ArrowLeft className="h-3 w-3" />
                  Previous
                </span>
                <span className="font-body text-[0.875rem] tracking-[0em] leading-[1.6] font-normal text-ink group-hover:text-sapphire transition-colors">
                  {prev.title}
                </span>
              </Link>
            ) : (
              <div />
            )}

            {next ? (
              <Link
                href={`/insights/${next.slug}`}
                className="group border border-sapphire/20 rounded-sm p-4 hover:border-sapphire/50 transition-all no-underline text-right"
              >
                <div className="flex items-center justify-end gap-2 font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-slate-400 mb-1.5">
                  Next
                  <ArrowRight className="h-3 w-3" />
                </div>
                <div className="font-body text-[0.875rem] tracking-[0em] leading-[1.6] font-normal text-ink group-hover:text-sapphire transition-colors">
                  {next.title}
                </div>
              </Link>
            ) : (
              <div />
            )}
          </div>
        </article>

        <aside className="sticky top-16 flex flex-col gap-6">
          <div className="bg-white border border-[#0474C4]/25 rounded-sm p-5 flex flex-col gap-4">
            <div className="font-heading text-[1.375rem] tracking-[-0.005em] leading-[1.3] font-medium text-[#0474C4]">
              About the Author
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#0474C4] flex items-center justify-center font-body text-[0.6875rem] font-medium text-[#EBF3FC] shrink-0">
                {ins.authorInitials}
              </div>

              <div>
                <div className="font-body text-[0.875rem] tracking-[0em] leading-normal font-medium text-ink">
                  {ins.author}
                </div>
                {ins.authorJobTitle ? (
                  <div className="font-body text-[0.75rem] tracking-[0.05em] leading-normal font-normal text-slate-500 mt-1">
                    {ins.authorJobTitle}
                  </div>
                ) : null}

                <div className="font-body text-[0.875rem] tracking-[0em] leading-[1.6] font-normal text-slate-600 mt-1">
                  {ins.authorBio ??
                    "Expert facilitator and researcher at ARPS Institute, contributing to professional education and capacity building worldwide."}
                </div>
              </div>
            </div>
          </div>

          {/* {related.length > 0 && (
            <div className="bg-white border border-[#0474C4]/25 rounded-sm p-5">
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

          <div className="bg-ink rounded-sm p-5">
            <div className="font-heading text-[1.375rem] tracking-[-0.005em] leading-[1.3] font-medium text-[#0474C4] mb-2">
              Deepen Your Practice
            </div>
            <p className="font-body text-[0.875rem] tracking-[0em] leading-[1.6] font-normal text-slate-600 mb-4">
              Explore our certificate programmes - designed to turn insight into
              applied expertise.
            </p>

            <Button
              className="font-body text-[0.75rem] tracking-[0.02em] font-medium w-full bg-[#0474C4] hover:bg-[#0474C4]/80 text-[#EBF3FC] rounded-[32px] py-2 px-5"
              asChild
            >
              <Link href="/programs">
                Browse Programs <ChevronRight className="h-4 w-4" />{" "}
              </Link>
            </Button>
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="bg-[#EDF2FB] px-8 md:px-16 py-16 w-full">
          <div className="max-w-350 mx-auto flex flex-col gap-12 w-full">
            <div className="flex items-end justify-between">
              <div className="flex flex-col gap-2">
                <p className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#637AA3]">
                  Keep Reading
                </p>
                <h2 className="font-heading text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-[#0474C4]">
                  More from ARPS Insights
                </h2>
              </div>
              <Button
                variant="default"
                asChild
                className="bg-[#0474C4] hover:bg-[#0474C4]/80 text-[#EBF3FC] rounded-[32px] px-5 py-2"
              >
                <Link href="/insights">
                  All Articles <ChevronRight className="h-4 w-4" />{" "}
                </Link>
              </Button>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/insights/${r.slug}`}
                  className="flex flex-col gap-4 group bg-white/90 border border-[#0474C4]/25 rounded-sm p-6 hover:border-[#0474C4]/55 hover:-translate-y-0.5 transition-all no-underline"
                >
                  <Badge className="font-body text-[0.6875rem] tracking-[0.05em] font-medium bg-[#0474C4]/10 text-[#0474C4] border-0 px-2 py-0.5">
                    {r.category}
                  </Badge>
                  <h3 className="font-heading line-clamp-2 text-[1.375rem] tracking-[-0.005em] leading-[1.3] font-medium text-[#262B40] group-hover:text-[#0474C4] transition-colors">
                    {r.title}
                  </h3>
                  <div className="h-px bg-[#0474C4]/18 w-full" />
                  <div className="flex items-center justify-between font-body text-[0.75rem] tracking-[0em] leading-normal font-normal text-[#637AA3]">
                    <span>{r.author}</span>
                    <span className="flex items-center gap-1">
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
