import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Calendar, Clock, GraduationCap, MapPin, Monitor, Users } from "lucide-react"
import {
  getWorkshopBySlug,
  getWorkshops,
  computeDurationHours,
  normalizeFacilitators,
} from "@/services/workshop.service"
import { initialsOf } from "@/lib/workshop-helpers"
import withLayout from "@/hooks/useLayout"
import OrganizationsStrip from "@/components/sections/OrganizationsStrip"
import ProjectShareCard from "@/components/sections/ProjectShareCard"
import { sanitizeHtml } from "@/lib/sanitize"
import RegisterCTA from "./RegisterCTA"

// Always render at request time so the past-event check reflects "today".
export const dynamic = "force-dynamic"
export const revalidate = 0

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "")

const CATEGORY_LABEL: Record<string, string> = {
  SHORT_COURSE: "Short Course",
  WEBINAR:      "Webinar",
  MASTERCLASS:  "Masterclass",
  CONFERENCE:   "Conference",
  WORKSHOP:     "Workshop",
}

const LEVEL_LABEL: Record<string, string> = {
  ALL:          "General",
  BEGINNER:     "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED:     "Advanced",
}

const TYPE_COLORS: Record<"FREE" | "PAID", string> = {
  FREE: "bg-emerald-50 text-emerald-700",
  PAID: "bg-amber-50 text-amber-700",
}

function fmtDate(d: Date | null) {
  if (!d) return "TBA"
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
}

function fmtTime(startTime: string, endTime: string, tz: string) {
  if (!startTime) return "Time TBA"
  const tzAbbr = (() => {
    try {
      return new Intl.DateTimeFormat("en-US", { timeZone: tz || "UTC", timeZoneName: "short" })
        .formatToParts(new Date()).find(p => p.type === "timeZoneName")?.value ?? tz
    } catch { return tz || "UTC" }
  })()
  return endTime ? `${startTime} – ${endTime} · ${tzAbbr}` : `${startTime} · ${tzAbbr}`
}

function fmtDelivery(medium: string, platform: string | null, city: string | null) {
  if (medium === "IN_PERSON") return city ? `In Person · ${city}` : "In Person"
  return platform ? `${platform} · Online` : "Live Online"
}

function htmlToExcerpt(html: string, max = 220): string {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
  if (text.length <= max) return text
  return text.slice(0, max).replace(/\s+\S*$/, "") + "…"
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug }   = await params
  const workshop   = await getWorkshopBySlug(slug)
  if (!workshop) return {}
  return {
    title:       `${workshop.title} — Workshops`,
    description: htmlToExcerpt(workshop.description),
  }
}

const WorkshopDetailPage = async ({
  params,
}: {
  params: Promise<{ slug: string }>
}) => {
  const { slug }   = await params
  const workshop   = await getWorkshopBySlug(slug)
  if (!workshop || !workshop.published) notFound()

  const facilitators = normalizeFacilitators(workshop.facilitators)
  const duration     = computeDurationHours(workshop.startTime, workshop.endTime)
  const isPaid       = workshop.fee > 0
  const registered   = workshop._count?.registrations ?? workshop.registered
  const isPast       = (() => {
    if (!workshop.date) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const eventDay = new Date(workshop.date)
    eventDay.setHours(0, 0, 0, 0)
    return eventDay.getTime() < today.getTime()
  })()
  const excerpt      = htmlToExcerpt(workshop.description)
  const workshopUrl  = `${APP_URL}/workshop/${workshop.slug}`

  const related = (await getWorkshops({ category: workshop.category, published: true }))
    .filter(w => w.slug !== workshop.slug)
    .slice(0, 4)

  return (
    <>
      {/* ── Section 1: Title (2/3) + Share (1/3) ───────────────────────── */}
      <section className="bg-[#071639] relative px-4 sm:px-6 md:px-10 lg:px-16 py-10 sm:py-14 md:py-20 lg:py-24 w-full overflow-hidden">
        <div className="absolute inset-0 bg-grid-ink pointer-events-none" />
        <div className="absolute -top-24 right-0 w-125 h-125 rounded-full bg-[#0474C4]/8 blur-[100px] pointer-events-none" />

        <div className="relative max-w-350 mx-auto z-10">
          <Link
            href="/workshop"
            className="inline-flex items-center gap-1.5 font-body text-[0.6875rem] sm:text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#5EEAD4] hover:text-[#67e8d6] no-underline mb-6 sm:mb-8"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
            All Workshops
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-10 lg:gap-16 items-start">
            {/* Left — title (2/3) */}
            <div className="lg:col-span-2 min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4 flex-wrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider ${TYPE_COLORS[isPaid ? "PAID" : "FREE"]}`}>
                  {isPaid ? "Paid" : "Free"}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-white/10 text-white/80 text-[10px] sm:text-[11px] font-semibold">
                  {CATEGORY_LABEL[workshop.category] ?? workshop.category}
                </span>
                {workshop.level && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 text-white/80 text-[10px] sm:text-[11px] font-semibold">
                    <GraduationCap className="h-3 w-3" />
                    {LEVEL_LABEL[workshop.level] ?? workshop.level}
                  </span>
                )}
              </div>
              <h1 className="font-heading text-[1.625rem] sm:text-[2rem] md:text-[2.5rem] lg:text-[3rem] tracking-[-0.015em] md:tracking-[-0.02em] leading-[1.2] md:leading-[1.1] font-bold text-white mb-3 sm:mb-4 break-words">
                {workshop.title}
              </h1>
              <p className="font-body text-[0.9375rem] sm:text-[1rem] md:text-[1.125rem] tracking-[-0.01em] leading-[1.65] font-light text-[#EBF3FC]/75">
                {excerpt}
              </p>
            </div>

            {/* Right — share (1/3) */}
            <div className="lg:col-span-1 w-full">
              <ProjectShareCard
                title={workshop.title}
                excerpt={excerpt}
                url={workshopUrl}
                kicker="Share this workshop"
                subline="Help others find this learning opportunity."
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 2: Full-bleed cover image ──────────────────────────── */}
      {workshop.coverImage && (
        <section
          className="relative w-full h-[32vh] sm:h-[42vh] md:h-[55vh] lg:h-[60vh] bg-[#0B1B3A] bg-center bg-cover"
          style={{ backgroundImage: `url(${workshop.coverImage})` }}
          aria-label={`${workshop.title} cover image`}
        />
      )}

      {/* ── Section 3: Body + sticky 400px sidebar ─────────────────────── */}
      <section className="bg-white py-10 sm:py-12 md:py-16 lg:py-20 px-4 sm:px-6 md:px-10 lg:px-16 w-full">
        <div className="max-w-350 mx-auto grid lg:grid-cols-[1fr_400px] gap-8 md:gap-10 lg:gap-12">

          {/* Main */}
          <div className="min-w-0 order-2 lg:order-1">
            <article
              className="prose prose-slate max-w-none font-body text-[0.9375rem] sm:text-[1rem] leading-[1.75] sm:leading-[1.8] text-[#1A1916] [&_h2]:tracking-[-0.01em] [&_h2]:leading-tight [&_h2]:font-heading [&_h2]:text-[#071639] [&_h2]:mt-6 sm:[&_h2]:mt-8 md:[&_h2]:mt-10 [&_h2]:mb-2 [&_h2]:text-[1.25rem] sm:[&_h2]:text-[1.5rem] md:[&_h2]:text-[1.75rem] [&_p]:mb-2 [&_ul]:list-disc [&_ul]:ml-5 sm:[&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-5 sm:[&_ol]:ml-6 [&_img]:max-w-full [&_img]:h-auto"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(workshop.description) }}
            />

            {(facilitators.length > 0 || workshop.facilitator) && (
              <FacilitatorsSection
                facilitators={facilitators.length > 0
                  ? facilitators.map(f => ({
                      imageUrl: f.image,
                      name:     f.fullName,
                      role:     [f.jobTitle, f.company].filter(Boolean).join(" · ") || null,
                    }))
                  : [{ imageUrl: null, name: workshop.facilitator, role: null }]}
              />
            )}
          </div>

          {/* Sidebar — max 400px, sticky on scroll */}
          <aside className="w-full lg:max-w-100 lg:sticky lg:top-24 self-start space-y-5 sm:space-y-6 order-1 lg:order-2">
            {/* Workshop Details — mini-card grid (2 cols) */}
            <div>
              <p className="font-body text-[0.625rem] sm:text-[0.6875rem] tracking-[0.07em] uppercase font-medium text-[#637AA3] mb-2.5 sm:mb-3">
                Workshop Details
              </p>
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                {[
                  { icon: Calendar, label: "Date",     value: fmtDate(workshop.date) },
                  { icon: Clock,    label: "Time",     value: fmtTime(workshop.startTime, workshop.endTime, workshop.timezone) },
                  { icon: workshop.medium === "IN_PERSON" ? MapPin : Monitor,
                                    label: "Delivery", value: fmtDelivery(workshop.medium, workshop.onlinePlatform, workshop.venueCity) },
                  { icon: GraduationCap, label: "Level", value: LEVEL_LABEL[workshop.level] ?? workshop.level },
                  { icon: Clock,    label: "Duration", value: duration !== null ? `${duration} hrs` : "TBA" },
                  { icon: Users,    label: "Fee",      value: isPaid ? `$${workshop.fee.toLocaleString()}` : "Free" },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="bg-white rounded px-3 py-2.5 sm:px-4 sm:py-3 flex flex-col gap-0.5 border border-[#0474C4]/12 min-w-0">
                    <span className="font-body text-[0.625rem] sm:text-[0.6875rem] tracking-[0.06em] uppercase font-medium text-slate-400 flex items-center gap-1.5">
                      <Icon className="h-3 w-3 text-[#0474C4] shrink-0" />
                      <span className="truncate">{label}</span>
                    </span>
                    <span className="font-body text-[0.8125rem] sm:text-[0.875rem] font-medium text-ink leading-snug break-words">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {workshop.capacity !== null && (
              <div className="bg-white border border-[#0474C4]/12 rounded p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <span className="font-body text-[0.625rem] sm:text-[0.6875rem] tracking-[0.06em] uppercase font-medium text-slate-400 flex items-center gap-1.5">
                    <Users className="h-3 w-3 text-[#0474C4]" /> Availability
                  </span>
                  <span className="font-body text-[0.6875rem] sm:text-[0.75rem] font-medium text-slate-500">
                    {registered} / {workshop.capacity}
                  </span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#0474C4] rounded-full transition-all"
                    style={{ width: `${workshop.capacity > 0 ? Math.min(100, Math.round((registered / workshop.capacity) * 100)) : 0}%` }}
                  />
                </div>
                <p className="font-body text-[0.6875rem] sm:text-[0.75rem] text-slate-400 mt-1.5">
                  {Math.max(0, workshop.capacity - registered)} seats remaining
                </p>
              </div>
            )}

            <RegisterCTA
              workshop={{
                id:    workshop.id,
                title: workshop.title,
                date:  fmtDate(workshop.date),
                time:  fmtTime(workshop.startTime, workshop.endTime, workshop.timezone),
                fee:   workshop.fee,
              }}
              isPast={isPast}
            />
          </aside>
        </div>
      </section>

      {/* ── Related Workshops (max 4 cards) ─────────────────────────────── */}
      {related.length > 0 && (
        <section className="bg-[#FAFAF9] py-10 sm:py-12 md:py-16 lg:py-20 px-4 sm:px-6 md:px-10 lg:px-16 w-full border-t border-[#E5E2DC]">
          <div className="max-w-350 mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-8 md:mb-10">
              <div>
                <p className="font-body text-[0.6875rem] sm:text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#637AA3] mb-1.5 sm:mb-2">
                  Continue Learning
                </p>
                <h2 className="font-heading text-[1.375rem] sm:text-[1.5rem] md:text-[1.875rem] lg:text-[2.25rem] tracking-[-0.015em] leading-tight font-semibold text-[#071639]">
                  Related Workshops
                </h2>
              </div>
              <Link
                href="/workshop"
                className="inline-flex items-center gap-1.5 font-body text-[0.6875rem] sm:text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#0474C4] hover:text-[#06457F] no-underline self-start sm:self-auto"
              >
                View all
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {related.map(r => {
                const rPaid = r.fee > 0
                return (
                  <Link
                    key={r.id}
                    href={`/workshop/${r.slug}`}
                    className="group bg-white rounded-sm overflow-hidden transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(13,27,42,0.1)] no-underline"
                  >
                    <div className="relative aspect-16/10 overflow-hidden bg-slate-100">
                      {r.coverImage ? (
                        <Image
                          src={r.coverImage}
                          alt={r.title}
                          fill
                          className="object-cover transition-transform duration-400 group-hover:scale-[1.04]"
                          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                        </div>
                      )}
                      <span className={`absolute top-2.5 left-2.5 sm:top-3 sm:left-3 text-[0.6rem] sm:text-[0.65rem] font-medium tracking-widest uppercase px-2 sm:px-2.5 py-1 rounded-sm ${TYPE_COLORS[rPaid ? "PAID" : "FREE"]}`}>
                        {rPaid ? "Paid" : "Free"}
                      </span>
                    </div>
                    <div className="px-4 sm:px-5 pt-4 sm:pt-[1.3rem] pb-4 sm:pb-[1.5rem]">
                      <p className="font-body text-[0.625rem] sm:text-[0.6875rem] tracking-[0.07em] uppercase font-medium text-[#A8A39C] mb-1.5">
                        {CATEGORY_LABEL[r.category] ?? r.category}
                      </p>
                      <h3 className="font-heading text-[0.9375rem] sm:text-[1.02rem] font-normal text-[#071639] leading-[1.35] line-clamp-2">
                        {r.title}
                      </h3>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      <OrganizationsStrip heading="Our Solutions" />
    </>
  )
}

// ── Facilitators grid ─────────────────────────────────────────────────────────

type Person = { imageUrl?: string | null; name: string; role?: string | null }

function FacilitatorsSection({ facilitators }: { facilitators: Person[] }) {
  return (
    <section className="mt-8 sm:mt-10 md:mt-12">
      <p className="font-body text-[0.625rem] sm:text-[0.6875rem] tracking-widest uppercase font-medium text-[#637AA3] mb-2.5 sm:mb-3">
        {facilitators.length > 1 ? "Facilitators" : "Facilitator"}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {facilitators.map((p, i) => (
          <div key={`${p.name}-${i}`} className="flex items-center gap-3 bg-transparent rounded-none p-3 border-t border-slate-200 min-w-0">
            {p.imageUrl ? (
              <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden border border-[#E5E2DC] bg-white shrink-0">
                <Image src={p.imageUrl} alt={p.name} fill className="object-cover" sizes="48px" />
              </div>
            ) : (
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#0474C4] text-white text-[0.75rem] sm:text-[0.8125rem] font-semibold flex items-center justify-center shrink-0">
                {initialsOf(p.name)}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-heading text-[0.875rem] sm:text-[0.9375rem] tracking-[-0.005em] leading-snug font-semibold text-[#071639] truncate">
                {p.name}
              </p>
              {p.role && (
                <p className="font-body text-[0.6875rem] sm:text-[0.75rem] text-[#637AA3] truncate">
                  {p.role}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default withLayout(WorkshopDetailPage)
