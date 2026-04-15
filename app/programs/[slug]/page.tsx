import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Clock, Monitor, Calendar, Users, Star, CheckCircle, ChevronRight } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { programCategories } from "@/lib/data";

// Flatten all programs
const allPrograms = programCategories.flatMap((cat) =>
  cat.programs.map((p) => ({ ...p, cat }))
);

export async function generateStaticParams() {
  return allPrograms.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const prog = allPrograms.find((p) => p.slug === params.slug);
  if (!prog) return {};
  return { title: prog.title };
}

const meModules = [
  { week: "Week 1", title: "Foundations of Monitoring & Evaluation", desc: "Introduction to M&E concepts, terminology, results-based management, and M&E in the programme cycle.", topics: ["M&E concepts & terminology", "Results-based management", "Donor M&E requirements"] },
  { week: "Week 2", title: "Theory of Change & Logical Frameworks", desc: "Developing Theories of Change (ToC) and Logical Frameworks (LogFrames) that articulate programme logic and results chains.", topics: ["Theory of Change design", "LogFrame development", "Results chains", "Assumptions & risks"] },
  { week: "Week 3", title: "Developing SMART Indicators", desc: "Constructing meaningful, measurable indicators at input, output, outcome, and impact levels, including equity disaggregation.", topics: ["SMART indicator criteria", "Output vs outcome indicators", "Disaggregation & equity"] },
  { week: "Week 4", title: "Data Collection Methods", desc: "Selecting and designing appropriate data collection tools — surveys, interviews, focus groups, and administrative data systems.", topics: ["Survey design", "Qualitative data tools", "Mobile data collection", "Sampling strategies"] },
  { week: "Week 5", title: "Baseline Studies & Needs Assessments", desc: "Planning and conducting baseline surveys and situational needs assessments, covering sampling and data quality assurance.", topics: ["Baseline study design", "Needs assessment frameworks", "Data quality assurance"] },
  { week: "Week 6", title: "Data Analysis for M&E", desc: "Analysing quantitative and qualitative M&E data — descriptive statistics, thematic analysis, and data visualisation.", topics: ["Descriptive statistics", "Thematic analysis", "Excel for M&E", "Data visualisation"] },
  { week: "Week 7", title: "Evaluation Design & Methods", desc: "Types of evaluation — formative, summative, process, and impact — with evaluation design and commissioning guidance.", topics: ["Evaluation types & timing", "Impact evaluation designs", "Evaluation ToR writing"] },
  { week: "Week 8", title: "Reporting, Learning & Adaptive Management", desc: "Writing high-quality monitoring reports and using M&E for adaptive management and organisational learning.", topics: ["Monitoring report writing", "Evaluation brief design", "Adaptive management"] },
];

const meFaqs = [
  { q: "Do I need prior M&E experience to enrol?", a: "This programme is designed for professionals with some exposure to programme work who want to formalise their M&E skills. A basic understanding of development programmes is helpful but not required." },
  { q: "How many hours per week should I expect to commit?", a: "Plan for approximately 6–8 hours per week — a 90-minute live session, 2–3 hours of self-paced content, and a weekly practical assignment." },
  { q: "Are live sessions recorded?", a: "Yes. All live sessions are recorded and made available in your dashboard within 24 hours. If you miss a live session, you can watch the recording and still submit your weekly assignment." },
  { q: "What is the assessment structure?", a: "Assessment is continuous — weekly practical assignments graded pass/fail, plus a final capstone M&E framework project reviewed by the facilitator and a peer reviewer." },
  { q: "Is the certificate internationally recognised?", a: "The ARPS Institute Certificate in M&E is recognised by international development organisations, academic institutions, and NGOs across 120+ countries, with QR verification." },
  { q: "Can my organisation sponsor multiple staff members?", a: "Yes. ARPS Institute offers group enrolment packages for 3+ participants with institutional invoicing and a dedicated mid-cohort check-in with the facilitator." },
];

export default function ProgramDetailPage({ params }: { params: { slug: string } }) {
  const prog = allPrograms.find((p) => p.slug === params.slug);
  if (!prog) notFound();

  const { cat } = prog;
  const modules = prog.slug === "monitoring-evaluation" ? meModules : null;
  const faqs    = prog.slug === "monitoring-evaluation" ? meFaqs   : null;

  const related = cat.programs.filter((p) => p.slug !== prog.slug).slice(0, 4);

  return (
    <>
      <Breadcrumb items={[
        { label: "Home",     href: "/" },
        { label: "Programs", href: "/programs" },
        { label: cat.label.split(" ")[0], href: `/programs#${cat.id}` },
        { label: prog.title },
      ]} />

      {/* Hero */}
      <section className="bg-ink-deep relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-ink bg-[length:60px_60px] pointer-events-none" style={{ backgroundImage: `linear-gradient(rgba(13,148,136,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(13,148,136,0.04) 1px,transparent 1px)` }} />
        <div className="absolute -top-24 right-48 w-[400px] h-[400px] rounded-full blur-[80px] pointer-events-none" style={{ background: `${cat.color}10` }} />

        <div className="relative z-10 px-8 md:px-16 py-16 grid lg:grid-cols-2 gap-16 items-center max-w-[1400px] mx-auto">
          <div>
            <Link href={`/programs#${cat.id}`} className="inline-flex items-center gap-2 text-[0.65rem] tracking-[0.12em] uppercase px-3.5 py-1.5 rounded-full border mb-5 transition-all hover:bg-white/5"
              style={{ background: `${cat.color}18`, borderColor: `${cat.color}30`, color: cat.color }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: cat.color }} />
              {cat.label}
            </Link>
            <h1 className="font-serif text-sky-light text-3xl md:text-4xl lg:text-[2.6rem] font-normal leading-[1.18] mb-4 tracking-tight">
              {prog.title}
            </h1>
            <p className="text-white/50 font-light text-base leading-loose mb-8 max-w-xl">
              Master the skills to design robust frameworks, develop measurable indicators, collect evidence, and produce credible reports that drive accountability and improvement.
            </p>
            <div className="flex gap-3 flex-wrap mb-8">
              <Button style={{ background: cat.color }} className="text-white hover:opacity-90" asChild>
                <Link href="/signup">Enrol Now</Link>
              </Button>
              <Button>Request Group Quote</Button>
            </div>
            {/* Social proof */}
            <div className="flex items-center gap-6 flex-wrap pt-6 border-t border-sapphire/15">
              <div className="flex items-center gap-2">
                {[1,2,3,4,5].map((i) => <Star key={i} className="h-3.5 w-3.5 fill-sapphire text-sapphire" />)}
                <span className="font-serif text-sky text-sm ml-1">4.9</span>
                <span className="text-white/35 text-xs ml-1">from 312 reviews</span>
              </div>
              <div className="text-[0.68rem] text-white/35 uppercase tracking-widest">2,100+ enrolled · 120+ countries</div>
            </div>
          </div>

          {/* Info card */}
          <div className="border rounded-xl p-6" style={{ background: "rgba(247,243,237,0.04)", borderColor: `${cat.color}25` }}>
            <div className="text-[0.62rem] text-white/30 tracking-widest uppercase mb-4">Programme Details</div>
            {[
              { icon: Clock,     label: "Duration",      val: prog.duration },
              { icon: Monitor,   label: "Format",        val: "Live + Self-Paced Online" },
              { icon: Star,      label: "Level",         val: prog.level },
              { icon: Calendar,  label: "Next Intake",   val: "14 April 2026", accent: true },
              { icon: Users,     label: "Cohort Size",   val: "35 participants" },
            ].map(({ icon: Icon, label, val, accent }) => (
              <div key={label} className="flex items-center gap-3 mb-3.5">
                <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style={{ background: `${cat.color}15` }}>
                  <Icon className="h-3.5 w-3.5" style={{ color: cat.color }} />
                </div>
                <div>
                  <div className="text-[0.6rem] text-white/30 tracking-widest uppercase mb-0.5">{label}</div>
                  <div className={`text-sm ${accent ? "" : "text-white/65"}`} style={accent ? { color: cat.color } : {}}>{val}</div>
                </div>
              </div>
            ))}
            {/* Progress */}
            <div className="mt-5 pt-4 border-t" style={{ borderColor: "rgba(247,243,237,0.07)" }}>
              <div className="flex justify-between text-[0.62rem] text-white/30 uppercase tracking-widest mb-2">
                <span>Cohort Filling</span><span style={{ color: cat.color }}>78% filled</span>
              </div>
              <div className="h-1 rounded-full bg-white/8"><div className="h-full rounded-full" style={{ width: "78%", background: cat.color }} /></div>
              <div className="text-[0.68rem] text-white/25 mt-1.5">Only 8 seats remaining in the April cohort</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main content */}
      <div className="max-w-[1400px] mx-auto grid lg:grid-cols-[1fr_340px] gap-0">
        <div className="px-8 md:px-16 py-12 lg:border-r border-sapphire/20">

          {/* Quick facts strip */}
          <div className="flex flex-wrap border border-sapphire/25 rounded-sm overflow-hidden mb-10">
            {[["Duration", prog.duration], ["Level", prog.level], ["Format", "Online · Live + Self-Paced"], ["Language", "English"], ["Next Intake", "14 April 2026"], ["Certificate", "Verified Digital"]].map(([label, val]) => (
              <div key={label} className="flex-1 min-w-[130px] px-4 py-3 bg-sky-light border-r border-sapphire/20 last:border-r-0">
                <div className="text-[0.6rem] tracking-widest uppercase text-slate-400 mb-1">{label}</div>
                <div className="font-serif text-sm text-ink">{val}</div>
              </div>
            ))}
          </div>

          {/* Overview */}
          <section className="mb-10 pb-10 border-b border-sapphire/20">
            <p className="eyebrow mb-2">Overview</p>
            <h2 className="font-serif text-2xl font-normal text-ink mb-4">What You Will Learn</h2>
            <p className="text-slate-600 font-light leading-loose mb-5">
              This certificate programme provides a comprehensive grounding in monitoring and evaluation for professionals working in development, government, NGOs, and research institutions. Participants learn to design results-based M&E systems, construct logical frameworks, select appropriate data collection methods, and produce analytical reports.
            </p>
            <div className="flex flex-col gap-2.5">
              {[
                "Design results-based M&E frameworks aligned to programme logics",
                "Develop SMART indicators and data collection instruments",
                "Apply key data analysis techniques to interpret M&E evidence",
                "Produce professional monitoring reports and evaluation findings",
                "Communicate M&E findings effectively to diverse stakeholders",
                "Navigate ethical considerations in data collection and reporting",
              ].map((obj) => (
                <div key={obj} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center mt-0.5 shrink-0" style={{ background: cat.bg }}>
                    <CheckCircle className="h-3 w-3" style={{ color: cat.color }} />
                  </div>
                  <span className="text-slate-600 font-light text-sm leading-relaxed">{obj}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Curriculum */}
          {modules && (
            <section className="mb-10 pb-10 border-b border-sapphire/20">
              <p className="eyebrow mb-2">Curriculum</p>
              <h2 className="font-serif text-2xl font-normal text-ink mb-6">8-Week Programme Outline</h2>
              <Accordion type="single" collapsible defaultValue="week-0">
                {modules.map((mod, i) => (
                  <AccordionItem key={i} value={`week-${i}`}>
                    <AccordionTrigger>
                      <div className="flex items-center gap-3">
                        <span className="text-[0.72rem] font-medium tracking-widest uppercase px-2.5 py-1 rounded-full shrink-0"
                          style={{ background: cat.bg, color: cat.color }}>
                          {mod.week}
                        </span>
                        <span className="font-serif text-base font-normal text-ink text-left">{mod.title}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-slate-600 text-sm mb-3 leading-loose">{mod.desc}</p>
                      <div className="flex flex-wrap gap-2">
                        {mod.topics.map((t) => (
                          <span key={t} className="text-[0.68rem] px-2.5 py-1 rounded-full" style={{ background: cat.bg, color: cat.color }}>{t}</span>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          )}

          {/* Instructor */}
          <section className="mb-10 pb-10 border-b border-sapphire/20">
            <p className="eyebrow mb-2">Programme Facilitator</p>
            <h2 className="font-serif text-2xl font-normal text-ink mb-5">Meet Your Instructor</h2>
            <div className="bg-sky-light border border-sapphire/25 rounded-sm p-6 flex gap-5">
              <div className="w-20 h-20 rounded-full bg-ink flex items-center justify-center font-serif text-2xl text-sky border-2 shrink-0" style={{ borderColor: cat.bg }}>RO</div>
              <div>
                <div className="font-serif text-xl text-ink mb-0.5">Dr. Rachel Osei</div>
                <div className="text-[0.76rem] uppercase tracking-widest mb-3" style={{ color: cat.color }}>Senior Researcher & M&E Specialist · ARPS Institute</div>
                <p className="text-slate-600 text-sm font-light leading-loose mb-4">Dr. Rachel Osei is a research methodologist with over 14 years of experience designing M&E systems for international development programmes across Sub-Saharan Africa, Southeast Asia, and the Middle East. She has led major evaluations for USAID, FCDO, and the World Bank.</p>
                <div className="flex flex-wrap gap-2">
                  {["PhD Research Methods — University of Ghana", "MSc International Development — LSE", "14+ Years M&E Practice"].map((c) => (
                    <span key={c} className="text-[0.68rem] text-slate-500 bg-sky-pale border border-sapphire/20 px-2.5 py-1 rounded-full">{c}</span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* FAQs */}
          {faqs && (
            <section>
              <p className="eyebrow mb-2">FAQs</p>
              <h2 className="font-serif text-2xl font-normal text-ink mb-5">Frequently Asked Questions</h2>
              <Accordion type="single" collapsible>
                {faqs.map((faq, i) => (
                  <AccordionItem key={i} value={`faq-${i}`}>
                    <AccordionTrigger>{faq.q}</AccordionTrigger>
                    <AccordionContent>{faq.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="px-6 py-10 lg:py-12 flex flex-col gap-4">
          {/* Enrol card */}
          <div className="bg-ink rounded-lg overflow-hidden">
            <div className="px-6 pt-6 pb-5 border-b border-white/8">
              <div className="font-serif text-[2.2rem] text-sky font-normal leading-none mb-1">${prog.price}</div>
              <div className="text-[0.72rem] text-white/35">Full programme fee · One-time payment</div>
            </div>
            <div className="px-6 py-5">
              <div className="flex flex-col gap-2.5 mb-5">
                {[
                  { icon: Clock,    val: `${prog.duration} · ~6–8 hrs/week` },
                  { icon: Calendar, val: "Next intake: 14 April 2026" },
                  { icon: Monitor,  val: "Live + self-paced online" },
                  { icon: Star,     val: "Verified digital certificate" },
                ].map(({ icon: Icon, val }) => (
                  <div key={val} className="flex items-center gap-2.5 text-[0.82rem] text-white/55">
                    <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: cat.color }} />
                    {val}
                  </div>
                ))}
              </div>
              <Button className="w-full mb-2.5 text-white hover:opacity-90" style={{ background: cat.color }} asChild>
                <Link href="/signup">Enrol Now</Link>
              </Button>
              <Button className="w-full">Request Group Quote</Button>
              <p className="text-[0.7rem] text-white/28 text-center mt-3">✓ 14-day money-back guarantee · Instalment plans available</p>
            </div>
          </div>

          {/* What's included */}
          <div className="bg-sky-pale border border-sapphire/25 rounded-sm p-5">
            <div className="font-serif text-sm text-ink mb-3">What&apos;s Included</div>
            <div className="flex flex-col gap-2">
              {["8 live virtual sessions (recorded)", "40+ hrs self-paced content", "8 practical assignments", "Capstone M&E project", "Downloadable templates & tools", "12 months platform access", "Verified digital certificate", "ARPS alumni network"].map((item) => (
                <div key={item} className="flex items-center gap-2 text-[0.8rem] text-slate-600">
                  <CheckCircle className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Related */}
          {related.length > 0 && (
            <div className="bg-sky-light border border-sapphire/25 rounded-sm p-5">
              <div className="font-serif text-sm text-ink mb-3">You Might Also Like</div>
              <div className="flex flex-col">
                {related.map((r) => (
                  <Link key={r.slug} href={`/programs/${r.slug}`} className="py-3 border-b border-sapphire/18 last:border-b-0 flex items-center gap-2.5 group no-underline">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: cat.color }} />
                    <span className="text-[0.83rem] text-ink group-hover:text-sapphire transition-colors leading-snug flex-1">{r.title}</span>
                    <span className="text-[0.68rem] text-slate-400 whitespace-nowrap">{r.duration}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* You may also like (full width) */}
      <section className="bg-ink px-8 md:px-16 py-16">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
            <div>
              <p className="eyebrow mb-2">Continue Learning</p>
              <h2 className="font-serif text-2xl text-sky-light font-normal">You May Also Like</h2>
            </div>
            <Link href="/programs" className="text-[0.76rem] text-white/45 tracking-widest uppercase border-b border-white/15 hover:text-sky hover:border-sapphire transition-all">
              Browse All Programs →
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {related.map((r) => (
              <Link key={r.slug} href={`/programs/${r.slug}`}
                className="bg-white/4 border rounded-sm p-5 hover:bg-white/6 hover:-translate-y-1 transition-all no-underline group block"
                style={{ borderColor: `${cat.color}18`, borderTopWidth: "2px", borderTopColor: cat.color }}>
                <span className="text-[0.62rem] font-medium tracking-widest uppercase px-2 py-0.5 rounded-full mb-3 inline-block"
                  style={{ background: `${cat.color}18`, color: cat.color }}>
                  {cat.label.split(" ")[0]}
                </span>
                <h3 className="font-serif text-[0.95rem] text-sky-light font-normal leading-snug mb-3 group-hover:text-sky transition-colors">{r.title}</h3>
                <div className="flex items-center justify-between pt-3 border-t border-white/8 text-[0.7rem] text-white/35">
                  <span>{r.duration} · Online</span>
                  <span className="group-hover:text-sapphire transition-colors">Enrol →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
