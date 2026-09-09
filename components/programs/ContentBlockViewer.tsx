"use client"

import { useState } from "react"
import Image from "next/image"
import { sanitizeHtml } from "@/lib/sanitize"
import type { ContentBlock } from "@/components/forms/ContentBlockEditor"

// ── Helpers ──────────────────────────────────────────────────────────────────

function toEmbedUrl(url: string): string | null {
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]+)/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`
  const vimeo = url.match(/vimeo\.com\/(\d+)/)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`
  return null
}

const panelCls = "rounded-[12px] border border-[#E5E2DC] bg-white overflow-hidden"
const labelCls = "px-4 py-2 text-[10px] font-bold uppercase tracking-[0.5px] text-[#A8A39C] bg-[#FAFAF9] border-b border-[#E5E2DC]"

// ── Blocks ───────────────────────────────────────────────────────────────────

function TextBlockView({ block }: { block: Extract<ContentBlock, { type: "text" }> }) {
  if (!block.content?.trim()) return null
  return (
    <div
      className="text-[14px] text-[#1A1916] leading-relaxed [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5 [&_p]:mb-2 last:[&_p]:mb-0"
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.content) }}
    />
  )
}

function VideoBlockView({ block }: { block: Extract<ContentBlock, { type: "video" }> }) {
  if (!block.url) return null
  const embed = toEmbedUrl(block.url)
  return (
    <div className={panelCls}>
      <div className="aspect-video bg-black">
        {embed ? (
          <iframe src={embed} className="w-full h-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
        ) : (
          <video controls src={block.url} className="w-full h-full" />
        )}
      </div>
      {block.caption && <p className="px-4 py-2.5 text-[12px] text-[#6B6560]">{block.caption}</p>}
    </div>
  )
}

function ImageBlockView({ block }: { block: Extract<ContentBlock, { type: "image" }> }) {
  if (!block.url) return null
  return (
    <div className={panelCls}>
      <div className="relative w-full aspect-video bg-[#F5F4F1]">
        <Image src={block.url} alt={block.caption || "Lesson image"} fill className="object-cover" />
      </div>
      {block.caption && <p className="px-4 py-2.5 text-[12px] text-[#6B6560]">{block.caption}</p>}
    </div>
  )
}

function FileLinkView({
  href, title, sub, icon,
}: { href: string; title: string; sub?: string; icon: React.ReactNode }) {
  return (
    <a
      href={href} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-3 px-4 py-3 rounded-[12px] border border-[#E5E2DC] bg-white hover:border-[#0474C4] transition-colors"
    >
      <div className="w-9 h-9 rounded-[9px] bg-[#EEF6FF] text-[#0474C4] flex items-center justify-center shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-[#1A1916] truncate">{title}</p>
        {sub && <p className="text-[11px] text-[#A8A39C]">{sub}</p>}
      </div>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#A8A39C] shrink-0">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
      </svg>
    </a>
  )
}

const docIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
)

function QuizBlockView({
  block, passed, onAnswer,
}: {
  block:     Extract<ContentBlock, { type: "quiz" }>
  passed:    boolean
  onAnswer?: (selectedIndex: number) => Promise<boolean>
}) {
  const [selected, setSelected]     = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [wrong, setWrong]           = useState(false)

  if (!block.question) return null

  if (passed) {
    return (
      <div className={panelCls}>
        <div className={labelCls}>Quiz</div>
        <div className="px-4 py-3 space-y-1.5">
          <p className="text-[13.5px] font-semibold text-[#1A1916]">{block.question}</p>
          <p className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-emerald-700">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
            Answered correctly
          </p>
        </div>
      </div>
    )
  }

  async function submit() {
    if (selected === null || !onAnswer) return
    setSubmitting(true)
    setWrong(false)
    try {
      const correct = await onAnswer(selected)
      if (!correct) setWrong(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={panelCls}>
      <div className={labelCls}>Quiz{onAnswer ? " — required to continue" : ""}</div>
      <div className="px-4 py-3 space-y-2.5">
        <p className="text-[13.5px] font-semibold text-[#1A1916]">{block.question}</p>
        <div className="space-y-1.5">
          {(block.options ?? []).map((opt, i) => (
            <label
              key={i}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-[9px] border text-[13px] transition-colors ${
                onAnswer ? "cursor-pointer" : "cursor-default opacity-70"
              } ${selected === i ? "border-[#0474C4] bg-[#EEF6FF]" : "border-[#E5E2DC]"}`}
            >
              <input
                type="radio"
                name={block.id}
                checked={selected === i}
                onChange={() => onAnswer && setSelected(i)}
                disabled={!onAnswer}
                className="accent-[#0474C4]"
              />
              {opt}
            </label>
          ))}
        </div>
        {wrong && <p className="text-[12px] font-medium text-red-600">Not quite — try again.</p>}
        {onAnswer && (
          <button
            type="button"
            onClick={submit}
            disabled={selected === null || submitting}
            className="px-4 py-2 rounded-[9px] text-[12.5px] font-semibold bg-[#0474C4] text-white hover:bg-[#06457F] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            {submitting ? "Checking…" : "Submit answer"}
          </button>
        )}
      </div>
    </div>
  )
}

function QuestionSetView({ title, kicker, items }: { title: string; kicker: string; items: string[] }) {
  if (!title && items.length === 0) return null
  return (
    <div className={panelCls}>
      <div className={labelCls}>{kicker}</div>
      <div className="px-4 py-3 space-y-2">
        {title && <p className="text-[13.5px] font-semibold text-[#1A1916]">{title}</p>}
        {items.length > 0 && (
          <ol className="space-y-1.5 list-decimal ml-5">
            {items.map((q, i) => <li key={i} className="text-[13px] text-[#1A1916]">{q}</li>)}
          </ol>
        )}
      </div>
    </div>
  )
}

function AssignmentBlockView({ block }: { block: Extract<ContentBlock, { type: "assignment" }> }) {
  return (
    <div className={panelCls}>
      <div className={labelCls}>Assignment{block.dueInDays ? ` · due in ${block.dueInDays} day${block.dueInDays === "1" ? "" : "s"}` : ""}{block.points ? ` · ${block.points} pts` : ""}</div>
      <div className="px-4 py-3 space-y-1.5">
        {block.title && <p className="text-[13.5px] font-semibold text-[#1A1916]">{block.title}</p>}
        {block.instructions && <p className="text-[13px] text-[#6B6560] leading-relaxed whitespace-pre-line">{block.instructions}</p>}
      </div>
    </div>
  )
}

// ── Entry point ──────────────────────────────────────────────────────────────

/** Renderer for a lesson's `ContentBlock[]` (the same JSON the admin curriculum
 *  editor writes into `Course.curriculum`). Quiz blocks become interactive
 *  when `onQuizAnswer` is provided (the student course player) — otherwise
 *  they render read-only, same as questionnaire/assignment/survey blocks,
 *  whose grading/submissions still aren't tracked. */
export function ContentBlockViewer({
  blocks, quizProgress, onQuizAnswer,
}: {
  blocks: ContentBlock[]
  /** Quiz content-block ids this student has already answered correctly. */
  quizProgress?: Set<string>
  /** Submits an answer for a quiz block; resolves to whether it was correct. */
  onQuizAnswer?: (blockId: string, selectedIndex: number) => Promise<boolean>
}) {
  if (!Array.isArray(blocks) || blocks.length === 0) return null
  return (
    <div className="space-y-3">
      {blocks.map(block => {
        switch (block.type) {
          case "text":  return <TextBlockView key={block.id} block={block} />
          case "video": return <VideoBlockView key={block.id} block={block} />
          case "image": return <ImageBlockView key={block.id} block={block} />
          case "document":
            return block.url ? (
              <FileLinkView key={block.id} href={block.url} title={block.title || "Document"} icon={docIcon} />
            ) : null
          case "pdf":
            return block.url ? (
              <FileLinkView
                key={block.id} href={block.url} title={block.title || block.fileName || "PDF document"}
                sub={block.fileSize || undefined} icon={docIcon}
              />
            ) : null
          case "survey":
            return block.url ? (
              <FileLinkView key={block.id} href={block.url} title={block.title || "Survey"} icon={docIcon} />
            ) : null
          case "quiz":
            return (
              <QuizBlockView
                key={block.id}
                block={block}
                passed={!!block.id && !!quizProgress?.has(block.id)}
                onAnswer={onQuizAnswer && block.id ? (selectedIndex) => onQuizAnswer(block.id!, selectedIndex) : undefined}
              />
            )
          case "questionnaire":
            return <QuestionSetView key={block.id} kicker="Questionnaire" title={block.title} items={block.questions ?? []} />
          case "assignment":
            return <AssignmentBlockView key={block.id} block={block} />
          default:
            return null
        }
      })}
    </div>
  )
}
