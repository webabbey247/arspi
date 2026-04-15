import type { Metadata } from "next";
import withLayout from "@/hooks/useLayout";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Software Solutions" };


const SolutionsPage = () => {
  return (
    <>
<section className="bg-[#071639] px-8 md:px-16 lg:px-20 pt-16 md:pt-24 pb-12 md:pb-20 relative overflow-hidden w-full">
        <div className="absolute inset-0 bg-grid-ink pointer-events-none" />
        <div className="absolute -top-24 right-0 w-125 h-125 rounded-full bg-[#0474C4]/8 blur-[100px] pointer-events-none" />

  <div className="relative z-2 max-w-175 flex flex-col w-full gap-12">
     <div className="flex flex-col gap-6">
<p className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-blue-300 flex items-center gap-3 before:content-[''] before:block before:w-8 before:h-px before:bg-blue-300 before:shrink-0">
      Our Software Solutions
    </p>
      <h1 className="font-heading text-[2.25rem] md:text-[3rem] tracking-[-0.015em] md:tracking-[-0.02em] leading-[1.2] md:leading-[1.1] font-bold text-white">
      Digital Tools Built for<br/><em className="italic text-[#0474C4]">Research &amp; Learning</em>
    </h1>
      <p className="font-body text-[1.125rem] tracking-[-0.01em] leading-[1.65] font-light text-[#EBF3FC] max-w-lg">
      ARPS Institute develops and commercialises specialised software platforms designed to support researchers, institutions, and learning professionals with smarter digital tools — purpose-built for the modern knowledge environment.
    </p>
     </div>
      
    <div className="flex gap-3.5 flex-wrap">
      <a href="#resolverite" className="flex items-center gap-2.5 border border-[rgba(200,169,110,0.2)] rounded-[40px] px-5 py-2.5 no-underline transition-all duration-250 bg-[rgba(247,243,237,0.04)] hover:border-[#C8A96E] hover:bg-[rgba(200,169,110,0.08)]">
        <span className="w-2 h-2 rounded-full shrink-0 bg-[#2563EB]" />
        <div>
          <span className="font-heading text-[0.95rem] text-[#EBF3FC] font-normal">ResolveRite</span>
          <div className="text-[0.68rem] text-[#EBF3FC] tracking-[0.08em] uppercase">Dispute &amp; Case Management</div>
        </div>
      </a>
      <a href="#mentortrack" className="flex items-center gap-2.5 border border-[rgba(200,169,110,0.2)] rounded-[40px] px-5 py-2.5 no-underline transition-all duration-250 bg-[rgba(247,243,237,0.04)] hover:border-[#C8A96E] hover:bg-[rgba(200,169,110,0.08)]">
        <span className="w-2 h-2 rounded-full shrink-0 bg-[#0D9488]" />
        <div>
          <span className="font-heading text-[0.95rem] text-[#EBF3FC] font-normal">MentorTrack</span>
          <div className="text-[0.68rem] text-[#EBF3FC] tracking-[0.08em] uppercase">Mentorship &amp; Learning Platform</div>
        </div>
      </a>
    </div>
  </div>
</section>

<section className="py-16 md:py-28 px-8 md:px-16 lg:px-20 bg-[#F9F9FB] grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-12 lg:gap-24 items-center">
  <div>
    <div className="flex items-center gap-3.5 mb-7">
      <div className="w-13 h-13 rounded-xl bg-[#EFF6FF] flex items-center justify-center shrink-0">
        <svg className="w-6.5 h-6.5" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <path d="M9 12l2 2 4-4"/>
        </svg>
      </div>
      <div>
        <div className="font-heading text-[1.375rem] tracking-[-0.005em] leading-[1.3] font-medium text-[#2563EB]">
          ResolveRite
        </div>
        <span className="font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium mt-0.5 block text-[#94A3B8]">
          Dispute &amp; Case Management Software
        </span>
      </div>
    </div>

    <p className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#2563EB] mb-4">
      About the Platform
    </p>

    <h2 className="font-heading text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-[#071639] mb-5">
      Smarter Dispute Resolution, End to End
    </h2>

    <p className="font-body text-[1rem] tracking-[-0.005em] leading-[1.7] font-normal text-[#64748B]">
      ResolveRite is a purpose-built case and dispute management platform
      designed for academic institutions, NGOs, HR departments, and governance
      bodies. It streamlines the entire resolution lifecycle — from intake and
      assignment to investigation, outcome tracking, and reporting — in one
      secure, auditable system.
      <br /><br />
      Whether managing student grievances, staff complaints, institutional
      disputes, or policy violations, ResolveRite replaces fragmented
      spreadsheets and email chains with a structured, transparent, and
      accountable workflow.
    </p>

        <div className="flex gap-3.5 flex-wrap mt-10">
  <Button className="rounded-[32px] font-body h-full text-[0.8125rem] tracking-[0.07em] uppercase font-medium py-3.25 px-7 cursor-pointer transition-all duration-250 no-underline inline-block bg-[#2563EB] text-white hover:bg-[#1D4ED8]">
       Request a Demo
      </Button>
      <Link href="/solutions/resolverite" className="font-body text-[0.8125rem] tracking-[0.07em] uppercase font-medium py-3.25 px-7 rounded-[32px] cursor-pointer transition-all duration-250 no-underline inline-block bg-transparent border border-[#2563EB] text-[#2563EB] hover:bg-[#F0FDFA]">
        Learn More
      </Link>
    </div>

     
      
  </div>

  {/* App mockup */}
  <div className="bg-[#071639] rounded-xl overflow-hidden border border-[rgba(200,169,110,0.12)] shadow-[0_24px_60px_rgba(6,13,20,0.3)]">
    <div className="px-3.5 py-2.5 flex items-center gap-2 border-b border-[rgba(247,243,237,0.06)]">
      <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
      <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
      <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
      <div className="flex-1 bg-[rgba(247,243,237,0.06)] rounded h-5 mx-2 flex items-center px-2 font-body text-[0.6875rem] tracking-[0em] font-normal text-[rgba(247,243,237,0.3)]">
        app.resolverite.com/dashboard
      </div>
    </div>

    <div className="p-6">
      <div className="font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium text-[rgba(247,243,237,0.3)] mb-2.5">
        Case Overview
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { value: "24", label: "Active Cases", color: "#F7F3ED"  },
          { value: "18", label: "Resolved",     color: "#86EFAC"  },
          { value: "6",  label: "Overdue",      color: "#FCA5A5"  },
        ].map(({ value, label, color }) => (
          <div key={label} className="bg-[rgba(247,243,237,0.05)] rounded-lg p-3 flex flex-col gap-1">
            <span className="font-heading text-[1.375rem] tracking-[-0.005em] leading-[1.1] font-semibold" style={{ color }}>
              {value}
            </span>
            <span className="font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium text-[rgba(247,243,237,0.4)]">
              {label}
            </span>
          </div>
        ))}
      </div>

      <div className="font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium text-[rgba(247,243,237,0.3)] mb-2">
        Recent Cases
      </div>

      <div className="flex flex-col gap-2">
        {[
          { dot: "#FCA5A5", text: "Student grievance — Dept. of Education",  status: "Open",      statusBg: "rgba(252,165,165,0.1)", statusColor: "#FCA5A5" },
          { dot: "#86EFAC", text: "HR complaint — Policy violation review",   status: "Resolved",  statusBg: "rgba(134,239,172,0.1)", statusColor: "#86EFAC" },
          { dot: "#93C5FD", text: "Academic integrity — Investigation phase", status: "In Review", statusBg: "rgba(147,197,253,0.1)", statusColor: "#93C5FD" },
          { dot: "#FEBC2E", text: "Staff misconduct — Awaiting response",     status: "Pending",   statusBg: "rgba(254,188,46,0.1)",  statusColor: "#FEBC2E" },
        ].map(({ dot, text, status, statusBg, statusColor }) => (
          <div key={text} className="flex items-center gap-2 bg-[rgba(247,243,237,0.03)] rounded px-3 py-2">
            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: dot }} />
            <div className="flex-1 font-body text-[0.75rem] tracking-[0em] font-normal text-[rgba(247,243,237,0.7)]">
              {text}
            </div>
            <div
              className="font-body text-[0.6875rem] tracking-[0.05em] uppercase font-medium px-2 py-0.5 rounded"
              style={{ background: statusBg, color: statusColor }}
            >
              {status}
            </div>
          </div>
        ))}
      </div>

    </div>
  </div>
</section>


<section className="py-16 md:py-28 px-8 md:px-16 lg:px-20 bg-[#F7F3ED] grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-12 lg:gap-24 items-center">

  {/* App mockup */}
  <div className="bg-[#071639] rounded-xl overflow-hidden border border-[rgba(200,169,110,0.12)] shadow-[0_24px_60px_rgba(6,13,20,0.3)]">

    {/* Browser chrome */}
    <div className="px-3.5 py-2.5 flex items-center gap-2 border-b border-[rgba(247,243,237,0.06)]">
      <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
      <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
      <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
      {/* URL — DM Sans, 11px, 0em */}
      <div className="flex-1 bg-[rgba(247,243,237,0.06)] rounded h-5 mx-2 flex items-center px-2 font-body text-[0.6875rem] tracking-[0em] font-normal text-[rgba(247,243,237,0.3)]">
        app.mentortrack.io/my-journey
      </div>
    </div>

    <div className="p-6">
      <div className="flex items-center gap-2.5 mb-3 pb-3 border-b border-[rgba(247,243,237,0.06)]">
        <div className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center font-body text-[0.6875rem] font-medium text-[#0D9488] bg-[rgba(13,148,136,0.15)]">
          DR
        </div>
        <div>
          <div className="font-body text-[0.8125rem] tracking-[0em] leading-normal font-medium text-[#F7F3ED]">
            Dr. Amara Diallo
          </div>
          <div className="font-body text-[0.6875rem] tracking-[0em] leading-normal font-normal text-[rgba(247,243,237,0.35)]">
            Research Fellow — Cohort 2026
          </div>
        </div>
      </div>

      {/* Progress bars */}
      {[
        { label: "Programme Progress",    value: "68%", width: "68%" },
        { label: "Milestones Completed",  value: "8 / 12", width: "66%" },
      ].map(({ label, value, width }) => (
        <div key={label} className="mb-3">
          <div className="flex justify-between mb-1.5">
            <span className="font-body text-[0.6875rem] tracking-[0em] font-normal text-[rgba(247,243,237,0.4)]">
              {label}
            </span>
            <span className="font-body text-[0.6875rem] tracking-[0em] font-medium text-[#0D9488]">
              {value}
            </span>
          </div>
          <div className="h-1.25 bg-[rgba(247,243,237,0.08)] rounded-[3px]">
            <div className="h-full rounded-[3px] bg-[#0D9488]" style={{ width }} />
          </div>
        </div>
      ))}

      <div className="font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium text-[rgba(247,243,237,0.3)] mb-2">
        Upcoming Sessions
      </div>

      <div className="flex flex-col gap-1.5">
        {[
          {
            text: "1-on-1 with Dr. Sarah Mensah",
            time: "Tomorrow, 10am",
            icon: <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
          },
          {
            text: "Group cohort debrief — Cohort 2026",
            time: "Fri, 2pm",
            icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
          },
          {
            text: "Submit milestone 9 — Chapter draft",
            time: "Due Mon",
            icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>,
          },
        ].map(({ text, time, icon }) => (
          <div key={text} className="flex items-center gap-2.5 bg-[rgba(247,243,237,0.03)] border border-[rgba(247,243,237,0.06)] rounded px-3 py-2.5">
            <div className="w-7 h-7 rounded-[6px] flex items-center justify-center shrink-0 bg-[rgba(13,148,136,0.15)]">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="#0D9488" strokeWidth="1.8" strokeLinecap="round">
                {icon}
              </svg>
            </div>
            <div className="font-body text-[0.75rem] tracking-[0em] font-normal text-[rgba(247,243,237,0.55)]">
              {text}
            </div>
            <div className="font-body text-[0.6875rem] tracking-[0em] font-normal text-[rgba(247,243,237,0.28)] ml-auto">
              {time}
            </div>
          </div>
        ))}
      </div>

    </div>
  </div>

  {/* Right column */}
  <div>
    <div className="flex items-center gap-3.5 mb-7">
      <div className="w-13 h-13 rounded-xl bg-[#F0FDFA] flex items-center justify-center shrink-0">
        <svg className="w-6.5 h-6.5" viewBox="0 0 24 24" fill="none" stroke="#0D9488" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      </div>
      <div>
        <div className="font-heading text-[1.375rem] tracking-[-0.005em] leading-[1.3] font-medium text-[#0D9488]">
          MentorTrack
        </div>
        <span className="font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium mt-0.5 block text-[#94A3B8]">
          Mentorship &amp; Learning Management Platform
        </span>
      </div>
    </div>

    <p className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#0D9488] mb-4">
      About the Platform
    </p>

    <h2 className="font-heading text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-[#071639] mb-5">
      Structured Mentorship, Measurable Growth
    </h2>

    <p className="font-body text-[1rem] tracking-[-0.005em] leading-[1.7] font-normal text-[#64748B]">
      MentorTrack is a comprehensive mentorship and learning management
      platform designed to connect mentors and mentees, structure learning
      journeys, track progress against milestones, and measure the impact
      of mentorship programmes at scale.
      <br /><br />
      Built for academic institutions, research organisations, and
      professional development programmes, MentorTrack replaces ad-hoc
      mentorship with a structured, data-driven system that keeps both
      mentors and mentees engaged, accountable, and on track.
    </p>

    <div className="flex gap-3.5 flex-wrap mt-10">
      <Button className="font-body h-full text-[0.8125rem] tracking-[0.07em] uppercase font-medium py-3.25 px-7 rounded-[32px] cursor-pointer transition-all duration-250 no-underline inline-block bg-[#0D9488] text-white hover:bg-[#0F766E]">
        Request a Demo
      </Button>
      <Link href="/solutions/mentortrack" className="font-body text-[0.8125rem] tracking-[0.07em] uppercase font-medium py-3.25 px-7 rounded-[32px] cursor-pointer transition-all duration-250 no-underline inline-block bg-transparent border border-[rgba(13,148,136,0.35)] text-[#0D9488] hover:bg-[#F0FDFA]">
        Learn More
      </Link>
    </div>
  </div>

</section>

    </>
  );
};

export default withLayout(SolutionsPage);
