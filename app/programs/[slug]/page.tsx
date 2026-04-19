import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Clock, Monitor, Calendar, Users, Star, CheckCircle, BookOpen, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { programCategories } from "@/lib/data"
import { getProgramBySlug, getPrograms } from "@/services/program.service"
import withLayout from "@/hooks/useLayout"

// ── Types ─────────────────────────────────────────────────────────────────────

type CatMeta = { id: string; label: string; color: string; bg: string }
type PageModule = { week?: string; title: string; desc?: string; topics?: string[] }
type PageFaq = { q: string; a: string }

type PageProgram = {
  title:          string
  slug:           string
  description:    string
  price:          number
  level:          string
  duration:       string
  format:         string | null
  nextIntake:     string | null
  cohortSize:     number | null
  rating:         number | null
  reviewCount:    number | null
  enrolledCount:  number | null
  countriesCount: number | null
  overview:       string | null
  objectives:     string[]
  modules:        PageModule[]
  faqs:           PageFaq[]
  included:       string[]
  instructor: {
    name:        string | null
    title:       string | null
    bio:         string | null
    initials:    string | null
    credentials: string[]
  }
  cat:     CatMeta
  related: { slug: string; title: string; duration: string }[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const DEFAULT_CAT: CatMeta = {
  id: "general", label: "Professional Development", color: "#0474C4", bg: "#EEF6FF",
}

function catMetaFor(name?: string | null): CatMeta {
  if (!name) return DEFAULT_CAT
  const match = programCategories.find(
    (c) => c.label.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(c.id)
  )
  return match ?? DEFAULT_CAT
}

function toStrArr(v: unknown): string[] {
  return Array.isArray(v) ? (v as string[]) : []
}

function toModules(v: unknown): PageModule[] {
  if (!Array.isArray(v)) return []
  return (v as Record<string, unknown>[]).map((m) => ({
    week:   m.week as string | undefined,
    title:  (m.title as string) ?? "",
    desc:   m.desc as string | undefined,
    topics: m.lessons
      ? (m.lessons as { title: string }[]).map((l) => l.title)
      : toStrArr(m.topics),
  }))
}

function toFaqs(v: unknown): PageFaq[] {
  if (!Array.isArray(v)) return []
  return (v as { q: string; a: string }[]).filter((f) => f.q && f.a)
}

// ── Resolve program from DB ───────────────────────────────────────────────────

async function resolveProgram(slug: string): Promise<PageProgram | null> {
  const dbProg = await getProgramBySlug(slug)
  if (!dbProg || !dbProg.published) return null

  const cat = catMetaFor(dbProg.category?.name)
  const siblingRows = await getPrograms({ categoryId: dbProg.categoryId ?? undefined, published: true })
  const related = siblingRows
    .filter((p) => p.slug !== slug)
    .slice(0, 4)
    .map((p) => ({ slug: p.slug, title: p.title, duration: p.duration ?? "Self-Paced" }))

  return {
    title:          dbProg.title,
    slug:           dbProg.slug,
    description:    dbProg.description,
    price:          dbProg.price,
    level:          dbProg.level.charAt(0) + dbProg.level.slice(1).toLowerCase(),
    duration:       dbProg.duration ?? "Self-Paced",
    format:         dbProg.format,
    nextIntake:     dbProg.startDate,
    cohortSize:     dbProg.cohortSize,
    rating:         dbProg.rating,
    reviewCount:    dbProg.reviewCount,
    enrolledCount:  dbProg.enrolledCount,
    countriesCount: dbProg.countriesCount,
    overview:       dbProg.overview,
    objectives:     toStrArr(dbProg.learningObjectives),
    modules:        toModules(dbProg.curriculum),
    faqs:           toFaqs(dbProg.faqs),
    included:       toStrArr(dbProg.whatIsIncluded),
    instructor: {
      name:        dbProg.instructorName,
      title:       dbProg.instructorTitle,
      bio:         dbProg.instructorBio,
      initials:    dbProg.instructorInitials,
      credentials: toStrArr(dbProg.instructorCredentials),
    },
    cat,
    related,
  }
}

// ── Static params & metadata ──────────────────────────────────────────────────

export async function generateStaticParams() {
  const programs = await getPrograms({ published: true })
  return programs.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const prog = await resolveProgram(slug)
  if (!prog) return {}
  return { title: `${prog.title} — ARPS Institute` }
}

// ── Page ──────────────────────────────────────────────────────────────────────

const ProgramDetailPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params
  const prog = await resolveProgram(slug)
  if (!prog) notFound()

  const { cat } = prog

  return (
    <>
     <>
  {/* ════ HERO ════ */}
  <section className="bg-[#071639] relative px-8 md:px-16 py-24 w-full">
    <div className="absolute inset-0 bg-grid-ink pointer-events-none" />
    <div className="absolute -top-24 right-0 w-125 h-125 rounded-full bg-[#0474C4]/8 blur-[100px] pointer-events-none" />

    <div className="relative w-full z-2 px-8 md:px-20 py-18 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12 lg:gap-20 items-center">

      {/* Left copy */}
      <div>
        {/* Category badge — DM Sans, 11px, +0.07em, font-medium, uppercase */}
        <Link
          href={`/programs#${cat.id}`}
          className="inline-flex items-center gap-2 bg-teal-600/15 border border-teal-600/25 text-[#5EEAD4] font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium px-3.5 py-1.25 rounded-full mb-[1.4rem] no-underline transition-opacity hover:opacity-75"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#5EEAD4] inline-block" />
          {cat.label}
        </Link>

        {/* H1 — Playfair Display, 36px→48px, -0.015em→-0.02em, lh 1.2→1.1 */}
        <h1 className="font-heading text-[2.25rem] md:text-[3rem] tracking-[-0.015em] md:tracking-[-0.02em] leading-[1.2] md:leading-[1.1] font-bold text-[#F7F3ED] mb-4">
          {prog.title}
        </h1>

        {/* Lead — DM Sans, 18px, -0.01em, lh 1.65 */}
        <p className="font-body text-[1.125rem] tracking-[-0.01em] leading-[1.65] font-light text-[#F7F3ED]/50 max-w-135 mb-8">
          {prog.description}
        </p>

        {/* CTAs */}
        <div className="flex gap-3 flex-wrap mb-8">
          <Button asChild className="font-body text-[0.875rem] tracking-[0.02em] font-medium bg-teal-600 hover:bg-teal-500 text-white px-6">
            <Link href="/signup">Enrol Now</Link>
          </Button>
          <Button variant="outline" className="font-body text-[0.875rem] tracking-[0.02em] font-medium border-white/20 text-white hover:bg-white/5 bg-transparent">
            Request Group Quote
          </Button>
        </div>

        {/* Social proof */}
        {(prog.rating != null || prog.enrolledCount != null || prog.countriesCount != null) && (
          <div className="flex items-center gap-[1.8rem] flex-wrap pt-[1.8rem] border-t border-teal-600/15">

            {prog.rating != null && (
              <div className="flex items-center">
                <div className="flex gap-0.5 items-center">
                  {[1,2,3,4,5].map((i) => (
                    <svg key={i} viewBox="0 0 24 24" className="w-3.25 h-3.25 fill-[#C8A96E]">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  ))}
                </div>
                {/* Rating — Playfair Display, 16px, font-semibold */}
                <span className="font-heading text-[1rem] tracking-[-0.005em] font-semibold text-[#D4BA85] ml-1.5">
                  {prog.rating}
                </span>
                {prog.reviewCount != null && (
                  <span className="font-body text-[0.75rem] tracking-[0em] font-normal text-[#F7F3ED]/35 ml-1.5">
                    ({prog.reviewCount.toLocaleString()} reviews)
                  </span>
                )}
              </div>
            )}

            {prog.rating != null && (prog.enrolledCount != null || prog.countriesCount != null) && (
              <div className="w-px h-5.5 bg-[#F7F3ED]/10" />
            )}

            {prog.enrolledCount != null && (
              <div>
                {/* Stat — Playfair Display, 16px, font-semibold */}
                <span className="font-heading text-[1rem] tracking-[-0.005em] font-semibold text-[#F7F3ED] block leading-none mb-0.5">
                  {prog.enrolledCount.toLocaleString()}+
                </span>
                {/* Label — DM Sans, 11px, +0.07em, uppercase */}
                <span className="font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium text-[#F7F3ED]/35">
                  Enrolled
                </span>
              </div>
            )}

            {prog.enrolledCount != null && prog.countriesCount != null && (
              <div className="w-px h-5.5 bg-[#F7F3ED]/10" />
            )}

            {prog.countriesCount != null && (
              <div>
                <span className="font-heading text-[1rem] tracking-[-0.005em] font-semibold text-[#F7F3ED] block leading-none mb-0.5">
                  {prog.countriesCount}+
                </span>
                <span className="font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium text-[#F7F3ED]/35">
                  Countries
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right feature card */}
      <div className="relative z-2">
        <div className="bg-[#F7F3ED]/4 border border-teal-600/20 rounded-[10px] p-[1.8rem]">

          <div className="flex items-center gap-3 mb-[1.4rem] pb-[1.2rem] border-b border-[#F7F3ED]/[.07]">
            <div className="w-11 h-11 rounded-[10px] bg-teal-600/15 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" className="w-5.5 h-5.5 fill-none stroke-[#5EEAD4]" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                <path d="M6 12v5c3 3 9 3 12 0v-5"/>
              </svg>
            </div>
            <div>
              {/* Card label — DM Sans, 11px, +0.07em, uppercase */}
              <p className="font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium text-[#F7F3ED]/30 mb-0.5">
                Programme
              </p>
              {/* Card name — Playfair Display, 15px, -0.005em */}
              <p className="font-heading text-[0.9375rem] tracking-[-0.005em] leading-[1.3] font-medium text-[#F7F3ED]">
                {cat.label}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-[0.65rem]">
            {[
              { icon: Clock,    label: "Duration",    value: prog.duration },
              { icon: Monitor,  label: "Format",      value: prog.format,    hide: !prog.format },
              { icon: Star,     label: "Level",       value: prog.level },
              { icon: Calendar, label: "Next Intake", value: prog.nextIntake, hide: !prog.nextIntake, accent: true },
              { icon: Users,    label: "Cohort Size", value: prog.cohortSize != null ? `${prog.cohortSize} participants` : null, hide: prog.cohortSize == null },
            ]
              .filter((r) => !r.hide && r.value)
              .map(({ icon: Icon, label, value, accent }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-[6px] bg-[#F7F3ED]/5 flex items-center justify-center shrink-0">
                    <Icon className="fill-none" style={{ width: 13, height: 13, stroke: "rgba(247,243,237,0.35)", strokeWidth: 1.6, strokeLinecap: "round" as const }} />
                  </div>
                  {/* Row label — DM Sans, 12px, 0em */}
                  <span className="font-body text-[0.75rem] tracking-[0em] font-normal text-[#F7F3ED]/45 flex-1">
                    {label}
                  </span>
                  {/* Row value — DM Sans, 12px, 0em, font-medium */}
                  <span className={`font-body text-[0.75rem] tracking-[0em] font-medium whitespace-nowrap ${accent ? "text-[#5EEAD4]" : "text-[#F7F3ED]/65"}`}>
                    {value}
                  </span>
                </div>
              ))}
          </div>

          <div className="mt-[1.4rem] pt-[1.2rem] border-t border-[#F7F3ED]/[.07]">
            {/* Price label — DM Sans, 11px, +0.07em, uppercase */}
            <div className="flex justify-between font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium mb-2">
              <span className="text-[#F7F3ED]/30">Programme Fee</span>
              <span className="text-[#5EEAD4]">
                {prog.price > 0 ? `$${prog.price.toLocaleString()}` : "Free"}
              </span>
            </div>
            <div className="h-1.25 bg-[#F7F3ED]/8 rounded-[3px] mb-1.5">
              <div className="h-full rounded-[3px] w-full" style={{ background: `linear-gradient(90deg, ${cat.color}, #5EEAD4)` }} />
            </div>
            {/* Small muted — DM Sans, 12px, 0em */}
            <p className="font-body text-[0.75rem] tracking-[0em] font-normal text-[#F7F3ED]/28 mb-4">
              {prog.price > 0 ? "One-time payment · Instalment plans available" : "No payment required"}
            </p>
            <Button asChild className="w-full font-body text-[0.875rem] tracking-[0.02em] font-medium bg-teal-600 hover:bg-teal-500 text-white">
              <Link href="/signup">Enrol Now</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  </section>

  {/* ── Quick facts strip ── */}
  <div className="bg-[#06457F] border-y border-[#C8A96E]/10">
    <div className="max-w-7xl mx-auto px-8 md:px-20 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-white/10">
      {[
        { label: "Duration",    value: prog.duration },
        { label: "Level",       value: prog.level },
        { label: "Format",      value: prog.format ?? "Online" },
        { label: "Language",    value: "English" },
        prog.nextIntake ? { label: "Next Intake", value: prog.nextIntake } : null,
        { label: "Certificate", value: "Verified Digital" },
      ]
        .filter((x): x is { label: string; value: string } => x !== null)
        .map(({ label, value }) => (
          <div key={label} className="px-4 py-4">
            {/* Label — DM Sans, 11px, +0.07em, uppercase */}
            <p className="font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium text-white/45 mb-1">
              {label}
            </p>
            {/* Value — DM Sans, 14px, 0em, font-medium */}
            <p className="font-body text-[0.875rem] tracking-[0em] font-medium text-white">
              {value}
            </p>
          </div>
        ))}
    </div>
  </div>

  {/* ── Main body ── */}
  <div className="bg-white w-full">
    <div className="max-w-7xl mx-auto px-8 md:px-20 grid lg:grid-cols-[1fr_340px] gap-0 py-12">

      {/* Left column */}
      <div className="lg:pr-12 lg:border-r border-slate-100 flex flex-col gap-10">

        {/* Overview */}
        {(prog.overview || prog.objectives.length > 0) && (
          <section className="pb-10 border-b border-slate-100">
            {/* Section label — DM Sans, 11px, +0.07em, font-medium, uppercase */}
            <p className="font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium mb-1" style={{ color: cat.color }}>
              Overview
            </p>
            {/* H2 — Playfair Display, 28px, -0.01em, lh 1.25 */}
            <h2 className="font-heading text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-slate-900 mb-4">
              What You Will Learn
            </h2>
            {prog.overview && (
              <p className="font-body text-[1rem] tracking-[-0.005em] leading-[1.7] font-normal text-slate-600 mb-6">
                {prog.overview}
              </p>
            )}
            {prog.objectives.length > 0 && (
              <div className="grid sm:grid-cols-2 gap-3">
                {prog.objectives.map((obj) => (
                  <div key={obj} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center mt-0.5 shrink-0" style={{ background: `${cat.color}18` }}>
                      <CheckCircle className="h-3 w-3" style={{ color: cat.color }} />
                    </div>
                    {/* Small — DM Sans, 14px, 0em, lh 1.6 */}
                    <span className="font-body text-[0.875rem] tracking-[0em] leading-[1.6] font-normal text-slate-600">
                      {obj}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Curriculum */}
        {prog.modules.length > 0 && (
          <section className="pb-10 border-b border-slate-100">
            <p className="font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium mb-1" style={{ color: cat.color }}>
              Curriculum
            </p>
            <h2 className="font-heading text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-slate-900 mb-1">
              Programme Outline
            </h2>
            {/* Module count — DM Sans, 13px, 0em */}
            <p className="font-body text-[0.8125rem] tracking-[0em] font-normal text-slate-400 mb-6">
              {prog.modules.length} modules
            </p>
            <Accordion type="single" collapsible defaultValue="week-0">
              {prog.modules.map((mod, i) => (
                <AccordionItem key={i} value={`week-${i}`} className="border-slate-100">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-3 text-left">
                      {mod.week && (
                        <span className="font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium px-2.5 py-1 rounded-full shrink-0" style={{ background: `${cat.color}15`, color: cat.color }}>
                          {mod.week}
                        </span>
                      )}
                      <span className="font-heading text-[0.9375rem] tracking-[-0.005em] leading-[1.3] font-medium text-slate-800">
                        {mod.title}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    {mod.desc && (
                      <p className="font-body text-[0.875rem] tracking-[0em] leading-[1.6] font-normal text-slate-500 mb-3">
                        {mod.desc}
                      </p>
                    )}
                    {mod.topics && mod.topics.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {mod.topics.map((t) => (
                          <span key={t} className="font-body text-[0.6875rem] tracking-[0.05em] font-medium px-2.5 py-1 rounded-full" style={{ background: `${cat.color}12`, color: cat.color }}>
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        )}

        {/* Instructor */}
        {prog.instructor.name && (
          <section className="pb-10 border-b border-slate-100">
            <p className="font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium mb-1" style={{ color: cat.color }}>
              Programme Facilitator
            </p>
            <h2 className="font-heading text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-slate-900 mb-5">
              Meet Your Instructor
            </h2>
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-6 flex gap-5">
              {/* Avatar — Playfair Display initials */}
              <div className="w-20 h-20 rounded-full flex items-center justify-center font-heading text-[1.375rem] tracking-[-0.005em] font-semibold text-white shrink-0" style={{ background: cat.color }}>
                {prog.instructor.initials ?? prog.instructor.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                {/* Instructor name — Playfair Display, 22px, -0.005em */}
                <p className="font-heading text-[1.375rem] tracking-[-0.005em] leading-[1.3] font-medium text-slate-900 mb-0.5">
                  {prog.instructor.name}
                </p>
                {prog.instructor.title && (
                  <p className="font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium mb-3" style={{ color: cat.color }}>
                    {prog.instructor.title}
                  </p>
                )}
                {prog.instructor.bio && (
                  <p className="font-body text-[0.875rem] tracking-[0em] leading-[1.6] font-normal text-slate-600 mb-4">
                    {prog.instructor.bio}
                  </p>
                )}
                {prog.instructor.credentials.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {prog.instructor.credentials.map((c) => (
                      <span key={c} className="font-body text-[0.6875rem] tracking-[0.05em] font-medium text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-full">
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* FAQs */}
        {prog.faqs.length > 0 && (
          <section>
            <p className="font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium mb-1" style={{ color: cat.color }}>
              FAQs
            </p>
            <h2 className="font-heading text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-slate-900 mb-5">
              Frequently Asked Questions
            </h2>
            <Accordion type="single" collapsible>
              {prog.faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border-slate-100">
                  {/* FAQ question — Playfair Display, 16px, -0.005em, font-medium */}
                  <AccordionTrigger className="hover:no-underline py-4 text-left font-heading text-[1rem] tracking-[-0.005em] leading-[1.3] font-medium text-slate-800">
                    {faq.q}
                  </AccordionTrigger>
                  {/* FAQ answer — DM Sans, 15px, 0em, lh 1.7 */}
                  <AccordionContent className="pb-4 font-body text-[0.9375rem] tracking-[0em] leading-[1.7] font-normal text-slate-500">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        )}
      </div>

      {/* Sidebar */}
      <div className="lg:pl-10 flex flex-col gap-5 mt-10 lg:mt-0">

        {/* Enrol card */}
        <div className="rounded-xl w-full border border-slate-100 overflow-hidden shadow-sm">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50">
            {/* Price — Playfair Display, 32px, -0.015em, lh 1.1 */}
            <p className="font-heading text-[2rem] tracking-[-0.015em] leading-[1.1] font-bold text-slate-900 mb-1">
              {prog.price > 0 ? `$${prog.price.toLocaleString()}` : "Free"}
            </p>
            {/* Price sub — DM Sans, 12px, 0em */}
            <p className="font-body text-[0.75rem] tracking-[0em] font-normal text-slate-400">
              {prog.price > 0 ? "Full programme fee · One-time payment" : "No payment required"}
            </p>
          </div>
          <div className="px-6 py-5">
            <div className="flex flex-col gap-2.5 mb-5">
              {[
                { icon: Clock,    value: prog.duration },
                prog.nextIntake ? { icon: Calendar, value: `Next intake: ${prog.nextIntake}` } : null,
                prog.format     ? { icon: Monitor,  value: prog.format } : null,
                { icon: Award,   value: "Verified digital certificate" },
                prog.cohortSize != null ? { icon: Users, value: `${prog.cohortSize}-participant cohort` } : null,
              ]
                .filter((x): x is { icon: typeof Clock; value: string } => x !== null)
                .map(({ icon: Icon, value }) => (
                  <div key={value} className="flex items-center gap-2.5">
                    <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: cat.color }} />
                    {/* Meta — DM Sans, 13px, 0em, font-normal */}
                    <span className="font-body text-[0.8125rem] tracking-[0em] font-normal text-slate-600">
                      {value}
                    </span>
                  </div>
                ))}
            </div>
            <Button asChild className="w-full mb-2.5 font-body text-[0.875rem] tracking-[0.02em] font-medium text-white hover:opacity-90" style={{ background: cat.color }}>
              <Link href="/signup">Enrol Now</Link>
            </Button>
            <Button variant="outline" className="w-full font-body text-[0.875rem] tracking-[0.02em] font-medium border-slate-200 text-slate-700">
              Request Group Quote
            </Button>
            {prog.price > 0 && (
              <p className="font-body text-[0.75rem] tracking-[0em] font-normal text-slate-400 text-center mt-3">
                ✓ 14-day money-back guarantee · Instalment plans available
              </p>
            )}
          </div>
        </div>

        {/* What's included */}
        {prog.included.length > 0 && (
          <div className="rounded-xl w-full border border-slate-100 p-5 bg-slate-50">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-4 w-4" style={{ color: cat.color }} />
              {/* H4 — Playfair Display, 15px, -0.005em */}
              <p className="font-heading text-[0.9375rem] tracking-[-0.005em] leading-[1.3] font-medium text-slate-800">
                What&apos;s Included
              </p>
            </div>
            <div className="flex flex-col gap-2.5">
              {prog.included.map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  {/* Small — DM Sans, 13px, 0em */}
                  <span className="font-body text-[0.8125rem] tracking-[0em] font-normal text-slate-600">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related programs */}
        {prog.related.length > 0 && (
          <div className="rounded-xl border border-slate-100 p-5">
            {/* H4 — Playfair Display, 15px, -0.005em */}
            <p className="font-heading text-[0.9375rem] tracking-[-0.005em] leading-[1.3] font-medium text-slate-800 mb-3">
              You Might Also Like
            </p>
            <div className="flex flex-col">
              {prog.related.map((r) => (
                <Link key={r.slug} href={`/programs/${r.slug}`} className="py-3 border-b border-slate-100 last:border-b-0 flex items-center gap-2.5 group no-underline">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: cat.color }} />
                  {/* Title — DM Sans, 13px, 0em, font-normal */}
                  <span className="font-body text-[0.8125rem] tracking-[0em] font-normal text-slate-700 group-hover:text-teal-600 transition-colors leading-snug flex-1">
                    {r.title}
                  </span>
                  {/* Duration — DM Sans, 11px, 0em */}
                  <span className="font-body text-[0.6875rem] tracking-[0em] font-normal text-slate-400 whitespace-nowrap">
                    {r.duration}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  </div>

  {/* ── Related programs grid ── */}
  {prog.related.length > 0 && (
    <section className="bg-[#060D14] px-8 md:px-20 py-16">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            {/* Label — DM Sans, 11px, +0.07em, font-medium, uppercase */}
            <p className="font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium text-[#C8A96E] mb-2">
              Continue Learning
            </p>
            {/* H2 — Playfair Display, 28px, -0.01em, lh 1.25 */}
            <h2 className="font-heading text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-white">
              You May Also Like
            </h2>
          </div>
          {/* Link — DM Sans, 12px, +0.07em, uppercase */}
          <Link href="/programs" className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-white/45 border-b border-white/15 hover:text-white hover:border-white/40 transition-colors pb-px">
            Browse All Programs →
          </Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {prog.related.map((r) => (
            <Link key={r.slug} href={`/programs/${r.slug}`} className="bg-white/4 border border-white/8 rounded-xl p-5 hover:bg-white/6 hover:-translate-y-1 transition-all no-underline group block" style={{ borderTopWidth: "2px", borderTopColor: cat.color }}>
              {/* Category badge — DM Sans, 10px, +0.07em, font-medium, uppercase */}
              <span className="font-body text-[0.625rem] tracking-[0.07em] uppercase font-medium px-2.5 py-1 rounded-full mb-3 inline-block" style={{ background: `${cat.color}18`, color: cat.color }}>
                {cat.label.split(" ")[0]}
              </span>
              {/* H3 — Playfair Display, 15px, -0.005em, lh 1.3 */}
              <h3 className="font-heading text-[0.9375rem] tracking-[-0.005em] leading-[1.3] font-medium text-white mb-3 group-hover:text-[#C8A96E] transition-colors">
                {r.title}
              </h3>
              <div className="flex items-center justify-between pt-3 border-t border-white/8">
                {/* Meta — DM Sans, 11px, 0em */}
                <span className="font-body text-[0.6875rem] tracking-[0em] font-normal text-white/35">
                  {r.duration} · Online
                </span>
                <span className="font-body text-[0.6875rem] tracking-[0em] font-normal text-white/35 group-hover:text-white/60 transition-colors">
                  Enrol →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )}
</>
    </>
  )
}

export default withLayout(ProgramDetailPage)
