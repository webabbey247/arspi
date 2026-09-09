"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ContentBlockViewer } from "@/components/programs/ContentBlockViewer"
import { DetailPageSkeleton } from "@/components/ui/skeleton"
import { sanitizeHtml } from "@/lib/sanitize"
import { cn } from "@/lib/utils"
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
  program:       ProgramDetail
  enrollment:    { status: "ACTIVE" | "COMPLETED" | "DROPPED"; enrolledAt: string; completedAt: string | null }
  totalLessons:  number
  completedIds:  string[]
  passedQuizIds: string[]
  certificate:   { verifyCode: string } | null
}

/** Quiz content-block ids within a single lesson. */
function quizBlockIdsForLesson(lesson: Lesson): string[] {
  return (lesson.blocks ?? []).filter(b => b.type === "quiz" && b.id).map(b => b.id!)
}

function isLessonDoneWith(lesson: Lesson, completed: Set<string>, passed: Set<string>): boolean {
  if (!lesson.id) return false
  const quizIds = quizBlockIdsForLesson(lesson)
  if (quizIds.length > 0) return quizIds.every(id => passed.has(id))
  return completed.has(lesson.id)
}

function isChapterDoneWith(chapter: Chapter, completed: Set<string>, passed: Set<string>): boolean {
  const lessons = chapter.lessons ?? []
  return lessons.length === 0 || lessons.every(l => isLessonDoneWith(l, completed, passed))
}

function instructorName(program: ProgramDetail): string {
  const prof = program.instructor.profile
  if (prof?.firstName || prof?.lastName) return [prof.firstName, prof.lastName].filter(Boolean).join(" ")
  return program.instructor.email
}

const LockIcon = ({ className }: { className?: string }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <rect x="3" y="11" width="18" height="10" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

// ── Page ─────────────────────────────────────────────────────────────────────

const StudentCoursePlayerPage = () => {
  const { slug } = useParams<{ slug: string }>()

  const [data, setData]           = useState<ApiResponse | null>(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState("")
  const [completedIds, setCompletedIds]   = useState<Set<string>>(new Set())
  const [passedQuizIds, setPassedQuizIds] = useState<Set<string>>(new Set())
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null)
  const [openChapters, setOpenChapters] = useState<Set<number>>(new Set())

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
        const completed = new Set<string>(d.completedIds ?? [])
        const passed     = new Set<string>(d.passedQuizIds ?? [])
        setCompletedIds(completed)
        setPassedQuizIds(passed)

        // Land on the first not-yet-done lesson in an unlocked chapter (or the
        // very first lesson if the programme is already fully complete).
        const chapters = Array.isArray(d.program?.curriculum) ? (d.program.curriculum as Chapter[]) : []
        let unlockedSoFar = true
        let picked: { ci: number; lesson: Lesson } | null = null
        let firstAny: { ci: number; lesson: Lesson } | null = null
        for (let ci = 0; ci < chapters.length; ci++) {
          const chapter = chapters[ci]
          for (const lesson of chapter.lessons ?? []) {
            if (!lesson.id) continue
            if (!firstAny) firstAny = { ci, lesson }
            if (unlockedSoFar && !picked && !isLessonDoneWith(lesson, completed, passed)) {
              picked = { ci, lesson }
            }
          }
          unlockedSoFar = unlockedSoFar && isChapterDoneWith(chapter, completed, passed)
        }
        const chosen = picked ?? firstAny
        if (chosen) {
          setSelectedLessonId(chosen.lesson.id!)
          setOpenChapters(new Set([chosen.ci]))
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Something went wrong.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [slug])

  /** A lesson counts as done differently depending on whether it has a quiz:
   *  quiz-bearing lessons are done once every quiz block in them is passed
   *  (no separate manual tick); others use the plain completedIds toggle. */
  function isLessonDone(lesson: Lesson): boolean {
    return isLessonDoneWith(lesson, completedIds, passedQuizIds)
  }

  function isChapterDone(chapter: Chapter): boolean {
    return isChapterDoneWith(chapter, completedIds, passedQuizIds)
  }

  async function handleQuizAnswer(blockId: string, selectedIndex: number): Promise<boolean> {
    const res = await fetch(`/api/student/programs/${slug}/quizzes/${blockId}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ selectedIndex }),
    })
    const d = await res.json().catch(() => ({}))
    if (!res.ok) return false

    setPassedQuizIds(new Set<string>(d.passedQuizIds ?? []))
    if (Array.isArray(d.completedIds)) setCompletedIds(new Set<string>(d.completedIds))
    setData(cur => cur ? {
      ...cur,
      enrollment: d.enrollment ? { ...cur.enrollment, status: d.enrollment.status, completedAt: d.enrollment.completedAt } : cur.enrollment,
      certificate: d.certificate ?? cur.certificate,
    } : cur)
    return !!d.correct
  }

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

  function toggleChapter(ci: number) {
    setOpenChapters(cur => {
      const next = new Set(cur)
      if (next.has(ci)) next.delete(ci)
      else next.add(ci)
      return next
    })
  }

  function selectLesson(ci: number, lessonId: string) {
    setSelectedLessonId(lessonId)
    setOpenChapters(cur => new Set(cur).add(ci))
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

  // A chapter unlocks once every chapter before it is fully done (all lessons,
  // and any quiz blocks within them, complete) — the first chapter is always open.
  const chapterUnlocked = chapters.map((_, i) => chapters.slice(0, i).every(isChapterDone))

  // Flat, ordered list of every lesson across every chapter — used to find the
  // selected lesson's chapter and to compute Previous/Next navigation.
  const flat = chapters.flatMap((chapter, ci) =>
    (chapter.lessons ?? [])
      .filter((lesson): lesson is Lesson & { id: string } => !!lesson.id)
      .map(lesson => ({ ci, lesson, locked: !chapterUnlocked[ci] }))
  )
  const selectedIndex   = flat.findIndex(f => f.lesson.id === selectedLessonId)
  const selected        = selectedIndex >= 0 ? flat[selectedIndex] : null
  const selectedChapter = selected ? chapters[selected.ci] : null
  const prevEntry        = flat.slice(0, selectedIndex).reverse().find(f => !f.locked)
  const nextEntry         = flat.slice(selectedIndex + 1).find(f => !f.locked)
  const selectedHasQuiz  = selected ? quizBlockIdsForLesson(selected.lesson).length > 0 : false
  const selectedDone     = selected ? isLessonDone(selected.lesson) : false
  const selectedHasContent = !!selected?.lesson.description || (selected?.lesson.blocks?.length ?? 0) > 0

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

      {/* Lesson content + Course content navigator */}
      {chapters.length === 0 ? (
        <div className="rounded-[14px] border border-[#E5E2DC] bg-white p-4 sm:p-5">
          <p className="text-center text-[13px] text-[#A8A39C] py-6">This programme&apos;s curriculum hasn&apos;t been published yet.</p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-5 items-start">
          {/* Lesson content — middle/main column */}
          <div className="order-2 lg:order-1 flex-1 min-w-0 w-full rounded-[14px] border border-[#E5E2DC] bg-white overflow-hidden">
            {selected ? (
              <>
                <div className="flex items-start justify-between gap-3 px-4 sm:px-5 py-4 border-b border-[#E5E2DC]">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-[#0474C4] uppercase tracking-[0.5px] mb-1 truncate">{selectedChapter?.title}</p>
                    <h2 className="text-[15px] font-bold text-[#1A1916] leading-tight">{selected.lesson.title}</h2>
                  </div>
                  {selectedHasQuiz ? (
                    <span className={cn(
                      "shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold",
                      selectedDone ? "bg-emerald-50 text-emerald-700" : "bg-[#EEF6FF] text-[#0474C4]",
                    )}>
                      {selectedDone ? "Quiz passed ✓" : "Quiz required"}
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={pendingId === selected.lesson.id}
                      onClick={() => toggleLesson(selected.lesson.id, !selectedDone)}
                      className={cn(
                        "shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] text-[12px] font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
                        selectedDone
                          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          : "bg-[#0474C4] text-white hover:bg-[#06457F]",
                      )}
                    >
                      {selectedDone && (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                      )}
                      {selectedDone ? "Completed" : "Mark as complete"}
                    </button>
                  )}
                </div>

                <div className="p-4 sm:p-5 space-y-4">
                  {selected.lesson.description && (
                    <div
                      className="text-[13.5px] text-[#1A1916] leading-relaxed [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5 [&_p]:mb-2 last:[&_p]:mb-0"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(selected.lesson.description) }}
                    />
                  )}
                  {selected.lesson.blocks && selected.lesson.blocks.length > 0 && (
                    <ContentBlockViewer
                      blocks={selected.lesson.blocks}
                      quizProgress={passedQuizIds}
                      onQuizAnswer={handleQuizAnswer}
                    />
                  )}
                  {!selectedHasContent && (
                    <p className="text-[13px] text-[#A8A39C] py-6 text-center">No content in this lesson yet.</p>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 px-4 sm:px-5 py-3 border-t border-[#E5E2DC] bg-[#FAFAF9]">
                  <button
                    type="button"
                    disabled={!prevEntry}
                    onClick={() => prevEntry && selectLesson(prevEntry.ci, prevEntry.lesson.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] text-[12px] font-semibold text-[#6B6560] hover:text-[#0474C4] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></svg>
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={!nextEntry}
                    onClick={() => nextEntry && selectLesson(nextEntry.ci, nextEntry.lesson.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] text-[12px] font-semibold text-[#6B6560] hover:text-[#0474C4] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    Next
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                  </button>
                </div>
              </>
            ) : (
              <p className="text-center text-[13px] text-[#A8A39C] py-16 px-4">Select a lesson from Course content to get started.</p>
            )}
          </div>

          {/* Course content — right-hand navigator */}
          <div className="order-1 lg:order-2 w-full lg:w-[340px] shrink-0 rounded-[14px] border border-[#E5E2DC] bg-white overflow-hidden">
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[#E5E2DC] bg-[#FAFAF9]">
              <h2 className="text-[13px] font-bold text-[#1A1916]">Course content</h2>
              <span className="text-[11px] font-semibold text-[#6B6560] shrink-0">{completedIds.size}/{totalLessons}</span>
            </div>
            <div className="max-h-[70vh] overflow-y-auto">
              {chapters.map((chapter, ci) => {
                const unlocked = chapterUnlocked[ci]
                const open     = openChapters.has(ci)
                const lessons  = chapter.lessons ?? []
                const doneCount = lessons.filter(isLessonDone).length
                return (
                  <div key={ci} className="border-b border-[#F0EEE9] last:border-none">
                    <button
                      type="button"
                      disabled={!unlocked}
                      onClick={() => toggleChapter(ci)}
                      className={cn(
                        "w-full flex items-start justify-between gap-2 px-4 py-3 text-left transition-colors",
                        unlocked ? "cursor-pointer hover:bg-[#FAFAF9]" : "cursor-not-allowed opacity-50",
                      )}
                    >
                      <span className="flex items-center gap-2 min-w-0 text-[12.5px] font-bold text-[#1A1916]">
                        {!unlocked && <LockIcon className="text-[#A8A39C] shrink-0" />}
                        <span className="truncate">{chapter.title}</span>
                      </span>
                      <span className="flex items-center gap-1.5 shrink-0 text-[11px] text-[#A8A39C] font-semibold">
                        {doneCount}/{lessons.length}
                        {unlocked && (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={cn("transition-transform", open ? "rotate-180" : "")}><polyline points="6 9 12 15 18 9" /></svg>
                        )}
                      </span>
                    </button>
                    {!unlocked && (
                      <p className="text-[11px] text-[#A8A39C] px-4 pb-2.5 -mt-1.5">Complete the previous chapter to unlock</p>
                    )}
                    {unlocked && open && (
                      <div className="border-t border-[#F0EEE9]">
                        {lessons.map((lesson, li) => {
                          const done   = isLessonDone(lesson)
                          const active = !!lesson.id && lesson.id === selectedLessonId
                          const hasQuiz = quizBlockIdsForLesson(lesson).length > 0
                          return (
                            <button
                              key={lesson.id ?? li}
                              type="button"
                              disabled={!lesson.id}
                              onClick={() => lesson.id && selectLesson(ci, lesson.id)}
                              className={cn(
                                "w-full flex items-center gap-2.5 px-4 py-2.5 text-left border-t border-[#F5F4F1] first:border-t-0 transition-colors",
                                lesson.id ? "cursor-pointer" : "cursor-default",
                                active ? "bg-[#EEF6FF]" : "hover:bg-[#FAFAF9]",
                              )}
                            >
                              <span className={cn(
                                "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0",
                                done ? "bg-emerald-600 border-emerald-600 text-white" : "border-[#D9D6D0] text-transparent",
                              )}>
                                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12" /></svg>
                              </span>
                              <span className={cn(
                                "flex-1 min-w-0 text-[12.5px] truncate",
                                done ? "text-[#A8A39C] line-through" : active ? "text-[#0474C4] font-semibold" : "text-[#1A1916]",
                              )}>
                                {lesson.title}
                              </span>
                              {hasQuiz && !done && (
                                <span className="shrink-0 text-[9.5px] font-bold uppercase tracking-wide text-[#0474C4] bg-[#EEF6FF] px-1.5 py-0.5 rounded-full">Quiz</span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentCoursePlayerPage
