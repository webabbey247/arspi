import type { Metadata } from "next";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import withLayout from "@/hooks/useLayout";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ResolveRite — Dispute & Case Management",
};

const ResolveRitePage = () => {
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
      <div className="w-14 h-14 rounded-[14px] bg-blue-600/15 border border-blue-600/30 flex items-center justify-center shrink-0">
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="#93C5FD" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <path d="M9 12l2 2 4-4"/>
        </svg>
      </div>
      <div>
        <div className="font-heading text-[1.75rem] tracking-[-0.01em] leading-[1.1] font-semibold text-blue-300">
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
      <Button className="font-body text-[0.8125rem] h-full rounded-[32px] min-w-40 tracking-[0.07em] uppercase font-medium bg-[#2563EB] text-white border-0 py-3.5 px-8 cursor-pointer transition-all duration-250 no-underline inline-block hover:bg-[#1D4ED8]">
        Request a Demo
      </Button>
      <Link href="#faqs" className="font-body text-[0.8125rem] h-full rounded-[32px] min-w-40 text-center tracking-[0.07em] uppercase font-medium bg-transparent text-[#0474C4] border border-[#0474C4] py-3.25 px-7 cursor-pointer transition-all duration-250 no-underline inline-block hover:border-[rgba(247,243,237,0.5)] hover:text-[#F7F3ED]">
        View FAQs
      </Link>
    </div>

    {/* Stats */}
    <div className="flex gap-10 pt-10 border-t border-blue-600/20 flex-wrap mt-10">
      {[
        { value: "100%",  label: "Audit Trail"      },
        { value: "5-step", label: "Resolution Flow" },
        { value: "GDPR",  label: "Compliant"        },
      ].map(({ value, label }) => (
        <div key={label}>
          <span className="font-heading text-[1.75rem] tracking-[-0.01em] leading-[1.1] font-semibold text-blue-300 block mb-1">
            {value}
          </span>
          <span className="font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium text-[rgba(247,243,237,0.35)]">
            {label}
          </span>
        </div>
      ))}
    </div>
  </div>

  {/* App mockup */}
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
            { value: "24", label: "Active",   color: "#93C5FD" },
            { value: "18", label: "Resolved", color: "#86EFAC" },
            { value: "6",  label: "Overdue",  color: "#FCA5A5" },
          ].map(({ value, label, color }) => (
            <div key={label} className="bg-[rgba(247,243,237,0.04)] border border-blue-600/15 rounded-[6px] py-2.5 px-3">
              <span className="font-heading text-[1.375rem] tracking-[-0.005em] leading-[1.1] font-semibold block" style={{ color }}>
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
            { dot: "#FCA5A5", text: "Student grievance — Dept. of Education",  status: "Open",      bg: "rgba(252,165,165,.1)", color: "#FCA5A5" },
            { dot: "#86EFAC", text: "HR complaint — Policy violation",          status: "Resolved",  bg: "rgba(134,239,172,.1)", color: "#86EFAC" },
            { dot: "#93C5FD", text: "Academic integrity — Investigation",        status: "In Review", bg: "rgba(147,197,253,.1)", color: "#93C5FD" },
            { dot: "#FEBC2E", text: "Staff misconduct — Awaiting response",     status: "Pending",   bg: "rgba(254,188,46,.1)",  color: "#FEBC2E" },
          ].map(({ dot, text, status, bg, color }) => (
            <div key={text} className="bg-[rgba(247,243,237,0.03)] border border-[rgba(247,243,237,0.06)] rounded-lg py-2.25 px-3 flex items-center gap-2.5">
              <div className="w-1.75 h-1.75 rounded-full shrink-0" style={{ background: dot }} />
              <div className="font-body text-[0.75rem] tracking-[0em] font-normal text-[rgba(247,243,237,0.55)] flex-1">
                {text}
              </div>
              <div className="font-body text-[0.6875rem] tracking-[0.05em] uppercase font-medium py-0.5 px-2 rounded-[10px]" style={{ background: bg, color }}>
                {status}
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
    <p className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#2563EB] mb-4">
      What is ResolveRite
    </p>

    <h2 className="font-heading text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-(--navy) mb-5">
      Replace Spreadsheets &amp; Email Chains with a Structured System
    </h2>

    <p className="font-body text-[1rem] tracking-[-0.005em] leading-[1.7] font-normal text-(--slate)">
      ResolveRite is a purpose-built case and dispute management platform
      that streamlines the entire resolution lifecycle — from intake and
      assignment through investigation, outcome tracking, and institutional
      reporting.
      <br /><br />
      Whether managing student grievances, staff complaints, research
      integrity cases, or policy violations, ResolveRite gives every party
      visibility, accountability, and a clear process from submission to
      closure.
    </p>

    <div className="mt-8 flex gap-3.5 flex-wrap">
      <a href="#" className="font-body text-[0.8125rem] tracking-[0.07em] uppercase font-medium bg-(--rr) text-white border-0 py-3.5 px-8 cursor-pointer rounded-xs transition-all duration-250 no-underline inline-block hover:bg-(--rr-dark)">
        Start Free Trial
      </a>
    </div>
  </div>

  <div>
  {/* Label — DM Sans, 12px, +0.07em, font-medium, uppercase */}
  <p className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium mb-4 text-[#2563EB]">
    Who Uses ResolveRite
  </p>

  {/* H2 — Playfair Display, 28px, -0.01em, lh 1.25 */}
  <h2 className="font-heading text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-(--navy) mb-5">
    Built for Institutions Handling Sensitive Cases
  </h2>

  {/* Body — DM Sans, 16px, -0.005em, lh 1.7 */}
  <p className="font-body text-[1rem] tracking-[-0.005em] leading-[1.7] font-normal text-(--slate)">
    ResolveRite is ideal for any organisation that manages structured
    complaint, grievance, or dispute workflows at scale.
  </p>

  <div className="mt-6 flex flex-col gap-px bg-blue-600/10 border border-blue-600/10">
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
        className="bg-(--warm-white) py-[1.1rem] px-[1.4rem] flex items-center gap-3 transition-colors duration-200 hover:bg-(--rr-light)"
      >
        <span className="w-1.75 h-1.75 rounded-full bg-(--rr) shrink-0" />
        {/* Small — DM Sans, 14px, 0em, lh 1.6 */}
        <span className="font-body text-[0.875rem] tracking-[0em] leading-[1.6] font-normal text-(--navy)">
          {item}
        </span>
      </div>
    ))}
  </div>
</div>
</section>


{/* ============ FEATURES SECTION ============ */}
<section className="py-28 px-20 bg-white">

  <p className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium mb-4 text-(--rr)">
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
        icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>,
      },
      {
        title: "Role-Based Assignment",
        desc: "Assign cases to investigators and reviewers with configurable permissions. Automatic notifications fire at every stage transition.",
        icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
      },
      {
        title: "SLA & Deadline Tracking",
        desc: "Built-in SLA monitoring flags overdue cases, sends automated reminders, and escalates to supervisors when response times are breached.",
        icon: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
      },
      {
        title: "Immutable Audit Trail",
        desc: "Every action, note, and status change is timestamped and logged — ensuring accountability, legal defensibility, and regulatory compliance.",
        icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>,
      },
      {
        title: "Analytics & Reporting",
        desc: "Real-time dashboards surface trends by case type, resolution time, and outcome — enabling data-driven governance reporting.",
        icon: <><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></>,
      },
      {
        title: "Secure Communication Portal",
        desc: "Encrypted in-platform messaging keeps all case communication confidential with document attachments and read receipts.",
        icon: <><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></>,
      },
    ].map(({ title, desc, icon }) => (
      <div
        key={title}
        className="bg-(--warm-white) border border-border rounded-xs p-8 transition-[border-color,transform] duration-250 hover:border-blue-600/40 hover:-translate-y-0.75"
      >
        <div className="w-11 h-11 rounded-[10px] bg-(--rr-light) flex items-center justify-center mb-5">
          <svg className="w-5.5 h-5.5 stroke-(--rr) fill-none stroke-[1.6] [stroke-linecap:round] [stroke-linejoin:round]" viewBox="0 0 24 24">
            {icon}
          </svg>
        </div>

        <div className="font-heading text-[1.125rem] tracking-[-0.005em] leading-[1.3] font-medium text-(--navy) mb-3">
          {title}
        </div>

        <div className="font-body text-[0.9375rem] tracking-[0em] leading-[1.7] font-normal text-(--slate)">
          {desc}
        </div>
      </div>
    ))}
  </div>
</section>

{/* ============ HOW IT WORKS + USE CASES ============ */}
<section className="py-28 px-20 bg-[#0B1625] grid grid-cols-2 gap-24 items-start">

  {/* How It Works */}
  <div>
    <p className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium mb-4 text-blue-300">
      How It Works
    </p>

    <h2 className="font-heading text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-(--cream) mb-8">
      A Clear Path from Complaint to Resolution
    </h2>

    <div className="flex flex-col">
      {[
        { n: 1, title: "Case Submitted",               body: "A complainant submits via the structured intake form. The system auto-categorises and assigns a reference number instantly." },
        { n: 2, title: "Assigned & Acknowledged",       body: "The case is routed to the appropriate officer. All parties receive confirmation and SLA-based timeline expectations." },
        { n: 3, title: "Investigation & Documentation", body: "Investigators log findings, upload evidence, and communicate through the secure portal — all actions timestamped." },
        { n: 4, title: "Decision Recorded",             body: "A formal decision is logged with supporting rationale. Outcomes are communicated to all parties through the platform." },
        { n: 5, title: "Reporting & Improvement",       body: "Aggregated data feeds into dashboards for trend analysis, policy review, and annual governance reporting." },
      ].map(({ n, title, body }) => (
        <div key={n} className="grid grid-cols-[44px_1fr] gap-[1.2rem] py-[1.4rem] border-b border-blue-600/15 items-start first:pt-0">
          <div className="w-11 h-11 rounded-full bg-(--rr) flex items-center justify-center font-heading text-[1rem] tracking-[0em] leading-none font-medium text-white shrink-0">
            {n}
          </div>
          <div>
            <div className="font-heading text-[1rem] tracking-[-0.005em] leading-[1.3] font-medium text-(--cream) mb-1.5">
              {title}
            </div>
            <div className="font-body text-[0.875rem] tracking-[0em] leading-[1.6] font-normal text-slate-400">
              {body}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>

  {/* Use Cases */}
  <div>
    <p className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium mb-4 text-blue-300">
      Use Cases
    </p>

    <h2 className="font-heading text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-(--cream) mb-8">
      Built for Any Structured Resolution Process
    </h2>

    <div className="flex flex-col">
      {[
        { title: "Student Academic Appeals & Grievances", body: "Full lifecycle management for student complaints, appeals, and misconduct cases across faculties and departments." },
        { title: "HR Complaints & Staff Misconduct",      body: "Structured workflows for staff grievances, disciplinary processes, and performance management escalations." },
        { title: "Research Integrity Investigations",     body: "Confidential case handling for plagiarism, data fabrication, and responsible research conduct violations." },
        { title: "Safeguarding & Policy Violations",      body: "Sensitive case management with anonymous reporting, strict access controls, and mandatory escalation rules." },
        { title: "NGO Accountability & Donor Compliance", body: "Complaint and feedback mechanisms that meet international donor accountability and transparency standards." },
      ].map(({ title, body }) => (
        <div key={title} className="py-[1.4rem] border-b border-blue-600/15 first:pt-0">
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

    <div className="sticky top-22">
      <p className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium mb-4 text-(--rr)">
        Support
      </p>

      <h2 className="font-heading text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-(--navy) mb-4">
        ResolveRite FAQs
      </h2>

      <p className="font-body text-[1rem] tracking-[-0.005em] leading-[1.7] font-normal text-(--slate) mb-6">
        Everything you need to know about ResolveRite. Can&apos;t find your
        answer? Talk to our team.
      </p>

      <a
        href="/contact"
        className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-(--rr) no-underline border-b border-blue-600/30 pb-0.5 transition-colors duration-200 hover:text-(--rr-dark)"
      >
        Contact Our Team →
      </a>
    </div>

    <Accordion type="single" collapsible className="flex flex-col">
      {[
        {
          q: "What types of cases can ResolveRite manage?",
          a: "ResolveRite is highly configurable and can manage virtually any structured case type — including student academic appeals and grievances, staff HR complaints and misconduct cases, research integrity investigations, policy violation reports, safeguarding concerns, and institutional governance disputes. Case categories, workflows, and fields are all fully customisable by your administrators.",
        },
        {
          q: "How does ResolveRite protect the confidentiality of sensitive cases?",
          a: "Confidentiality is central to ResolveRite's architecture. Access is strictly role-based. All data is encrypted at rest and in transit. The platform is designed to comply with GDPR, FERPA, and equivalent data protection frameworks, and includes full audit logging for compliance. Anonymous reporting is also fully supported.",
        },
        {
          q: "Can we customise the case workflow and intake forms?",
          a: "Absolutely. ResolveRite's workflow builder allows administrators to design multi-stage resolution processes that match your policies exactly. Intake forms are fully configurable with conditional logic, required fields, and document upload. Different workflows can be created for different case types — each with its own SLAs, escalation paths, and notification rules.",
        },
        {
          q: "Does ResolveRite support anonymous reporting?",
          a: "Yes. ResolveRite includes an anonymous reporting module allowing complainants to submit without revealing their identity. A secure token system allows anonymous reporters to check case status updates. Special privacy controls prevent case handlers from attempting to identify the reporter.",
        },
        {
          q: "Can ResolveRite integrate with our existing HR or student systems?",
          a: "Yes. ResolveRite offers REST APIs and supports common SSO standards including SAML and OAuth. We provide pre-built connectors for popular HRMS and student information systems. Our implementation team handles all integration work during onboarding at no extra charge.",
        },
        {
          q: "Is there a free trial available?",
          a: "Yes — a 14-day fully featured free trial with no credit card required. Trials include access to all core features, sample case data for exploration, and a guided onboarding session with a product specialist. Your configuration is preserved if you convert to a paid licence.",
        },
        {
          q: "Is ResolveRite cloud-based or can it be self-hosted?",
          a: "ResolveRite is available as a cloud-hosted SaaS solution for rapid deployment. For organisations with data sovereignty requirements, self-hosted and private cloud options are available. Contact our team to discuss the right deployment model for your institution.",
        },
        {
          q: "Do you offer discounts for NGOs or academic institutions?",
          a: "Yes. ARPS Institute offers preferential pricing for registered non-profits, publicly funded academic institutions, and development sector organisations in low- and middle-income countries. Contact our team with your organisation details to discuss eligibility and applicable rates.",
        },
      ].map(({ q, a }) => (
        <AccordionItem
          key={q}
          value={q}
          className="border-b border-[rgba(200,169,110,0.2)] first:border-t first:border-t-[rgba(200,169,110,0.2)]"
        >
          {/* Question — Playfair Display, 16px, -0.005em, lh 1.3, font-medium */}
          <AccordionTrigger className="py-[1.4rem] font-heading text-[1rem] tracking-[-0.005em] leading-[1.3] font-medium text-(--navy) hover:no-underline hover:text-(--rr) transition-colors duration-200 [&>svg]:text-(--light-slate)">
            {q}
          </AccordionTrigger>

          {/* Answer — DM Sans, 15px, 0em, lh 1.7, font-normal */}
          <AccordionContent className="pb-[1.4rem] font-body text-[0.9375rem] tracking-[0em] leading-[1.7] font-normal text-(--slate)">
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

    <p className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-blue-300 mb-6">
      Get Started with ResolveRite
    </p>

    <h2 className="font-heading text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-white mb-5">
      Ready to Bring Order to Your Case Management?
    </h2>

    <p className="font-body text-[1.125rem] tracking-[-0.01em] leading-[1.65] font-light text-slate-300 mb-10">
      Book a personalised demo and see exactly how ResolveRite fits your
      institution&apos;s workflow — no commitment required.
    </p>

    <div className="flex gap-4 justify-center flex-wrap">
            <Button
              className="font-body text-[0.875rem] tracking-[0.02em] font-medium bg-[#0474C4] text-[#EBF3FC] capitalize border-[#0474C4] py-3.5 px-5 h-12 rounded-[32px] min-w-40  transition-colors duration-200 hover:bg-[#06457F] hover:border-[#06457F]"
            >
              Request a Demo
            </Button>

            <Link
              href="/contact"
              className="font-body text-[0.875rem] tracking-[0.02em] font-medium bg-transparent text-center text-[#EBF3FC] capitalize border border-[#EBF3FC] py-3.5 px-5 h-12 rounded-[32px] min-w-40  transition-colors duration-200 hover:bg-[#06457F] hover:border-[#06457F]"
            >
              Start free trial
            </Link>
          </div>

  </div>
</section>
    
    </>
  );
};

export default withLayout(ResolveRitePage);
