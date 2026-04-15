/* eslint-disable react/no-unescaped-entities */
import withLayout from "@/hooks/useLayout";
import { ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
const HomePage = () => {
  return (
    <>
      <section className="bg-[#060D14] min-h-[88vh] grid grid-cols-1 md:grid-cols-2 relative overflow-hidden w-full">
        <div className="absolute inset-0 bg-grid-ink pointer-events-none" />
        <div className="absolute -top-30 -right-30 w-150 h-150 rounded-full bg-[#0474C4]/8 blur-[100px] pointer-events-none" />

        <div className="py-16 md:py-24 px-6 md:pr-16 md:pl-20 flex flex-col justify-center relative z-2 gap-12">
          <div className="flex flex-col gap-4 max-w-110">
            <p className="text-[0.7rem] tracking-[0.18em] uppercase text-blue-300 flex items-center gap-3 before:content-[''] before:block before:w-8 before:h-px before:bg-blue-300 before:shrink-0">
              Global Professional Institute
            </p>
            <h1 className="font-heading text-[clamp(2.4rem,4vw,3.4rem)] leading-[1.15] text-[#F7F3ED] font-normal tracking-[-0.01em]">
              Advance Your
              <br />
              <em className="italic text-[#0474C4]">Research Capacity</em>
              <br />
              &amp; Leadership
            </h1>
            <p className="font-body text-[1.125rem] tracking-[-0.01em] leading-[1.65] font-light text-[#EBF3FC]">
              Professional certification programs, research training, and
              institutional consulting — for scholars, practitioners, and
              development professionals worldwide.
            </p>
          </div>
          <div className="flex gap-4 items-center flex-wrap">
            <Link
              href="/"
              className="font-body text-[0.8125rem] h-full rounded-[32px] min-w-40 tracking-[0.07em] uppercase font-medium bg-[#0474C4] text-white border-0 py-3.5 px-8 cursor-pointer transition-all duration-250 no-underline inline-block hover:bg-[#06457F] hover:border-[#06457F]"
            >
              Explore Programs
            </Link>
            <Link
              href="/"
              className="font-body text-[0.8125rem] h-full rounded-[32px] min-w-40 text-center tracking-[0.07em] uppercase font-medium bg-transparent text-[#0474C4] border border-[#0474C4] py-3.25 px-7 cursor-pointer transition-all duration-250 no-underline inline-block hover:bg-[#0474C4] hover:text-white hover:border-[#0474C4]"
            >
              Research Training
            </Link>
          </div>
          <div className="flex gap-12 pt-10 border-t border-t-[rgba(200,169,110,0.15)] flex-wrap">
            <div>
              <div className="font-heading text-[1.75rem] tracking-[-0.01em] leading-[1.1] font-semibold text-[#0474C4] block mb-1">
                120+
              </div>
              <div className="font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium text-[#EBF3FC]">
                Countries Reached
              </div>
            </div>
            <div>
              <div className="font-heading text-[1.75rem] tracking-[-0.01em] leading-[1.1] font-semibold text-[#0474C4] block mb-1">
                40+
              </div>
              <div className="font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium text-[#EBF3FC]">
                Certifications
              </div>
            </div>
            <div>
              <div className="font-heading text-[1.75rem] tracking-[-0.01em] leading-[1.1] font-semibold text-[#0474C4] block mb-1">
                15k+
              </div>
              <div className="font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium text-[#EBF3FC]">
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

      <section className="py-16 md:py-28 px-8 md:px-16 lg:px-20 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center bg-white">
        <div className="fle">
          <div className="flex flex-col items-start gap-6 w-full">
            <div className="block space-y-5">
              <p className="text-[0.68rem] tracking-[0.18em] uppercase text-[#0474C4]">
                About the Institute
              </p>
              <h2 className="font-heading text-[clamp(1.8rem,2.8vw,2.4rem)] leading-[1.2] font-normal text-[#071639] tracking-[-0.01em]">
                A Global Institute for Professional Learning &amp; Research
                Innovation
              </h2>
            </div>
            <p className="font-body text-[1rem] tracking-[-0.005em] leading-[1.7] font-normal text-slate-600">
              The Institute for Advanced Research and Professional Studies (ARPS
              Institute) is a global online institute dedicated to advancing
              professional education, research capacity, leadership development,
              and digital innovation across multiple disciplines. Through its
              integrated digital model, ARPS Institute connects global knowledge
              networks while expanding access to advanced professional learning
              and applied research training — without geographical limitations.
            </p>
            <Link href="/about"  className="bg-[#0474C4] min-w-40 text-white border-none py-3.5 px-8 font-body text-[0.82rem] font-medium tracking-widest uppercase cursor-pointer rounded-[32px] transition-all duration-250 inline-block hover:bg-[#06457F] hover:border-[#06457F]">
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

        <div className="relative p-4">
          <Image
            src="/images/about-arsp.webp"
            alt="Professionals in a research training session"
            width={700}
            height={530}
            className="w-full aspect-4/3 object-cover rounded-xs block"
          />
          <div className="absolute inset-0 border border-border rounded-xs pointer-events-none"></div>
          <div className="absolute -bottom-2 -left-2 bg-[#0B1625] text-[#D4BA85] py-5 px-6">
            <span className="font-heading text-[2rem] font-normal leading-none block">
              120+
            </span>
            <span className="text-[0.72rem] italic text-[rgba(232,213,168,0.6)] block mt-1">
              Countries Reached
            </span>
          </div>
        </div>
      </section>

      {/* ============ SOFTWARE SECTION ============ */}
      <section className="py-16 md:py-28 px-8 md:px-16 lg:px-20 bg-[#F7F3ED]/50 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
        <div className="block relative space-y-6 w-full">
          <div className="block space-y-5">
            <p className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#0474C4]">
              Software Sales
            </p>
            <h2 className="font-heading text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-[#071639]">
              Curated Research &amp; Productivity Software
            </h2>
          </div>
          <p className="font-body text-[1rem] tracking-[-0.005em] leading-[1.7] font-normal text-slate-600">
            We supply institutions, universities, and individual professionals
            with industry-leading software tools to power modern research
            workflows, data analysis, and operational productivity.
          </p>
          <Link
            href="/solutions"
            className="font-body min-w-40 border border-[#0474C4] rounded-[32px] mt-2 text-[0.8125rem] tracking-[0.07em] uppercase font-medium bg-[#0474C4] text-white border-none py-3.5 px-8 cursor-pointer transition-all duration-250 inline-block hover:bg-[#06457F] hover:border-[#06457F]"
          >
            Browse Catalogue
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="relative z-2">
            <div className="bg-[#0D1B2A] rounded-xl overflow-hidden border border-blue-600/20 shadow-[0_24px_60px_rgba(6,13,20,0.4)]">
              <div className="py-2.5 px-3.5 flex items-center gap-2 border-b border-[rgba(247,243,237,0.06)]">
                <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
                <div className="flex-1 bg-[rgba(247,243,237,0.06)] rounded-lg h-5 mx-2 flex items-center px-2 font-body text-[0.6875rem] tracking-[0em] font-normal text-[rgba(247,243,237,0.3)]">
                  app.resolverite.com/dashboard
                </div>
              </div>

              <div className="p-6">
                <div className="font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium text-[rgba(247,243,237,0.3)] mb-2.5">
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
                      className="bg-[rgba(247,243,237,0.04)] border border-blue-600/15 rounded-[6px] py-2.5 px-3"
                    >
                      <span
                        className="font-heading text-[1.375rem] tracking-[-0.005em] leading-[1.1] font-semibold block"
                        style={{ color }}
                      >
                        {value}
                      </span>
                      <span className="font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium text-[rgba(247,243,237,0.3)] mt-0.75 block">
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
                      className="bg-[rgba(247,243,237,0.03)] border border-[rgba(247,243,237,0.06)] rounded-lg py-2.25 px-3 flex items-center gap-2.5"
                    >
                      <div
                        className="w-1.75 h-1.75 rounded-full shrink-0"
                        style={{ background: dot }}
                      />
                      <div className="font-body text-[0.75rem] tracking-[0em] font-normal text-[rgba(247,243,237,0.55)] flex-1">
                        {text}
                      </div>
                      <div
                        className="font-body text-[0.6875rem] tracking-[0.05em] uppercase font-medium py-0.5 px-2 rounded-[10px]"
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
              <div className="px-3.5 py-2.5 flex items-center gap-2 border-b border-[rgba(247,243,237,0.06)]">
                <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
                <div className="flex-1 bg-[rgba(247,243,237,0.06)] rounded-lg h-5 mx-2 flex items-center px-2 font-body text-[0.6875rem] tracking-[0em] font-normal text-[rgba(247,243,237,0.3)]">
                  app.mentortrack.io/my-journey
                </div>
              </div>

              <div className="p-6">
                {/* User row */}
                <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-[rgba(247,243,237,0.06)]">
                  <div className="w-8 h-8 rounded-full bg-[rgba(13,148,136,0.18)] flex items-center justify-center font-body text-[0.6875rem] font-medium text-[#5EEAD4] shrink-0">
                    DA
                  </div>
                  <div>
                    <div className="font-body text-[0.8125rem] tracking-[0em] leading-normal font-medium text-(--cream)">
                      Dr. Amara Diallo
                    </div>
                    <div className="font-body text-[0.6875rem] tracking-[0em] leading-normal font-normal text-[rgba(247,243,237,0.3)]">
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
                      className="bg-[rgba(247,243,237,0.03)] border border-[rgba(247,243,237,0.06)] rounded-lg py-2.25 px-3 flex items-center gap-2.5"
                    >
                      <div
                        className="w-1.75 h-1.75 rounded-full shrink-0"
                        style={{ background: dot }}
                      />
                      <div className="font-body text-[0.75rem] tracking-[0em] font-normal text-[rgba(247,243,237,0.55)] flex-1">
                        {text}
                      </div>
                      <div
                        className="font-body text-[0.6875rem] tracking-[0.05em] font-medium py-0.5 px-2 rounded-[10px]"
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
        className="py-28 px-20 bg-[#06457F] grid grid-cols-2 gap-24 items-center"
        id="research-highlight"
      >
        <div className="relative">
          <iframe
            width="auto"
            height="456"
            className="w-full h-114 aspect-4/3 rounded-sm block opacity-70"
            src="https://www.youtube.com/embed/zlRl8sJU_4I?si=wIGyhgKvevZC22vc"
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>

        <div>
          <p className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#F7F3ED] mb-5">
            Research Training
          </p>
          <h2 className="font-heading text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-[#F7F3ED] mb-6">
            Build Capacity. Produce Impact.
          </h2>
          <p className="font-body text-[1rem] tracking-[-0.005em] leading-[1.7] font-normal text-slate-300 mb-6">
            Our research training programs equip scholars, practitioners, and
            institutional teams with the analytical skills and methodological
            rigour needed to produce credible, high-impact research.
          </p>
          <div className="flex flex-wrap gap-2 mb-8">
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
                className="font-body text-[0.6875rem] tracking-[0.05em] font-medium text-slate-300 border border-white py-1.25 px-3.5 rounded-[32px] transition-[background,color] duration-200 cursor-default"
              >
                {tag}
              </span>
            ))}
          </div>
          <Link
            href="//research"
            className="font-body min-w-40 border border-[#0474C4] rounded-[32px] mt-2 text-[0.8125rem] tracking-[0.07em] uppercase font-medium bg-[#0474C4] text-white border-none py-3.5 px-8 cursor-pointer transition-all duration-250 inline-block hover:bg-[#060d14] hover:border-[#060d14]"
          >
            Explore Research
          </Link>
        </div>
      </section>

      {/* ============ COURSES SECTION ============ */}
      <section className="py-28 px-20 bg-white" id="products">
        <div className="flex justify-between items-end mb-14 gap-8">
          <div>
            <p className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#0474C4] mb-4">
              Featured Programs
            </p>
            <h2 className="font-heading text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-[#071639]">
              Explore Our Courses
            </h2>
          </div>
          <a
            href="#"
            className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#0474C4] no-underline border-b border-b-border pb-0.5 whitespace-nowrap transition-[color,border-color] duration-200 hover:text-[#0B1625] hover:border-b-[#0B1625]"
          >
            View All Programs →
          </a>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {[
            {
              initials: "DR",
              author: "Dr. Rachel Osei",
              title: "Advanced Data Analysis & Research Methods",
              hours: "12 hours",
              level: "Intermediate",
              price: "$99 / mo",
              badge: "Bestseller",
            },
            {
              initials: "PK",
              author: "Prof. Kenneth Addo",
              title: "Academic Writing & Journal Publication Mastery",
              hours: "10 hours",
              level: "Beginners",
              price: "$19 / mo",
            },
            {
              initials: "SM",
              author: "Dr. Sarah Mensah",
              title: "Strategic Leadership & Institutional Management",
              hours: "16 hours",
              level: "Expert",
              price: "$1,000 / yr",
              badge: "New",
            },
            {
              initials: "JB",
              author: "James Boateng, MSc",
              title: "Monitoring, Evaluation & Learning (MEL) Fundamentals",
              hours: "8 hours",
              level: "Beginners",
              price: "$18 / mo",
            },
            {
              initials: "AA",
              author: "Dr. Ama Asante",
              title: "Artificial Intelligence Tools for Researchers",
              hours: "12 hours",
              level: "Intermediate",
              price: "$99 / yr",
              badge: "Trending",
            },
            {
              initials: "EK",
              author: "Emmanuel Kwarteng, PhD",
              title: "Policy Research & Evidence-Based Advocacy",
              hours: "14 hours",
              level: "Expert",
              price: "$180 / yr",
            },
          ].map(({ initials, author, title, hours, level, price, badge }) => (
            <Link
              href="/courses/advanced-data-analysis"
              key={title}
              className="group bg-white rounded-sm overflow-hidden border border-[#0474C4]/15 transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(13,27,42,0.1)]"
            >
              <div className="relative aspect-16/10 overflow-hidden">
                <Image
                  src="/images/dummy/course-1.jpg"
                  alt={title}
                  width={600}
                  height={400}
                  className="object-cover transition-transform duration-400 group-hover:scale-[1.04]"
                />
                {badge && (
                  <span className="absolute top-3 left-3 font-body text-[0.625rem] tracking-[0.07em] uppercase font-medium bg-[#0474C4] text-white px-4 py-1.5 rounded-full">
                    {badge}
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
                  <span className="font-body text-[0.8125rem] tracking-[0em] font-normal text-slate-600">
                    {author}
                  </span>
                </div>

                <h3 className="font-heading text-[1rem] tracking-[-0.005em] leading-[1.35] font-medium text-[#071639] mb-4">
                  {title}
                </h3>

                <div className="flex gap-[1.2rem] items-center">
                  <span className="flex items-center gap-1.25 text-[0.78rem] text-[#637AA3] font-light">
                    <svg
                      className="w-3.5 h-3.5 opacity-50"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle
                        cx="8"
                        cy="8"
                        r="6.5"
                        stroke="currentColor"
                        strokeWidth="1.2"
                      />
                      <path
                        d="M8 5v3.5l2 1.5"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                      />
                    </svg>
                    {hours}
                  </span>
                  <span className="w-0.75 h-0.75 rounded-full bg-slate-400/30"></span>
                  <span className="flex items-center gap-1.25 text-[0.78rem] text-[#637AA3] font-light">
                    <svg
                      className="w-3.5 h-3.5 opacity-50"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect
                        x="2"
                        y="3"
                        width="12"
                        height="10"
                        rx="1.5"
                        stroke="currentColor"
                        strokeWidth="1.2"
                      />
                      <path
                        d="M5 7h6M5 10h4"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                      />
                    </svg>
                    {level}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ============ INSIGHTS SECTION ============ */}
      <section className="py-28 px-20 bg-[#06457F] w-full">
        <div className="flex justify-between items-end mb-14 gap-8">
          <div>
            <p className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-slate-300 mb-4">
              Knowledge Hub
            </p>
            <h2 className="font-heading text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-white">
              Insights &amp; Articles
            </h2>
          </div>
          <Link
            href="/insights"
            className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-white no-underline border-b border-b-border pb-0.5 whitespace-nowrap transition-[color,border-color] duration-200 hover:text-[#F7F3ED] hover:border-b-[#F7F3ED]"
          >
            View All Articles →
          </Link>
        </div>

        <div className="grid grid-cols-[1.6fr_1fr_1fr] gap-6 items-start">
          {/* Featured article */}
          <Link
            href="/insights/article-1"
            className="group bg-transparent rounded-sm border border-[rgba(200,169,110,0.15)] overflow-hidden cursor-pointer transition-[border-color,background] duration-300 hover:border-[rgba(200,169,110,0.4)] hover:bg-[rgba(247,243,237,0.07)]"
          >
            <Image
              className="w-full aspect-video object-cover block opacity-75 transition-opacity duration-300 group-hover:opacity-90"
              src="/images/dummy/article-1.jpg"
              alt="Research methods article"
              width={700}
              height={400}
            />
            <div className="pt-[1.6rem] px-[1.8rem] pb-8 bg-white">
              <span className="inline-block font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium bg-[#0474C4]/10 text-[#0474C4] border border-[#0474C4]/10 py-0.75 px-2.5 rounded-full mb-4">
                Research Methods
              </span>
              <h3 className="font-heading text-[1.125rem] tracking-[-0.005em] leading-[1.35] font-medium text-[#071639] mb-3 transition-colors duration-200 group-hover:text-[#0474C4]">
                How Evidence-Based Decision Making Is Transforming Development
                Practice
              </h3>
              <p className="font-body text-[0.875rem] tracking-[0em] leading-[1.7] font-normal text-slate-600 mb-5">
                Across governments and international organisations, the shift
                toward data-driven policymaking is reshaping how development
                outcomes are planned, measured, and sustained.
              </p>
              <div className="flex justify-between items-center pt-4 border-t border-t-[rgba(200,169,110,0.1)]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#0474C4] border border-[#0474C4] font-body text-[0.8125rem] font-medium text-white flex items-center justify-center">
                    RO
                  </div>
                  <span className="font-body text-[0.8125rem] tracking-[0em] font-normal text-[#637AA3]">
                    Dr. Rachel Osei
                  </span>
                </div>
                <span className="font-body text-[0.8125rem] tracking-[0em] font-normal text-[#637AA3]">
                  Mar 10, 2026
                </span>
              </div>
            </div>
          </Link>

          {/* Small article columns — refactored into maps */}
          {[
            [
              {
                initials: "AA",
                author: "Dr. Ama Asante",
                date: "Feb 28, 2026",
                category: "Technology",
                title: "Five Ways AI Is Reshaping Academic Research in 2026",
              },
              {
                initials: "PK",
                author: "Prof. Kenneth Addo",
                date: "Feb 14, 2026",
                category: "Academic Publishing",
                title:
                  "Getting Published: A Practical Guide for Early-Career Researchers",
              },
            ],
            [
              {
                initials: "SM",
                author: "Dr. Sarah Mensah",
                date: "Jan 30, 2026",
                category: "Leadership",
                title:
                  "Building High-Performance Teams in Research Institutions",
              },
              {
                initials: "JB",
                author: "James Boateng, MSc",
                date: "Jan 12, 2026",
                category: "MEL",
                title:
                  "Why Monitoring & Evaluation Must Evolve for the Data Age",
              },
            ],
          ].map((col, ci) => (
            <div key={ci} className="flex flex-col gap-6">
              {col.map(({ initials, author, date, category, title }) => (
                <div
                  key={title}
                  className="group bg-transparent border border-transparent rounded-sm overflow-hidden cursor-pointer transition-[border-color,background] duration-300 hover:border-[rgba(200,169,110,0.4)] hover:bg-[rgba(247,243,237,0.07)]"
                >
                  <Image
                    className="w-full aspect-video object-cover block opacity-75 transition-opacity duration-300 group-hover:opacity-90"
                    src="/images/dummy/article-1.jpg"
                    alt={title}
                    width={500}
                    height={300}
                  />
                  <div className="pt-[1.3rem] px-6 pb-[1.6rem] bg-white">
                    <span className="inline-block font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium bg-[#0474C4]/10 text-[#0474C4] border border-[#0474C4]/10 py-0.75 px-2.5 rounded-full mb-4">
                      {category}
                    </span>
                    <h3 className="font-heading text-[1rem] tracking-[-0.005em] leading-[1.4] font-medium text-[#071639] mb-3 transition-colors duration-200 group-hover:text-[#0474C4]">
                      {title}
                    </h3>
                    <div className="flex justify-between items-center pt-4 border-t border-t-[rgba(200,169,110,0.1)]">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#0474C4] border border-[#0474C4] font-body text-[0.8125rem] font-medium text-white flex items-center justify-center">
                          {initials}
                        </div>
                        <span className="font-body text-[0.8125rem] tracking-[0em] font-normal text-[#637AA3]">
                          {author}
                        </span>
                      </div>
                      <span className="font-body text-[0.8125rem] tracking-[0em] font-normal text-[#637AA3]">
                        {date}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ============ EVENTS SECTION ============ */}
      <section className="py-28 px-20 bg-[#F7F3ED]/50 w-full">
        <div className="flex justify-between items-end mb-14 gap-8">
          <div>
            <p className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#0474C4] mb-4">
              What's On
            </p>
            <h2 className="font-heading text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-[#071639]">
              Upcoming Events
            </h2>
          </div>
          <Link
            href="/workshops"
            className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#0474C4] no-underline border-b border-b-border pb-0.5 whitespace-nowrap transition-[color,border-color] duration-200 hover:text-[#071639] hover:border-b-[#071639]"
          >
            View All Events →
          </Link>
        </div>

        <div className="grid grid-cols-[1fr_2fr] gap-12 items-start">
          {/* Mini calendar */}
          <div className="bg-[#06457F] rounded-sm p-[1.8rem] sticky top-22">
            <div className="flex justify-between items-center mb-6">
              <span className="font-heading text-[1rem] tracking-[-0.005em] leading-[1.3] font-medium text-slate-300">
                March 2026
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
              {[
                { day: 1 },
                { day: 2 },
                { day: 3 },
                { day: 4 },
                { day: 5 },
                { day: 6 },
                { day: 7 },
                { day: 8 },
                { day: 9 },
                { day: 10 },
                { day: 11 },
                { day: 12, hasEvent: true },
                { day: 13 },
                { day: 14 },
                { day: 15 },
                { day: 16, today: true },
                { day: 17, hasEvent: true },
                { day: 18 },
                { day: 19 },
                { day: 20, hasEvent: true },
                { day: 21 },
                { day: 22 },
                { day: 23 },
                { day: 24 },
                { day: 25, hasEvent: true },
                { day: 26 },
                { day: 27 },
                { day: 28, hasEvent: true },
                { day: 29 },
                { day: 30 },
                { day: 31 },
              ].map(({ day, hasEvent, today }) => (
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
            {[
              {
                day: "17",
                month: "Mar",
                type: "Webinar",
                title: "Introduction to Systematic Reviews & Meta-Analysis",
                meta: ["2:00 PM – 4:00 PM GMT", "Online · Zoom", "Free"],
                spots: "8 spots left",
                spotsUrgent: true,
                cta: "Register",
              },
              {
                day: "20",
                month: "Mar",
                type: "Workshop",
                title:
                  "Quantitative Data Analysis with SPSS & R — Hands-On Workshop",
                meta: ["9:00 AM – 1:00 PM GMT", "Online · Zoom", "$45"],
                spots: "24 spots left",
                cta: "Register",
              },
              {
                day: "25",
                month: "Mar",
                type: "Conference",
                title: "ARPS Annual Research & Leadership Summit 2026",
                meta: [
                  "All Day · 3 Sessions",
                  "Hybrid · Accra + Online",
                  "$120 / Free online",
                ],
                spots: "142 spots left",
                cta: "Register",
              },
              {
                day: "28",
                month: "Mar",
                type: "Masterclass",
                title:
                  "Writing & Publishing in High-Impact Journals — Live Masterclass",
                meta: ["3:00 PM – 5:30 PM GMT", "Online · Zoom", "$30"],
                spots: "3 spots left",
                spotsUrgent: true,
                cta: "Register",
              },
              {
                day: "10",
                month: "Apr",
                type: "Short Course",
                title:
                  "AI for Development Research — 4-Week Intensive Online Course",
                meta: [
                  "Starts Apr 10 · 4 Weeks",
                  "Online · Self-paced",
                  "$199",
                ],
                spots: "Open enrolment",
                cta: "Enrol Now",
              },
              {
                day: "22",
                month: "Apr",
                type: "Webinar",
                title: "Grant Writing Strategies for Research Professionals",
                meta: ["11:00 AM – 12:30 PM GMT", "Online · Zoom", "Free"],
                spots: "Waitlist only",
                full: true,
                cta: "Full",
              },
            ].map(
              ({
                day,
                month,
                type,
                title,
                meta,
                spots,
                spotsUrgent,
                full,
                cta,
              }) => (
                <div
                  key={title}
                  className="group bg-white grid grid-cols-[72px_1fr_auto] gap-6 py-[1.6rem] px-[1.8rem] items-center transition-[background] duration-250 cursor-pointer hover:bg-[#EDF2FB]/50"
                >
                  {/* Date block */}
                  <div className="text-center bg-[#0474C4] rounded-xs py-2.5 px-2 shrink-0">
                    <span className="font-heading text-[1.375rem] tracking-[-0.005em] leading-[1.1] font-semibold text-[#EDF2FB] block">
                      {day}
                    </span>
                    <span className="font-body text-[0.625rem] tracking-[0.07em] uppercase font-medium text-[#EDF2FB] block mt-0.75">
                      {month}
                    </span>
                  </div>

                  {/* Event info */}
                  <div className="min-w-0">
                    <span className="font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium text-[#0474C4] mb-1.5 block">
                      {type}
                    </span>
                    <h3 className="font-heading text-[1rem] tracking-[-0.005em] leading-[1.3] font-medium text-[#071639] mb-1.5 transition-colors duration-200 group-hover:text-[#0474C4]">
                      {title}
                    </h3>
                    <div className="flex gap-4 items-center flex-wrap">
                      {meta.map((m) => (
                        <span
                          key={m}
                          className="font-body text-[0.8125rem] tracking-[0em] font-normal text-slate-400"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="shrink-0 text-right">
                    <span
                      className={`font-body text-[0.75rem] tracking-[0em] font-normal block mb-2 whitespace-nowrap ${spotsUrgent ? "text-[#0474C4]" : "text-slate-400"}`}
                    >
                      {spots}
                    </span>
                    <button
                      disabled={full}
                      className={`font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium py-1.75 px-4.5 rounded-full whitespace-nowrap transition-all duration-200 ${
                        full
                          ? "border border-[#0474C4] text-[#0474C4] min-w-20 cursor-not-allowed"
                          : "bg-transparent border border-[#0474C4] min-w-20 text-[#0474C4] cursor-pointer hover:bg-[#0474C4] hover:text-white"
                      }`}
                    >
                      {cta}
                    </button>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      {/* ============ CTA SECTION ============ */}
      <section className="w-full py-28 px-20 text-center bg-[#181C2C] relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-ink pointer-events-none" />
        <div className="relative max-w-140 mx-auto">
          <p className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-blue-300 mb-6">
            Get Started
          </p>

          <h2 className="font-heading text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-white mb-5">
            Begin Your Professional Learning Journey
          </h2>

          <p className="font-body text-[1.125rem] tracking-[-0.01em] leading-[1.65] font-light text-slate-300 mb-10">
            Join thousands of professionals advancing their expertise with ARPS
            Institute.
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/contact"
              className="font-body text-[0.875rem] tracking-[0.02em] font-medium bg-[#0474C4] text-[#EBF3FC] capitalize border-[#0474C4] py-3.5 px-5 h-12 rounded-[32px] min-w-40  transition-colors duration-200 hover:bg-[#06457F] hover:border-[#06457F]"
            >
              Contact Us <ChevronRight className="h-4 w-4" />
            </Link>

            <Link
              href="/programs"
              className="font-body text-[0.875rem] tracking-[0.02em] font-medium bg-transparent text-center text-[#EBF3FC] capitalize border border-[#EBF3FC] py-3.5 px-5 h-12 rounded-[32px] min-w-40  transition-colors duration-200 hover:bg-[#06457F] hover:border-[#06457F]"
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
