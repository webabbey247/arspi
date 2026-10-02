import type { Metadata } from "next";
import Link from "next/link";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import withLayout from "@/hooks/useLayout";

export const metadata: Metadata = {
  title: "UPPMS — University Publication Payment Management",
};

/** The product's own site — "Request a Demo" leaves ARPS for it. */
const UPPMS_URL = "https://uppms.app";

/** UPPMS's own brand green is #0D5A42, used directly in the Tailwind classes
 *  below wherever the background is light. #4FA98A is a lightened tint for dark
 *  backgrounds, where the true brand colour is too low-contrast to read. It's a
 *  constant only because the SVG `stroke` prop needs a real value, not a class. */
const BRAND_ON_DARK = "#4FA98A";

const steps = [
  {
    n: "01",
    title: "Academic submits",
    actor: "Applicant",
    desc: "Completes the request, confirms subsidy eligibility, and attaches the invoice, acceptance letter and authorship evidence in one guided application.",
  },
  {
    n: "02",
    title: "Officer screens",
    actor: "Screening Secretary / Officer",
    desc: "Checks the application for completeness and independently verifies publication subsidy eligibility before it moves forward.",
  },
  {
    n: "03",
    title: "Research leader decides",
    actor: "Director / Faculty Director",
    desc: "Approves, returns or declines the request according to the workflow configured for that unit.",
  },
  {
    n: "04",
    title: "High-value approval applies",
    actor: "DVC / Dean",
    desc: "Only requests above the university or unit's configured financial threshold are escalated to this stage.",
  },
  {
    n: "05",
    title: "Finance pays and records",
    actor: "Finance Officer",
    desc: "Processes the approved expense, records the payment reference, and uploads proof of payment against the request.",
  },
];

const faqs = [
  {
    q: "Can we run one central process, or does each faculty need its own?",
    a: "Either. UPPMS ships with an institutional workflow you can use as-is, or you can configure separate routes, officers, approval thresholds and budgets for individual faculties, departments, centres, institutes and schools — without exposing one unit's applications to another.",
  },
  {
    q: "How are approval thresholds handled?",
    a: "Each workflow carries its own financial threshold. Requests below it are settled at research-leader level; anything above is automatically escalated to the configured high-value approver, typically a Dean or DVC. Thresholds are set per unit, so a well-funded faculty and a small centre can operate different limits.",
  },
  {
    q: "What does Finance actually see and do in the system?",
    a: "Finance receives only approved requests. They can raise queries back to the applicant or approver, record authorisation, enter the payment reference, and upload proof of payment. The request is not closed until that evidence is attached, so the financial record and the approval record stay together.",
  },
  {
    q: "Is there an audit trail?",
    a: "Yes. Every decision, return, comment, document, cancellation and payment event is retained in a timestamped history against the request. Nothing is overwritten — the full sequence of who did what, and when, remains available for internal audit and external review.",
  },
  {
    q: "Can we see what has been committed versus actually paid?",
    a: "That distinction is built in. Dashboards show the annual allocation, amounts awaiting approval, committed funds, completed payments and the remaining balance — at institutional level and for every configured unit, so budget holders can see their position before approving more spend.",
  },
  {
    q: "How is access controlled?",
    a: "By identity, role, unit and workflow assignment. Applicants see their own requests, approvers see only what is assigned to them, and confidential invoices and supporting records remain restricted to authorised participants and institutional oversight roles.",
  },
  {
    q: "Is pricing per article?",
    a: "No. There is no per-article charge. Subscriptions are quoted according to users, workflows, storage, integrations and deployment requirements, so publication volume does not change what the institution pays.",
  },
];

const UppmsPage = () => {
  return (
    <>
      {/* ============ HERO SECTION ============ */}
      <section className="bg-[#071639] pt-20 md:pt-28 px-4 sm:px-6 md:px-10 lg:px-16 xl:px-20 pb-16 md:pb-24 relative overflow-hidden grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-10 lg:gap-20 items-center">
        <div className="absolute inset-0 bg-grid-ink pointer-events-none" />
        <div className="absolute -top-24 right-0 w-125 h-125 rounded-full bg-[#0474C4]/8 blur-[100px] pointer-events-none" />

        <div className="relative z-2">
          <p className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-blue-300 mb-6 flex items-center gap-3 before:content-[''] before:block before:w-8 before:h-px before:bg-blue-300 before:shrink-0">
            Publication Payment Management
          </p>

          <div className="flex items-center gap-3.5 mb-[1.8rem]">
            <div className="w-14 h-14 rounded-[14px] bg-[#0D5A42]/20 border border-[#4FA98A]/30 flex items-center justify-center shrink-0">
              <svg
                className="w-7 h-7"
                viewBox="0 0 24 24"
                fill="none"
                stroke={BRAND_ON_DARK}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 20 7 4 7" />
                <line x1="6" y1="11" x2="6" y2="18" />
                <line x1="10" y1="11" x2="10" y2="18" />
                <line x1="14" y1="11" x2="14" y2="18" />
                <line x1="18" y1="11" x2="18" y2="18" />
                <line x1="3" y1="22" x2="21" y2="22" />
              </svg>
            </div>
            <div>
              <div className="font-heading text-[1.75rem] tracking-[-0.01em] leading-[1.1] font-semibold text-[#4FA98A]">
                UPPMS
              </div>
              <span className="font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium text-[rgba(247,243,237,0.35)] mt-1 block">
                by ARPS Institute
              </span>
            </div>
          </div>

          <h1 className="font-heading text-[2.25rem] md:text-[3rem] tracking-[-0.015em] md:tracking-[-0.02em] leading-[1.2] md:leading-[1.1] font-bold text-white mb-5">
            From Accepted Publication to
            <br />
            <em className="italic text-[#0474C4]">Accounted-For Payment</em>
          </h1>

          <p className="font-body text-[1.125rem] tracking-[-0.01em] leading-[1.65] font-light text-[#EBF3FC] mb-10">
            A publication-payment platform built for universities — replacing
            emails, spreadsheets and unclear hand-offs with one controlled
            record covering applications, approvals, budgets, Finance
            processing and institutional reporting.
          </p>

          <div className="flex gap-3.5 flex-wrap">
            {/* Plain anchors, not <Button asChild> — the Button's default
                variant carries `[a]:hover:bg-primary/80`, whose extra element
                qualifier outranks a plain `hover:bg-*` and repaints these grey
                on hover. The sibling solution pages style their CTAs the same
                way for the same reason. */}
            <a
              href={UPPMS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-body text-[0.8125rem] inline-flex items-center justify-center h-12 rounded-[32px] min-w-40 tracking-[0.07em] uppercase font-medium bg-[#0D5A42] text-white border-0 px-8 cursor-pointer transition-all duration-250 no-underline hover:bg-[#0A4633]"
            >
              Request a Demo
            </a>
            <Link
              href="#faqs"
              className="font-body text-[0.8125rem] inline-flex items-center justify-center h-12 rounded-[32px] min-w-40 text-center tracking-[0.07em] uppercase font-medium bg-transparent text-[#4FA98A] border border-[#4FA98A] px-7 cursor-pointer transition-all duration-250 no-underline hover:bg-[#0D5A42] hover:text-white hover:border-[#0D5A42]"
            >
              View FAQs
            </Link>
          </div>

          {/* Stats */}
          <div className="flex gap-10 pt-10 border-t border-blue-600/20 flex-wrap mt-10">
            {[
              { value: "5-step", label: "Approval Route" },
              { value: "100%", label: "Audit Trail" },
              { value: "Live", label: "Budget Visibility" },
            ].map(({ value, label }) => (
              <div key={label}>
                <span className="font-heading text-[1.75rem] tracking-[-0.01em] leading-[1.1] font-semibold text-[#4FA98A] block mb-1">
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
              <div className="flex-1 min-w-0 bg-[rgba(247,243,237,0.06)] rounded-lg h-5 mx-2 flex items-center px-2 font-body text-[0.6875rem] tracking-[0em] font-normal text-[rgba(247,243,237,0.3)] truncate">
                app.uppms.io/expenditure
              </div>
            </div>

            <div className="p-6">
              <div className="font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium text-[rgba(247,243,237,0.3)] mb-2.5">
                Publication Expenditure — 2026 Cycle
              </div>

              {/* Budget spotlight */}
              <div className="bg-[rgba(247,243,237,0.05)] rounded-lg p-3.5 mb-3">
                <div className="flex justify-between items-baseline mb-1.5">
                  <span className="font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium text-[rgba(247,243,237,0.4)]">
                    Available Balance
                  </span>
                  <span className="font-body text-[0.6875rem] tracking-[0em] font-medium text-[#6EE7B7]">
                    74%
                  </span>
                </div>
                <div className="font-heading text-[1.625rem] tracking-[-0.005em] leading-[1.1] font-semibold text-[#F7F3ED] mb-1">
                  R 4,370,000
                </div>
                <div className="font-body text-[0.6875rem] tracking-[0em] font-normal text-[rgba(247,243,237,0.35)] mb-2.5">
                  of R 5,000,000 allocated
                </div>
                <div className="h-1 bg-[rgba(247,243,237,0.08)] rounded-xs">
                  <div className="h-full rounded-xs bg-[#4FA98A]" style={{ width: "74%" }} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { value: "R410k", label: "Committed", color: "#F7F3ED" },
                  { value: "R220k", label: "Paid", color: "#86EFAC" },
                  { value: "12", label: "In Review", color: "#FEBC2E" },
                ].map(({ value, label, color }) => (
                  <div key={label} className="bg-[rgba(247,243,237,0.05)] rounded-lg p-3 flex flex-col gap-1">
                    <span
                      className="font-heading text-[1.25rem] tracking-[-0.005em] leading-[1.1] font-semibold"
                      style={{ color }}
                    >
                      {value}
                    </span>
                    <span className="font-body text-[0.625rem] tracking-[0.07em] uppercase font-medium text-[rgba(247,243,237,0.4)]">
                      {label}
                    </span>
                  </div>
                ))}
              </div>

              <div className="font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium text-[rgba(247,243,237,0.3)] mb-2">
                Recent Applications
              </div>

              <div className="flex flex-col gap-1.5">
                {[
                  { dot: "#93C5FD", text: "APC — Faculty of Health Sciences",     status: "Screening", statusBg: "rgba(147,197,253,0.1)", statusColor: "#93C5FD" },
                  { dot: "#FEBC2E", text: "APC — Dept. of Environmental Science", status: "Director",  statusBg: "rgba(254,188,46,0.1)",  statusColor: "#FEBC2E" },
                  { dot: "#C4B5FD", text: "APC — Centre for Data Innovation",     status: "Finance",   statusBg: "rgba(196,181,253,0.1)", statusColor: "#C4B5FD" },
                  { dot: "#86EFAC", text: "APC — School of Education",            status: "Paid",      statusBg: "rgba(134,239,172,0.1)", statusColor: "#86EFAC" },
                ].map(({ dot, text, status, statusBg, statusColor }) => (
                  <div key={text} className="bg-[rgba(247,243,237,0.03)] border border-[rgba(247,243,237,0.06)] rounded-lg py-2.25 px-3 flex items-center gap-2.5">
                    <div className="w-1.75 h-1.75 rounded-full shrink-0" style={{ background: dot }} />
                    <div className="font-body text-[0.75rem] tracking-[0em] font-normal text-[rgba(247,243,237,0.55)] flex-1 min-w-0 truncate">
                      {text}
                    </div>
                    <div
                      className="font-body text-[0.6875rem] tracking-[0.05em] font-medium py-0.5 px-2 rounded-[10px] shrink-0"
                      style={{ background: statusBg, color: statusColor }}
                    >
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
      <section className="py-16 md:py-28 px-4 sm:px-6 md:px-10 lg:px-16 xl:px-20 bg-[#F9F9FB] grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-12 lg:gap-24 items-start">
        <div>
          <p className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#0D5A42] mb-4">
            What is UPPMS
          </p>

          <h2 className="font-heading text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-[#071639] mb-5">
            One Controlled Record, From Application to Payment
          </h2>

          <p className="font-body text-[1rem] tracking-[-0.005em] leading-[1.7] font-normal text-slate-600 mb-4">
            UPPMS is the University Publication Payment Management System — a
            platform for submitting, screening, approving and paying
            publication charges. Academics submit article processing charges
            with invoices, acceptance letters and subsidy declarations in one
            guided application, which then moves through a workflow that
            mirrors the institution&apos;s own approval structure.
          </p>

          <p className="font-body text-[1rem] tracking-[-0.005em] leading-[1.7] font-normal text-slate-600">
            It connects research administration with financial control.
            Applicants can track progress, approvers see only their assigned
            work, and management gains a current view of publication
            expenditure across the institution and every configured unit —
            with a timestamped audit trail behind every decision and document.
          </p>

          <div className="mt-8 flex gap-3.5 flex-wrap">
            <a
              href={UPPMS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-body text-[0.8125rem] inline-flex items-center justify-center h-12 rounded-[32px] min-w-40 text-center tracking-[0.07em] uppercase font-medium bg-[#0D5A42] text-white border-0 px-8 cursor-pointer transition-all duration-250 no-underline hover:bg-[#d8af46]"
            >
              Visit UPPMS
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <p className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#0D5A42]">
              Who Uses UPPMS
            </p>

            <h2 className="font-heading text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-[#071639]">
              Built for Central and Decentralised University Structures
            </h2>

            <p className="font-body text-[1rem] tracking-[-0.005em] leading-[1.7] font-normal text-slate-600">
              Run one institutional process, or give each unit its own
              protected workflow, officers, thresholds and budget.
            </p>
          </div>

          <div className="flex flex-col gap-px bg-blue-600/10 border border-blue-600/10">
            {[
              "Research offices & research administration",
              "Faculties, schools and departments",
              "Research centres & institutes",
              "Finance & expenditure control teams",
              "Deans, DVCs and high-value approvers",
              "Internal audit & institutional oversight",
            ].map((item) => (
              <div
                key={item}
                className="bg-white py-[1.1rem] px-[1.4rem] flex items-center gap-3 transition-colors duration-200 hover:bg-[#EEF5F1]"
              >
                <span className="w-1.75 h-1.75 rounded-full bg-[#0D5A42] shrink-0" />
                <span className="font-body text-[0.875rem] tracking-[0em] leading-[1.6] font-normal text-[#071639]">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FEATURES SECTION ============ */}
      <section className="py-16 md:py-28 px-4 sm:px-6 md:px-10 lg:px-16 xl:px-20 bg-white">
        <p className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium mb-4 text-[#0D5A42]">
          Key Features
        </p>

        <h2 className="font-heading text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-[#071639] mb-14">
          More Than an Approval System — the Working Record for Every
          Publication Expense
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: "Capture Complete Requests",
              desc: "Academics submit publication details, invoices, acceptance letters, authorship evidence and subsidy declarations in one guided application.",
              icon: (
                <>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <polyline points="9 15 11 17 15 13" />
                </>
              ),
            },
            {
              title: "Match Your University Structure",
              desc: "Run one central process, or create protected workflows for faculties, departments, centres, institutes and schools.",
              icon: (
                <>
                  <circle cx="6" cy="19" r="3" />
                  <circle cx="18" cy="5" r="3" />
                  <path d="M6 16V9a4 4 0 0 1 4-4h5" />
                </>
              ),
            },
            {
              title: "Route to the Right People",
              desc: "Assign named officers at every stage. Requests stay restricted to the responsible role, unit and workflow.",
              icon: (
                <>
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </>
              ),
            },
            {
              title: "Control Publication Expenditure",
              desc: "See allocated budgets, amounts awaiting approval, committed funds, completed payments and remaining balances by unit.",
              icon: (
                <>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M14.5 9A2.5 2.5 0 0 0 12 7.5h-.5a2 2 0 0 0 0 4h1a2 2 0 0 1 0 4H12A2.5 2.5 0 0 1 9.5 15" />
                  <path d="M12 6v12" />
                </>
              ),
            },
            {
              title: "Close the Finance Loop",
              desc: "Finance can raise queries, record authorisation, enter payment references and upload proof of payment against the request.",
              icon: (
                <>
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <path d="M2 10h20" />
                  <path d="M16 15h2" />
                </>
              ),
            },
            {
              title: "Stay Ready for Audit",
              desc: "Every decision, return, comment, document, cancellation and payment event is retained in a timestamped history.",
              icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
            },
          ].map(({ title, desc, icon }) => (
            <div
              key={title}
              className="bg-(--warm-white) border border-border rounded-xs p-8 transition-[border-color,transform] duration-250 hover:border-[#0D5A42]/40 hover:-translate-y-0.75"
            >
              <div className="w-11 h-11 rounded-[10px] bg-[#EEF5F1] flex items-center justify-center mb-5">
                <svg
                  className="w-5.5 h-5.5 stroke-[#0D5A42] fill-none stroke-[1.6] [stroke-linecap:round] [stroke-linejoin:round]"
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
      <section className="py-16 md:py-28 px-4 sm:px-6 md:px-10 lg:px-16 xl:px-20 bg-[#0B1625] grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-start">
        {/* How It Works */}
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <p className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#4FA98A]">
              How It Works
            </p>

            <h2 className="font-heading text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-white max-w-lg">
              An Example Institutional Route
            </h2>
          </div>

          <div className="flex flex-col">
            {steps.map(({ n, title, actor, desc }) => (
              <div
                key={n}
                className="grid grid-cols-[44px_1fr] gap-[1.2rem] py-[1.4rem] border-b border-blue-600/15 items-start first:pt-0"
              >
                <div className="w-11 h-11 rounded-full bg-[#0D5A42] flex items-center justify-center font-heading text-[1rem] tracking-[0em] leading-none font-medium text-white shrink-0">
                  {n}
                </div>
                <div>
                  <div className="font-heading text-[1rem] tracking-[-0.005em] leading-[1.3] font-medium text-(--cream) mb-1">
                    {title}
                  </div>
                  <div className="font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium text-[#4FA98A] mb-1.5">
                    {actor}
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
            <p className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#4FA98A]">
              Use Cases
            </p>

            <h2 className="font-heading text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-white max-w-lg">
              Wherever Publication Money Needs a Paper Trail
            </h2>
          </div>

          <div className="flex flex-col">
            {[
              {
                title: "Article Processing Charges (APCs)",
                body: "The core case — open-access publishing fees requested by academics, screened for eligibility, approved against a budget and paid by Finance.",
              },
              {
                title: "Subsidy-Eligible Publication Tracking",
                body: "Capture subsidy declarations at submission and verify eligibility independently at screening, so claims rest on a documented decision.",
              },
              {
                title: "Faculty & Departmental Research Budgets",
                body: "Give each unit its own allocation, threshold and approval chain, with live visibility of committed versus remaining funds.",
              },
              {
                title: "High-Value Expenditure Oversight",
                body: "Escalate only requests above a configured threshold to a Dean or DVC, keeping senior approvers focused on material spend.",
              },
              {
                title: "Multi-Campus & Decentralised Institutions",
                body: "Operate separate workflows per campus or unit without exposing one unit's applications, invoices or budgets to another.",
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
      <section className="py-16 md:py-28 px-4 sm:px-6 md:px-10 lg:px-16 xl:px-20 bg-white" id="faqs">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-12 lg:gap-24 items-start">
          <div className="lg:sticky lg:top-22 space-y-6">
            <div className="flex flex-col gap-4">
              <p className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#0D5A42]">
                Support
              </p>

              <h2 className="font-heading text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-[#071639]">
                UPPMS FAQs
              </h2>

              <p className="font-body text-[1rem] tracking-[-0.005em] leading-[1.7] font-normal text-slate-600">
                Everything you need to know about UPPMS. Can&apos;t find your
                answer? Talk to our team.
              </p>
            </div>

            <a
              href="mailto:support@uppms.app"
              className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#0D5A42] no-underline border-b border-[#0D5A42] pb-0.5 transition-colors duration-200 hover:text-[#0A4633]"
            >
              Contact Our Team →
            </a>
          </div>

          <Accordion type="single" collapsible className="flex flex-col">
            {faqs.map(({ q, a }) => (
              <AccordionItem
                key={q}
                value={q}
                className="border-b border-[rgba(200,169,110,0.2)] first:border-t first:border-t-[rgba(200,169,110,0.2)]"
              >
                <AccordionTrigger className="py-[1.4rem] font-heading text-[1rem] tracking-[-0.005em] leading-[1.3] font-medium text-[#071639] hover:no-underline hover:text-[#0D5A42] transition-colors duration-200 [&>svg]:text-(--light-slate)">
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
      <section className="w-full py-16 md:py-28 px-4 sm:px-6 md:px-10 lg:px-16 xl:px-20 text-center bg-[#181C2C] relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-ink pointer-events-none" />
        <div className="relative max-w-140 mx-auto">
          <p className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#4FA98A] mb-6">
            Get Started with UPPMS
          </p>

          <h2 className="font-heading text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-white mb-5">
            Bring Clarity to Every Publication Payment
          </h2>

          <p className="font-body text-[1.125rem] tracking-[-0.01em] leading-[1.65] font-light text-slate-300 mb-10">
            Give academics a clear path and your university complete control.
            Book a demonstration and see UPPMS configured against your own
            approval structure.
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <a
              href={UPPMS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-body text-[0.875rem] inline-flex items-center justify-center tracking-[0.02em] font-medium bg-[#0D5A42] text-[#EBF3FC] capitalize border border-[#0D5A42] px-5 h-12 rounded-[32px] min-w-40 transition-colors duration-200 hover:bg-[#0A4633] hover:border-[#0A4633]"
            >
              Request a Demo
            </a>

            {/* Plain <a>, not next/link — mailto: isn't an internal route. */}
            <a
              href="mailto:support@uppms.app"
              className="font-body text-[0.875rem] tracking-[0.02em] font-medium bg-transparent text-center text-[#EBF3FC] capitalize border border-[#EBF3FC] py-3.5 px-5 h-12 rounded-[32px] min-w-40 transition-colors duration-200 hover:bg-[#0D5A42] hover:border-[#0D5A42]"
            >
              Contact Sales
            </a>
          </div>
        </div>
      </section>
    </>
  );
};

export default withLayout(UppmsPage);
