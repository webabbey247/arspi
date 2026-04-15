"use client";

import * as React from "react";
import { programCategories } from "@/lib/data";
import withLayout from "@/hooks/useLayout";
import Image from "next/image";
import Link from "next/link";

const allCats = [
  { id: "all", label: "All Programs" },
  ...programCategories.map((c) => ({ id: c.id, label: c.label.split(" ")[0] })),
];

const ProgramsPage = () => {
  const [active, setActive] = React.useState("all");

  const visible =
    active === "all"
      ? programCategories
      : programCategories.filter((c) => c.id === active);

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
              { value: "40+", label: "Certificate Programs" },
              { value: "1–4", label: "Months Duration" },
              { value: "100%", label: "Online & Flexible" },
              { value: "120+", label: "Countries Served" },
            ].map((s) => (
              <div key={s.label}>
                <span className="block font-heading text-[1.75rem] tracking-[-0.01em] leading-[1.1] font-semibold text-sky text-[#EBF3FC]">
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

      <section className="bg-[#06457F] py-12 px-8 md:px-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-b border-[#C8A96E]/10">
        <div className="py-[1.8rem] px-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-[8px] bg-[#C8A96E]/8 border border-[#C8A96E]/15 flex items-center justify-center shrink-0">
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 fill-none stroke-[#F7F3ED]"
              strokeWidth="1.6"
              strokeLinecap="round"
            >
              <rect x="2" y="3" width="20" height="14" rx="2"></rect>
              <path d="M8 21h8M12 17v4"></path>
            </svg>
          </div>
          <div>
            <div className="font-heading text-[0.9rem] font-normal text-[#F7F3ED] mb-0.75">
              Live Virtual Sessions
            </div>
            <div className="text-[0.78rem] text-[#F7F3ED]/35 font-light leading-normal">
              Real-time instruction with cohort interaction via Zoom
            </div>
          </div>
        </div>
        <div className="py-[1.8rem] px-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-[8px] bg-[#C8A96E]/8 border border-[#C8A96E]/15 flex items-center justify-center shrink-0">
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 fill-none stroke-[#F7F3ED]"
              strokeWidth="1.6"
              strokeLinecap="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <div>
            <div className="font-heading text-[0.9rem] font-normal text-[#F7F3ED] mb-0.75">
              Self-Paced Access
            </div>
            <div className="text-[0.78rem] text-[#F7F3ED]/35 font-light leading-normal">
              Recorded lectures available 24/7 for flexible learning
            </div>
          </div>
        </div>
        <div className="py-[1.8rem] px-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-[8px] bg-[#C8A96E]/8 border border-[#C8A96E]/15 flex items-center justify-center shrink-0">
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 fill-none stroke-[#F7F3ED]"
              strokeWidth="1.6"
              strokeLinecap="round"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          </div>
          <div>
            <div className="font-heading text-[0.9rem] font-normal text-[#F7F3ED] mb-0.75">
              Verified Certificate
            </div>
            <div className="text-[0.78rem] text-[#F7F3ED]/35 font-light leading-normal">
              Digitally signed certificate with QR verification
            </div>
          </div>
        </div>
        <div className="py-[1.8rem] px-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-[8px] bg-[#C8A96E]/8 border border-[#C8A96E]/15 flex items-center justify-center shrink-0">
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 fill-none stroke-[#F7F3ED]"
              strokeWidth="1.6"
              strokeLinecap="round"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div>
            <div className="font-heading text-[0.9rem] font-normal text-[#F7F3ED] mb-0.75">
              Expert Facilitators
            </div>
            <div className="text-[0.78rem] text-[#F7F3ED]/35 font-light leading-normal">
              Led by practising researchers and academic professionals
            </div>
          </div>
        </div>
      </section>

      {/* Filter bar */}
      <section className="bg-white px-8 md:px-16 py-16 w-full">
        <div className="max-w-350 mx-auto flex flex-col gap-12">
          <div className="bg-white/97 sticky top-17 z-30 backdrop-blur  py-3 flex items-center gap-2.5 overflow-x-auto w-full">
            <span className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#637AA3] mr-2 shrink-0">
              Filter:
            </span>
            {allCats.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActive(cat.id)}
                className={`font-body text-[0.75rem] tracking-[0.05em] leading-normal font-medium px-4 py-1.5 rounded-full border transition-all whitespace-nowrap shrink-0 ${
                  active === cat.id
                    ? "bg-[#0474C4] text-[#EBF3FC] border-[#0474C4]"
                    : "bg-sky-pale text-slate-500 border-[#0474C4]/25 hover:border-[#0474C4] hover:text-ink"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {visible.map((cat) => (
            <div
              key={cat.id}
              id={cat.id}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {cat.programs.map((prog) => (
                <Link
                  href={`/programs/${prog.slug}`}
                  key={prog.slug}
                  className="group bg-white rounded-sm overflow-hidden border border-[#0474C4]/15 transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(13,27,42,0.1)]"
                >
                  <div className="relative aspect-16/10 overflow-hidden">
                    <Image
                      src="/images/dummy/course-1.jpg"
                      alt="Data Analysis"
                      fill
                      className="object-cover transition-transform duration-400 group-hover:scale-[1.04]"
                    />
                    <span className="absolute top-3 left-3 bg-[#C8A96E] text-[#0D1B2A] text-[0.65rem] font-medium tracking-widest uppercase px-2.5 py-1 rounded-sm">
                      Bestseller
                    </span>
                    <span className="absolute bottom-3 right-3 bg-[#071639] text-[#F7F3ED] font-body text-[0.78rem] font-medium tracking-[0.06em] px-3.5 py-1.5 rounded-sm">
                      $99 / mo
                    </span>
                  </div>
                  <div className="px-6 pt-[1.4rem] pb-[1.6rem]">
                    <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-[#0474C4] text-white font-body text-[0.8125rem] font-medium flex items-center justify-center shrink-0">
                    DR
                  </div>
                  <span className="font-body text-[0.8125rem] tracking-[0em] font-normal text-slate-600">
                    Dr. Rachel Osei
                  </span>
                      {/* <div className="w-6.5 h-6.5 rounded-full bg-[#0474C4] text-white text-[0.6rem] font-medium flex items-center justify-center tracking-[0.04em] shrink-0">
                        DR
                      </div>
                      <span className="text-[0.8rem] text-[#637AA3] font-normal">
                        Dr. Rachel Osei
                      </span> */}
                    </div>
                    <h3 className="font-heading text-[1.08rem] font-normal text-[#071639] leading-[1.35] mb-4">
                      Advanced Data Analysis &amp; Research Methods
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
                        12 hours
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
                        Intermediate
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

export default withLayout(ProgramsPage);
