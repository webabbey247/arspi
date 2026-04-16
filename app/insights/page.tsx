/* eslint-disable react/no-unescaped-entities */
"use client";

import * as React from "react";
import Link from "next/link";
import { Clock, ArrowRight, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import withLayout from "@/hooks/useLayout";

type PublicInsight = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featured: boolean;
  readTime: string;
  author: string;
  authorInitials: string;
  category: string;
  date: string;
  publishedAt: string | null;
  coverImage: string | null;
};

 const InsightsPage =() => {
  const [activeCategory, setActiveCategory] = React.useState("All");
  const [query, setQuery] = React.useState("");
  const [insights, setInsights] = React.useState<PublicInsight[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/insights/public")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error ?? "Failed to fetch insights");
        }
        setInsights(data?.insights ?? []);
      })
      .catch(() => {
        setInsights([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const categories = React.useMemo(
    () => ["All", ...Array.from(new Set(insights.map((ins) => ins.category)))],
    [insights]
  );

  const featured = insights.filter((i) => i.featured);
  const filtered = insights.filter((ins) => {
    const matchCat = activeCategory === "All" || ins.category === activeCategory;
    const matchQ =
      !query ||
      ins.title.toLowerCase().includes(query.toLowerCase()) ||
      ins.excerpt.toLowerCase().includes(query.toLowerCase()) ||
      ins.author.toLowerCase().includes(query.toLowerCase());
    return matchCat && matchQ;
  });

  return (
    <>
      <section className="bg-[#071639] relative overflow-hidden px-8 md:px-16 py-24 w-full">
        <div className="absolute inset-0 bg-grid-ink pointer-events-none" />
        <div className="absolute -top-24 right-0 w-125 h-125 rounded-full bg-[#0474C4]/8 blur-[100px] pointer-events-none" />
  <div className="relative z-10 gap-4 flex flex-col justify-start items-start">
             <p className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#EBF3FC] inline-flex items-center gap-2">
      <span className="block w-8 h-px bg-[#EBF3FC]" />
            Research & Knowledge Hub
          </p>
    <h1 className="font-heading text-[2.25rem] md:text-[3rem] tracking-[-0.015em] md:tracking-[-0.02em] leading-[1.2] md:leading-[1.1] font-bold text-white max-w-lg">
            Insights, Research &amp;{" "}
             <em className="italic text-[#0474C4]">Expert Perspectives</em>
          </h1>
    <p className="font-body text-[1.125rem] tracking-[-0.01em] leading-[1.65] font-light text-[#EBF3FC] max-w-lg">
            Articles, research highlights, practice guides, and news from the ARPS Institute
            team and our network of scholars and practitioners worldwide.
          </p>
        </div>
      </section>

      {/* Filter bar */}
     <div className="sticky top-17 z-30 bg-sky-light/97 backdrop-blur border-b border-[#0474C4]/25 px-8 md:px-16 py-3 flex items-center gap-2.5 overflow-x-auto w-full">

  <span className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#637AA3] mr-2 shrink-0">
    Filter:
  </span>

  {categories.map((cat) => (
    <button
      key={cat}
      onClick={() => setActiveCategory(cat)}
      className={`font-body text-[0.75rem] tracking-[0.05em] leading-normal font-medium px-4 py-1.5 rounded-full border transition-all whitespace-nowrap shrink-0 ${
        activeCategory === cat
          ? "bg-[#0474C4] text-[#EBF3FC] border-[#0474C4]"
          : "bg-sky-pale text-slate-500 border-[#0474C4]/25 hover:border-[#0474C4] hover:text-ink"
      }`}
    >
      {cat}
    </button>
  ))}

</div>

      {/* Featured articles */}
     {activeCategory === "All" && !query && (
  <section className="bg-white px-8 md:px-16 py-16 w-full">
    <div className="max-w-350 mx-auto flex flex-col gap-8 w-full">
   <div className="flex flex-col gap-2">
       <p className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#637AA3]">
        Featured
      </p>
      <h2 className="font-heading text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-[#0474C4]">
        Editor&apos;s Picks
      </h2>
   </div>

      <div className="grid lg:grid-cols-2 gap-6 w-full">
        {featured.map((ins) => (
          <Link
            key={ins.slug}
            href={`/insights/${ins.slug}`}
            className="group bg-white/90 border border-[#0474C4]/50 rounded-sm overflow-hidden hover:border-[#0474C4]/60 hover:-translate-y-0.5 transition-all no-underline flex flex-col"
          >
            <div className="h-1 bg-[#0474C4]" />

            <div className="p-7 flex flex-col flex-1">

              <div className="flex items-center gap-2 mb-4">
                <Badge className="font-body text-[0.6875rem] tracking-[0.05em] font-medium bg-[#0474C4]/10 text-[#0474C4] border-0 px-2 py-0.5">
                  {ins.category}
                </Badge>
                <span className="font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium text-slate-400">
                  Featured
                </span>
              </div>

              <h3 className="font-heading line-clamp-2 text-[1.375rem] tracking-[-0.005em] leading-[1.3] font-medium text-[#262B40] mb-3 group-hover:text-[#0474C4] transition-colors">
                {ins.title}
              </h3>

              <p className="font-body text-[0.875rem] tracking-[0em] leading-[1.6] font-normal text-slate-500 mb-5 flex-1 line-clamp-3">
                {ins.excerpt}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-[#0474C4]/18">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#0474C4] flex items-center justify-center font-body text-[0.6875rem] font-medium text-[#EBF3FC] shrink-0">
                    {ins.authorInitials}
                  </div>
                  <div>
                    <div className="font-body text-[0.8125rem] tracking-[0em] leading-normal font-medium text-ink">
                      {ins.author}
                    </div>
                    <div className="font-body text-[0.6875rem] tracking-[0.05em] font-normal text-slate-400">
                      {ins.date}
                    </div>
                  </div>
                </div>

                <span className="flex items-center gap-1 font-body text-[0.75rem] tracking-[0em] font-normal text-[#637AA3]">
                  <Clock className="h-3 w-3" />
                  {ins.readTime}
                </span>
              </div>

                <label className="ml-auto min-w-55 max-w-80 relative hidden md:flex items-center">
                  <Search className="h-3.5 w-3.5 text-[#637AA3] absolute left-3" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search insights"
                    className="w-full bg-white border border-[#0474C4]/25 rounded-full pl-9 pr-3 py-1.5 text-[0.75rem] text-[#262B40] placeholder:text-[#637AA3] outline-none focus:border-[#0474C4]"
                  />
                </label>

            </div>
          </Link>
        ))}
      </div>

    </div>
  </section>
)}

      {/* All articles grid */}
      <section className="bg-sky-light px-8 md:px-16 py-16">
        <div className="max-w-350 mx-auto">
          {loading ? (
            <div className="text-center py-20">
              <p className="text-slate-500 font-light text-sm">Loading insights...</p>
            </div>
          ) : null}

          {!loading && (activeCategory !== "All" || query) ? (
            <div className="mb-6">
              <p className="text-sm text-slate-500 font-light">
                {filtered.length} article{filtered.length !== 1 ? "s" : ""}
                {activeCategory !== "All" ? ` in ${activeCategory}` : ""}
                {query ? ` matching "${query}"` : ""}
              </p>
            </div>
          ) : !loading ? (
            <div className="mb-8">
                <p className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#637AA3] mb-2">
       All Insights
      </p>
      <h2 className="font-heading text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-[#0474C4] mb-8">
     Latest Articles
      </h2>
            </div>
          ) : null}

          {!loading && filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="font-serif text-4xl text-[#0474C4]/20 mb-4">∅</div>
              <h3 className="font-serif text-xl text-ink mb-2">No articles found</h3>
              <p className="text-slate-400 font-light text-sm">
                Try a different search term or category.
              </p>
            </div>
          ) : !loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((ins) => (
                <Link
                  key={ins.slug}
                  href={`/insights/${ins.slug}`}
                  className="group border border-[#0474C4]/25 rounded-sm overflow-hidden hover:border-[#0474C4]/55 hover:-translate-y-0.5 transition-all no-underline flex flex-col"
                >
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-4">
                        <Badge className="font-body text-[0.6875rem] tracking-[0.05em] font-medium bg-[#0474C4]/10 text-[#0474C4] border-0 px-2 py-0.5">
                        {ins.category}
                      </Badge>
                      <div className="flex items-center gap-1 font-body text-[0.75rem] tracking-[0em] font-normal text-[#637AA3]">
                        <Clock className="h-3 w-3" />
                        {ins.readTime}
                      </div>
                    </div>
              <h3 className="font-heading line-clamp-2 text-[1.375rem] tracking-[-0.005em] leading-[1.3] font-medium text-[#262B40] mb-3 group-hover:text-[#0474C4] transition-colors">
                      {ins.title}
                    </h3>
              <p className="font-body text-[0.875rem] tracking-[0em] leading-[1.6] font-normal text-slate-500 mb-5 flex-1 line-clamp-3">
                      {ins.excerpt}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-[#0474C4]/18 mt-auto">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full text-[#EBF3FC] bg-[#0474C4] flex items-center justify-center font-serif text-[0.6rem] text-sky shrink-0">
                          {ins.authorInitials}
                        </div>
                        <span className="text-[0.72rem] text-slate-500 font-light">{ins.author}</span>
                      </div>
                      <span className="text-[0.68rem] text-slate-400">{ins.date}</span>
                    </div>
                  </div>
                  <div className="px-6 pb-4">
                    <span className="inline-flex items-center gap-1 text-[0.72rem] text-[#0474C4] group-hover:gap-2 transition-all">
                      Read article <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </section>

    
    </>
  );
}

export default withLayout(InsightsPage);
