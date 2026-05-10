"use client"

import * as React from "react";
import withLayout from "@/hooks/useLayout";
import { CalendarHeart, ChevronLeft, ChevronRight, TargetIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getInsights, type PublicInsight } from "@/services/public-insight.service";
import { getWorkshops, type PublicWorkshop } from "@/services/public-workshop.service";
import { getPrograms, type PublicProgram } from "@/services/public-program.service";

function renderProgramCard(
  prog: PublicProgram,
  extraClass: string,
  key: string | number = prog.id,
  ariaHidden = false,
) {
  const initials = prog.instructor.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
  const price = prog.price > 0 ? `$${prog.price.toLocaleString()}` : "Free"
  const level = prog.level.charAt(0) + prog.level.slice(1).toLowerCase()

  return (
    <Link
      href={`/programs/${prog.slug}`}
      key={key}
      aria-hidden={ariaHidden || undefined}
      tabIndex={ariaHidden ? -1 : undefined}
      data-program-card
      className={`group bg-white rounded-sm overflow-hidden border border-[#0474C4]/15 transition-all duration-300 cursor-pointer hover:-translate-y-1 shrink-0 ${extraClass}`}
    >
      <div className="relative h-75 overflow-hidden bg-slate-100">
        <Image
          src={prog.thumbnail || "/images/dummy/course-1.jpg"}
          alt={prog.title}
          width={600}
          height={400}
          className="w-full h-full object-cover transition-transform duration-400 group-hover:scale-[1.04]"
        />
        {prog.featured && (
          <span className="absolute top-3 left-3 font-body text-[0.625rem] tracking-[0.07em] uppercase font-medium bg-[#0474C4] text-white px-4 py-1.5 rounded">
            Featured
          </span>
        )}
        <span className="absolute bottom-3 right-3 font-body text-[0.75rem] tracking-[0.05em] font-medium bg-[#0B1625] text-[#D4BA85] py-1.5 px-3.5 rounded-xs">
          {price}
        </span>
      </div>

      <div className="pt-[1.4rem] px-6 pb-[1.6rem]">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-[#0474C4] text-white font-body text-[0.8125rem] font-medium flex items-center justify-center shrink-0">
            {initials}
          </div>
          <span className="font-body text-[0.8125rem] tracking-[0em] font-normal text-slate-600 truncate">
            {prog.instructor.name}
          </span>
        </div>

        <h3 className="font-heading text-[1rem] tracking-[-0.005em] leading-[1.35] font-medium text-[#071639] mb-4 line-clamp-2">
          {prog.title}
        </h3>

        <div className="flex gap-[1.2rem] items-center">
          {prog.duration && (
            <span className="flex items-center capitalize gap-1.25 text-[0.78rem] text-[#637AA3] font-light">
              <CalendarHeart className="w-3.5 h-3.5 opacity-50" />
              {`${prog.duration} ${prog.duration > "1" ? "weeks" : "week"}`}
            </span>
          )}
          {prog.duration && <span className="w-0.75 h-0.75 rounded-full bg-slate-400/30" />}
          <span className="flex items-center gap-1.25 text-[0.78rem] text-[#637AA3] font-light">
            <TargetIcon className="w-3.5 h-3.5 opacity-50" />
            {level}
          </span>
        </div>
      </div>
    </Link>
  )
}

function InsightCard({ insight }: { insight: PublicInsight }) {
  return (
    <Link
      href={`/insights/${insight.slug}`}
      className="group bg-transparent border border-transparent rounded-sm overflow-hidden cursor-pointer transition-[border-color,background] duration-300"
    >
      <Image
        className="w-full aspect-video object-cover block opacity-75 transition-opacity duration-300 group-hover:opacity-90"
        src={insight.coverImage || "/images/placeholder-img.png"}
        alt={insight.title}
        width={500}
        height={300}
      />
      <div className="pt-[1.3rem] px-6 pb-[1.6rem] bg-white h-48.75">
        <span className="inline-block font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium bg-[#0474C4]/10 text-[#0474C4] border border-[#0474C4]/10 py-0.75 px-2.5 rounded-full mb-4">
          {insight.category}
        </span>
        <h3 className="font-heading text-[1rem] tracking-[-0.005em] leading-[1.4] font-medium text-[#071639] mb-3 transition-colors duration-200 group-hover:text-[#0474C4]">
          {insight.title}
        </h3>
        <div className="flex justify-between items-center pt-4 border-t border-t-[rgba(200,169,110,0.1)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#0474C4] border border-[#0474C4] font-body text-[0.8125rem] font-medium text-white flex items-center justify-center">
              {insight.authorInitials}
            </div>
            <span className="font-body text-[0.8125rem] tracking-[0em] font-normal text-[#637AA3]">
              {insight.author}
            </span>
          </div>
          <span className="font-body text-[0.8125rem] tracking-[0em] font-normal text-[#637AA3]">
            {insight.date}
          </span>
        </div>
      </div>
    </Link>
  )
}

const HomePage = () => {
  const [insights, setInsights] = React.useState<PublicInsight[]>([]);
  const [insightsLoading, setInsightsLoading] = React.useState(true);
  const [insightsError, setInsightsError] = React.useState<string | null>(null);

  const [workshops, setWorkshops] = React.useState<PublicWorkshop[]>([]);
  const [workshopsLoading, setWorkshopsLoading] = React.useState(true);
  const [workshopsError, setWorkshopsError] = React.useState<string | null>(null);

  const [programs, setPrograms] = React.useState<PublicProgram[]>([]);
  const [programsLoading, setProgramsLoading] = React.useState(true);
  const programsScrollRef = React.useRef<HTMLDivElement>(null);

  const scrollPrograms = (direction: "prev" | "next") => {
    const el = programsScrollRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-program-card]");
    const gap = parseFloat(getComputedStyle(el).columnGap || "0") || 0;
    const step = card ? card.offsetWidth + gap : el.clientWidth;
    el.scrollBy({ left: direction === "next" ? step : -step, behavior: "smooth" });
  };

  const loadInsights = React.useCallback(() => {
    setInsightsLoading(true);
    setInsightsError(null);

    getInsights()
      .then(setInsights)
      .catch((err: unknown) => {
        const typedError = err as Error;
        setInsightsError(typedError?.message ?? "Failed to load insights");
        setInsights([]);
      })
      .finally(() => {
        setInsightsLoading(false);
      });
  }, []);

  const loadWorkshops = React.useCallback(() => {
    setWorkshopsLoading(true);
    setWorkshopsError(null);

    getWorkshops({ limit: 6, sort: "upcoming" })
      .then(setWorkshops)
      .catch((err: unknown) => {
        const typedError = err as Error;
        setWorkshopsError(typedError?.message ?? "Failed to load workshops");
        setWorkshops([]);
      })
      .finally(() => {
        setWorkshopsLoading(false);
      });
  }, []);

  React.useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  React.useEffect(() => {
    loadWorkshops();
  }, [loadWorkshops]);

  React.useEffect(() => {
    setProgramsLoading(true);
    getPrograms({ limit: 6 })
      .then(setPrograms)
      .catch(() => setPrograms([]))
      .finally(() => setProgramsLoading(false));
  }, []);

  const calendar = React.useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const todayDay = now.getDate();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const eventDays = new Set<number>();
    for (const w of workshops) {
      if (!w.date) continue;
      const d = new Date(w.date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        eventDays.add(d.getDate());
      }
    }

    return {
      label: new Date(year, month, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      leadingEmpty: firstWeekday,
      days: Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        return { day, today: day === todayDay, hasEvent: eventDays.has(day) };
      }),
    };
  }, [workshops]);
  return (
    <>
      <section className="bg-[#060D14] min-h-[80vh] sm:min-h-[88vh] grid grid-cols-1 md:grid-cols-2 relative overflow-hidden w-full">
        <div className="absolute inset-0 bg-grid-ink pointer-events-none" />
        <div className="absolute -top-30 -right-30 w-150 h-150 rounded-full bg-[#0474C4]/8 blur-[100px] pointer-events-none" />

        <div className="py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 md:pr-10 md:pl-10 lg:pr-16 lg:pl-20 flex flex-col justify-center relative z-2 gap-8 sm:gap-10 md:gap-12">
          <div className="flex flex-col gap-3 sm:gap-4 max-w-140">
            <p className="text-[0.625rem] sm:text-[0.7rem] tracking-[0.18em] uppercase text-blue-300 flex items-center gap-3 before:content-[''] before:block before:w-6 sm:before:w-8 before:h-px before:bg-blue-300 before:shrink-0">
              Institute for Advanced Research and Professional Studies
            </p>
            <h1 className="font-heading text-[clamp(1.875rem,5vw,3.4rem)] leading-[1.15] text-[#F7F3ED] font-normal tracking-[-0.01em]">
              Advance Your
              <br />
              <em className="italic text-[#0474C4]">Research Capacity</em>
              <br />
              &amp; Leadership
            </h1>
            <p className="font-body text-[0.9375rem] sm:text-[1rem] md:text-[1.0625rem] lg:text-[1.125rem] tracking-[-0.01em] leading-[1.65] font-light text-[#EBF3FC]">
              Professional certification programs, research training, and
              institutional consulting — for scholars, practitioners, and
              development professionals worldwide.
            </p>
          </div>
          <div className="flex gap-3 sm:gap-4 items-start lg:items-center flex-col lg:flex-row flex-nowrap lg:flex-wrap w-full">
            <Link
              href="/programs"
              className="font-body text-[0.75rem] sm:text-[0.8125rem] h-full rounded lg:min-w-40 tracking-[0.07em] uppercase font-medium bg-[#0474C4] text-white border-0 py-3 sm:py-3.5 px-6 sm:px-8 cursor-pointer transition-all duration-250 no-underline inline-block text-center hover:bg-[#06457F] hover:border-[#06457F]"
            >
              Explore Programs
            </Link>
            <Link
              href="/our-research/research-training"
              className="font-body text-[0.75rem] sm:text-[0.8125rem] h-full rounde lg:min-w-40 text-center tracking-[0.07em] uppercase font-medium bg-transparent text-[#0474C4] border border-[#0474C4] py-3 sm:py-3.25 px-5 sm:px-7 cursor-pointer transition-all duration-250 no-underline inline-block hover:bg-[#0474C4] hover:text-white hover:border-[#0474C4]"
            >
              Research Training
            </Link>
          </div>
          <div className="flex gap-6 sm:gap-8 md:gap-12 pt-6 sm:pt-8 md:pt-10 border-t border-t-[rgba(200,169,110,0.15)] flex-wrap">
            <div>
              <div className="font-heading text-[1.375rem] sm:text-[1.5rem] md:text-[1.75rem] tracking-[-0.01em] leading-[1.1] font-semibold text-[#0474C4] block mb-1">
                120+
              </div>
              <div className="font-body text-[0.625rem] sm:text-[0.6875rem] tracking-[0.07em] uppercase font-medium text-[#EBF3FC]">
                Countries Reached
              </div>
            </div>
            <div>
              <div className="font-heading text-[1.375rem] sm:text-[1.5rem] md:text-[1.75rem] tracking-[-0.01em] leading-[1.1] font-semibold text-[#0474C4] block mb-1">
                40+
              </div>
              <div className="font-body text-[0.625rem] sm:text-[0.6875rem] tracking-[0.07em] uppercase font-medium text-[#EBF3FC]">
                Certifications
              </div>
            </div>
            <div>
              <div className="font-heading text-[1.375rem] sm:text-[1.5rem] md:text-[1.75rem] tracking-[-0.01em] leading-[1.1] font-semibold text-[#0474C4] block mb-1">
                15k+
              </div>
              <div className="font-body text-[0.625rem] sm:text-[0.6875rem] tracking-[0.07em] uppercase font-medium text-[#EBF3FC]">
                Professionals Trained
              </div>
            </div>
          </div>
        </div>

        <div className="relative hidden md:flex items-stretch min-h-full">
          <div className="flex-1 relative overflow-hidden min-h-125">
            <Image
              src="/images/hero-banner.webp"
              alt="Professionals collaborating"
              height={900}
              width={700}
              loading="eager"
              className="w-full h-full object-cover opacity-[0.65] filter-[grayscale(15%)] block"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to right, #060D14 0%, transparent 40%), linear-gradient(to top, #060D14 0%, transparent 40%)",
              }}
            ></div>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 md:py-20 lg:py-28 px-4 sm:px-6 md:px-10 lg:px-16 xl:px-20 grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10 lg:gap-24 items-center bg-white">
        <div className="fle">
          <div className="flex flex-col items-start gap-5 sm:gap-6 w-full">
            <div className="block space-y-4 sm:space-y-5 w-full">
              <p className="text-[0.625rem] sm:text-[0.68rem] tracking-[0.18em] uppercase text-[#0474C4]">
                About the Institute
              </p>
              <h2 className="font-heading text-[clamp(1.5rem,3.5vw,2.4rem)] leading-[1.2] font-normal text-[#071639] tracking-[-0.01em]">
                A Global Institute for Professional Learning &amp; Research
                Innovation
              </h2>
            </div>
            <p className="font-body text-[0.9375rem] sm:text-[1rem] tracking-[-0.005em] leading-[1.7] font-normal text-slate-600">
              The Institute for Advanced Research and Professional Studies (ARPS
              Institute) is a global online institute dedicated to advancing
              professional education, research capacity, leadership development,
              and digital innovation across multiple disciplines. Through its
              integrated digital model, ARPS Institute connects global knowledge
              networks while expanding access to advanced professional learning
              and applied research training — without geographical limitations.
            </p>
            <Link href="/about"  className="bg-[#0474C4] lg:min-w-40 text-white text-center border-none py-3 sm:py-3.5 px-6 sm:px-8 font-body text-[0.75rem] sm:text-[0.82rem] font-medium tracking-widest uppercase cursor-pointer rounded transition-all duration-250 inline-block hover:bg-[#06457F] hover:border-[#06457F]">
                Learn More
            </Link>
          </div>

          {/* <div className="my-[1.8rem] mb-8 flex flex-col gap-[0.7rem]">
            {[
              "Promote excellence in professional education and research capacity development",
              "Provide accessible online professional certification programs globally",
              "Support organisations through research consulting, monitoring, and evaluation",
              "Develop innovative digital tools and management software solutions",
              "Foster global collaboration in leadership development and knowledge exchange",
            ].map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 text-[0.88rem] text-slate-600 font-body font-light leading-[1.6]"
              >
                <span className="w-4 h-px bg-[#0474C4] shrink-0 mt-2.5 block"></span>
                {item}
              </div>
            ))}
          </div> */}
        </div>

        <div className="relative p-3 sm:p-4">
          <Image
            src="/images/about-arps.webp"
            alt="Professionals in a research training session"
            width={700}
            height={530}
            className="w-full aspect-4/3 object-cover rounded-xs block"
          />
          <div className="absolute inset-0 border border-border rounded-xs pointer-events-none"></div>
          <div className="absolute -bottom-2 -left-2 bg-[#0B1625] text-[#D4BA85] py-3 px-4 sm:py-4 sm:px-5 md:py-5 md:px-6">
            <span className="font-heading text-[1.5rem] sm:text-[1.75rem] md:text-[2rem] font-normal leading-none block">
              120+
            </span>
            <span className="text-[0.65rem] sm:text-[0.72rem] italic text-[rgba(232,213,168,0.6)] block mt-1">
              Countries Reached
            </span>
          </div>
        </div>
      </section>

      {/* ============ SOFTWARE SECTION ============ */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-28 px-4 sm:px-6 md:px-10 lg:px-16 xl:px-20 bg-[#F7F3ED]/50 grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10 lg:gap-24 items-center w-full">
        <div className="block relative space-y-5 sm:space-y-6 w-full">
          <div className="block space-y-4 sm:space-y-5">
            <p className="font-body text-[0.6875rem] sm:text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#0474C4]">
              Software Sales
            </p>
            <h2 className="font-heading text-[1.5rem] sm:text-[1.625rem] md:text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-[#071639]">
              Curated Research &amp; Productivity Software
            </h2>
          </div>
          <p className="font-body text-[0.9375rem] sm:text-[1rem] tracking-[-0.005em] leading-[1.7] font-normal text-slate-600">
            We supply institutions, universities, and individual professionals
            with industry-leading software tools to power modern research
            workflows, data analysis, and operational productivity.
          </p>
          <Link
            href="/solutions"
            className="font-body lg:min-w-40 text-center border border-[#0474C4] rounded mt-2 text-[0.75rem] sm:text-[0.8125rem] tracking-[0.07em] uppercase font-medium bg-[#0474C4] text-white border-none py-3 sm:py-3.5 px-6 sm:px-8 cursor-pointer transition-all duration-250 inline-block hover:bg-[#06457F] hover:border-[#06457F]"
          >
            Browse Catalogue
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="relative z-2">
            <div className="bg-[#0D1B2A] rounded-xl overflow-hidden border border-blue-600/20 shadow-[0_24px_60px_rgba(6,13,20,0.4)]">
              <div className="py-2 sm:py-2.5 px-3 sm:px-3.5 flex items-center gap-1.5 sm:gap-2 border-b border-[rgba(247,243,237,0.06)]">
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#FF5F57] shrink-0" />
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#FEBC2E] shrink-0" />
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#28C840] shrink-0" />
                <div className="flex-1 min-w-0 bg-[rgba(247,243,237,0.06)] rounded-lg h-5 mx-1.5 sm:mx-2 flex items-center px-2 font-body text-[0.625rem] sm:text-[0.6875rem] tracking-[0em] font-normal text-[rgba(247,243,237,0.3)] truncate">
                  app.resolverite.com/dashboard
                </div>
              </div>

              <div className="p-4 sm:p-5 md:p-6">
                <div className="font-body text-[0.625rem] sm:text-[0.6875rem] tracking-[0.07em] uppercase font-medium text-[rgba(247,243,237,0.3)] mb-2 sm:mb-2.5">
                  Case Overview
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    { value: "24", label: "Active", color: "#93C5FD" },
                    { value: "18", label: "Resolved", color: "#86EFAC" },
                    { value: "6", label: "Overdue", color: "#FCA5A5" },
                  ].map(({ value, label, color }) => (
                    <div
                      key={label}
                      className="bg-[rgba(247,243,237,0.04)] border border-blue-600/15 rounded-[6px] py-2 px-2.5 sm:py-2.5 sm:px-3"
                    >
                      <span
                        className="font-heading text-[1.125rem] sm:text-[1.25rem] md:text-[1.375rem] tracking-[-0.005em] leading-[1.1] font-semibold block"
                        style={{ color }}
                      >
                        {value}
                      </span>
                      <span className="font-body text-[0.5625rem] sm:text-[0.625rem] md:text-[0.6875rem] tracking-[0.07em] uppercase font-medium text-[rgba(247,243,237,0.3)] mt-0.75 block">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Section label */}
                <div className="font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium text-[rgba(247,243,237,0.3)] mb-2">
                  Recent Cases
                </div>

                <div className="flex flex-col gap-1.5">
                  {[
                    {
                      dot: "#FCA5A5",
                      text: "Student grievance — Dept. of Education",
                      status: "Open",
                      bg: "rgba(252,165,165,.1)",
                      color: "#FCA5A5",
                    },
                    {
                      dot: "#86EFAC",
                      text: "HR complaint — Policy violation",
                      status: "Resolved",
                      bg: "rgba(134,239,172,.1)",
                      color: "#86EFAC",
                    },
                    {
                      dot: "#93C5FD",
                      text: "Academic integrity — Investigation",
                      status: "In Review",
                      bg: "rgba(147,197,253,.1)",
                      color: "#93C5FD",
                    },
                    {
                      dot: "#FEBC2E",
                      text: "Staff misconduct — Awaiting response",
                      status: "Pending",
                      bg: "rgba(254,188,46,.1)",
                      color: "#FEBC2E",
                    },
                  ].map(({ dot, text, status, bg, color }) => (
                    <div
                      key={text}
                      className="bg-[rgba(247,243,237,0.03)] border border-[rgba(247,243,237,0.06)] rounded-lg py-2 sm:py-2.25 px-2.5 sm:px-3 flex items-center gap-2 sm:gap-2.5"
                    >
                      <div
                        className="w-1.75 h-1.75 rounded-full shrink-0"
                        style={{ background: dot }}
                      />
                      <div className="font-body text-[0.6875rem] sm:text-[0.75rem] tracking-[0em] font-normal text-[rgba(247,243,237,0.55)] flex-1 min-w-0 truncate">
                        {text}
                      </div>
                      <div
                        className="font-body text-[0.625rem] sm:text-[0.6875rem] tracking-[0.05em] uppercase font-medium py-0.5 px-1.5 sm:px-2 rounded-[10px] shrink-0"
                        style={{ background: bg, color }}
                      >
                        {status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/* App mockup */}
          <div className="relative z-2">
            <div className="bg-[#0B1625] rounded-xl overflow-hidden border border-[rgba(37,99,235,0.2)] shadow-[0_24px_60px_rgba(6,13,20,0.4)]">
              {/* Browser chrome */}
              <div className="px-3 sm:px-3.5 py-2 sm:py-2.5 flex items-center gap-1.5 sm:gap-2 border-b border-[rgba(247,243,237,0.06)]">
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#FF5F57] shrink-0" />
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#FEBC2E] shrink-0" />
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#28C840] shrink-0" />
                <div className="flex-1 min-w-0 bg-[rgba(247,243,237,0.06)] rounded-lg h-5 mx-1.5 sm:mx-2 flex items-center px-2 font-body text-[0.625rem] sm:text-[0.6875rem] tracking-[0em] font-normal text-[rgba(247,243,237,0.3)] truncate">
                  app.mentortrack.io/my-journey
                </div>
              </div>

              <div className="p-4 sm:p-5 md:p-6">
                {/* User row */}
                <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-[rgba(247,243,237,0.06)]">
                  <div className="w-8 h-8 rounded-full bg-[rgba(13,148,136,0.18)] flex items-center justify-center font-body text-[0.6875rem] font-medium text-[#5EEAD4] shrink-0">
                    DA
                  </div>
                  <div className="min-w-0">
                    <div className="font-body text-[0.75rem] sm:text-[0.8125rem] tracking-[0em] leading-normal font-medium text-(--cream) truncate">
                      Dr. Amara Diallo
                    </div>
                    <div className="font-body text-[0.625rem] sm:text-[0.6875rem] tracking-[0em] leading-normal font-normal text-[rgba(247,243,237,0.3)] truncate">
                      Research Fellow — Cohort 2026
                    </div>
                  </div>
                </div>

                {/* Progress bars */}
                {[
                  { label: "Programme Progress", value: "68%", width: "68%" },
                  {
                    label: "Milestones Completed",
                    value: "8 / 12",
                    width: "66%",
                  },
                ].map(({ label, value, width }) => (
                  <div key={label} className="mb-2.5">
                    <div className="flex justify-between mb-1.25">
                      <span className="font-body text-[0.6875rem] tracking-[0em] font-normal text-[rgba(247,243,237,0.3)]">
                        {label}
                      </span>
                      <span className="font-body text-[0.6875rem] tracking-[0em] font-medium text-[#5EEAD4]">
                        {value}
                      </span>
                    </div>
                    <div className="h-1 bg-[rgba(247,243,237,0.08)] rounded-xs">
                      <div
                        className="h-full bg-[#0D9488] rounded-xs"
                        style={{ width }}
                      />
                    </div>
                  </div>
                ))}

                <div className="font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium text-[rgba(247,243,237,0.3)] mb-2">
                  Upcoming Sessions
                </div>

                <div className="flex flex-col gap-1.5">
                  {[
                    {
                      dot: "#5EEAD4",
                      text: "1-on-1 with Dr. Sarah Mensah",
                      time: "Tomorrow 10am",
                      timeBg: "rgba(94,234,212,0.1)",
                      timeColor: "#5EEAD4",
                    },
                    {
                      dot: "#5EEAD4",
                      text: "Group cohort debrief — Cohort 2026",
                      time: "Fri 2pm",
                      timeBg: "rgba(94,234,212,0.1)",
                      timeColor: "#5EEAD4",
                    },
                    {
                      dot: "#FEBC2E",
                      text: "Submit milestone 9 — Chapter draft",
                      time: "Due Mon",
                      timeBg: "rgba(254,188,46,0.1)",
                      timeColor: "#FEBC2E",
                    },
                  ].map(({ dot, text, time, timeBg, timeColor }) => (
                    <div
                      key={text}
                      className="bg-[rgba(247,243,237,0.03)] border border-[rgba(247,243,237,0.06)] rounded-lg py-2 sm:py-2.25 px-2.5 sm:px-3 flex items-center gap-2 sm:gap-2.5"
                    >
                      <div
                        className="w-1.75 h-1.75 rounded-full shrink-0"
                        style={{ background: dot }}
                      />
                      <div className="font-body text-[0.6875rem] sm:text-[0.75rem] tracking-[0em] font-normal text-[rgba(247,243,237,0.55)] flex-1 min-w-0 truncate">
                        {text}
                      </div>
                      <div
                        className="font-body text-[0.625rem] sm:text-[0.6875rem] tracking-[0.05em] font-medium py-0.5 px-1.5 sm:px-2 rounded-[10px] shrink-0"
                        style={{ background: timeBg, color: timeColor }}
                      >
                        {time}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* <div className="grid grid-cols-2 gap-4">
          {[
            {
              bg: "#EEF4FF",
              color: "#4A7FD4",
              title: "Reference Managers",
              desc: "Zotero, EndNote, Mendeley — licensed for institutions",
              icon: (
                <>
                  <rect
                    x="3"
                    y="3"
                    width="18"
                    height="18"
                    rx="2"
                    stroke="#4A7FD4"
                    strokeWidth="1.6"
                  />
                  <path
                    d="M8 12h8M8 8h5M8 16h6"
                    stroke="#4A7FD4"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </>
              ),
            },
            {
              bg: "#EDFAF4",
              color: "#1A9E6A",
              title: "Statistical Tools",
              desc: "SPSS, STATA, NVivo — academic & commercial licences",
              icon: (
                <path
                  d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"
                  stroke="#1A9E6A"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
              ),
            },
            {
              bg: "#FFF4E6",
              color: "#C8770A",
              title: "Project Management",
              desc: "Tools for research teams, timelines & collaboration",
              icon: (
                <>
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    stroke="#C8770A"
                    strokeWidth="1.6"
                  />
                  <path
                    d="M12 7v5l3 3"
                    stroke="#C8770A"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </>
              ),
            },
            {
              bg: "#F9EEFF",
              color: "#8B5CF6",
              title: "AI Research Assistants",
              desc: "AI-powered tools for literature review & writing",
              icon: (
                <path
                  d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                  stroke="#8B5CF6"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ),
            },
          ].map(({ bg, title, desc, icon }) => (
            <div
              key={title}
              className="bg-[#FAF8F5] border border-border rounded-[2px] p-6 transition-all duration-[250ms] cursor-default hover:border-[#C8A96E] hover:-translate-y-0.5"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                style={{ background: bg }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  {icon}
                </svg>
              </div>
              <div className="font-heading text-[1rem] tracking-[-0.005em] leading-[1.3] font-medium text-[#0B1625] mb-2">
                {title}
              </div>
              <div className="font-body text-[0.8125rem] tracking-[0em] leading-[1.6] font-normal text-[#94A3B8]">
                {desc}
              </div>
            </div>
          ))}
        </div> */}
      </section>

      {/* ============ RESEARCH HIGHLIGHT SECTION ============ */}
      <section
        className="py-12 sm:py-16 md:py-20 lg:py-28 px-4 sm:px-6 md:px-10 lg:px-16 xl:px-20 bg-[#06457F] grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10 lg:gap-24 items-center"
        id="research-highlight"
      >
        <div className="relative w-full">
          <iframe
            className="w-full aspect-video lg:aspect-4/3 rounded-sm block opacity-70"
            src="https://www.youtube.com/embed/zlRl8sJU_4I?si=wIGyhgKvevZC22vc"
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>

        <div className="w-full">
          <p className="font-body text-[0.6875rem] sm:text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#F7F3ED] mb-4 sm:mb-5">
            Research Training
          </p>
          <h2 className="font-heading text-[1.5rem] sm:text-[1.625rem] md:text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-[#F7F3ED] mb-4 sm:mb-6">
            Build Capacity. Produce Impact.
          </h2>
          <p className="font-body text-[0.9375rem] sm:text-[1rem] tracking-[-0.005em] leading-[1.7] font-normal text-slate-300 mb-5 sm:mb-6">
            Our research training programs equip scholars, practitioners, and
            institutional teams with the analytical skills and methodological
            rigour needed to produce credible, high-impact research.
          </p>
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-6 sm:mb-8">
            {[
              "Research Design",
              "Quantitative Methods",
              "Qualitative Methods",
              "Academic Writing",
              "Data Analysis",
              "AI for Research",
              "MEL",
              "Grant Writing",
            ].map((tag) => (
              <span
                key={tag}
                className="font-body text-[0.625rem] sm:text-[0.6875rem] tracking-[0.05em] font-medium text-slate-300 border border-white py-1 sm:py-1.25 px-2.5 sm:px-3.5 rounded transition-[background,color] duration-200 cursor-default"
              >
                {tag}
              </span>
            ))}
          </div>
          <Link
            href="/our-research/research-training"
            className="font-body lg:min-w-40 text-center border border-[#0474C4] rounded mt-2 text-[0.75rem] sm:text-[0.8125rem] tracking-[0.07em] uppercase font-medium bg-[#0474C4] text-white border-none py-3 sm:py-3.5 px-6 sm:px-8 cursor-pointer transition-all duration-250 inline-block hover:bg-[#060d14] hover:border-[#060d14]"
          >
            Explore Research
          </Link>
        </div>
      </section>

      {/* ============ PROGRAMS SECTION ============ */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-28 px-4 sm:px-6 md:px-10 lg:px-16 xl:px-20 bg-white space-y-10 w-full" id="products">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-10 sm:mb-12 md:mb-14 gap-4 sm:gap-8">
          <div>
            <p className="font-body text-[0.6875rem] sm:text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#0474C4] mb-3 sm:mb-4">
              Featured Programs
            </p>
            <h2 className="font-heading text-[1.5rem] sm:text-[1.625rem] md:text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-[#071639]">
              Explore Our Courses
            </h2>
          </div>
          <div className="flex flex-col items-center gap-3 sm:gap-4 self-start sm:self-auto">
            <Link
              href="/programs"
              className="font-body text-[0.6875rem] sm:text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#0474C4] no-underline border-b border-b-border pb-0.5 whitespace-nowrap transition-[color,border-color] duration-200 hover:text-[#0B1625] hover:border-b-[#0B1625]"
            >
              View All Programs →
            </Link>
          </div>
        </div>

        {programsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6 w-full">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-full rounded-sm overflow-hidden border border-[#0474C4]/10 animate-pulse">
                <div className="aspect-16/10 bg-slate-100" />
                <div className="p-5 sm:p-6 space-y-3">
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                  <div className="h-4 bg-slate-100 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : programs.length > 0 ? (
          <div className="relative -mx-4 sm:-mx-6 md:-mx-10 lg:-mx-16 xl:-mx-20">
            <div
              ref={programsScrollRef}
              className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth gap-4 sm:gap-5 md:gap-6 pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              {programs.map((prog) =>
                renderProgramCard(
                  prog,
                  "snap-start basis-[280px] sm:basis-[calc(50%-0.625rem)] md:basis-[calc(50%-0.625rem)] lg:basis-[calc(25%-1.125rem)]",
                ),
              )}
            </div>

            <button
              type="button"
              onClick={() => scrollPrograms("prev")}
              aria-label="Previous programs"
              className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/95 border border-[#0474C4]/30 text-[#0474C4] flex items-center justify-center shadow-md backdrop-blur transition-colors duration-200 cursor-pointer hover:bg-[#0474C4] hover:text-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => scrollPrograms("next")}
              aria-label="Next programs"
              className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/95 border border-[#0474C4]/30 text-[#0474C4] flex items-center justify-center shadow-md backdrop-blur transition-colors duration-200 cursor-pointer hover:bg-[#0474C4] hover:text-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div className="text-slate-400 py-12 text-center">No programs available yet.</div>
        )}
      
      </section>

      {/* ============ INSIGHTS SECTION ============ */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-28 px-4 sm:px-6 md:px-10 lg:px-16 xl:px-20 bg-[#06457F] w-full">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-10 sm:mb-12 md:mb-14 gap-4 sm:gap-8">
          <div>
            <p className="font-body text-[0.6875rem] sm:text-[0.75rem] tracking-[0.07em] uppercase font-medium text-slate-300 mb-3 sm:mb-4">
              Knowledge Hub
            </p>
            <h2 className="font-heading text-[1.5rem] sm:text-[1.625rem] md:text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-white">
              Insights &amp; Articles
            </h2>
          </div>
          <Link
            href="/insights"
            className="font-body text-[0.6875rem] sm:text-[0.75rem] tracking-[0.07em] uppercase font-medium text-white no-underline border-b border-b-border pb-0.5 whitespace-nowrap transition-[color,border-color] duration-200 hover:text-[#F7F3ED] hover:border-b-[#F7F3ED] self-start sm:self-auto"
          >
            View All Articles →
          </Link>
        </div>

        {insightsLoading ? (
          <div className="text-slate-300 py-12">Loading insights...</div>
        ) : insightsError ? (
          <div className="text-red-300 py-12">{insightsError}</div>
        ) : insights.length === 0 ? (
          <div className="text-slate-300 py-12">No insights available yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
            {insights.map((insight) => (
              <InsightCard key={insight.slug} insight={insight} />
            ))}
          </div>
        )}
      </section>

      {/* ============ EVENTS SECTION ============ */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-28 px-4 sm:px-6 md:px-10 lg:px-16 xl:px-20 bg-[#F7F3ED]/50 w-full">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-10 sm:mb-12 md:mb-14 gap-4 sm:gap-8">
          <div>
            <p className="font-body text-[0.6875rem] sm:text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#0474C4] mb-3 sm:mb-4">
              What&apos;s On
            </p>
            <h2 className="font-heading text-[1.5rem] sm:text-[1.625rem] md:text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-[#071639]">
              Upcoming Workshops
            </h2>
          </div>
          <Link
            href="/workshops"
            className="font-body text-[0.6875rem] sm:text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#0474C4] no-underline border-b border-b-border pb-0.5 whitespace-nowrap transition-[color,border-color] duration-200 hover:text-[#071639] hover:border-b-[#071639] self-start sm:self-auto"
          >
            View All Workshops →
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6 md:gap-8 lg:gap-12 items-start">
          {/* Mini calendar */}
          <div className="bg-[#06457F] rounded-sm p-5 sm:p-6 md:p-[1.8rem] lg:sticky lg:top-22">
            <div className="flex justify-between items-center mb-6">
              <span className="font-heading text-[1rem] tracking-[-0.005em] leading-[1.3] font-medium text-slate-300">
                {calendar.label}
              </span>
              <div className="flex gap-2">
                <button className="bg-[#EDF2FB]/20 border border-[#EDF2FB]/20 text-slate-300 w-7 h-7 rounded-xs cursor-pointer font-body text-[0.75rem] flex items-center justify-center transition-[background] duration-200 hover:bg-[rgba(200,169,110,0.2)]">
                  &#8249;
                </button>
                <button className="bg-[#EDF2FB]/20 border border-[#EDF2FB]/20 text-slate-300 w-7 h-7 rounded-xs cursor-pointer font-body text-[0.75rem] flex items-center justify-center transition-[background] duration-200 hover:bg-[rgba(200,169,110,0.2)]">
                  &#8250;
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                <span
                  key={d}
                  className="font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium text-[rgba(247,243,237,0.25)] pb-2"
                >
                  {d}
                </span>
              ))}
              {Array.from({ length: calendar.leadingEmpty }).map((_, i) => (
                <span key={`empty-${i}`} aria-hidden className="py-1.5 px-1" />
              ))}
              {calendar.days.map(({ day, hasEvent, today }) => (
                /* Day number — DM Sans, 12px, font-normal/medium */
                <span
                  key={day}
                  className={[
                    "py-1.5 px-1 rounded-xs font-body text-[0.75rem]",
                    today
                      ? "bg-[#0474C4] text-[#EDF2FB] font-medium cursor-pointer"
                      : hasEvent
                        ? "font-medium text-[#EDF2FB] cursor-pointer relative after:content-[''] after:block after:w-1 after:h-1 after:rounded-full after:bg-[#EDF2FB] after:mx-auto after:mt-0.5 hover:bg-[rgba(200,169,110,0.1)] hover:text-[#F7F3ED]"
                        : "font-normal text-[rgba(247,243,237,0.45)] cursor-pointer hover:bg-[rgba(200,169,110,0.1)] hover:text-[#F7F3ED] transition-[background,color] duration-150",
                  ].join(" ")}
                >
                  {day}
                </span>
              ))}
            </div>

            <div className="mt-6 pt-[1.2rem] border-t border-t-[rgba(200,169,110,0.1)] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#EDF2FB] shrink-0 block" />
              <span className="font-body text-[0.75rem] tracking-[0em] font-normal text-[#EDF2FB]">
                Event scheduled on this date
              </span>
            </div>
          </div>

          {/* Event list */}
          <div className="flex flex-col gap-px bg-transparent border border-transparent rounded-sm overflow-hidden">
            {!workshopsLoading && !workshopsError && workshops.length > 0 ? (
              workshops.map((workshop) => {
                const availableSpots = workshop.capacity !== null
                  ? Math.max(0, workshop.capacity - workshop.registered)
                  : Infinity;
                const isFull = availableSpots === 0;
                const isUrgent = availableSpots <= 3 && availableSpots > 0;
                const workshopDate = new Date(workshop.date ?? "");

                return (
                  <div
                    key={workshop.id}
                    className="group bg-white grid grid-cols-[60px_1fr] sm:grid-cols-[72px_1fr_auto] gap-4 sm:gap-5 md:gap-6 py-4 sm:py-5 md:py-[1.6rem] px-4 sm:px-5 md:px-[1.8rem] items-start sm:items-center transition-[background] duration-250 cursor-pointer hover:bg-[#EDF2FB]/50"
                >
                    {/* Date block */}
                    <div className="text-center bg-[#0474C4] rounded-xs py-2 px-2 sm:py-2.5 shrink-0">
                      <span className="font-heading text-[1.125rem] sm:text-[1.25rem] md:text-[1.375rem] tracking-[-0.005em] leading-[1.1] font-semibold text-[#EDF2FB] block">
                        {workshopDate.getDate()}
                      </span>
                      <span className="font-body text-[0.5625rem] sm:text-[0.625rem] tracking-[0.07em] uppercase font-medium text-[#EDF2FB] block mt-0.75">
                        {workshopDate.toLocaleDateString("en-US", { month: "short" })}
                      </span>
                    </div>

                    {/* Event info */}
                    <div className="min-w-0">
                      <span className="font-body text-[0.625rem] sm:text-[0.6875rem] tracking-[0.07em] uppercase font-medium text-[#0474C4] mb-1 sm:mb-1.5 block">
                        {workshop.type}
                      </span>
                      <h3 className="font-heading text-[0.9375rem] sm:text-[1rem] tracking-[-0.005em] leading-[1.3] font-medium text-[#071639] mb-1.5 transition-colors duration-200 group-hover:text-[#0474C4]">
                        {workshop.title}
                      </h3>
                      <div className="flex gap-3 sm:gap-4 items-center flex-wrap">
                        <span className="font-body text-[0.75rem] sm:text-[0.8125rem] tracking-[0em] font-normal text-slate-400">
                          {workshop.startTime
                            ? workshop.endTime
                              ? `${workshop.startTime} – ${workshop.endTime}`
                              : workshop.startTime
                            : "Time TBA"}
                        </span>
                        {!!workshop.duration && (
                          <span className="font-body text-[0.75rem] sm:text-[0.8125rem] tracking-[0em] font-normal text-slate-400">
                            {workshop.duration}h
                          </span>
                        )}
                        <span className="font-body text-[0.75rem] sm:text-[0.8125rem] tracking-[0em] font-normal text-slate-400">
                          {Number(workshop.fee) === 0 ? "Free" : `$${Number(workshop.fee).toLocaleString()}`}
                        </span>
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="shrink-0 col-span-2 sm:col-span-1 sm:text-right flex sm:block items-center gap-3 sm:gap-0 mt-1 sm:mt-0">
                      <span
                        className={`font-body text-[0.6875rem] sm:text-[0.75rem] tracking-[0em] font-normal sm:block sm:mb-2 whitespace-nowrap ${isUrgent ? "text-[#0474C4]" : "text-slate-400"}`}
                    >

                        {isFull ? "Full" : `${availableSpots} spots left`}
                      </span>
                      <button
                        disabled={isFull}
                        className={`font-body text-[0.6875rem] sm:text-[0.75rem] tracking-[0.07em] uppercase font-medium py-1.5 sm:py-1.75 px-3.5 sm:px-4.5 rounded-full whitespace-nowrap transition-all duration-200 ml-auto sm:ml-0 ${
                          isFull
                            ? "border border-[#0474C4] text-[#0474C4] min-w-20 cursor-not-allowed"
                            : "bg-transparent border border-[#0474C4] min-w-20 text-[#0474C4] cursor-pointer hover:bg-[#0474C4] hover:text-white"
                      }`}
                      >
                        {isFull ? "Full" : "Register"}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : workshopsLoading ? (
              <div className="bg-white py-12 px-[1.8rem] text-slate-400">
                Loading events...
              </div>
            ) : workshopsError ? (
              <div className="bg-white py-12 px-[1.8rem] text-red-400">
                {workshopsError}
              </div>
            ) : (
              <div className="bg-white py-12 px-[1.8rem] text-slate-400">
                No upcoming events.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ============ CTA SECTION ============ */}
      <section className="w-full py-12 sm:py-16 md:py-20 lg:py-28 px-4 sm:px-6 md:px-10 lg:px-20 text-center bg-[#181C2C] relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-ink pointer-events-none" />
        <div className="relative max-w-140 mx-auto">
          <p className="font-body text-[0.6875rem] sm:text-[0.75rem] tracking-[0.07em] uppercase font-medium text-blue-300 mb-4 sm:mb-6">
            Get Started
          </p>

          <h2 className="font-heading text-[1.5rem] sm:text-[1.625rem] md:text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-white mb-4 sm:mb-5">
            Begin Your Professional Learning Journey
          </h2>

          <p className="font-body text-[0.9375rem] sm:text-[1rem] md:text-[1.0625rem] lg:text-[1.125rem] tracking-[-0.01em] leading-[1.65] font-light text-slate-300 mb-8 sm:mb-10">
            Join thousands of professionals advancing their expertise with ARPS
            Institute.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center sm:flex-wrap">
            <Link
              href="/contact"
              className="font-body text-[0.8125rem] sm:text-[0.875rem] tracking-[0.02em] font-medium bg-[#0474C4] text-[#EBF3FC] capitalize border-[#0474C4] py-3 sm:py-3.5 px-5 h-11 sm:h-12 rounded inline-flex items-center justify-center gap-1 min-w-40 transition-colors duration-200 hover:bg-[#06457F] hover:border-[#06457F]"
            >
              Contact Us <ChevronRight className="h-4 w-4" />
            </Link>

            <Link
              href="/programs"
              className="font-body text-[0.8125rem] sm:text-[0.875rem] tracking-[0.02em] font-medium bg-transparent text-center text-[#EBF3FC] capitalize border border-[#EBF3FC] py-3 sm:py-3.5 px-5 h-11 sm:h-12 rounded inline-flex items-center justify-center gap-1 min-w-40 transition-colors duration-200 hover:bg-[#06457F] hover:border-[#06457F]"
            >
              Explore Programs <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default withLayout(HomePage);
