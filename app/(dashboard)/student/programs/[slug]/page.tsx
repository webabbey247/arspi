"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { ContentBlockViewer } from "@/components/programs/ContentBlockViewer"
import { DetailPageSkeleton } from "@/components/ui/skeleton"
import { sanitizeHtml } from "@/lib/sanitize"
import type { ContentBlock } from "@/components/forms/ContentBlockEditor"

// ── Types ────────────────────────────────────────────────────────────────────

type Lesson = { id?: string; title: string; description?: string | null; blocks?: ContentBlock[] }
type Chapter = { id?: string; title: string; desc?: string | null; lessons?: Lesson[] }

type ProgramDetail = {
  id: string; title: string; slug: string; thumbnail: string | null
  tagline: string | null; overview: string | null; level: string
  curriculum: unknown
  instructor: { email: string; profile: { firstName: string | null; lastName: string | null } | null }
}

type ApiResponse = {
  program:      ProgramDetail
  enrollment:   { status: "ACTIVE" | "COMPLETED" | "DROPPED"; enrolledAt: string; completedAt: string | null }
  totalLessons: number
  completedIds: string[]
  certificate:  { verifyCode: string } | null
}

function instructorName(program: ProgramDetail): string {
  const prof = program.instructor.profile
  if (prof?.firstName || prof?.lastName) return [prof.firstName, prof.lastName].filter(Boolean).join(" ")
  return program.instructor.email
}

// ── Page ─────────────────────────────────────────────────────────────────────

const StudentCoursePlayerPage = () => {
  const { slug } = useParams<{ slug: string }>()

  const [data, setData]           = useState<ApiResponse | null>(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState("")
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set())

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError("")
      try {
        const res = await fetch(`/api/student/programs/${slug}`)
        const d   = await res.json()
        if (!res.ok) throw new Error(d.error ?? "Failed to load programme.")
        if (cancelled) return
        setData(d)
        setCompletedIds(new Set<string>(d.completedIds ?? []))
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Something went wrong.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [slug])

  async function toggleLesson(lessonId: string, next: boolean) {
    setPendingId(lessonId)
    const prev = new Set(completedIds)
    const optimistic = new Set(completedIds)
    if (next) optimistic.add(lessonId)
    else optimistic.delete(lessonId)
    setCompletedIds(optimistic)

    try {
      const res = await fetch(`/api/student/programs/${slug}/lessons/${lessonId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ completed: next }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error ?? "Failed to update progress.")
      setCompletedIds(new Set<string>(d.completedIds))
      setData(cur => cur ? {
        ...cur,
        enrollment: { ...cur.enrollment, status: d.enrollment.status, completedAt: d.enrollment.completedAt },
        certificate: d.certificate ?? cur.certificate,
      } : cur)
    } catch {
      setCompletedIds(prev) // revert optimistic update on failure
    } finally {
      setPendingId(null)
    }
  }

  function toggleExpanded(lessonId: string) {
    setExpandedLessons(cur => {
      const next = new Set(cur)
      if (next.has(lessonId)) next.delete(lessonId)
      else next.add(lessonId)
      return next
    })
  }

  if (loading) return <DetailPageSkeleton />

  if (error || !data) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-350 mx-auto">
        <p className="text-[13px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error || "Programme not found."}</p>
        <Link href="/student/programs" className="inline-block mt-4 text-[13px] font-semibold text-[#0474C4] hover:text-[#06457F]">← Back to My Programs</Link>
      </div>
    )
  }

  const { program, enrollment, totalLessons, certificate } = data
  const chapters = Array.isArray(program.curriculum) ? (program.curriculum as Chapter[]) : []
  const completed = enrollment.status === "COMPLETED"
  const pct = completed ? 100 : totalLessons > 0 ? Math.round((completedIds.size / totalLessons) * 100) : 0

  return (
    <div className="max-w-350 mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <Link href="/student/programs" className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#6B6560] hover:text-[#0474C4] transition-colors mb-4">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></svg>
        My Programs
      </Link>

      {/* Header */}
      <div className="rounded-[14px] border border-[#E5E2DC] bg-white overflow-hidden mb-5">
        <div className="flex flex-col sm:flex-row gap-4 p-4 sm:p-5">
          <div className="relative w-full sm:w-48 aspect-video sm:aspect-square rounded-[10px] overflow-hidden bg-[#F5F4F1] shrink-0">
            {program.thumbnail ? (
              <Image src={program.thumbnail} alt={program.title} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#A8A39C]">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-[19px] font-extrabold text-[#1A1916] leading-tight">{program.title}</h1>
            {program.tagline && <p className="text-[13px] text-[#6B6560] mt-1">{program.tagline}</p>}
            <p className="text-[12px] text-[#A8A39C] mt-1.5">{instructorName(program)}</p>

            <div className="mt-4">
              <div className="flex items-center justify-between text-[12px] mb-1.5">
                <span className="text-[#6B6560] font-medium">
                  {totalLessons > 0 ? `${completedIds.size} of ${totalLessons} lessons complete` : "No trackable lessons in this programme"}
                </span>
                <span className="font-bold text-[#1A1916]">{pct}%</span>
              </div>
              <div className="h-2 rounded-full bg-[#F0EEE9] overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-300 ${completed ? "bg-emerald-600" : "bg-[#0474C4]"}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>
        </div>

        {completed && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-4 sm:px-5 py-3 bg-emerald-50 border-t border-emerald-100">
            <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-emerald-700">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
              You&apos;ve completed this programme!
            </span>
            {certificate && (
              <a
                href={`/api/certificates/verify/${certificate.verifyCode}/download`}
                target="_blank" rel="noopener noreferrer"
                className="sm:ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] text-[12px] font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                Download certificate
              </a>
            )}
          </div>
        )}
      </div>

      {/* Overview */}
      {program.overview && (
        <div className="rounded-[14px] border border-[#E5E2DC] bg-white p-4 sm:p-5 mb-5">
          <h2 className="text-[13px] font-bold text-[#1A1916] mb-2">Overview</h2>
          <div
            className="text-[13.5px] text-[#1A1916] leading-relaxed [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5 [&_p]:mb-2 last:[&_p]:mb-0"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(program.overview) }}
          />
        </div>
      )}

      {/* Curriculum */}
      <div className="rounded-[14px] border border-[#E5E2DC] bg-white overflow-hidden">
        <div className="px-4 sm:px-5 py-3 border-b border-[#E5E2DC] bg-[#FAFAF9]">
          <h2 className="text-[13px] font-bold text-[#1A1916]">Curriculum</h2>
        </div>
        {chapters.length === 0 ? (
          <p className="px-4 sm:px-5 py-8 text-center text-[13px] text-[#A8A39C]">This programme&apos;s curriculum hasn&apos;t been published yet.</p>
        ) : (
          <Accordion type="multiple" defaultValue={chapters.map((_, i) => `chapter-${i}`)} className="px-4 sm:px-5">
            {chapters.map((chapter, ci) => (
              <AccordionItem key={ci} value={`chapter-${ci}`}>
                <AccordionTrigger>
                  <span className="text-[13.5px] font-bold text-[#1A1916]">{chapter.title}</span>
                </AccordionTrigger>
                <AccordionContent>
                  {chapter.desc && (
                    <div
                      className="text-[12.5px] text-[#6B6560] mb-3 [&_p]:mb-1.5 last:[&_p]:mb-0"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(chapter.desc) }}
                    />
                  )}
                  <div className="space-y-2">
                    {(chapter.lessons ?? []).map((lesson, li) => {
                      const trackable = !!lesson.id
                      const done      = !!lesson.id && completedIds.has(lesson.id)
                      const isOpen    = !!lesson.id && expandedLessons.has(lesson.id)
                      const hasContent = !!lesson.description || (lesson.blocks?.length ?? 0) > 0
                      return (
                        <div key={li} className="rounded-[10px] border border-[#E5E2DC] overflow-hidden">
                          <div className="flex items-center gap-2.5 px-3 py-2.5 bg-white">
                            <button
                              type="button"
                              disabled={!trackable || pendingId === lesson.id}
                              onClick={() => lesson.id && toggleLesson(lesson.id, !done)}
                              title={trackable ? (done ? "Mark as incomplete" : "Mark as complete") : "This lesson can't be tracked yet"}
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                                done ? "bg-emerald-600 border-emerald-600 text-white" : "border-[#D9D6D0] text-transparent hover:border-[#0474C4]"
                              } ${!trackable ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                            >
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><polyline points="20 6 9 17 4 12" /></svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => hasContent && lesson.id && toggleExpanded(lesson.id)}
                              className={`flex-1 min-w-0 text-left text-[13px] font-medium ${done ? "text-[#A8A39C] line-through" : "text-[#1A1916]"} ${hasContent ? "cursor-pointer hover:text-[#0474C4]" : ""} transition-colors`}
                            >
                              {lesson.title}
                            </button>
                            {hasContent && lesson.id && (
                              <button type="button" onClick={() => toggleExpanded(lesson.id!)} className="shrink-0 text-[#A8A39C] cursor-pointer">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`transition-transform ${isOpen ? "rotate-180" : ""}`}><polyline points="6 9 12 15 18 9" /></svg>
                              </button>
                            )}
                          </div>
                          {isOpen && hasContent && (
                            <div className="px-3 py-3 border-t border-[#F0EEE9] bg-[#FAFAF9] space-y-3">
                              {lesson.description && (
                                <div
                                  className="text-[12.5px] text-[#6B6560] [&_p]:mb-1.5 last:[&_p]:mb-0"
                                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(lesson.description) }}
                                />
                              )}
                              {lesson.blocks && lesson.blocks.length > 0 && <ContentBlockViewer blocks={lesson.blocks} />}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </div>
  )
}

export default StudentCoursePlayerPage
