import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Clock, Monitor, Calendar, Users, BookOpen, Award, Check, DollarSign, ArrowRight } from "lucide-react"
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
  audience:       string[]
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

/** Short label for the curriculum stepper — first couple of meaningful words. */
function stepLabel(title: string): string {
  return title.replace(/[&]/g, "").split(/\s+/).filter(Boolean).slice(0, 2).join(" ")
}

// ── Resolve program from DB ───────────────────────────────────────────────────

function pickFirstFacilitator(v: unknown): {
  name: string | null
  title: string | null
  bio: string | null
  initials: string | null
  credentials: string[]
} {
  if (!Array.isArray(v) || v.length === 0) {
    return { name: null, title: null, bio: null, initials: null, credentials: [] }
  }
  const f = v[0] as Record<string, unknown>
  const name = (f.name as string) ?? null
  const initials = name
    ? name.split(/\s+/).filter(Boolean).map((w) => w[0].toUpperCase()).join("").slice(0, 4)
    : null
  const credsRaw = f.credentials
  const credentials = typeof credsRaw === "string"
    ? credsRaw.split(/\r?\n/).map(s => s.trim()).filter(Boolean)
    : Array.isArray(credsRaw) ? (credsRaw as string[]) : []
  return {
    name,
    title:    (f.title as string) ?? null,
    bio:      (f.bio   as string) ?? null,
    initials,
    credentials,
  }
}

async function resolveProgram(slug: string): Promise<PageProgram | null> {
  const dbProg = await getProgramBySlug(slug)
  if (!dbProg) return null

  const cat = catMetaFor(dbProg.category?.name)

  // Related = same-category siblings first, topped up with other programmes so
  // the "You May Also Like" section always populates when more than one exists.
  const siblingRows = dbProg.categoryId
    ? await getPrograms({ categoryId: dbProg.categoryId })
    : []
  const fillerRows = await getPrograms()
  const related = [...siblingRows, ...fillerRows]
    .filter((p) => p.slug !== slug)
    .filter((p, i, arr) => arr.findIndex((q) => q.slug === p.slug) === i)
    .slice(0, 4)
    .map((p) => ({ slug: p.slug, title: p.title, duration: p.duration ?? "Self-Paced" }))

  return {
    title:          dbProg.title,
    slug:           dbProg.slug,
    description:    dbProg.excerpt,
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
    audience:       toStrArr(dbProg.targetAudience),
    modules:        toModules(dbProg.curriculum),
    faqs:           toFaqs(dbProg.faqs),
    included:       toStrArr(dbProg.whatIsIncluded),
    instructor:     pickFirstFacilitator(dbProg.facilitators),
    cat,
    related,
  }
}

// ── Static params & metadata ──────────────────────────────────────────────────

export async function generateStaticParams() {
  const programs = await getPrograms()
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
  const priceLabel = prog.price > 0 ? `$${prog.price.toLocaleString()}` : "Free"

  const quickFacts = [
    { label: "Duration",    value: prog.duration },
    { label: "Level",       value: prog.level },
    { label: "Format",      value: prog.format ?? "Online" },
    { label: "Language",    value: "English" },
    prog.nextIntake ? { label: "Next Intake", value: prog.nextIntake, accent: true } : null,
    { label: "Certificate", value: "Verified Digital" },
  ].filter((x): x is { label: string; value: string; accent?: boolean } => x !== null)

  const enrolDetails = [
    { icon: Clock,    value: prog.duration },
    prog.nextIntake ? { icon: Calendar, value: `Next intake: ${prog.nextIntake}` } : null,
    prog.cohortSize != null ? { icon: Users, value: `Cohort of ${prog.cohortSize} participants` } : null,
    prog.format ? { icon: Monitor, value: prog.format } : null,
    { icon: Award, value: "Verified digital certificate" },
  ].filter((x): x is { icon: typeof Clock; value: string } => x !== null)

  return (
    <>
      {/* ════ BREADCRUMB ════ */}
      <nav className="w-full bg-[#F7F3ED]/95 border-b border-[#C8A96E]/25 px-6 md:px-20 py-3.5 flex flex-wrap items-center gap-2 font-body text-[0.75rem] text-[#718096]">
        <Link href="/" className="text-[#C8A96E] hover:text-[#0D1B2A] transition-colors no-underline">Home</Link>
        <span className="text-[#718096]/50">›</span>
        <Link href="/programs" className="text-[#C8A96E] hover:text-[#0D1B2A] transition-colors no-underline">Programs</Link>
        <span className="text-[#718096]/50">›</span>
        <Link href={`/programs#${cat.id}`} className="text-[#C8A96E] hover:text-[#0D1B2A] transition-colors no-underline">{cat.label}</Link>
        <span className="text-[#718096]/50">›</span>
        <span className="text-[#718096]">{prog.title}</span>
      </nav>

      {/* ════ HERO BANNER ════ */}
      <section className="relative w-full overflow-hidden bg-[#060D14] border-b border-[#C8A96E]/[.12] px-6 md:px-20 py-16 md:py-18 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10 lg:gap-20 items-center">
        {/* grid texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(13,148,136,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(13,148,136,0.03) 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />
        {/* glow */}
        <div className="absolute -top-20 right-[250px] w-100 h-100 rounded-full pointer-events-none bg-[radial-gradient(ellipse,rgba(13,148,136,0.07)_0%,transparent_70%)]" />

        {/* Left copy */}
        <div className="relative z-2">
          <Link
            href={`/programs#${cat.id}`}
            className="inline-flex items-center gap-2 bg-[#0D9488]/15 border border-[#0D9488]/25 text-[#5EEAD4] font-body text-[0.65rem] tracking-[0.12em] uppercase font-medium px-3.5 py-[5px] rounded-full mb-[1.4rem] no-underline"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#5EEAD4] inline-block" />
            {cat.label}
          </Link>

          <h1 className="font-heading text-[clamp(1.8rem,2.8vw,2.6rem)] tracking-[-0.01em] leading-[1.18] font-bold text-[#F7F3ED] mb-4">
            {prog.title}
          </h1>

          <p className="font-body text-[0.96rem] leading-[1.8] font-light text-[#F7F3ED]/50 max-w-135 mb-8">
            {prog.description}
          </p>

          {/* CTAs */}
          <div className="flex gap-3 flex-wrap mb-8">
            <Button asChild className="font-body text-[0.82rem] tracking-[0.08em] uppercase font-medium bg-[#0D9488] hover:bg-[#0F766E] text-white px-7 rounded">
              <Link href="/signup">Enrol Now</Link>
            </Button>
            <Button variant="outline" className="font-body text-[0.82rem] tracking-[0.06em] uppercase font-normal border-white/15 text-white/70 hover:text-[#F7F3ED] hover:border-white/40 bg-transparent rounded">
              Request Group Quote
            </Button>
          </div>

          {/* Social proof */}
          {(prog.rating != null || prog.enrolledCount != null || prog.countriesCount != null) && (
            <div className="flex items-center gap-[1.8rem] flex-wrap pt-[1.8rem] border-t border-[#0D9488]/15">
              {prog.rating != null && (
                <div>
                  <div className="flex gap-0.5 items-center">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <svg key={i} viewBox="0 0 24 24" className="w-3.25 h-3.25 fill-[#C8A96E]">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ))}
                    <span className="font-heading text-[1rem] text-[#E8D5A8] ml-1.5">{prog.rating}</span>
                  </div>
                  {prog.reviewCount != null && (
                    <div className="font-body text-[0.75rem] text-[#F7F3ED]/35 mt-[3px]">
                      from {prog.reviewCount.toLocaleString()} participant reviews
                    </div>
                  )}
                </div>
              )}

              {prog.rating != null && prog.enrolledCount != null && (
                <div className="w-px h-5.5 bg-[#F7F3ED]/10" />
              )}

              {prog.enrolledCount != null && (
                <div>
                  <span className="font-heading text-[1rem] text-[#F7F3ED] block leading-none mb-0.5">
                    {prog.enrolledCount.toLocaleString()}+
                  </span>
                  <span className="font-body text-[0.67rem] tracking-[0.08em] uppercase text-[#F7F3ED]/35">
                    Enrolled to date
                  </span>
                </div>
              )}

              {prog.enrolledCount != null && prog.countriesCount != null && (
                <div className="w-px h-5.5 bg-[#F7F3ED]/10" />
              )}

              {prog.countriesCount != null && (
                <div>
                  <span className="font-heading text-[1rem] text-[#F7F3ED] block leading-none mb-0.5">
                    {prog.countriesCount}+
                  </span>
                  <span className="font-body text-[0.67rem] tracking-[0.08em] uppercase text-[#F7F3ED]/35">
                    Countries
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right feature card */}
        <div className="relative z-2 hidden lg:block">
          <div className="bg-[#F7F3ED]/4 border border-[#0D9488]/20 rounded-[10px] p-[1.8rem]">
            <div className="flex items-center gap-3 mb-[1.4rem] pb-[1.2rem] border-b border-[#F7F3ED]/[.07]">
              <div className="w-11 h-11 rounded-[10px] bg-[#0D9488]/15 flex items-center justify-center shrink-0">
                <BookOpen className="w-5.5 h-5.5 stroke-[#5EEAD4]" strokeWidth={1.6} />
              </div>
              <div>
                <p className="font-body text-[0.62rem] tracking-[0.12em] uppercase text-[#F7F3ED]/30 mb-0.5">
                  Programme
                </p>
                <p className="font-heading text-[0.92rem] leading-[1.3] text-[#F7F3ED]">{cat.label}</p>
              </div>
            </div>

            <div className="flex flex-col gap-[0.65rem]">
              {[
                { icon: Clock,    label: "Duration",      value: prog.duration },
                { icon: BookOpen, label: "Modules",       value: prog.modules.length > 0 ? `${prog.modules.length} Modules` : null, hide: prog.modules.length === 0 },
                { icon: Monitor,  label: "Format",        value: prog.format, hide: !prog.format },
                { icon: Award,    label: "Certificate",   value: "Verified Digital" },
                { icon: Calendar, label: "Next Intake",   value: prog.nextIntake, hide: !prog.nextIntake, accent: true },
                { icon: DollarSign, label: "Programme Fee", value: priceLabel, gold: true },
              ]
                .filter((r) => !r.hide && r.value)
                .map(({ icon: Icon, label, value, accent, gold }) => (
                  <div key={label} className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-[6px] bg-[#F7F3ED]/5 flex items-center justify-center shrink-0">
                      <Icon className="w-3.25 h-3.25 stroke-[#F7F3ED]/35" strokeWidth={1.6} />
                    </div>
                    <span className="font-body text-[0.77rem] text-[#F7F3ED]/45 flex-1">{label}</span>
                    <span
                      className={`font-body text-[0.75rem] whitespace-nowrap ${
                        accent ? "text-[#5EEAD4]" : gold ? "text-[#E8D5A8]" : "text-[#F7F3ED]/65"
                      }`}
                    >
                      {value}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════ MOBILE STICKY ENROL BAR ════ */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-150 bg-[#0D1B2A] border-t border-[#C8A96E]/20 px-6 py-4 flex items-center justify-between gap-4 shadow-[0_-8px_30px_rgba(0,0,0,0.3)]">
        <div>
          <div className="font-heading text-[1.4rem] text-[#E8D5A8]">{priceLabel}</div>
          {prog.nextIntake && <div className="font-body text-[0.7rem] text-[#F7F3ED]/35">{prog.duration} · {prog.nextIntake}</div>}
        </div>
        <Button asChild className="font-body text-[0.82rem] tracking-[0.08em] uppercase font-medium bg-[#0D9488] hover:bg-[#0F766E] text-white rounded shrink-0">
          <Link href="/signup">Enrol Now</Link>
        </Button>
      </div>

      {/* ════ TWO-COLUMN PAGE ════ */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-[1fr_340px] max-w-350 mx-auto bg-[#FDFAF6] items-start">
        {/* ── MAIN CONTENT ── */}
        <main className="px-6 py-12 md:py-16 lg:pr-16 lg:pl-20 border-b lg:border-b-0 lg:border-r border-[#C8A96E]/25">
          {/* Program header — quick facts */}
          <div className="mb-12 pb-12 border-b border-[#C8A96E]/25">
            <div className="flex flex-col sm:flex-row flex-wrap rounded-[2px] overflow-hidden border border-[#C8A96E]/25">
              {quickFacts.map((f) => (
                <div
                  key={f.label}
                  className="flex-1 min-w-30 py-4 px-[1.2rem] bg-[#F7F3ED] border-b sm:border-b-0 sm:border-r border-[#C8A96E]/25 last:border-0"
                >
                  <p className="font-body text-[0.62rem] tracking-[0.12em] uppercase text-[#718096] mb-1">
                    {f.label}
                  </p>
                  <p className={`font-heading text-[1rem] ${f.accent ? "text-[#0D9488]" : "text-[#0D1B2A]"}`}>
                    {f.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Overview */}
          {(prog.overview || prog.objectives.length > 0 || prog.audience.length > 0) && (
            <section className="mb-14 pb-14 border-b border-[#C8A96E]/25">
              <p className="flex items-center gap-2.5 font-body text-[0.65rem] tracking-[0.18em] uppercase text-[#0D9488] mb-3 before:content-[''] before:w-5 before:h-px before:bg-[#0D9488]">
                Overview
              </p>
              <h2 className="font-heading text-[1.5rem] leading-[1.3] text-[#0D1B2A] mb-5">What You Will Learn</h2>
              {prog.overview && (
                <p className="font-body text-[0.94rem] leading-[1.85] font-light text-[#4A5568] whitespace-pre-line">
                  {prog.overview}
                </p>
              )}

              {prog.objectives.length > 0 && (
                <div className="mt-6 flex flex-col gap-[0.7rem]">
                  {prog.objectives.map((obj) => (
                    <div key={obj} className="flex items-start gap-3 font-body text-[0.9rem] leading-[1.65] font-light text-[#4A5568]">
                      <span className="w-5 h-5 rounded-full bg-[#CCFBF1] flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-2.75 h-2.75 stroke-[#0D9488]" strokeWidth={2.5} />
                      </span>
                      {obj}
                    </div>
                  ))}
                </div>
              )}

              {prog.audience.length > 0 && (
                <>
                  <p className="flex items-center gap-2.5 font-body text-[0.65rem] tracking-[0.18em] uppercase text-[#0D9488] mt-10 mb-3 before:content-[''] before:w-5 before:h-px before:bg-[#0D9488]">
                    Who This Programme Is For
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {prog.audience.map((a) => (
                      <div
                        key={a}
                        className="bg-[#F7F3ED] border border-[#C8A96E]/25 rounded-[2px] py-4 px-[1.2rem] flex items-center gap-2.5 font-body text-[0.84rem] font-light text-[#4A5568]"
                      >
                        <span className="w-[7px] h-[7px] rounded-full bg-[#0D9488] shrink-0" />
                        {a}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>
          )}

          {/* Curriculum */}
          {prog.modules.length > 0 && (
            <section className="mb-14 pb-14 border-b border-[#C8A96E]/25">
              <p className="flex items-center gap-2.5 font-body text-[0.65rem] tracking-[0.18em] uppercase text-[#0D9488] mb-3 before:content-[''] before:w-5 before:h-px before:bg-[#0D9488]">
                Curriculum
              </p>
              <h2 className="font-heading text-[1.5rem] leading-[1.3] text-[#0D1B2A] mb-4">Programme Outline</h2>
              <p className="font-body text-[0.94rem] leading-[1.85] font-light text-[#4A5568] mb-6">
                The programme is structured across {prog.modules.length} modules, each covering one stage of learning with live sessions, self-paced content, and a practical assignment.
              </p>

              {/* Week stepper */}
              <div
                className="hidden sm:grid gap-1 mb-8 relative"
                style={{ gridTemplateColumns: `repeat(${prog.modules.length}, minmax(0, 1fr))` }}
              >
                <div className="absolute top-4 left-0 right-0 h-0.5 bg-[#C8A96E]/25 z-0" />
                <div
                  className="absolute top-4 left-0 h-0.5 bg-[#0D9488] z-1"
                  style={{ width: `${100 / prog.modules.length}%` }}
                />
                {prog.modules.map((mod, i) => (
                  <div key={i} className="flex flex-col items-center gap-1.5 relative z-2">
                    <div
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-heading text-[0.72rem] ${
                        i === 0
                          ? "bg-[#0D9488] border-[#0D9488] text-white"
                          : "bg-[#FDFAF6] border-[#C8A96E]/25 text-[#718096]"
                      }`}
                    >
                      {i + 1}
                    </div>
                    <span className={`text-[0.6rem] text-center leading-[1.3] ${i === 0 ? "text-[#0D9488]" : "text-[#718096]"}`}>
                      {stepLabel(mod.title)}
                    </span>
                  </div>
                ))}
              </div>

              <Accordion type="single" collapsible defaultValue="mod-0" className="flex flex-col gap-2">
                {prog.modules.map((mod, i) => (
                  <AccordionItem
                    key={i}
                    value={`mod-${i}`}
                    className="border border-[#C8A96E]/25 rounded-[2px] overflow-hidden"
                  >
                    <AccordionTrigger className="group hover:no-underline px-5 py-[1.1rem] bg-[#FDFAF6] hover:bg-[#F7F3ED] data-[state=open]:bg-[#0D1B2A] transition-colors">
                      <div className="flex items-center gap-3.5 text-left flex-1">
                        <span className="font-heading text-[0.75rem] text-[#0D9488] bg-[#CCFBF1] px-2.5 py-[3px] rounded-[10px] shrink-0 whitespace-nowrap group-data-[state=open]:bg-[#0D9488]/20 group-data-[state=open]:text-[#5EEAD4]">
                          {mod.week ?? `Week ${i + 1}`}
                        </span>
                        <span className="font-heading text-[0.98rem] leading-[1.3] text-[#0D1B2A] group-data-[state=open]:text-[#F7F3ED]">
                          {mod.title}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-5 py-[1.2rem] bg-[#F7F3ED] border-t border-[#C8A96E]/25">
                      {mod.desc && (
                        <p className="font-body text-[0.85rem] leading-[1.75] font-light text-[#4A5568] mb-4">
                          {mod.desc}
                        </p>
                      )}
                      {mod.topics && mod.topics.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {mod.topics.map((t) => (
                            <span key={t} className="font-body text-[0.72rem] text-[#0F766E] bg-[#CCFBF1] px-3 py-1 rounded-[10px]">
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
            <section className="mb-14 pb-14 border-b border-[#C8A96E]/25">
              <p className="flex items-center gap-2.5 font-body text-[0.65rem] tracking-[0.18em] uppercase text-[#0D9488] mb-3 before:content-[''] before:w-5 before:h-px before:bg-[#0D9488]">
                Programme Facilitator
              </p>
              <h2 className="font-heading text-[1.5rem] leading-[1.3] text-[#0D1B2A] mb-2">Meet Your Instructor</h2>

              <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-6 items-start bg-[#F7F3ED] border border-[#C8A96E]/25 rounded-[2px] p-8 mt-6">
                <div className="w-20 h-20 rounded-full bg-[#0D1B2A] border-[3px] border-[#CCFBF1] flex items-center justify-center font-heading text-[1.4rem] text-[#E8D5A8] shrink-0">
                  {prog.instructor.initials ?? prog.instructor.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-heading text-[1.2rem] leading-[1.3] text-[#0D1B2A] mb-0.5">{prog.instructor.name}</p>
                  {prog.instructor.title && (
                    <p className="font-body text-[0.78rem] tracking-[0.06em] uppercase text-[#0D9488] mb-3">
                      {prog.instructor.title}
                    </p>
                  )}
                  {prog.instructor.bio && (
                    <p className="font-body text-[0.86rem] leading-[1.75] font-light text-[#4A5568] mb-4 whitespace-pre-line">
                      {prog.instructor.bio}
                    </p>
                  )}
                  {prog.instructor.credentials.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {prog.instructor.credentials.map((c) => (
                        <span key={c} className="font-body text-[0.72rem] text-[#4A5568] bg-[#FDFAF6] border border-[#C8A96E]/25 px-3 py-1 rounded-[10px]">
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
              <p className="flex items-center gap-2.5 font-body text-[0.65rem] tracking-[0.18em] uppercase text-[#0D9488] mb-3 before:content-[''] before:w-5 before:h-px before:bg-[#0D9488]">
                FAQs
              </p>
              <h2 className="font-heading text-[1.5rem] leading-[1.3] text-[#0D1B2A] mb-2">Frequently Asked Questions</h2>

              <Accordion type="single" collapsible className="mt-6 border-t border-[#C8A96E]/25">
                {prog.faqs.map((faq, i) => (
                  <AccordionItem key={i} value={`faq-${i}`} className="border-b border-[#C8A96E]/25">
                    <AccordionTrigger className="hover:no-underline py-[1.2rem] text-left font-heading text-[0.98rem] leading-[1.35] text-[#0D1B2A] data-[state=open]:text-[#0D9488]">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="pb-[1.2rem] font-body text-[0.88rem] leading-[1.85] font-light text-[#4A5568]">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          )}
        </main>

        {/* ── SIDEBAR ── */}
        <aside className="px-6 py-12 lg:p-12 lg:sticky lg:top-[68px] flex flex-col gap-6">
          {/* Enrol card */}
          <div className="bg-[#0D1B2A] rounded-[8px] overflow-hidden">
            <div className="p-8 border-b border-[#C8A96E]/[.12]">
              <span className="font-heading text-[2.4rem] text-[#E8D5A8] leading-none block mb-1">{priceLabel}</span>
              <span className="font-body text-[0.75rem] text-[#F7F3ED]/35">
                {prog.price > 0 ? "Full programme fee · One-time payment" : "No payment required"}
              </span>
            </div>
            <div className="px-8 py-6">
              <div className="flex flex-col gap-[0.7rem] mb-6">
                {enrolDetails.map(({ icon: Icon, value }) => (
                  <div key={value} className="flex items-center gap-2.5 font-body text-[0.82rem] font-light text-[#F7F3ED]/55">
                    <Icon className="w-3.75 h-3.75 stroke-[#0D9488] shrink-0" strokeWidth={1.6} />
                    {value}
                  </div>
                ))}
              </div>
              <Button asChild className="w-full mb-2.5 font-body text-[0.82rem] tracking-[0.08em] uppercase font-medium bg-[#0D9488] hover:bg-[#0F766E] text-white rounded">
                <Link href="/signup">Enrol Now</Link>
              </Button>
              <Button variant="outline" className="w-full font-body text-[0.82rem] tracking-[0.06em] uppercase font-normal bg-transparent border-white/15 text-[#F7F3ED]/60 hover:text-[#F7F3ED] hover:border-white/40 rounded">
                Request Group Quote
              </Button>
              {prog.price > 0 && (
                <p className="font-body text-[0.72rem] text-[#F7F3ED]/28 text-center mt-4 leading-[1.5]">
                  ✓ 14-day money-back guarantee · Instalment plans available
                </p>
              )}
            </div>
          </div>

          {/* What's included */}
          {prog.included.length > 0 && (
            <div className="bg-[#F7F3ED] border border-[#C8A96E]/25 rounded-[2px] p-6">
              <div className="font-heading text-[0.95rem] text-[#0D1B2A] mb-4">What&apos;s Included</div>
              <div className="flex flex-col gap-[0.6rem]">
                {prog.included.map((item) => (
                  <div key={item} className="flex items-center gap-2.5 font-body text-[0.82rem] font-light text-[#4A5568]">
                    <Check className="w-3.5 h-3.5 stroke-[#0D9488] shrink-0" strokeWidth={2} />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certificate preview */}
          <div className="relative overflow-hidden bg-[#060D14] border border-[#C8A96E]/[.12] rounded-[8px] p-7 text-center">
            <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full pointer-events-none bg-[radial-gradient(ellipse,rgba(200,169,110,0.06)_0%,transparent_70%)]" />
            <div className="relative w-14 h-14 rounded-full bg-[#C8A96E]/10 border border-[#C8A96E]/25 flex items-center justify-center mx-auto mb-4">
              <Award className="w-6.5 h-6.5 stroke-[#C8A96E]" strokeWidth={1.5} />
            </div>
            <div className="relative font-heading text-[0.95rem] text-[#F7F3ED] mb-1.5">ARPS Institute Certificate</div>
            <div className="relative font-body text-[0.76rem] leading-[1.55] font-light text-[#F7F3ED]/38">
              Upon completion you will receive a digitally signed, QR-verified certificate — shareable on LinkedIn and recognised globally.
            </div>
          </div>
        </aside>
      </div>

      {/* ════ YOU MAY ALSO LIKE ════ */}
      {prog.related.length > 0 && (
        <section className="w-full bg-[#EDF2FB] border-t border-[#C8A96E]/[.12] px-6 md:px-20 py-16 md:py-20">
          <div className="flex items-end justify-between gap-8 flex-wrap mb-12">
            <div>
              <p className="font-body text-[0.68rem] tracking-[0.18em] uppercase text-[#C8A96E] mb-3">Continue Learning</p>
              <h2 className="font-heading text-[clamp(1.5rem,2.5vw,2rem)] leading-[1.2] text-[#F7F3ED]">You May Also Like</h2>
            </div>
            <Link
              href={`/programs#${cat.id}`}
              className="font-body text-[0.78rem] tracking-[0.08em] uppercase text-[#F7F3ED]/45 hover:text-[#E8D5A8] border-b border-[#F7F3ED]/15 hover:border-[#C8A96E] pb-0.5 whitespace-nowrap transition-colors no-underline"
            >
              Browse All Programs →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {prog.related.map((r) => (
              <Link
                key={r.slug}
                href={`/programs/${r.slug}`}
                className="flex flex-col gap-3 sm:gap-4 group bg-white/90 border border-[#0474C4]/25 rounded p-5 sm:p-6 hover:border-[#0474C4]/55 hover:-translate-y-0.5 transition-all no-underline"
              >
                <span className="font-body text-[0.62rem] tracking-widest font-medium bg-[#0474C4]/10 text-[#0474C4] px-2.5 py-[3px] rounded-[10px] w-fit mb-4">
                  {cat.label}
                </span>
                <div className="font-heading line-clamp-2 text-[1.125rem] sm:text-[1.25rem] md:text-[1.375rem] tracking-[-0.005em] leading-[1.3] font-medium text-[#262B40] group-hover:text-[#0474C4] transition-colors">{r.title}</div>
                <div className="flex items-center justify-between pt-4 border-t border-[#C8A96E]/10">
                  <span className="flex items-center gap-1.5 font-body text-[0.72rem] font-light text-[#F7F3ED]/35">
                    <Clock className="w-2.75 h-2.75 stroke-[#F7F3ED]/30" strokeWidth={1.5} />
                    {r.duration}
                  </span>
                  <span className="flex items-center gap-1 font-body text-[0.72rem] text-[#0D9488]/60 group-hover:text-[#5EEAD4] transition-all">
                    Enrol <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  )
}

export default withLayout(ProgramDetailPage)
