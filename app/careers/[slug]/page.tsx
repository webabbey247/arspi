import { notFound } from "next/navigation"
import Link from "next/link"
import { Briefcase, Calendar, ChevronLeft, GraduationCap, Mail, MapPin } from "lucide-react"
import { getCareerBySlug } from "@/services/career.service"
import withLayout from "@/hooks/useLayout"
import ApplyCTA from "./ApplyCTA"

type CareerType      = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP" | "TEMPORARY"
type ExperienceLevel = "ENTRY" | "JUNIOR" | "MID" | "SENIOR" | "LEAD" | "EXECUTIVE"

const TYPE_LABEL: Record<CareerType, string> = {
  FULL_TIME:  "Full-time",
  PART_TIME:  "Part-time",
  CONTRACT:   "Contract",
  INTERNSHIP: "Internship",
  TEMPORARY:  "Temporary",
}

const LEVEL_LABEL: Record<ExperienceLevel, string> = {
  ENTRY:     "Entry",
  JUNIOR:    "Junior",
  MID:       "Mid-Level",
  SENIOR:    "Senior",
  LEAD:      "Lead",
  EXECUTIVE: "Executive",
}

function fmtDate(d: Date | null) {
  if (!d) return null
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
}

function fmtSalary(min: number | null, max: number | null, currency: string) {
  if (min === null && max === null) return null
  if (min !== null && max !== null) return `${currency} ${min.toLocaleString()} – ${max.toLocaleString()}`
  if (min !== null) return `${currency} ${min.toLocaleString()}+`
  return `Up to ${currency} ${max!.toLocaleString()}`
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((v): v is string => typeof v === "string" && v.trim().length > 0)
}

const CareerDetailPage = async ({
  params,
}: {
  params: Promise<{ slug: string }>
}) => {
  const { slug } = await params
  const career = await getCareerBySlug(slug)
  if (!career || career.status !== "PUBLISHED") notFound()

  const responsibilities = asStringArray(career.responsibilities)
  const requirements     = asStringArray(career.requirements)
  const benefits         = asStringArray(career.benefits)
  const salary           = fmtSalary(career.salaryMin, career.salaryMax, career.currency)

  return (
    <div className="bg-[#F7F9FC] min-h-screen w-full">
      {/* Hero */}
      <section className="bg-[#071639] px-6 md:px-16 pt-12 pb-20 w-full relative">
        <div className="absolute inset-0 bg-grid-ink pointer-events-none" />
        <div className="absolute -top-24 right-0 w-125 h-125 rounded-full bg-[#0474C4]/8 blur-[100px] pointer-events-none" />

        <div className="max-w-5xl mx-auto w-full relative">
          <Link
            href="/careers"
            className="inline-flex items-center gap-1.5 text-white/70 hover:text-white font-body text-[0.8125rem] mb-6 transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Back to all roles
          </Link>

          <div className="flex gap-2 flex-wrap mb-4">
            <span className="font-body text-[0.6875rem] tracking-[0.05em] font-medium px-2.5 py-1 rounded-full bg-white/15 text-white/85">
              {TYPE_LABEL[career.type as CareerType]}
            </span>
            <span className="font-body text-[0.6875rem] tracking-[0.05em] font-medium px-2.5 py-1 rounded-full bg-white/15 text-white/85 inline-flex items-center gap-1">
              <GraduationCap className="h-3 w-3" />
              {LEVEL_LABEL[career.experienceLevel as ExperienceLevel]}
            </span>
            {career.remote && (
              <span className="font-body text-[0.6875rem] tracking-[0.05em] font-medium px-2.5 py-1 rounded-full bg-emerald-400/20 text-emerald-100">
                Remote-friendly
              </span>
            )}
          </div>

          <h1 className="font-heading text-[2rem] md:text-[2.75rem] tracking-[-0.015em] leading-[1.15] font-bold text-white max-w-3xl">
            {career.title}
          </h1>

          <p className="font-body text-[0.9375rem] text-white/80 mt-3">
            {career.department} · {career.location}
          </p>
        </div>
      </section>

      {/* Body */}
      <section className="px-6 md:px-16 py-12 -mt-10 w-full">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">

          {/* Main column */}
          <div className="space-y-6">

            <div className="bg-white border border-[#0474C4]/12 rounded p-6 md:p-8">
              <h2 className="font-heading text-[1.25rem] tracking-[-0.005em] font-semibold text-[#0474C4] mb-4">About the role</h2>
              <div
                className="font-body text-[0.9375rem] leading-[1.7] text-slate-600 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: career.description }}
              />
            </div>

            {responsibilities.length > 0 && (
              <div className="bg-white border border-[#0474C4]/12 rounded p-6 md:p-8">
                <h2 className="font-heading text-[1.25rem] tracking-[-0.005em] font-semibold text-[#0474C4] mb-4">Responsibilities</h2>
                <ul className="list-disc list-inside space-y-1.5 font-body text-[0.9375rem] text-slate-600">
                  {responsibilities.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            )}

            {requirements.length > 0 && (
              <div className="bg-white border border-[#0474C4]/12 rounded p-6 md:p-8">
                <h2 className="font-heading text-[1.25rem] tracking-[-0.005em] font-semibold text-[#0474C4] mb-4">Requirements</h2>
                <ul className="list-disc list-inside space-y-1.5 font-body text-[0.9375rem] text-slate-600">
                  {requirements.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            )}

            {benefits.length > 0 && (
              <div className="bg-white border border-[#0474C4]/12 rounded p-6 md:p-8">
                <h2 className="font-heading text-[1.25rem] tracking-[-0.005em] font-semibold text-[#0474C4] mb-4">Benefits</h2>
                <ul className="list-disc list-inside space-y-1.5 font-body text-[0.9375rem] text-slate-600">
                  {benefits.map((b, i) => <li key={i}>{b}</li>)}
                </ul>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            {/* Apply CTA */}
            <ApplyCTA
              career={{
                slug:  career.slug,
                title: career.title,
              }}
            />

            {/* Meta */}
            <div className="bg-white border border-[#0474C4]/12 rounded p-5 space-y-3.5">
              <div className="flex items-start gap-3">
                <Briefcase className="h-4 w-4 text-[#0474C4] mt-0.5 shrink-0" />
                <div className="flex flex-col leading-tight">
                  <span className="font-body text-[0.6875rem] tracking-[0.06em] uppercase font-medium text-slate-400">Department</span>
                  <span className="font-body text-[0.875rem] font-medium text-ink">{career.department}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-[#0474C4] mt-0.5 shrink-0" />
                <div className="flex flex-col leading-tight">
                  <span className="font-body text-[0.6875rem] tracking-[0.06em] uppercase font-medium text-slate-400">Location</span>
                  <span className="font-body text-[0.875rem] font-medium text-ink">{career.location}</span>
                </div>
              </div>

              {salary && (
                <div className="flex items-start gap-3">
                  <Briefcase className="h-4 w-4 text-[#0474C4] mt-0.5 shrink-0" />
                  <div className="flex flex-col leading-tight">
                    <span className="font-body text-[0.6875rem] tracking-[0.06em] uppercase font-medium text-slate-400">Salary</span>
                    <span className="font-body text-[0.875rem] font-medium text-ink">{salary}</span>
                  </div>
                </div>
              )}

              {fmtDate(career.closingDate) && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-[#0474C4] mt-0.5 shrink-0" />
                  <div className="flex flex-col leading-tight">
                    <span className="font-body text-[0.6875rem] tracking-[0.06em] uppercase font-medium text-slate-400">Closing date</span>
                    <span className="font-body text-[0.875rem] font-medium text-ink">{fmtDate(career.closingDate)}</span>
                  </div>
                </div>
              )}

              {career.applyEmail && (
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 text-[#0474C4] mt-0.5 shrink-0" />
                  <div className="flex flex-col leading-tight">
                    <span className="font-body text-[0.6875rem] tracking-[0.06em] uppercase font-medium text-slate-400">Or email</span>
                    <a
                      href={`mailto:${career.applyEmail}`}
                      className="font-body text-[0.875rem] font-medium text-[#0474C4] hover:underline break-all"
                    >
                      {career.applyEmail}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </section>
    </div>
  )
}

export default withLayout(CareerDetailPage)
