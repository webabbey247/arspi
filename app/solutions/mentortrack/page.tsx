import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import withLayout from "@/hooks/useLayout";
import { resolveriteFAQs, resolveriteSteps } from "@/lib/data";

export const metadata: Metadata = {
  title: "MentorTrack — Mentorship & Learning Management",
};

const MentorTrackPage = () => {
  return (
    <>
      {/* ============ HERO SECTION ============ */}
      <section className="bg-[#071639] pt-28 px-20 pb-24 relative overflow-hidden grid grid-cols-[1fr_1.1fr] gap-20 items-center">
        <div className="absolute inset-0 bg-grid-ink pointer-events-none" />
        <div className="absolute -top-24 right-0 w-125 h-125 rounded-full bg-[#0474C4]/8 blur-[100px] pointer-events-none" />

        <div className="relative z-2">
          <p className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-blue-300 mb-6 flex items-center gap-3 before:content-[''] before:block before:w-8 before:h-px before:bg-blue-300 before:shrink-0">
            Case &amp; Dispute Management
          </p>

          <div className="flex items-center gap-3.5 mb-[1.8rem]">
            <div className="w-14 h-14 rounded-[14px] bg-[#0D9488]/15 border border-[#0D9488]/30 flex items-center justify-center shrink-0">
              <svg
                className="w-7 h-7"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#0D9488"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <div>
              <div className="font-heading text-[1.75rem] tracking-[-0.01em] leading-[1.1] font-semibold text-[#0D9488]">
                ResolveRite
              </div>
              <span className="font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium text-[rgba(247,243,237,0.35)] mt-1 block">
                by ARPS Institute
              </span>
            </div>
          </div>

          <h1 className="font-heading text-[2.25rem] md:text-[3rem] tracking-[-0.015em] md:tracking-[-0.02em] leading-[1.2] md:leading-[1.1] font-bold text-white mb-5">
            Smarter Dispute Resolution,
            <br />
            <em className="italic text-[#0474C4]">End to End</em>
          </h1>

          <p className="font-body text-[1.125rem] tracking-[-0.01em] leading-[1.65] font-light text-[#EBF3FC] mb-10">
            A purpose-built case and dispute management platform for academic
            institutions, NGOs, HR departments, and governance bodies — turning
            fragmented complaint processes into structured, transparent, and
            auditable workflows.
          </p>

          <div className="flex gap-3.5 flex-wrap">
            <Button className="font-body text-[0.8125rem] h-full rounded-[32px] min-w-40 tracking-[0.07em] uppercase font-medium bg-[#0D9488] text-white border-0 py-3.5 px-8 cursor-pointer transition-all duration-250 no-underline inline-block hover:bg-[#0F766E]">
              Request a Demo
            </Button>
            <Link
              href="#faqs"
              className="font-body text-[0.8125rem] h-full rounded-[32px] min-w-40 text-center tracking-[0.07em] uppercase font-medium bg-transparent text-[#0D9488] border border-[#0D9488] py-3.25 px-7 cursor-pointer transition-all duration-250 no-underline inline-block hover:bg-[#0F766E] hover:text-white hover:border-[#0F766E]"
            >
              View FAQs
            </Link>
          </div>

          {/* Stats */}
          <div className="flex gap-10 pt-10 border-t border-blue-600/20 flex-wrap mt-10">
            {[
              { value: "100%", label: "Audit Trail" },
              { value: "5-step", label: "Resolution Flow" },
              { value: "GDPR", label: "Compliant" },
            ].map(({ value, label }) => (
              <div key={label}>
                <span className="font-heading text-[1.75rem] tracking-[-0.01em] leading-[1.1] font-semibold text-[#0D9488] block mb-1">
                  {value}
                </span>
                <span className="font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium text-[#EBF3FC]">
                  {label}
                </span>
              </div>
            ))}
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
        { label: "Programme Progress",   value: "68%",   width: "68%" },
        { label: "Milestones Completed", value: "8 / 12", width: "66%" },
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
            <div className="h-full bg-[#0D9488] rounded-xs" style={{ width }} />
          </div>
        </div>
      ))}

      <div className="font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium text-[rgba(247,243,237,0.3)] mb-2">
        Upcoming Sessions
      </div>

      <div className="flex flex-col gap-1.5">
        {[
          { dot: "#5EEAD4", text: "1-on-1 with Dr. Sarah Mensah",         time: "Tomorrow 10am", timeBg: "rgba(94,234,212,0.1)",  timeColor: "#5EEAD4" },
          { dot: "#5EEAD4", text: "Group cohort debrief — Cohort 2026",   time: "Fri 2pm",       timeBg: "rgba(94,234,212,0.1)",  timeColor: "#5EEAD4" },
          { dot: "#FEBC2E", text: "Submit milestone 9 — Chapter draft",   time: "Due Mon",       timeBg: "rgba(254,188,46,0.1)",  timeColor: "#FEBC2E" },
        ].map(({ dot, text, time, timeBg, timeColor }) => (
          <div key={text} className="bg-[rgba(247,243,237,0.03)] border border-[rgba(247,243,237,0.06)] rounded-lg py-2.25 px-3 flex items-center gap-2.5">
            <div className="w-1.75 h-1.75 rounded-full shrink-0" style={{ background: dot }} />
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
      </section>

      {/* ============ ABOUT SECTION ============ */}
      <section className="py-28 px-20 bg-[#F9F9FB] grid grid-cols-[1.2fr_1fr] gap-24 items-start">
        <div>
          <p className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#0D9488] mb-4">
            What is MentorTrack
          </p>

          <h2 className="font-heading text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-[#071639] mb-5">
            Replace Ad-Hoc Mentorship with a Structured, Data-Driven System
          </h2>

          <p className="font-body text-[1rem] tracking-[-0.005em] leading-[1.7] font-normal text-slate-600">
            MentorTrack is a purpose-built mentorship management platform that
            streamlines the entire mentorship lifecycle — from intake and
            assignment through session logging, milestone tracking, and
            institutional reporting.
          </p>

          <p className="font-body text-[1rem] tracking-[-0.005em] leading-[1.7] font-normal text-slate-600">
            Whether running a postgraduate research mentorship programme, an
            early-career faculty initiative, or an institutional leadership
            track, MentorTrack gives coordinators full visibility and both
            parties a clear, accountable path to their goals.
          </p>
          <div className="mt-8 flex gap-3.5 flex-wrap">
            <Link
              href="/"
              className="font-body text-[0.8125rem] rounded-[32px] min-w-40 text-center tracking-[0.07em] uppercase font-medium bg-[#0D9488] text-white border-0 py-3.5 px-8 cursor-pointer transition-all duration-250 no-underline inline-block hover:bg-(--rr-dark)"
            >
              Start Free Trial
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <p className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#0D9488]">
              Who Uses MentorTrack
            </p>

            <h2 className="font-heading text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-[#071639]">
              Designed for Organisations Running Structured Mentorship
            </h2>

            <p className="font-body text-[1rem] tracking-[-0.005em] leading-[1.7] font-normal text-slate-600">
              MentorTrack adapts to any structured mentorship context — from
              academic research programmes to corporate learning academies.
            </p>
          </div>

          <div className="flex flex-col gap-px bg-blue-600/10 border border-blue-600/10">
            {[
              "Universities & higher education institutions",
              "HR departments & people operations teams",
              "NGOs & international development organisations",
              "Government agencies & regulatory bodies",
              "Legal compliance & governance offices",
              "School districts & education authorities",
            ].map((item) => (
              <div
                key={item}
                className="bg-white py-[1.1rem] px-[1.4rem] flex items-center gap-3 transition-colors duration-200 hover:bg-[#CCFBF1]"
              >
                <span className="w-1.75 h-1.75 rounded-full bg-[#0D9488] shrink-0" />
                <span className="font-body text-[0.875rem] tracking-[0em] leading-[1.6] font-normal text-[#071639]">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FEATURES SECTION ============ */}
      <section className="py-28 px-20 bg-white">
        <p className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium mb-4 text-[#0D9488]">
          Key Features
        </p>

        <h2 className="font-heading text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-[#071639] mb-14">
          Everything You Need to Manage Cases with Confidence
        </h2>

        <div className="grid grid-cols-3 gap-6">
          {[
            {
              title: "Structured Case Intake",
              desc: "Customisable intake forms auto-categorise cases by type, department, and urgency on submission — no manual triage required.",
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
              title: "Role-Based Assignment",
              desc: "Assign cases to investigators and reviewers with configurable permissions. Automatic notifications fire at every stage transition.",
              icon: (
                <>
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </>
              ),
            },
            {
              title: "SLA & Deadline Tracking",
              desc: "Built-in SLA monitoring flags overdue cases, sends automated reminders, and escalates to supervisors when response times are breached.",
              icon: (
                <>
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </>
              ),
            },
            {
              title: "Immutable Audit Trail",
              desc: "Every action, note, and status change is timestamped and logged — ensuring accountability, legal defensibility, and regulatory compliance.",
              icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
            },
            {
              title: "Analytics & Reporting",
              desc: "Real-time dashboards surface trends by case type, resolution time, and outcome — enabling data-driven governance reporting.",
              icon: (
                <>
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M3 9h18M9 21V9" />
                </>
              ),
            },
            {
              title: "Secure Communication Portal",
              desc: "Encrypted in-platform messaging keeps all case communication confidential with document attachments and read receipts.",
              icon: (
                <>
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <path d="M8 21h8M12 17v4" />
                </>
              ),
            },
          ].map(({ title, desc, icon }) => (
            <div
              key={title}
              className="bg-(--warm-white) border border-border rounded-xs p-8 transition-[border-color,transform] duration-250 hover:border-blue-600/40 hover:-translate-y-0.75"
            >
              <div className="w-11 h-11 rounded-[10px] bg-[#CCFBF1] flex items-center justify-center mb-5">
                <svg
                  className="w-5.5 h-5.5 stroke-[#0D9488] fill-none stroke-[1.6] [stroke-linecap:round] [stroke-linejoin:round]"
                  viewBox="0 0 24 24"
                >
                  {icon}
                </svg>
              </div>

              <div className="font-heading text-[1.125rem] tracking-[-0.005em] leading-[1.3] font-medium text-[#071639] mb-3">
                {title}
              </div>

              <div className="font-body text-[0.9375rem] tracking-[0em] leading-[1.7] font-normal text-slate-600">
                {desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ HOW IT WORKS + USE CASES ============ */}
      <section className="py-28 px-20 bg-[#0B1625] grid grid-cols-2 gap-24 items-start">
        {/* How It Works */}
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <p className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#0D9488]">
              How It Works
            </p>

            <h2 className="font-heading text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-white max-w-lg">
              A Structured Path from Enrolment to Completion
            </h2>
          </div>

          <div className="flex flex-col">
            {resolveriteSteps.map(({ n, title, desc }) => (
              <div
                key={n}
                className="grid grid-cols-[44px_1fr] gap-[1.2rem] py-[1.4rem] border-b border-blue-600/15 items-start first:pt-0"
              >
                <div className="w-11 h-11 rounded-full bg-[#0D9488] flex items-center justify-center font-heading text-[1rem] tracking-[0em] leading-none font-medium text-white shrink-0">
                  {n}
                </div>
                <div>
                  <div className="font-heading text-[1rem] tracking-[-0.005em] leading-[1.3] font-medium text-(--cream) mb-1.5">
                    {title}
                  </div>
                  <div className="font-body text-[0.875rem] tracking-[0em] leading-[1.6] font-normal text-slate-400">
                    {desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Use Cases */}
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <p className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#0D9488]">
              Use Cases
            </p>

            <h2 className="font-heading text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-white max-w-lg">
              Built for Any Structured Resolution Process
            </h2>
          </div>

          <div className="flex flex-col">
            {[
              {
                title: "Student Academic Appeals & Grievances",
                body: "Full lifecycle management for student complaints, appeals, and misconduct cases across faculties and departments.",
              },
              {
                title: "HR Complaints & Staff Misconduct",
                body: "Structured workflows for staff grievances, disciplinary processes, and performance management escalations.",
              },
              {
                title: "Research Integrity Investigations",
                body: "Confidential case handling for plagiarism, data fabrication, and responsible research conduct violations.",
              },
              {
                title: "Safeguarding & Policy Violations",
                body: "Sensitive case management with anonymous reporting, strict access controls, and mandatory escalation rules.",
              },
              {
                title: "NGO Accountability & Donor Compliance",
                body: "Complaint and feedback mechanisms that meet international donor accountability and transparency standards.",
              },
            ].map(({ title, body }) => (
              <div
                key={title}
                className="py-[1.4rem] border-b border-blue-600/15 first:pt-0"
              >
                <div className="font-heading text-[1rem] tracking-[-0.005em] leading-[1.3] font-medium text-(--cream) mb-1.5">
                  {title}
                </div>
                <div className="font-body text-[0.875rem] tracking-[0em] leading-[1.6] font-normal text-slate-400">
                  {body}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FAQ SECTION ============ */}
      <section className="py-28 px-20 bg-white" id="faqs">
        <div className="grid grid-cols-[1fr_2fr] gap-24 items-start">
          <div className="sticky top-22 space-y-6">
            <div className="flex flex-col gap-4">
              <p className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#0D9488]">
                Support
              </p>

              <h2 className="font-heading text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-[#071639]">
                MentorTrack FAQs
              </h2>

              <p className="font-body text-[1rem] tracking-[-0.005em] leading-[1.7] font-normal text-slate-600">
                Everything you need to know about MentorTrack. Can&apos;t find
                your answer? Talk to our team.
              </p>
            </div>

            <a
              href="/contact"
              className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#0D9488] no-underline border-b border-[#0D9488] pb-0.5 transition-colors duration-200 hover:text-[#0F766E]"
            >
              Contact Our Team →
            </a>
          </div>

          <Accordion type="single" collapsible className="flex flex-col">
            {resolveriteFAQs.map(({ q, a }) => (
              <AccordionItem
                key={q}
                value={q}
                className="border-b border-[rgba(200,169,110,0.2)] first:border-t first:border-t-[rgba(200,169,110,0.2)]"
              >
                <AccordionTrigger className="py-[1.4rem] font-heading text-[1rem] tracking-[-0.005em] leading-[1.3] font-medium text-[#071639] hover:no-underline hover:text-[#0D9488] transition-colors duration-200 [&>svg]:text-(--light-slate)">
                  {q}
                </AccordionTrigger>

                <AccordionContent className="pb-[1.4rem] font-body text-[0.9375rem] tracking-[0em] leading-[1.7] font-normal text-slate-600">
                  {a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ============ CTA SECTION ============ */}
      <section className="w-full py-28 px-20 text-center bg-[#181C2C] relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-ink pointer-events-none" />
        <div className="relative max-w-140 mx-auto">
          <p className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#0F766E] mb-6">
            Get Started with MentorTrack
          </p>

          <h2 className="font-heading text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-white mb-5">
           Ready to Transform How Your Institution Mentors?
          </h2>

          <p className="font-body text-[1.125rem] tracking-[-0.01em] leading-[1.65] font-light text-slate-300 mb-10">
          Book a personalised demo and see exactly how MentorTrack fits your programme — no commitment required.
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <Button className="font-body text-[0.875rem] tracking-[0.02em] font-medium bg-[#0D9488] text-[#EBF3FC] capitalize border-[#0D9488] py-3.5 px-5 h-12 rounded-[32px] min-w-40  transition-colors duration-200 hover:bg-[#0F766E] hover:border-[#0F766E]">
              Request a Demo
            </Button>

            <Link
              href="/contact"
              className="font-body text-[0.875rem] tracking-[0.02em] font-medium bg-transparent text-center text-[#EBF3FC] capitalize border border-[#EBF3FC] py-3.5 px-5 h-12 rounded-[32px] min-w-40  transition-colors duration-200 hover:bg-[#0F766E] hover:border-[#0F766E]"
            >
              Start free trial
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default withLayout(MentorTrackPage);
