"use client"

import { useState } from "react"

export type AiFieldBuilderKind = "module" | "lesson-summary" | "lesson" | "assignment"

type Props = {
  title:   string   // modal header, e.g. "AI Builder — Module Description"
  kind:    AiFieldBuilderKind
  context: {
    courseTitle:    string
    chapterTitle?:  string
    lessonTitle?:   string
    /** The lesson's short description — extra grounding for the content-block
     *  kinds, where it's context rather than the thing being written. */
    lessonSummary?: string
    /** Assignment blocks only — the block's own title. */
    blockTitle?:    string
  }
  currentValue: string
  onGenerated:  (html: string) => void
  onClose:      () => void
}

/** Provider + custom-prompt AI builder for a single field — module/lesson
 *  descriptions and the lesson-text/assignment content blocks all route
 *  through here. Same visual language (header, provider picker, loading
 *  panel) as the AI Program Builder, scaled down to a single generation call
 *  instead of a multi-stage pipeline, since there's only one field to fill. */
export default function AiFieldBuilderModal({ title, kind, context, currentValue, onGenerated, onClose }: Props) {
  const [provider, setProvider] = useState<"anthropic" | "openai">("anthropic")
  const [prompt, setPrompt]     = useState("")
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/programs/ai-expand-block", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          kind,
          courseTitle:    context.courseTitle,
          chapterTitle:   context.chapterTitle,
          lessonTitle:    context.lessonTitle,
          lessonSummary:  context.lessonSummary,
          blockTitle:     context.blockTitle,
          currentContent: currentValue || undefined,
          instruction:    prompt.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "AI generation failed. Please try again.")
      onGenerated(data.content as string)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="bg-[#0474C4] p-5 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-white font-extrabold text-[16px]">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.9 5.6L19.5 9.5l-5.6 1.9L12 17l-1.9-5.6L4.5 9.5l5.6-1.9L12 2z"/></svg>
              {title}
            </div>
            <p className="text-[12px] text-white/80 mt-0.5">Generate or improve this field — you review it before saving.</p>
          </div>
          <button type="button" onClick={onClose} className="text-white/70 hover:text-white shrink-0 bg-white/10 hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition-colors cursor-pointer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
          {error && <p className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

          {loading ? (
            <div className="py-6 flex flex-col items-center text-center gap-3">
              <div className="w-8 h-8 border-2 border-[#0474C4]/25 border-t-[#0474C4] rounded-full animate-spin" />
              <p className="text-[13px] font-medium text-[#1A1916]">
                {currentValue ? "Improving your description…" : "Generating…"}
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="text-[11px] font-bold text-[#6B6560] uppercase tracking-[0.4px]">AI Model</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {([
                    ["anthropic", "Anthropic Claude"],
                    ["openai",    "GPT-4.1 mini"],
                  ] as const).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setProvider(value)}
                      className={`px-3 py-2 rounded-[10px] text-[13px] font-semibold border cursor-pointer transition-colors ${
                        provider === value
                          ? "bg-[#0474C4] border-[#0474C4] text-white"
                          : "bg-white border-[#E5E2DC] text-[#6B6560] hover:border-[#0474C4] hover:text-[#0474C4]"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#6B6560] uppercase tracking-[0.4px]">
                  Prompt<span className="ml-1 text-[10px] font-normal normal-case text-[#A8A39C]">(optional)</span>
                </label>
                <textarea
                  autoFocus
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-[10px] border border-[#E5E2DC] px-3 py-2 text-[13px] text-[#1A1916] placeholder:text-[#A8A39C] focus:outline-none focus:ring-2 focus:ring-[#0474C4]/30 focus:border-[#0474C4]"
                  placeholder="e.g. Focus on practical case studies, keep it upbeat"
                />
              </div>
            </>
          )}

          <div className="flex gap-2 justify-end pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-[10px] text-[13px] font-semibold border border-[#E5E2DC] text-[#6B6560] hover:bg-[#F5F4F1] cursor-pointer">Cancel</button>
            <button type="submit" disabled={loading} className="flex items-center gap-1.5 px-5 py-2 rounded-[10px] text-[13px] font-semibold bg-[#0474C4] text-white hover:bg-[#06457F] disabled:opacity-50 cursor-pointer">
              {loading ? "Generating…" : "Generate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
