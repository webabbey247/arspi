import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import withLayout from "@/hooks/useLayout"
import OrganizationsStrip from "@/components/sections/OrganizationsStrip"
import ProjectShareCard from "@/components/sections/ProjectShareCard"
import { getProjectBySlug, getProjects, type ProjectStatus } from "@/services/project.service"

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "")

const STATUS_LABELS: Record<ProjectStatus, string> = {
  COMPLETE: "Complete",
  ACTIVE:   "Active",
}

const STATUS_COLORS: Record<ProjectStatus, string> = {
  COMPLETE: "bg-emerald-50 text-emerald-700",
  ACTIVE:   "bg-amber-50 text-amber-700",
}

function fmtDate(d: Date | null): string | null {
  if (!d) return null
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })
}

export async function generateStaticParams() {
  const projects = await getProjects()
  return projects.map(p => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const project  = await getProjectBySlug(slug)
  if (!project) return {}
  return {
    title:       `${project.title} — Research Projects`,
    description: project.excerpt,
  }
}

const ProjectDetailPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params
  const project  = await getProjectBySlug(slug)
  if (!project) notFound()

  const startStr = fmtDate(project.startDate)
  const endStr   = fmtDate(project.endDate)

  const related = (await getProjects({
    ...(project.divisionId ? { divisionId: project.divisionId } : {}),
  }))
    .filter(p => p.slug !== project.slug)
    .slice(0, 4)

  const projectUrl = `${APP_URL}/our-research/research-projects/${project.slug}`

  return (
    <>
      {/* ── Section 1: Title (2/3) + Share (1/3) ───────────────────────── */}
      <section className="bg-[#071639] relative px-4 sm:px-6 md:px-10 lg:px-16 py-12 sm:py-16 md:py-20 lg:py-24 w-full">
        <div className="absolute inset-0 bg-grid-ink pointer-events-none" />
        <div className="absolute -top-24 right-0 w-125 h-125 rounded-full bg-[#0474C4]/8 blur-[100px] pointer-events-none" />

        <div className="relative max-w-350 mx-auto z-10">
          <Link
            href="/our-research/research-projects"
            className="inline-flex items-center gap-1.5 font-body text-[0.6875rem] sm:text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#5EEAD4] hover:text-[#67e8d6] no-underline mb-6 sm:mb-8"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
            All Projects
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10 lg:gap-16 items-start">
            {/* Left — title (2/3) */}
            <div className="lg:col-span-2">
              <div className="flex flex-wrap items-center gap-2 mb-3 sm:mb-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${STATUS_COLORS[project.status]}`}>
                  Project ({STATUS_LABELS[project.status]})
                </span>
                {project.division && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-white/10 text-white/80 text-[11px] font-semibold">
                    {project.division.name}
                  </span>
                )}
              </div>
              <h1 className="font-heading text-[1.75rem] sm:text-[2rem] md:text-[2.5rem] lg:text-[3rem] tracking-[-0.015em] md:tracking-[-0.02em] leading-[1.2] md:leading-[1.1] font-bold text-white mb-3 sm:mb-4">
                {project.title}
              </h1>
              <p className="font-body text-[0.9375rem] sm:text-[1rem] md:text-[1.0625rem] lg:text-[1.125rem] tracking-[-0.01em] leading-[1.65] font-light text-[#EBF3FC]/75">
                {project.excerpt}
              </p>
            </div>

            {/* Right — share (1/3) */}
            <div className="lg:col-span-1">
              <ProjectShareCard
                title={project.title}
                excerpt={project.excerpt}
                url={projectUrl}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 2: Full-bleed cover image ──────────────────────────── */}
      {project.coverImage && (
        <section
          className="relative w-full h-[42vh] md:h-[60vh] bg-[#0B1B3A] bg-center bg-cover"
          style={{ backgroundImage: `url(${project.coverImage})` }}
          aria-label={`${project.title} cover image`}
        />
      )}

      {/* ── Section 3: Body + sticky 400px sidebar ─────────────────────── */}
      <section className="bg-white py-12 sm:py-14 md:py-16 lg:py-20 px-4 sm:px-6 md:px-10 lg:px-16 w-full">
        <div className="max-w-350 mx-auto grid lg:grid-cols-[1fr_400px] gap-8 md:gap-10 lg:gap-12">

          {/* Main */}
          <div className="min-w-0">
            <article
              className="prose prose-slate max-w-none font-body text-[0.9375rem] sm:text-[1rem] leading-[1.8] text-[#1A1916] [&_h2]:tracking-[-0.01em] [&_h2]:leading-tight [&_h2]:font-heading [&_h2]:text-[#071639] [&_h2]:mt-8 sm:[&_h2]:mt-10 [&_h2]:mb-2 [&_h2]:text-[1.375rem] sm:[&_h2]:text-[1.5rem] md:[&_h2]:text-[1.625rem] lg:[&_h2]:text-[1.75rem] [&_p]:mb-2 [&_ul]:list-disc [&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-6"
              dangerouslySetInnerHTML={{ __html: project.description }}
            />

            {project.investigators.length > 0 && (
              <PeopleSection title="Project Investigators" people={project.investigators} />
            )}
            {project.members.length > 0 && (
              <PeopleSection title="Project Members" people={project.members} />
            )}
          </div>

          {/* Sidebar — max 400px, sticky on scroll */}
         <aside className="w-full lg:max-w-100 lg:sticky lg:top-24 self-start space-y-6">
  <div className="bg-[#F9F9FB] border border-[#E5E2DC] rounded p-5 sm:p-6">

    {/* Section label — DM Sans, 11px, +0.07em, font-medium, uppercase */}
    <p className="font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium text-[#637AA3] mb-4">
      Project Details
    </p>

    <div className="space-y-4">

      <div>
        {/* Field label — DM Sans, 10px, +0.07em, font-medium, uppercase */}
        <p className="font-body text-[0.625rem] tracking-[0.07em] uppercase font-medium text-[#A8A39C] mb-1">
          Client
        </p>
        <div className="flex items-center gap-2">
          {project.clientLogo && (
            <div className="relative w-10 h-10 rounded-md border border-[#E5E2DC] bg-white overflow-hidden flex-shrink-0">
              <Image src={project.clientLogo} alt={project.client} fill className="object-contain p-1" />
            </div>
          )}
          {/* Value — DM Sans, 15px, 0em, font-medium */}
          <p className="font-body text-[0.9375rem] tracking-[0em] font-medium text-[#071639]">
            {project.client}
          </p>
        </div>
      </div>

      {(startStr || endStr) && (
        <div>
          <p className="font-body text-[0.625rem] tracking-[0.07em] uppercase font-medium text-[#A8A39C] mb-1">
            Timeline
          </p>
          {/* Value — DM Sans, 14px, 0em, font-normal */}
          <p className="font-body text-[0.875rem] tracking-[0em] font-normal text-[#1A1916]">
            {startStr ?? "—"} {endStr ? `– ${endStr}` : ""}
          </p>
        </div>
      )}

      <div>
        <p className="font-body text-[0.625rem] tracking-[0.07em] uppercase font-medium text-[#A8A39C] mb-1">
          Status
        </p>
        {/* Badge — DM Sans, 11px, +0.05em, font-medium */}
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-body text-[0.6875rem] tracking-[0.05em] font-medium ${STATUS_COLORS[project.status]}`}>
          {STATUS_LABELS[project.status]}
        </span>
      </div>

      {project.division && (
        <div>
          <p className="font-body text-[0.625rem] tracking-[0.07em] uppercase font-medium text-[#A8A39C] mb-1">
            Division
          </p>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full font-body text-[0.6875rem] tracking-[0.05em] font-medium bg-[#EEF2FF] text-[#4F46E5]">
            {project.division.name}
          </span>
        </div>
      )}

      {project.department && (
        <div>
          <p className="font-body text-[0.625rem] tracking-[0.07em] uppercase font-medium text-[#A8A39C] mb-1">
            Department
          </p>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full font-body text-[0.6875rem] tracking-[0.05em] font-medium bg-white border border-[#E5E2DC] text-[#1A1916]">
            {project.department.name}
          </span>
        </div>
      )}

      {project.services.length > 0 && (
        <div>
          <p className="font-body text-[0.625rem] tracking-[0.07em] uppercase font-medium text-[#A8A39C] mb-1">
            Services
          </p>
          <div className="flex flex-wrap gap-1">
            {project.services.map(s => (
              <span key={s.id} className="inline-flex items-center px-2 py-0.5 rounded-full font-body text-[0.6875rem] tracking-[0.05em] font-medium bg-[#F5F4F1] text-[#6B6560]">
                {s.name}
              </span>
            ))}
          </div>
        </div>
      )}

    </div>
  </div>
</aside>
        </div>
      </section>

      {/* ── Related Projects (max 4 cards) ─────────────────────────────── */}
      {related.length > 0 && (
        <section className="bg-[#FAFAF9] py-12 sm:py-14 md:py-16 lg:py-20 px-4 sm:px-6 md:px-10 lg:px-16 w-full border-t border-[#E5E2DC]">
          <div className="max-w-350 mx-auto">
            <div className="flex items-end justify-between gap-4 mb-6 sm:mb-8 md:mb-10">
              <div>
                <p className="font-body text-[0.6875rem] sm:text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#637AA3] mb-1.5 sm:mb-2">
                  Continue Exploring
                </p>
                <h2 className="font-heading text-[1.5rem] sm:text-[1.75rem] md:text-[2rem] lg:text-[2.25rem] tracking-[-0.015em] leading-tight font-semibold text-[#071639]">
                  Related Projects
                </h2>
              </div>
              <Link
                href="/our-research/research-projects"
                className="hidden md:inline-flex items-center gap-1.5 font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#0474C4] hover:text-[#06457F] no-underline"
              >
                View all
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {related.map(r => (
                <Link
                  key={r.id}
                  href={`/our-research/research-projects/${r.slug}`}
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
                    <span className={`absolute top-3 left-3 text-[0.65rem] font-medium tracking-widest uppercase px-2.5 py-1 rounded-sm ${STATUS_COLORS[r.status]}`}>
                      Project ({STATUS_LABELS[r.status]})
                    </span>
                  </div>
                  <div className="px-5 pt-[1.3rem] pb-[1.5rem]">
                    <p className="font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium text-[#A8A39C] mb-1.5">
                      {r.client}
                    </p>
                    <h3 className="font-heading text-[1.02rem] font-normal text-[#071639] leading-[1.35] line-clamp-2">
                      {r.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <OrganizationsStrip heading="Our Solutions" />
    </>
  )
}

// ── People grid (Investigators / Members) ─────────────────────────────────────

type Person = { imageUrl?: string | null; name: string; role?: string | null }

function PeopleSection({ title, people }: { title: string; people: Person[] }) {
  return (
    <section className="mt-12">
      <p className="font-body text-[0.6875rem] tracking-widest uppercase font-medium text-[#637AA3] mb-3">
        {title}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {people.map((p, i) => (
       <div key={`${p.name}-${i}`} className="flex items-center gap-3 bg-transparent rounded-none p-3 border-t border-slate-200">
            {p.imageUrl ? (
              <div className="relative w-12 h-12 rounded-full overflow-hidden border border-[#E5E2DC] bg-white shrink-0">
                <Image src={p.imageUrl} alt={p.name} fill className="object-cover" sizes="48px" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#0474C4] text-white text-[0.8125rem] font-semibold flex items-center justify-center shrink-0">
                {p.name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("") || "—"}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-heading text-[0.9375rem] tracking-[-0.005em] leading-snug font-semibold text-[#071639] truncate">
                {p.name}
              </p>
              {p.role && (
                <p className="font-body text-[0.75rem] text-[#637AA3] truncate">
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

export default withLayout(ProjectDetailPage)
