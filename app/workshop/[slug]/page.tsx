import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Calendar, ChevronLeft, Clock, GraduationCap, MapPin, Monitor, Users } from "lucide-react"
import { getWorkshopBySlug, computeDurationHours, normalizeFacilitators } from "@/services/workshop.service"
import { initialsOf } from "@/lib/workshop-helpers"
import withLayout from "@/hooks/useLayout"
import RegisterCTA from "./RegisterCTA"

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

const WorkshopDetailPage = async ({
  params,
}: {
  params: Promise<{ slug: string }>
}) => {
  const { slug } = await params
  const workshop = await getWorkshopBySlug(slug)
  if (!workshop || !workshop.published) notFound()

  const facilitators = normalizeFacilitators(workshop.facilitators)
  const duration     = computeDurationHours(workshop.startTime, workshop.endTime)
  const isPaid       = workshop.fee > 0
  const registered   = workshop._count?.registrations ?? workshop.registered

  return (
    <div className="bg-[#F7F9FC] min-h-screen w-full">
      {/* Hero */}
      <section className="bg-[#071639] px-6 md:px-16 pt-12 pb-20 w-full relative">
                <div className="absolute inset-0 bg-grid-ink pointer-events-none" />
        <div className="absolute -top-24 right-0 w-125 h-125 rounded-full bg-[#0474C4]/8 blur-[100px] pointer-events-none" />

        <div className="max-w-5xl mx-auto w-full">
          <Link
            href="/workshop"
            className="inline-flex items-center gap-1.5 text-white/70 hover:text-white font-body text-[0.8125rem] mb-6 transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Back to workshops
          </Link>

          <div className="flex gap-2 flex-wrap mb-4">
            <span className={`font-body text-[0.6875rem] tracking-[0.05em] font-medium px-2.5 py-1 rounded-full ${isPaid ? "bg-white/20 text-white" : "bg-emerald-400/20 text-emerald-100"}`}>
              {isPaid ? "Paid" : "Free"}
            </span>
            <span className="font-body text-[0.6875rem] tracking-[0.05em] font-medium px-2.5 py-1 rounded-full bg-white/15 text-white/85">
              {CATEGORY_LABEL[workshop.category] ?? workshop.category}
            </span>
            {workshop.level && (
              <span className="font-body text-[0.6875rem] tracking-[0.05em] font-medium px-2.5 py-1 rounded-full bg-white/15 text-white/85 inline-flex items-center gap-1">
                <GraduationCap className="h-3 w-3" />
                {LEVEL_LABEL[workshop.level] ?? workshop.level}
              </span>
            )}
          </div>

          <h1 className="font-heading text-[2rem] md:text-[2.75rem] tracking-[-0.015em] leading-[1.15] font-bold text-white max-w-3xl">
            {workshop.title}
          </h1>

          <p className="font-body text-[0.9375rem] text-white/80 mt-3">
            {fmtDate(workshop.date)} · {fmtTime(workshop.startTime, workshop.endTime, workshop.timezone)}
          </p>
        </div>
      </section>

      {/* Body */}
      <section className="px-6 md:px-16 py-12 -mt-10 w-full">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">

          {/* Main column */}
          <div className="space-y-8">

            {/* Cover image */}
            {workshop.coverImage && (
              <div className="relative w-full aspect-video rounded overflow-hidden border border-[#0474C4]/15 bg-white">
                <Image src={workshop.coverImage} alt={workshop.title} width={630} height={354} className="object-cover" loading="eager" />
              </div>
            )}
            {/* Key details */}

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {[
                          { icon: Calendar, label: "Date",       value: fmtDate(workshop.date) },
                          { icon: Clock,    label: "Time",       value: fmtTime(workshop.startTime, workshop.endTime, workshop.timezone) },
                          { icon: workshop.medium === "IN_PERSON" ? MapPin : Monitor,
                                            label: "Delivery",   value: fmtDelivery(workshop.medium, workshop.onlinePlatform, workshop.venueCity) },
                          { icon: GraduationCap, label: "Level", value: LEVEL_LABEL[workshop.level] ?? workshop.level },
                          { icon: Clock,    label: "Duration",   value: duration !== null ? `${duration} hrs` : "TBA" },
                        ].map(({ icon: Icon, label, value }) => (
                          <div key={label} className="bg-white rounded px-4 py-3 flex flex-col gap-0.5 border border-[#0474C4]/12">
                            <span className="font-body text-[0.6875rem] tracking-[0.06em] uppercase font-medium text-slate-400 flex items-center gap-1.5">
                              <Icon className="h-3 w-3 text-[#0474C4]" />
                              {label}
                            </span>
                            <span className="font-body text-[0.875rem] font-medium text-ink leading-snug">
                              {value}
                            </span>
                          </div>
                        ))}
                      </div>

            {/* About */}
            <div className="bg-white border border-[#0474C4]/12 rounded p-6 md:p-8">
              <h2 className="font-heading text-[1.25rem] tracking-[-0.005em] font-semibold text-[#0474C4] mb-4">About this event</h2>
              <div className="font-body text-[0.9375rem] leading-[1.7] text-slate-600 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: workshop.description }} />
            </div>

     

            {/* Facilitators */}
            {(facilitators.length > 0 || workshop.facilitator) && (
              <div className="bg-white border border-[#0474C4]/12 rounded p-6 md:p-8">
                <h2 className="font-heading text-[1.25rem] tracking-[-0.005em] font-semibold text-[#0474C4] mb-4">
                  {facilitators.length > 1 ? "Facilitators" : "Facilitator"}
                </h2>
                {facilitators.length > 0 ? (
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {facilitators.map((f, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-[#EBF3FC] border border-[#0474C4]/20 flex items-center justify-center shrink-0">
                          {f.image ? (
                            <Image src={f.image} alt={f.fullName} width={48} height={48} className="object-cover w-full h-full" />
                          ) : (
                            <span className="font-body text-[0.875rem] font-semibold text-[#0474C4]">
                              {initialsOf(f.fullName)}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col leading-tight">
                          <span className="font-body text-[0.9375rem] font-semibold text-ink">{f.fullName}</span>
                          {(f.jobTitle || f.company) && (
                            <span className="font-body text-[0.8125rem] text-slate-500 mt-0.5">
                              {[f.jobTitle, f.company].filter(Boolean).join(" · ")}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="font-body text-[0.9375rem] text-slate-600">{workshop.facilitator}</p>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">

            {/* Key details */}
            {/* <div className="bg-white border border-[#0474C4]/12 rounded p-5 space-y-3.5">
              {[
                { icon: Calendar, label: "Date",     value: fmtDate(workshop.date) },
                { icon: Clock,    label: "Time",     value: fmtTime(workshop.startTime, workshop.endTime, workshop.timezone) },
                { icon: Clock,    label: "Duration", value: duration !== null ? `${duration} hour${duration === 1 ? "" : "s"}` : "TBA" },
                { icon: workshop.medium === "IN_PERSON" ? MapPin : Monitor,
                                  label: "Delivery", value: fmtDelivery(workshop.medium, workshop.onlinePlatform, workshop.venueCity) },
                { icon: GraduationCap, label: "Level", value: LEVEL_LABEL[workshop.level] ?? workshop.level },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <Icon className="h-4 w-4 text-[#0474C4] mt-0.5 shrink-0" />
                  <div className="flex flex-col leading-tight">
                    <span className="font-body text-[0.6875rem] tracking-[0.06em] uppercase font-medium text-slate-400">{label}</span>
                    <span className="font-body text-[0.875rem] font-medium text-ink">{value}</span>
                  </div>
                </div>
              ))}
            </div> */}

            {/* Capacity */}
            {workshop.capacity !== null && (
            <div className="bg-white border border-[#0474C4]/12 rounded p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="font-body text-[0.6875rem] tracking-[0.06em] uppercase font-medium text-slate-400 flex items-center gap-1.5">
                  <Users className="h-3 w-3 text-[#0474C4]" /> Availability
                </span>
                <span className="font-body text-[0.75rem] font-medium text-slate-500">
                  {registered} / {workshop.capacity}
                </span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#0474C4] rounded-full transition-all"
                  style={{ width: `${workshop.capacity > 0 ? Math.min(100, Math.round((registered / workshop.capacity) * 100)) : 0}%` }}
                />
              </div>
              <p className="font-body text-[0.75rem] text-slate-400 mt-1.5">
                {Math.max(0, workshop.capacity - registered)} seats remaining
              </p>
            </div>
            )}

            {/* Register CTA — opens modal */}
            <RegisterCTA
              workshop={{
                id:        workshop.id,
                title:     workshop.title,
                date:      fmtDate(workshop.date),
                time:      fmtTime(workshop.startTime, workshop.endTime, workshop.timezone),
                fee:       workshop.fee,
              }}
            />
          </aside>
        </div>
      </section>
    </div>
  )
}


 export default withLayout(WorkshopDetailPage);
 
