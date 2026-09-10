import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { programCategories } from "@/lib/data"
import { getProgramBySlug, getPrograms } from "@/services/program.service"
import withLayout from "@/hooks/useLayout"
import EnrollCTA from "./EnrollCTA"
import ShareButton from "./ShareButton"
import CurriculumAccordion from "./CurriculumAccordion"
import FaqAccordion from "./FaqAccordion"
import InstructorProfileModal, { type InstructorProgramStat } from "./InstructorProfileModal"

// ── Types ─────────────────────────────────────────────────────────────────────

type CatMeta = { id: string; label: string; color: string; bg: string }
type PageModule = { week?: string; title: string; desc?: string; topics?: string[] }
type PageFaq = { q: string; a: string }

type RelatedProgram = {
  slug: string; title: string; duration: string; categoryLabel: string
  thumbnail: string | null; price: number; rating: number | null
}

type PageProgram = {
  id:             string
  title:          string
  slug:           string
  description:    string
  thumbnail:      string | null
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
  cat: CatMeta
  related: RelatedProgram[]
  moreByInstructor: RelatedProgram[]
  instructorProgramCount:  number
  instructorPrograms:      InstructorProgramStat[]
  instructorAvgRating:     string | null
  instructorTotalReviews:  number
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

/** Fisher-Yates shuffle — used to randomize the "You May Also Like" picks. */
function shuffle<T>(items: T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
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

// ── Small shared bits ────────────────────────────────────────────────────────

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 font-body text-[10.5px] tracking-[0.18em] uppercase text-[#128C6E]">
      <span className="w-4.5 h-px bg-[#128C6E]" />
      {children}
    </div>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-heading font-medium text-[32px] leading-[1.15] tracking-[-0.015em] text-[#0B2239] max-[760px]:text-[26px]">
      {children}
    </h2>
  )
}

// ── Program mini card (You May Also Like / More by Instructor) ─────────────────

function ProgramMiniCard({ program }: { program: RelatedProgram }) {
  const price = program.price > 0 ? `$${program.price.toLocaleString()}` : "Free"
  return (
    <Link
      href={`/programs/${program.slug}`}
      className="block bg-white border border-[#E1E8F4] rounded-[3px] overflow-hidden text-[#1C2430] hover:border-[#0B6FC4] transition-colors duration-200"
    >
      <div className="relative aspect-video bg-[#EFEAE1]">
        {program.thumbnail ? (
          <Image src={program.thumbnail} alt={program.title} fill className="object-cover" />
        ) : (
          <div className="absolute inset-0" style={{ background: "repeating-linear-gradient(135deg,#EFEAE1 0 8px,#E7E1D6 8px 16px)" }} />
        )}
      </div>
      <div className="px-4.5 pt-4 pb-4.5">
        <div className="font-body text-[10px] tracking-[0.14em] uppercase text-[#0B6FC4]">{program.categoryLabel}</div>
        <div className="mt-2 font-heading text-[17px] leading-[1.3] text-[#0B2239] line-clamp-2 min-h-[2.6em]">{program.title}</div>
        <div className="mt-3 pt-3 border-t border-[#EFEAE1] flex items-center justify-between font-body text-[13px] text-[#6B7684]">
          <span>{program.rating != null ? `★ ${program.rating}` : program.duration}</span>
          <span className="text-[#0B2239]">{price}</span>
        </div>
      </div>
    </Link>
  )
}

// ── Purchase card — sticky rail, overlaps the hero via CSS grid row-span ───────

function PurchaseCard({ prog }: { prog: PageProgram }) {
  const priceLabel = prog.price > 0 ? `$${prog.price.toLocaleString()}` : "Free"
  const bullets = prog.included.length > 0
    ? prog.included.slice(0, 4)
    : [prog.duration, "Verified digital certificate", "Full lifetime access"].filter(Boolean)

  return (
    <div className="bg-white rounded-[4px] overflow-hidden shadow-[0_24px_60px_rgba(6,28,50,0.28)] text-[#1C2430]">
      {/* Preview */}
      <div className="relative aspect-[16/10] flex items-center justify-center" style={{ background: "repeating-linear-gradient(135deg,#E7E2D9 0 8px,#DFD9CE 8px 16px)" }}>
        {prog.thumbnail && <Image src={prog.thumbnail} alt={prog.title} fill className="object-cover" />}
        <button
          type="button"
          className="relative z-10 w-13 h-13 rounded-full bg-white shadow-[0_6px_18px_rgba(0,0,0,0.2)] cursor-pointer text-[#0A3D6B] text-[15px] flex items-center justify-center pl-[3px]"
        >
          ▶
        </button>
        <div className="absolute left-3.5 bottom-3 z-10 font-body text-[11px] tracking-[0.1em] uppercase text-[#5A6675]">
          Preview this programme
        </div>
      </div>

      {/* Body */}
      <div className="px-6 pt-5.5 pb-6">
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <div>
            <div className="font-heading text-[32px] leading-none text-[#0A3D6B]">{priceLabel}</div>
            <div className="mt-1.5 font-body text-[13px] text-[#6B7684]">
              {prog.price > 0 ? "One-time payment" : "No payment required"}
            </div>
          </div>
          <div className="font-body text-[11px] tracking-[0.12em] uppercase text-[#0E6E57] bg-[#E8F5F0] px-2.25 py-1.25 rounded-[3px] whitespace-nowrap">
            Open enrolment
          </div>
        </div>

        <EnrollCTA
          programId={prog.id}
          programSlug={prog.slug}
          className="mt-5 w-full h-12 rounded-[3px] bg-[#0B6FC4] hover:bg-[#0A5CA5] text-white font-body text-[13px] font-semibold tracking-[0.14em] uppercase transition-colors duration-200"
        >
          Enrol Now
        </EnrollCTA>

        <div className="mt-3.5 flex justify-center">
          <ShareButton className="font-body text-[12.5px] text-[#6B7684] hover:text-[#0A3D6B] transition-colors duration-200 cursor-pointer" />
        </div>

        <div className="mt-5.5 pt-5 border-t border-[#EAE5DC]">
          <div className="font-body text-[10.5px] tracking-[0.16em] uppercase text-[#5A6675]">In this programme</div>
          <div className="grid gap-2.5 mt-3">
            {bullets.map((item) => (
              <div key={item} className="flex gap-2.25">
                <span className="text-[#128C6E] shrink-0">✓</span>
                <span className="font-body text-[13.5px] leading-[1.45] text-[#3E4A59]">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
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
  if (!dbProg || dbProg.status !== "PUBLISHED") return null

  const cat = catMetaFor(dbProg.category?.name)

  // Related = same-category siblings first, topped up with other programmes so
  // the "You May Also Like" section always populates when more than one exists —
  // shuffled so it's a different random 4 on each visit, not always the same set.
  // Status is explicitly PUBLISHED-only here — getPrograms() has no default
  // status filter, so omitting this would leak draft programmes onto a public
  // page (their cards would render but 404 on click).
  const siblingRows = dbProg.categoryId
    ? await getPrograms({ categoryId: dbProg.categoryId, status: "PUBLISHED" })
    : []
  const fillerRows = await getPrograms({ status: "PUBLISHED" })
  const relatedPool = [...siblingRows, ...fillerRows]
    .filter((p) => p.slug !== slug)
    .filter((p, i, arr) => arr.findIndex((q) => q.slug === p.slug) === i)
  const toRelated = (p: (typeof relatedPool)[number]): RelatedProgram => ({
    slug: p.slug, title: p.title, duration: p.duration ?? "Self-Paced",
    thumbnail: p.thumbnail, price: p.price, rating: p.rating,
    categoryLabel: catMetaFor(p.category?.name).label,
  })
  const related = shuffle(relatedPool).slice(0, 4).map(toRelated)

  // Other published programmes by the same instructor (real data — no synthetic
  // "instructor stats" like Udemy's review/course counts, since this app doesn't
  // track those in aggregate). Full list kept for an accurate count; only the
  // first 3 are shown as cards.
  const instructorRows = (await getPrograms({ instructorId: dbProg.instructorId, status: "PUBLISHED" }))
    .filter((p) => p.slug !== slug)
  const moreByInstructor = instructorRows.slice(0, 3).map(toRelated)

  // Instructor profile modal — real aggregates from every published programme
  // they teach (this one included), not synthetic Udemy-style stats.
  const levelLabel = (lvl: string) => lvl.charAt(0) + lvl.slice(1).toLowerCase()
  const instructorPrograms: InstructorProgramStat[] = [dbProg, ...instructorRows].map((p) => ({
    slug:  p.slug,
    title: p.title,
    meta:  `${p.duration ?? "Self-Paced"} · ${levelLabel(p.level)}`,
    price: p.price > 0 ? `$${p.price.toLocaleString()}` : "Free",
    rating:      p.rating,
    reviewCount: p.reviewCount,
  }))
  const ratedInstructorPrograms = instructorPrograms.filter((p) => p.rating != null && p.reviewCount != null)
  const instructorTotalReviews = ratedInstructorPrograms.reduce((sum, p) => sum + (p.reviewCount ?? 0), 0)
  const instructorAvgRating = instructorTotalReviews > 0
    ? (ratedInstructorPrograms.reduce((sum, p) => sum + (p.rating ?? 0) * (p.reviewCount ?? 0), 0) / instructorTotalReviews).toFixed(1)
    : null

  // Modal only shows the top 5 by rating (unrated programmes sort last, tied
  // ratings broken by review count) — "View more" is disabled until the
  // /programs sidebar gets a facilitator filter to link out to.
  const topInstructorPrograms = [...instructorPrograms].sort((a, b) => {
    if (a.rating == null && b.rating == null) return (b.reviewCount ?? 0) - (a.reviewCount ?? 0)
    if (a.rating == null) return 1
    if (b.rating == null) return -1
    if (b.rating !== a.rating) return b.rating - a.rating
    return (b.reviewCount ?? 0) - (a.reviewCount ?? 0)
  }).slice(0, 5)

  return {
    id:             dbProg.id,
    title:          dbProg.title,
    slug:           dbProg.slug,
    thumbnail:      dbProg.thumbnail,
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
    moreByInstructor,
    instructorProgramCount: instructorRows.length + 1, // +1 for this programme itself
    instructorPrograms: topInstructorPrograms,
    instructorAvgRating,
    instructorTotalReviews,
  }
}

// ── Static params & metadata ──────────────────────────────────────────────────

export async function generateStaticParams() {
  const programs = await getPrograms({ status: "PUBLISHED" })
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

  const priceLabel = prog.price > 0 ? `$${prog.price.toLocaleString()}` : "Free"
  const totalLessonCount = prog.modules.reduce((sum, m) => sum + (m.topics?.length ?? 0), 0)

  const quickFacts = [
    { label: "Duration",    value: prog.duration },
    { label: "Level",       value: prog.level },
    { label: "Format",      value: prog.format ?? "Online" },
    { label: "Language",    value: "English" },
    { label: "Certificate", value: "Verified Digital" },
  ]

  return (
    <div className="w-full overflow-x-clip">
      <div className="w-full max-w-[1240px] mx-auto px-7 max-[760px]:px-5 grid grid-cols-1 min-[901px]:grid-cols-[minmax(0,1fr)_minmax(320px,372px)] min-[901px]:gap-x-14 items-start">

        {/* ════ HERO — text column ════ */}
        <div className="relative min-[901px]:col-start-1 min-[901px]:row-start-1 text-white pt-14 pb-14 max-[760px]:pt-9 max-[760px]:pb-11">
          {/* full-bleed dark background, this column only */}
          <div className="absolute inset-y-0 -left-[100vw] -right-[100vw] bg-[#0A3D6B] -z-10" aria-hidden />

          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/12 border border-white/18 font-body text-[11px] tracking-[0.14em] uppercase text-[#BFE0D6]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3FBE9C]" />
              {prog.cat.label}
            </div>

            <h1 className="font-heading font-medium text-[clamp(34px,4.2vw,56px)] leading-[1.06] tracking-[-0.02em] mt-5.5 max-w-[16em] text-pretty">
              {prog.title}
            </h1>

            <p className="mt-5 max-w-[34em] font-body text-[17px] leading-[1.6] text-[#C6D6E6] text-pretty">
              {prog.description}
            </p>

            {(prog.rating != null || prog.enrolledCount != null || prog.countriesCount != null) && (
              <div className="flex flex-wrap gap-y-5 items-start mt-10">
                {prog.rating != null && (
                  <div className="pr-7">
                    <div className="flex items-center gap-2">
                      <span className="text-[#F0B429] text-[15px] tracking-[2px]">★★★★★</span>
                      <span className="font-heading text-[20px] leading-none">{prog.rating}</span>
                    </div>
                    {prog.reviewCount != null && (
                      <div className="mt-1.5 font-body text-[12.5px] text-[#9FB6CC]">
                        from {prog.reviewCount.toLocaleString()} participant reviews
                      </div>
                    )}
                  </div>
                )}
                {prog.enrolledCount != null && (
                  <div className="px-7 border-l border-white/16 max-[980px]:pl-0 max-[980px]:pr-7 max-[980px]:border-l-0">
                    <div className="font-heading text-[20px] leading-none">{prog.enrolledCount.toLocaleString()}+</div>
                    <div className="mt-1.5 font-body text-[11px] tracking-[0.14em] uppercase text-[#9FB6CC]">Enrolled to date</div>
                  </div>
                )}
                {prog.countriesCount != null && (
                  <div className="px-7 border-l border-white/16 max-[980px]:pl-0 max-[980px]:pr-7 max-[980px]:border-l-0">
                    <div className="font-heading text-[20px] leading-none">{prog.countriesCount}+</div>
                    <div className="mt-1.5 font-body text-[11px] tracking-[0.14em] uppercase text-[#9FB6CC]">Countries</div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-11 grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] border-t border-white/16">
              {quickFacts.map((f, i) => (
                <div key={f.label} className={`pt-4.5 pr-5 ${i > 0 ? "border-l border-white/14 pl-5 max-[760px]:pl-0 max-[760px]:pr-3 max-[760px]:border-l-0" : ""}`}>
                  <div className="font-body text-[10.5px] tracking-[0.16em] uppercase text-[#8FA9C2]">{f.label}</div>
                  <div className="mt-1.5 font-heading text-[17px]">{f.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ════ RAIL — spans hero + main via CSS grid row-span, so it overlaps
              the hero's bottom edge regardless of how tall the hero renders
              (title length varies per programme — a fixed pixel offset would
              only work for one specific height). Sticky within that span. ════ */}
        <div className="min-[901px]:col-start-2 min-[901px]:row-start-1 min-[901px]:row-span-2 min-[901px]:sticky min-[901px]:top-22 pt-6 pb-10 max-[760px]:pb-7">
          <PurchaseCard prog={prog} />

          <div className="mt-4 bg-[#0B2239] rounded-[4px] px-6 py-5.5 text-white flex gap-4 items-start">
            <div className="w-8.5 h-8.5 rounded-full border border-[#F0B429]/50 text-[#F0B429] flex items-center justify-center text-[15px] shrink-0">♛</div>
            <div>
              <div className="font-heading text-[16px]">ARPS Institute Certificate</div>
              <div className="mt-1.5 font-body text-[13px] leading-[1.5] text-[#A9BACB]">
                Upon completion you will receive a digitally signed, QR-verified certificate – shareable on LinkedIn and recognised globally.
              </div>
            </div>
          </div>
        </div>

        {/* ════ MAIN CONTENT ════ */}
        <div className="min-[901px]:col-start-1 min-[901px]:row-start-2 max-w-[44em] pt-18 pb-22 max-[760px]:pt-11 max-[760px]:pb-14">

          {(prog.overview || prog.objectives.length > 0) && (
            <section>
              <Kicker>Overview</Kicker>
              <div className="mt-3.5 mb-4.5"><SectionHeading>What You Will Learn</SectionHeading></div>
              {prog.overview && (
                <p className="font-body text-[16.5px] leading-[1.68] text-[#3E4A59] text-pretty">{prog.overview}</p>
              )}
              {prog.objectives.length > 0 && (
                <div className="grid gap-px mt-7.5 bg-[#EAE5DC] border-y border-[#EAE5DC]">
                  {prog.objectives.map((obj) => (
                    <div key={obj} className="bg-[#FFFDFA] py-4 flex gap-3.5 items-start">
                      <span className="w-5 h-5 rounded-full bg-[#E8F5F0] text-[#128C6E] text-[11px] flex items-center justify-center shrink-0 mt-0.5">✓</span>
                      <span className="font-body text-[15.5px] leading-[1.55] text-[#2A3441]">{obj}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {prog.audience.length > 0 && (
            <section className="mt-16">
              <Kicker>Who this programme is for</Kicker>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3 mt-5">
                {prog.audience.map((a) => (
                  <div key={a} className="bg-[#FAF6EF] border border-[#EFE9DE] rounded-[3px] px-5 py-4.5 font-body text-[15px] leading-[1.5] text-[#2A3441]">
                    {a}
                  </div>
                ))}
              </div>
            </section>
          )}

          {prog.included.length > 0 && (
            <section className="mt-16">
              <Kicker>Included</Kicker>
              <div className="mt-3.5 mb-5.5"><SectionHeading>This Programme Includes</SectionHeading></div>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-x-8 gap-y-3.5">
                {prog.included.map((item) => (
                  <div key={item} className="flex gap-3 items-start">
                    <span className="text-[#128C6E] text-[13px] mt-0.75 shrink-0">◆</span>
                    <span className="font-body text-[15px] leading-[1.55] text-[#2A3441]">{item}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {prog.modules.length > 0 && (
            <section className="mt-18 pt-14 border-t border-[#EAE5DC] max-[760px]:mt-12 max-[760px]:pt-10">
              <Kicker>Curriculum</Kicker>
              <div className="flex flex-wrap items-baseline justify-between gap-3 mt-3.5">
                <SectionHeading>Programme Outline</SectionHeading>
                <div className="font-body text-[13px] text-[#6B7684] tracking-[0.02em]">
                  {prog.modules.length} {prog.modules.length === 1 ? "module" : "modules"}
                  {totalLessonCount > 0 && <> · {totalLessonCount} {totalLessonCount === 1 ? "lesson" : "lessons"}</>}
                  {" "}· {prog.duration}
                </div>
              </div>
              <p className="mt-4 max-w-[40em] font-body text-[16px] leading-[1.66] text-[#3E4A59] text-pretty">
                The programme is structured across {prog.modules.length} modules, each covering one stage of learning with live sessions, self-paced content, and a practical assignment.
              </p>
              <CurriculumAccordion modules={prog.modules} />
            </section>
          )}

          {prog.instructor.name && (
            <section className="mt-18 pt-14 border-t border-[#EAE5DC] max-[760px]:mt-12 max-[760px]:pt-10">
              <Kicker>Programme facilitator</Kicker>
              <div className="mt-3.5 mb-6"><SectionHeading>Meet Your Instructor</SectionHeading></div>

              <div className="flex gap-5.5 items-center flex-wrap">
                <div className="w-19 h-19 rounded-full bg-[#0B2239] text-white flex items-center justify-center font-heading text-[20px] tracking-[0.04em] shrink-0">
                  {prog.instructor.initials}
                </div>
                <div className="flex-1 min-w-55">
                  <div className="font-heading text-[22px] text-[#0B2239]">{prog.instructor.name}</div>
                  {prog.instructor.title && (
                    <div className="mt-1.25 font-body text-[11px] tracking-[0.16em] uppercase text-[#0B6FC4]">{prog.instructor.title}</div>
                  )}
                  <div className="mt-2.5 font-body text-[14.5px] text-[#6B7684]">
                    {prog.instructorProgramCount} {prog.instructorProgramCount === 1 ? "programme" : "programmes"} on ARPS Institute · {prog.cat.label}
                  </div>
                </div>
                <InstructorProfileModal
                  name={prog.instructor.name}
                  title={prog.instructor.title}
                  categoryLabel={prog.cat.label}
                  initials={prog.instructor.initials}
                  bio={prog.instructor.bio}
                  avgRating={prog.instructorAvgRating}
                  totalReviews={prog.instructorTotalReviews}
                  programmeCount={prog.instructorProgramCount}
                  programs={prog.instructorPrograms}
                />
              </div>

              {prog.moreByInstructor.length > 0 && (
                <>
                  <div className="mt-9 font-body text-[11px] tracking-[0.16em] uppercase text-[#5A6675]">
                    More by {prog.instructor.name}
                  </div>
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-4.5 mt-4">
                    {prog.moreByInstructor.map((r) => <ProgramMiniCard key={r.slug} program={r} />)}
                  </div>
                </>
              )}
            </section>
          )}

          {prog.faqs.length > 0 && (
            <section className="mt-18 pt-14 border-t border-[#EAE5DC] max-[760px]:mt-12 max-[760px]:pt-10">
              <Kicker>FAQs</Kicker>
              <div className="mt-3.5 mb-5"><SectionHeading>Frequently Asked Questions</SectionHeading></div>
              <FaqAccordion faqs={prog.faqs} />
            </section>
          )}
        </div>
      </div>

      {/* ════ MOBILE STICKY ENROL BAR ════ */}
      <div className="hidden max-[900px]:flex fixed bottom-0 left-0 right-0 z-40 bg-[#0B2239] border-t border-white/10 px-5 py-3.5 items-center justify-between gap-4 shadow-[0_-8px_30px_rgba(0,0,0,0.3)]">
        <div>
          <div className="font-heading text-[20px] leading-none text-white">{priceLabel}</div>
        </div>
        <EnrollCTA
          programId={prog.id}
          programSlug={prog.slug}
          className="h-11 px-6 rounded-[3px] bg-[#0B6FC4] hover:bg-[#0A5CA5] text-white font-body text-[13px] font-semibold tracking-[0.14em] uppercase transition-colors duration-200 shrink-0"
        >
          Enrol Now
        </EnrollCTA>
      </div>

      {/* ════ YOU MAY ALSO LIKE ════ */}
      {prog.related.length > 0 && (
        <section className="w-full bg-[#EDF2FB] border-t border-[#E1E8F4]">
          <div className="w-full max-w-[1240px] mx-auto px-7 max-[760px]:px-5 pt-16 pb-18 max-[760px]:pt-12 max-[760px]:pb-13">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="font-body text-[10.5px] tracking-[0.18em] uppercase text-[#0B6FC4]">Programs</div>
                <h2 className="font-heading font-medium text-[34px] tracking-[-0.015em] mt-3 text-[#0B2239]">You May Also Like</h2>
              </div>
              <Link href="/programs" className="font-body text-[11px] tracking-[0.16em] uppercase text-[#0B6FC4] hover:text-[#0A3D6B] transition-colors duration-200">
                Browse all programs →
              </Link>
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-5 mt-8">
              {prog.related.map((r) => <ProgramMiniCard key={r.slug} program={r} />)}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

export default withLayout(ProgramDetailPage)
