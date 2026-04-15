/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from "next";
import Link from "next/link";
import withLayout from "@/hooks/useLayout";

export const metadata: Metadata = { title: "Research Training" };

const ResearchPage = () => {
  return (
    <>
      <section className="bg-[#071639] w-full pt-16 md:pt-28 pb-16 md:pb-24 px-8 md:px-16 lg:px-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-ink pointer-events-none" />
        <div className="absolute -top-24 right-0 w-125 h-125 rounded-full bg-[#0474C4]/8 blur-[100px] pointer-events-none" />

        <div className="relative z-2 flex flex-col gap-6">
          <div className="flex flex-col gap-6">
            <p className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-blue-300 flex items-center gap-3 before:content-[''] before:block before:w-8 before:h-px before:bg-blue-300 before:shrink-0">
              Advanced Research Training
            </p>

            <h1 className="font-heading text-[2.25rem] md:text-[3rem] tracking-[-0.015em] md:tracking-[-0.02em] leading-[1.2] md:leading-[1.1] font-bold text-white">
              Build Capacity.
              <br />
              <em className="italic text-[#0474C4]">Produce Impact.</em>
            </h1>

            <p className="font-body text-[1.125rem] tracking-[-0.01em] leading-[1.65] font-light text-[#EBF3FC] max-w-lg">
              ARPS Institute's research training programs are designed to equip
              scholars, practitioners, and institutional teams with the
              analytical skills, methodological rigour, and scholarly
              communication tools needed to produce credible, high-impact
              research.
            </p>
          </div>

          <div className="flex gap-10 pt-10 border-t border-[rgba(200,169,110,0.15)] flex-wrap">
            {[
              { value: "500+", label: "Researchers Trained" },
              { value: "30+", label: "Training Modules" },
              { value: "92%", label: "Completion Rate" },
              { value: "120+", label: "Countries Reached" },
            ].map((s) => (
              <div key={s.label}>
                <span className="font-heading text-[1.75rem] tracking-[-0.01em] leading-[1.1] font-semibold text-[#0474C4] block mb-1">
                  {s.value}
                </span>
                <span className="font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium text-[#EBF3FC]">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* <div className="relative z-2">
    <div className="relative h-100">
      <div className="absolute bottom-0 right-0 w-70 h-50 rotate-[4deg] bg-[rgba(200,169,110,0.04)] border border-[rgba(200,169,110,0.18)] rounded-sm p-[1.8rem]" />
      <div className="absolute bottom-7.5 right-5 w-75 h-55 -rotate-2 bg-[rgba(200,169,110,0.07)] border border-[rgba(200,169,110,0.18)] rounded-sm p-[1.8rem]" />
      <div className="absolute bottom-15 right-10 w-[320px] h-60 bg-[rgba(200,169,110,0.11)] border border-[rgba(200,169,110,0.3)] rounded-sm p-[1.8rem]">

        <div className="font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium text-[#0474C4] mb-2.5">
          Featured Programme
        </div>

        <div className="font-heading text-[1.125rem] tracking-[-0.005em] leading-[1.3] font-medium text-[#f7f3ed] mb-4">
          Advanced Quantitative Research Methods
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {["8 Weeks", "Online", "Certificate"].map((tag) => (
            <span
              key={tag}
              className="font-body text-[0.6875rem] tracking-[0.05em] font-medium text-[rgba(200,169,110,0.7)] border border-[rgba(200,169,110,0.2)] py-0.75 px-2.5 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-4">
          <div className="font-body text-[0.75rem] tracking-[0em] leading-normal font-normal text-[rgba(247,243,237,0.4)] mb-1.5">
            Enrolment — 78% filled
          </div>
          <div className="h-0.75 bg-[rgba(200,169,110,0.15)] rounded-sm">
            <div className="h-full bg-[#0474C4] rounded-sm w-[78%]" />
          </div>
        </div>

      </div>
    </div>
  </div> */}
      </section>

      {/* <section className="py-28 px-20 bg-[#faf8f4] grid grid-cols-[1.3fr_1fr] gap-24 items-center">
  <div className="relative">
    <Image
      src="/images/about-arps.webp"
      width={700}
      height={530}
      alt="Research training session"
      className="w-full aspect-3/2 object-cover rounded-xs block"
    />
    <div className="absolute -inset-3.5 border border-border rounded-xs pointer-events-none" />

    <div className="absolute -bottom-4 -left-4 bg-[#071639] text-[#E8D5A8] py-4.5 px-5.5">
      <span className="font-heading text-[1.75rem] tracking-[-0.01em] leading-[1.1] font-semibold block">
        30+
      </span>
      <span className="font-body text-[0.6875rem] tracking-[0.05em] font-normal italic text-[rgba(232,213,168,0.55)] block mt-0.75">
        Training Modules
      </span>
    </div>
  </div>

  <div>
    <p className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#637AA3] mb-4">
      What We Offer
    </p>

    <h2 className="font-heading text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-[#071639] mb-5">
      Advanced Research Training for Scholars &amp; Professionals
    </h2>

    <p className="font-body text-[1rem] tracking-[-0.005em] leading-[1.7] font-normal text-slate-600 max-w-150">
      The Research Methods and Academic Writing Division provides advanced
      training programs for scholars, researchers, and professionals seeking
      to strengthen their research design, analytical skills, and scholarly
      communication.
      <br /><br />
      Our programmes cover the full research cycle — from designing a study
      and collecting data to analysing findings and publishing results — with
      a strong focus on practical, applied learning that participants can use
      immediately in their work.
    </p>

    <div className="mt-8">      
       <Link href="#focus"
        className="btn-dark no-underline inline-block py-3.5 px-8 font-body text-[0.8125rem] tracking-[0.07em] uppercase font-medium rounded-xs cursor-pointer transition-all duration-250"
      >
        View Focus Areas
      </Link>
    </div>
  </div>
</section> */}
      <section className="py-16 md:py-28 px-8 md:px-16 lg:px-20 bg-[#F9F9FB]">
        <div className="mb-12 md:mb-16 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-end">
          <div>
            <p className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#637AA3] mb-4">
              How We Teach
            </p>
            <h2 className="font-heading text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-[#071639]">
              The Research Training Cycle
            </h2>
          </div>
          <p className="font-body text-[1rem] tracking-[-0.005em] leading-[1.7] font-normal text-slate-600">
            Our programmes follow a structured five-phase learning cycle, taking
            participants from foundational concepts through to published outputs
            and real-world application.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 md:gap-0 relative mb-12 md:mb-16">
          {[
            {
              label: "Foundations",
              sub: "Concepts & context",
              icon: (
                <>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 3" />
                </>
              ),
            },
            {
              label: "Design",
              sub: "Research planning",
              icon: (
                <>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </>
              ),
            },
            {
              label: "Data & Analysis",
              sub: "Collection & methods",
              icon: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />,
            },
            {
              label: "Writing",
              sub: "Scholarly output",
              icon: (
                <>
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </>
              ),
            },
            {
              label: "Publication",
              sub: "Dissemination & impact",
              icon: (
                <>
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </>
              ),
            },
          ].map((step, i, arr) => (
            <div
              key={step.label}
              className={`flex flex-col items-center text-center relative ${i < arr.length - 1 ? "[&]:after:content-['→'] after:absolute after:-right-3 after:top-7 after:text-[#0474C4] after:text-base after:opacity-60 after:z-1" : ""}`}
            >
              <div className="w-14 h-14 rounded-full bg-[#0474C4] border-2 border-[#0474C4]/25 flex items-center justify-center mb-4 relative z-2 transition-[background,border-color] duration-300 ">
                <svg
                  className="w-5.5 h-5.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#EBF3FC"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                >
                  {step.icon}
                </svg>
              </div>
              <div className="font-heading text-[0.875rem] tracking-[0em] leading-[1.3] font-medium text-[#071639] transition-colors duration-300">
                {step.label}
              </div>
              <div className="font-body text-[0.75rem] tracking-[0em] leading-normal font-normal text-slate-600 mt-1">
                {step.sub}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              color: "#4A7FD4",
              bg: "#EEF4FF",
              title: "Expert-Led Live Workshops",
              desc: "All programmes are facilitated by experienced researchers and academics with real-world publishing and consulting credentials. Live sessions combine instruction, Q&A, and practical exercises.",
              icon: (
                <>
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </>
              ),
            },
            {
              color: "#1A9E6A",
              bg: "#EEF4FF",
              title: "Applied Learning with Real Data",
              desc: "Participants work on real datasets and research scenarios throughout the programme, applying each method immediately to their own research context for maximum relevance.",
              icon: (
                <>
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <path d="M8 21h8M12 17v4" />
                </>
              ),
            },
            {
              color: "#C8770A",
              bg: "#EEF4FF",
              title: "Certification & Credentials",
              desc: "Participants who complete all modules and assessments receive a digital certificate from ARPS Institute. Certificates include QR verification and are shareable on LinkedIn and professional portfolios.",
              icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
            },
            {
              color: "#8B5CF6",
              bg: "#EEF4FF",
              title: "Global Cohort & Peer Network",
              desc: "Learners join a global cohort of researchers from 120+ countries. Peer discussion boards, group projects, and alumni networks create lasting professional connections.",
              icon: (
                <>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </>
              ),
            },
          ].map((card) => (
            <div
              key={card.title}
              className="bg-white border border-slate-200 rounded-sm p-8 transition-[border-color,transform] duration-250 hover:border-[#0474C4] hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-3.5 mb-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: card.bg }}
                >
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={card.color}
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  >
                    {card.icon}
                  </svg>
                </div>
                {/* H3 — Playfair Display, 18px, -0.005em, lh 1.3 */}
                <div className="font-heading text-[1.125rem] tracking-[-0.005em] leading-[1.3] font-medium text-[#071639]">
                  {card.title}
                </div>
              </div>
              {/* Body — DM Sans, 15px, 0em, lh 1.7 */}
              <div className="font-body text-[0.9375rem] tracking-[0em] leading-[1.7] font-normal text-slate-600">
                {card.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 md:py-28 px-8 md:px-16 lg:px-20 bg-white w-full" id="focus">
        <div className="mb-16">
          <p className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#0474C4] mb-4 block">
            Areas of Focus
          </p>
          <h2 className="font-heading text-[1.75rem] tracking-[-0.015em] leading-[1.2] font-semibold mb-5 text-[#071639] max-w-150">
            Disciplines We Cover
          </h2>
          <p className="font-body text-[1rem] tracking-[-0.005em] leading-[1.7] font-normal text-slate-600 max-w-160">
            ARPS Institute focuses on professional, research, and leadership
            development fields — providing accessible and high-quality training
            across key disciplines worldwide. We do not provide clinical or
            medical training.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              num: "01",
              color: "#4A7FD4",
              bg: "rgba(74,127,212,0.12)",
              title: "Qualitative Research Methods",
              desc: "In-depth training on interviews, focus groups, ethnography, case studies, and thematic analysis. Learn to design, conduct, and report rigorous qualitative inquiry.",
              tags: ["Interviews", "Ethnography", "Thematic Analysis"],
              icon: <path d="M9 11l3 3L22 4" />,
              icon2: (
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              ),
            },
            {
              num: "02",
              color: "#1A9E6A",
              bg: "rgba(26,158,106,0.12)",
              title: "Quantitative Research Methods",
              desc: "Statistical foundations, survey design, hypothesis testing, regression analysis, and interpretation of numerical data for evidence-based reporting.",
              tags: ["SPSS", "Regression", "Survey Design"],
              icon: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />,
            },
            {
              num: "03",
              color: "#C8770A",
              bg: "rgba(200,119,10,0.12)",
              title: "Mixed Methods Research",
              desc: "Integration of qualitative and quantitative approaches for comprehensive research design. Covers convergent, explanatory, and exploratory mixed methods frameworks.",
              tags: ["Integration", "Convergent Design"],
              icon: <circle cx="12" cy="12" r="3" />,
              icon2: (
                <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
              ),
            },
            {
              num: "04",
              color: "#8B5CF6",
              bg: "rgba(139,92,246,0.12)",
              title: "Academic Writing & Scholarly Publishing",
              desc: "From structuring arguments and writing literature reviews to manuscript preparation, journal submission, and navigating peer review processes.",
              tags: ["Journal Articles", "Literature Review", "Peer Review"],
              icon: (
                <>
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </>
              ),
            },
            {
              num: "05",
              color: "#4A7FD4",
              bg: "rgba(74,127,212,0.12)",
              title: "R Programming for Data Analysis",
              desc: "Practical introduction to R for researchers — data wrangling, visualisation, statistical modelling, and reproducible research workflows using RMarkdown.",
              tags: ["R Studio", "ggplot2", "RMarkdown"],
              icon: (
                <>
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <path d="M8 21h8M12 17v4" />
                </>
              ),
            },
            {
              num: "06",
              color: "#1A9E6A",
              bg: "rgba(26,158,106,0.12)",
              title: "Power BI for Research Data Visualisation",
              desc: "Creating interactive dashboards and data stories from research datasets. Covers data modelling, DAX fundamentals, and publishing reports for institutional use.",
              tags: ["Dashboards", "DAX", "Data Stories"],
              icon: (
                <>
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M3 9h18M9 21V9" />
                </>
              ),
            },
            {
              num: "07",
              color: "#C8770A",
              bg: "rgba(200,119,10,0.12)",
              title: "Systematic Literature Review Methods",
              desc: "Step-by-step guidance on conducting rigorous systematic reviews — protocol development, database searching, PRISMA reporting, and evidence synthesis.",
              tags: ["PRISMA", "Evidence Synthesis"],
              icon: (
                <>
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </>
              ),
            },
            {
              num: "08",
              color: "#8B5CF6",
              bg: "rgba(139,92,246,0.12)",
              title: "Meta-Analysis & Evidence Synthesis",
              desc: "Statistical techniques for combining results across studies, calculating effect sizes, assessing heterogeneity, and interpreting pooled evidence for policy and practice.",
              tags: ["Effect Sizes", "Forest Plots"],
              icon: (
                <path d="M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z" />
              ),
            },
            {
              num: "09",
              color: "#4A7FD4",
              bg: "rgba(74,127,212,0.12)",
              title: "Research Ethics & Responsible Scholarship",
              desc: "Navigating ethical approval processes, informed consent, data protection, research integrity, and responsible conduct of research across disciplines.",
              tags: ["IRB/Ethics", "Data Protection", "Integrity"],
              icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
            },
            {
              num: "10",
              color: "#1A9E6A",
              bg: "rgba(26,158,106,0.12)",
              title: "Artificial Intelligence Tools for Research",
              desc: "Practical use of AI tools — ChatGPT, Perplexity, Elicit, Semantic Scholar — for literature discovery, writing assistance, data analysis, and research productivity.",
              tags: ["AI Literacy", "Prompt Design", "Elicit"],
              icon: (
                <>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </>
              ),
            },
            {
              num: "11",
              color: "#C8770A",
              bg: "rgba(200,119,10,0.12)",
              title: "Grant Writing & Research Funding",
              desc: "Crafting compelling grant proposals, identifying funding opportunities, understanding donor requirements, and developing competitive research budgets and narratives.",
              tags: ["Proposal Writing", "Donor Research"],
              icon: (
                <>
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </>
              ),
            },
            {
              num: "12",
              color: "#8B5CF6",
              bg: "rgba(139,92,246,0.12)",
              title: "Proposal Development & Thesis Writing",
              desc: "Structured guidance for developing research proposals, dissertations, and theses — from formulating research questions to defending findings before academic committees.",
              tags: ["Dissertation", "Research Design"],
              icon: (
                <>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </>
              ),
            },
            {
              num: "13",
              color: "#4A7FD4",
              bg: "rgba(74,127,212,0.12)",
              title: "Qualitative Data Analysis (NVivo / Atlas.ti)",
              desc: "Hands-on training in computer-assisted qualitative data analysis using NVivo and Atlas.ti — coding, querying, and visualising qualitative datasets for publication.",
              tags: ["NVivo", "Atlas.ti", "Coding"],
              icon: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />,
            },
            {
              num: "14",
              color: "#4A7FD4",
              bg: "rgba(74,127,212,0.12)",
              title: "Training & Consultancy",
              desc: "Hands-on training in computer-assisted qualitative data analysis using NVivo and Atlas.ti — coding, querying, and visualising qualitative datasets for publication.",
              tags: ["NVivo", "Atlas.ti", "Coding"],
              icon: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />,
            },
          ].map((card) => (
            <div
              key={card.num}
              className="group relative overflow-hidden cursor-default rounded-xs border border-[#0474C4]/25 bg-white/90 py-[2.2rem] px-8 transition-[background-color,border-color] duration-300"
            >
              <div className="flex flex-col gap-4 mb-4">
                <div className="font-heading text-[3rem] tracking-[-0.02em] leading-[1.1] font-bold text-[#0474C4]/50">
                  {card.num}
                </div>

                <div className="font-heading text-[1.125rem] tracking-[-0.005em] leading-[1.3] font-medium text-[#071639]">
                  {card.title}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <p className="font-body text-[0.9375rem] tracking-[0em] leading-[1.7] font-normal text-slate-600">
                  {card.desc}
                </p>

                <div className="flex flex-wrap gap-2">
                  {card.tags.map((tag) => (
                    <span
                      key={tag}
                      className="font-body text-[0.6875rem] tracking-[0.05em] font-medium text-[#0474C4] py-1 px-3 rounded-full bg-[#0474C4]/10 transition-all duration-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>



      <section className="py-28 w-full px-20 text-center bg-[#181C2C] relative overflow-hidden">
        <div className="relative max-w-140 mx-auto">
          <div className=" flex flex-col gap-5 mb-12">
            <p className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#0474C4]">
              Start Learning
            </p>

            <h2 className="font-heading text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-white">
              Ready to Strengthen Your Research Capacity?
            </h2>

            <p className="font-body text-[1.125rem] tracking-[-0.01em] leading-[1.65] font-light text-slate-300 max-w-lg mx-auto">
              Join scholars and professionals from 120+ countries advancing
              their research skills with ARPS Institute — fully online, at your
              own pace.
            </p>
          </div>

          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/programs"
              className="font-body text-[0.875rem] tracking-[0.02em] font-medium bg-[#0474C4] text-[#EBF3FC] border-[#0474C4] py-3.5 px-5 h-12 rounded-[32px] min-w-40  transition-colors duration-200 hover:bg-[#06457F] hover:border-[#06457F]"
            >
              Browse Programs{" "}
            </Link>

            <Link
              href="/contact"
              className="font-body text-[0.875rem] tracking-[0.02em] font-medium bg-transparent text-[#EBF3FC] border border-[#EBF3FC] py-3.5 px-5 h-12 rounded-[32px] min-w-40  transition-colors duration-200 hover:bg-[#06457F] hover:border-[#06457F]"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

    </>
  );
};

export default withLayout(ResearchPage);
