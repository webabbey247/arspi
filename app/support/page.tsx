import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Star, Shield, Users, CreditCard, CheckCircle } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = { title: "Support Centre" };

const categories = [
  { icon: BookOpen,     title: "Getting Started",         desc: "Account setup, platform navigation, onboarding guides.", count: 14, href: "#getting-started", color: "#4F46E5", bg: "#EEF2FF" },
  { icon: Star,         title: "Programmes & Enrolment",  desc: "How to enrol, payment plans, cohort schedules, cancellations.", count: 22, href: "#programmes", color: "#0D9488", bg: "#CCFBF1" },
  { icon: CheckCircle,  title: "Certificates",            desc: "Download, verify, and share your certificate.", count: 8, href: "#certificates", color: "#B45309", bg: "#FEF3C7" },
  { icon: Shield,       title: "ResolveRite Support",     desc: "Setup guides, workflows, user management, troubleshooting.", count: 31, href: "#resolverite", color: "#2563EB", bg: "#DBEAFE" },
  { icon: Users,        title: "MentorTrack Support",     desc: "Programme setup, matching, session logging, reporting.", count: 28, href: "#mentortrack", color: "#0D9488", bg: "#CCFBF1" },
  { icon: CreditCard,   title: "Billing & Payments",      desc: "Invoices, receipts, refund policies, instalment plans.", count: 16, href: "#billing", color: "#7C3AED", bg: "#EDE9FE" },
];

const faqSections = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: BookOpen,
    color: "#4F46E5",
    bg: "#EEF2FF",
    faqs: [
      { q: "How do I create an ARPS Institute account?", a: "Visit the ARPS Institute website and click 'Sign Up'. Enter your email address, create a password, and complete your profile. You'll receive a verification email — click the link to activate your account." },
      { q: "How do I reset my password?", a: "Click 'Sign In' and then 'Forgot Password?'. Enter your registered email and we'll send a reset link within a few minutes. The link expires after 24 hours. If you don't receive the email, check your spam folder." },
      { q: "Can I access ARPS Institute from any country?", a: "Yes. ARPS Institute is fully online and accessible from 120+ countries. All programmes, workshops, and software products are delivered digitally. Payment is supported in multiple currencies." },
      { q: "What browsers and devices are supported?", a: "The platform supports Chrome, Firefox, Safari, and Edge (latest two versions) on desktop, tablet, and mobile. We recommend Chrome or Firefox for the best experience." },
    ],
  },
  {
    id: "programmes",
    title: "Programmes & Enrolment",
    icon: Star,
    color: "#0D9488",
    bg: "#CCFBF1",
    faqs: [
      { q: "How do I enrol in a programme?", a: "Navigate to the Programmes page, find the programme you're interested in, and click 'Enrol Now'. You'll be prompted to log in, complete a brief application form, and proceed to payment." },
      { q: "Can I access recorded sessions if I miss a live class?", a: "Yes. All live sessions are recorded and uploaded to your dashboard within 24 hours. Recordings are available for 12 months from your programme start date." },
      { q: "What is your cancellation and refund policy?", a: "We offer a 14-day money-back guarantee for all certificate programmes. Contact support@arpsinstitute.org within 14 days of your cohort start date for a full refund." },
      { q: "Can I transfer to a different cohort?", a: "Yes. You can request a cohort transfer up to 7 days before your current cohort starts — free of charge. After the cohort has started, a one-cohort extension is available." },
      { q: "Do you offer group or institutional pricing?", a: "Yes. We offer group discounts for 3+ staff from the same organisation. Contact programs@arpsinstitute.org for a group quote." },
    ],
  },
  {
    id: "certificates",
    title: "Certificates & Credentials",
    icon: CheckCircle,
    color: "#B45309",
    bg: "#FEF3C7",
    faqs: [
      { q: "When will I receive my certificate?", a: "Certificates are issued automatically within 48 hours of your programme completion being confirmed. You'll receive an email notification with a download link." },
      { q: "How do I verify or share my certificate?", a: "Each certificate includes a unique QR code that links to a verification page. A 'Share on LinkedIn' button on your dashboard lets you add the credential to your LinkedIn profile in one click." },
      { q: "Can I request a replacement if I lose my certificate?", a: "Your certificate is permanently stored in your account and can be re-downloaded at any time from 'My Certificates'. Contact support if you've lost access to your account." },
    ],
  },
  {
    id: "billing",
    title: "Billing & Payments",
    icon: CreditCard,
    color: "#7C3AED",
    bg: "#EDE9FE",
    faqs: [
      { q: "What payment methods do you accept?", a: "We accept Visa, Mastercard, American Express, and PayPal for individual enrolments. Bank transfer is available for institutional invoicing. All payments are processed securely via Stripe." },
      { q: "How do I get a receipt or invoice?", a: "A receipt is automatically emailed after payment. You can also download receipts from Account → Billing → Purchase History at any time." },
      { q: "Do you offer reduced pricing for low-income countries?", a: "Yes. We offer purchasing power parity (PPP) pricing for participants from low- and middle-income countries. Discounts of 30–60% are available. Contact billing@arpsinstitute.org to apply." },
    ],
  },
];

const services = [
  "Learning Platform", "ResolveRite", "MentorTrack", "Certificate API",
  "Payment Processing", "Email Notifications", "Live Session Streaming", "Authentication",
];

export default function SupportPage() {
  return (
    <>
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Support Centre" }]} />

      {/* Hero search */}
      <section className="bg-ink-deep relative overflow-hidden px-8 md:px-16 py-20 text-center">
        <div className="absolute inset-0 bg-grid-ink bg-[length:60px_60px] pointer-events-none" />
        <div className="absolute -top-16 left-1/4 w-[400px] h-[400px] rounded-full bg-sapphire/8 blur-[100px] pointer-events-none" />
        <div className="absolute -top-16 right-1/4 w-[400px] h-[400px] rounded-full bg-sapphire/8 blur-[100px] pointer-events-none" />
        <div className="relative z-10 max-w-xl mx-auto">
          <p className="eyebrow mb-3">Support Centre</p>
          <h1 className="font-serif text-sky-light text-4xl md:text-5xl font-normal leading-[1.12] mb-4 tracking-tight">
            How Can We <em className="italic text-sky">Help You?</em>
          </h1>
          <p className="text-white/45 font-light mb-8">Search our knowledge base or browse by topic below.</p>
          <form className="flex max-w-lg mx-auto">
            <input type="text" placeholder="Search for answers, e.g. 'reset password', 'download certificate'..."
              className="flex-1 bg-white/7 border border-sapphire/25 border-r-0 rounded-l-sm px-5 py-3.5 text-sm text-sky-light font-light placeholder:text-white/28 outline-none focus:border-sapphire/50 transition-colors" />
            <button type="submit" className="bg-sapphire text-ink-deep px-6 text-[0.8rem] font-medium tracking-widest uppercase rounded-r-sm hover:bg-sky-light transition-colors whitespace-nowrap">
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Status banner */}
      <div className="bg-emerald-50 border-b border-emerald-200 px-8 md:px-16 py-3 flex items-center gap-3">
        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
        <span className="text-sm text-emerald-800 font-light">
          <strong className="font-medium">All systems operational.</strong> No incidents reported. Last checked 5 minutes ago.{" "}
          <Link href="#status" className="font-medium text-emerald-700 hover:underline">View status →</Link>
        </span>
      </div>

      {/* Categories */}
      <section className="bg-sky-pale px-8 md:px-16 py-16">
        <div className="max-w-[1400px] mx-auto">
          <p className="eyebrow mb-2">Browse by Topic</p>
          <h2 className="font-serif text-2xl font-normal text-ink mb-2">Support Categories</h2>
          <p className="text-slate-500 font-light text-sm mb-8">Find answers quickly by selecting the topic that matches your question.</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(({ icon: Icon, title, desc, count, href, color, bg }) => (
              <Link key={title} href={href}
                className="bg-sky-light border border-sapphire/25 rounded-sm p-6 hover:border-sapphire/55 hover:-translate-y-0.5 transition-all block group no-underline">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: bg }}>
                  <Icon className="h-5.5 w-5.5" style={{ color }} />
                </div>
                <div className="font-serif text-base text-ink mb-1.5 group-hover:text-sapphire transition-colors">{title}</div>
                <div className="text-[0.8rem] text-slate-500 font-light leading-relaxed mb-3">{desc}</div>
                <div className="text-[0.68rem] text-slate-400 uppercase tracking-widest">{count} articles</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ + Sidebar */}
      <div className="grid lg:grid-cols-[1fr_300px] max-w-[1400px] mx-auto bg-sky-light border-t border-sapphire/20">
        {/* FAQs */}
        <div className="px-8 md:px-16 py-14">
          {faqSections.map(({ id, title, icon: Icon, color, bg, faqs }) => (
            <div key={id} id={id} className="mb-12 scroll-mt-32">
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-sapphire/20">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: bg }}>
                  <Icon className="h-4.5 w-4.5" style={{ color }} />
                </div>
                <div className="font-serif text-xl font-normal text-ink">{title}</div>
              </div>
              <Accordion type="single" collapsible defaultValue={id === "getting-started" ? "0" : undefined}>
                {faqs.map((faq, i) => (
                  <AccordionItem key={i} value={String(i)}>
                    <AccordionTrigger>{faq.q}</AccordionTrigger>
                    <AccordionContent>{faq.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>

        {/* Sidebar */}
        <div className="px-6 py-10 border-l border-sapphire/20 flex flex-col gap-6">
          {/* Live chat */}
          <div className="bg-ink rounded-lg p-5 text-center">
            <div className="flex justify-center gap-[-8px] mb-3">
              {["RO", "KM", "SA"].map((initials) => (
                <div key={initials} className="w-8 h-8 rounded-full bg-sapphire/15 border-2 border-navy flex items-center justify-center -ml-2 first:ml-0 font-serif text-[0.65rem] text-sky">{initials}</div>
              ))}
            </div>
            <div className="font-serif text-sm text-sky-light mb-1">We&apos;re Online</div>
            <div className="flex items-center justify-center gap-1.5 text-[0.68rem] text-white/35 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />3 agents available
            </div>
            <Button className="w-full bg-sapphire text-ink-deep hover:bg-sky-light text-xs">
              Start Live Chat
            </Button>
          </div>

          {/* Ticket form */}
          <div>
            <div className="font-serif text-sm text-ink mb-3">Submit a Ticket</div>
            <div className="flex flex-col gap-2.5">
              <Input type="email" placeholder="your@email.com" />
              <select className="h-10 w-full rounded-sm border border-sapphire/25 bg-sky-light px-3 py-2 text-sm font-light text-ink outline-none focus:border-sapphire">
                <option>Select a category...</option>
                <option>Account & Access</option>
                <option>Programmes & Enrolment</option>
                <option>Certificates</option>
                <option>ResolveRite</option>
                <option>MentorTrack</option>
                <option>Billing & Payments</option>
              </select>
              <Textarea placeholder="Describe your issue..." className="min-h-[70px]" />
              <Button variant="default" className="w-full text-xs">Submit Ticket →</Button>
            </div>
          </div>

          {/* Popular articles */}
          <div>
            <div className="font-serif text-sm text-ink mb-3">Popular Articles</div>
            {["How to download your certificate", "Resetting your password", "Requesting a cohort transfer", "Sharing certificate on LinkedIn", "Setting up ResolveRite", "Group enrolment & invoicing"].map((a) => (
              <Link key={a} href="#" className="flex items-center gap-2 py-2.5 border-b border-sapphire/18 last:border-b-0 group no-underline">
                <span className="text-[0.82rem] text-ink group-hover:text-sapphire transition-colors flex-1 font-light">{a}</span>
                <span className="text-slate-300 group-hover:text-sapphire transition-colors text-xs">›</span>
              </Link>
            ))}
          </div>

          {/* Contact */}
          <div className="border-t border-sapphire/20 pt-5">
            <div className="font-serif text-sm text-ink mb-2">Contact Support</div>
            <a href="mailto:support@arpsinstitute.org" className="text-sapphire text-sm hover:text-ink transition-colors">support@arpsinstitute.org</a>
            <p className="text-[0.74rem] text-slate-400 font-light mt-1 leading-relaxed">Mon–Fri · 8:00 AM – 6:00 PM UTC<br />Response within 24–48 hours</p>
          </div>
        </div>
      </div>

      {/* System Status */}
      <section id="status" className="bg-sky-pale px-8 md:px-16 py-14 border-t border-sapphire/20">
        <div className="max-w-[1400px] mx-auto">
          <p className="eyebrow mb-2">Platform Health</p>
          <h2 className="font-serif text-2xl font-normal text-ink mb-6">System Status</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
            {services.map((s) => (
              <div key={s} className="bg-sky-light border border-sapphire/22 rounded-sm px-4 py-3 flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <div>
                  <div className="text-sm text-ink font-normal">{s}</div>
                  <div className="text-[0.62rem] text-emerald-600 uppercase tracking-widest">Operational</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
