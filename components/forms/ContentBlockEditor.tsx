"use client"

import { useState, useRef, useEffect } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import { useUploadThing } from "@/lib/uploadthing-client"
import Image from "next/image"

// ── Types ─────────────────────────────────────────────────────────────────────

export type TextBlock         = { id: string; type: "text";          content: string }
export type VideoBlock        = { id: string; type: "video";         url: string; caption: string }
export type ImageBlock        = { id: string; type: "image";         url: string; caption: string }
export type QuizBlock         = { id: string; type: "quiz";          question: string; options: string[]; correctIndex: number }
export type QuestionnaireBlock= { id: string; type: "questionnaire"; title: string; questions: string[] }
export type AssignmentBlock   = { id: string; type: "assignment";    title: string; instructions: string; submissionType: "text" | "file" | "link" | "none"; dueInDays: string; points: string }
export type DocumentBlock     = { id: string; type: "document";      url: string; title: string }
export type PdfBlock          = { id: string; type: "pdf";           url: string; title: string; fileName: string; fileSize: string }
export type SurveyBlock       = { id: string; type: "survey";        url: string; title: string }

export type ContentBlock =
  | TextBlock
  | VideoBlock
  | ImageBlock
  | QuizBlock
  | QuestionnaireBlock
  | AssignmentBlock
  | DocumentBlock
  | PdfBlock
  | SurveyBlock

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const inputCls = "w-full px-3 py-2 text-[13px] bg-white border border-[#E5E2DC] rounded-[10px] text-[#1A1916] outline-none placeholder:text-[#A8A39C] focus:border-[#0474C4] transition-colors"

// ── Mini rich-text editor ─────────────────────────────────────────────────────

function MiniRTE({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: placeholder ?? "Write content…" }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "px-3 py-2.5 min-h-[100px] text-[13px] text-[#1A1916] outline-none [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4 [&_p]:leading-relaxed",
      },
    },
  })

  useEffect(() => {
    if (editor && !editor.isFocused && value !== editor.getHTML()) {
      editor.commands.setContent(value || "")
    }
  }, [value, editor])

  function tb(active: boolean, label: React.ReactNode, action: () => void) {
    return (
      <button type="button" onClick={action} className={`w-6 h-6 flex items-center justify-center rounded text-[11px] transition-colors cursor-pointer ${active ? "bg-[#0474C4] text-white" : "text-[#6B6560] hover:bg-[#E5E2DC]"}`}>
        {label}
      </button>
    )
  }

  return (
    <div className="border border-[#E5E2DC] rounded-[10px] overflow-hidden focus-within:border-[#0474C4] transition-colors">
      <div className="flex items-center gap-0.5 px-2 py-1 border-b border-[#E5E2DC] bg-[#FAFAF9]">
        {tb(!!editor?.isActive("bold"),   <b>B</b>,   () => editor?.chain().focus().toggleBold().run())}
        {tb(!!editor?.isActive("italic"), <em>I</em>, () => editor?.chain().focus().toggleItalic().run())}
        {tb(!!editor?.isActive("bulletList"),
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1.5" fill="currentColor"/><circle cx="4" cy="12" r="1.5" fill="currentColor"/><circle cx="4" cy="18" r="1.5" fill="currentColor"/></svg>,
          () => editor?.chain().focus().toggleBulletList().run()
        )}
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}

// ── Individual block editors ───────────────────────────────────────────────────

function TextBlockEditor({ block, onChange }: { block: TextBlock; onChange: (b: TextBlock) => void }) {
  return (
    <MiniRTE
      value={block.content}
      onChange={content => onChange({ ...block, content })}
      placeholder="Write rich text content…"
    />
  )
}

function VideoBlockEditor({ block, onChange }: { block: VideoBlock; onChange: (b: VideoBlock) => void }) {
  return (
    <div className="space-y-2">
      <input
        value={block.url}
        onChange={e => onChange({ ...block, url: e.target.value })}
        className={inputCls}
        placeholder="https://youtu.be/... or https://vimeo.com/..."
      />
      <input
        value={block.caption}
        onChange={e => onChange({ ...block, caption: e.target.value })}
        className={inputCls}
        placeholder="Caption (optional)"
      />
    </div>
  )
}

function ImageBlockEditor({ block, onChange }: { block: ImageBlock; onChange: (b: ImageBlock) => void }) {
  const [uploading, setUploading] = useState(false)
  const { startUpload } = useUploadThing("imageUploader")
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const res = await startUpload([file])
      if (res?.[0]?.url) onChange({ ...block, url: res[0].url })
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-2">
      {block.url ? (
        <div className="relative w-full h-36 rounded-[10px] overflow-hidden border border-[#E5E2DC] bg-[#F5F4F1]">
          <Image src={block.url} alt="block" fill className="object-cover" />
          <button
            type="button"
            onClick={() => onChange({ ...block, url: "" })}
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 cursor-pointer"
          >
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-[10px] text-[13px] font-semibold border border-dashed border-[#E5E2DC] text-[#6B6560] hover:border-[#0474C4] hover:text-[#0474C4] disabled:opacity-50 transition-colors cursor-pointer"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          {uploading ? "Uploading…" : "Upload image"}
        </button>
      )}
      <input
        value={block.caption}
        onChange={e => onChange({ ...block, caption: e.target.value })}
        className={inputCls}
        placeholder="Caption (optional)"
      />
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  )
}

function QuizBlockEditor({ block, onChange }: { block: QuizBlock; onChange: (b: QuizBlock) => void }) {
  function setOption(i: number, val: string) {
    const opts = [...block.options]
    opts[i] = val
    onChange({ ...block, options: opts })
  }
  function addOption() {
    onChange({ ...block, options: [...block.options, ""] })
  }
  function removeOption(i: number) {
    const opts = block.options.filter((_, j) => j !== i)
    const correct = block.correctIndex >= opts.length ? Math.max(0, opts.length - 1) : block.correctIndex
    onChange({ ...block, options: opts, correctIndex: correct })
  }

  return (
    <div className="space-y-2">
      <input
        value={block.question}
        onChange={e => onChange({ ...block, question: e.target.value })}
        className={inputCls}
        placeholder="Enter quiz question…"
      />
      <div className="space-y-1.5">
        {block.options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onChange({ ...block, correctIndex: i })}
              className={`w-5 h-5 rounded-full border-2 shrink-0 transition-colors cursor-pointer flex items-center justify-center ${block.correctIndex === i ? "border-[#0474C4] bg-[#0474C4]" : "border-[#D9D6D0]"}`}
            >
              {block.correctIndex === i && <span className="w-2 h-2 rounded-full bg-white block" />}
            </button>
            <input
              value={opt}
              onChange={e => setOption(i, e.target.value)}
              className={`${inputCls} flex-1`}
              placeholder={`Option ${i + 1}`}
            />
            {block.options.length > 2 && (
              <button type="button" onClick={() => removeOption(i)} className="w-7 h-8 flex items-center justify-center rounded-[8px] border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 shrink-0 cursor-pointer">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            )}
          </div>
        ))}
      </div>
      <button type="button" onClick={addOption} className="flex items-center gap-1.5 text-[12px] font-semibold text-[#0474C4] hover:text-[#06457F] transition-colors cursor-pointer mt-1">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add option
      </button>
      <p className="text-[11px] text-[#A8A39C]">Click the circle next to the correct answer.</p>
    </div>
  )
}

function QuestionnaireBlockEditor({ block, onChange }: { block: QuestionnaireBlock; onChange: (b: QuestionnaireBlock) => void }) {
  function setQ(i: number, val: string) {
    const qs = [...block.questions]
    qs[i] = val
    onChange({ ...block, questions: qs })
  }
  function removeQ(i: number) {
    onChange({ ...block, questions: block.questions.filter((_, j) => j !== i) })
  }

  return (
    <div className="space-y-2">
      <input
        value={block.title}
        onChange={e => onChange({ ...block, title: e.target.value })}
        className={inputCls}
        placeholder="Questionnaire title (e.g. Reflection Questions)"
      />
      <div className="space-y-1.5">
        {block.questions.map((q, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={q}
              onChange={e => setQ(i, e.target.value)}
              className={`${inputCls} flex-1`}
              placeholder={`Question ${i + 1}`}
            />
            {block.questions.length > 1 && (
              <button type="button" onClick={() => removeQ(i)} className="w-7 h-8 flex items-center justify-center rounded-[8px] border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 shrink-0 cursor-pointer">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            )}
          </div>
        ))}
      </div>
      <button type="button" onClick={() => onChange({ ...block, questions: [...block.questions, ""] })} className="flex items-center gap-1.5 text-[12px] font-semibold text-[#0474C4] hover:text-[#06457F] transition-colors cursor-pointer mt-1">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add question
      </button>
    </div>
  )
}

function AssignmentBlockEditor({ block, onChange }: { block: AssignmentBlock; onChange: (b: AssignmentBlock) => void }) {
  return (
    <div className="space-y-2">
      <input
        value={block.title}
        onChange={e => onChange({ ...block, title: e.target.value })}
        className={inputCls}
        placeholder="Assignment title e.g. Week 2 Reflection"
      />
      <MiniRTE
        value={block.instructions}
        onChange={instructions => onChange({ ...block, instructions })}
        placeholder="Instructions for this assignment…"
      />
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-[#6B6560] uppercase tracking-[0.4px]">Submission type</label>
          <select
            value={block.submissionType}
            onChange={e => onChange({ ...block, submissionType: e.target.value as AssignmentBlock["submissionType"] })}
            className={inputCls}
          >
            <option value="none">No submission</option>
            <option value="text">Text response</option>
            <option value="file">File upload</option>
            <option value="link">Link / URL</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-[#6B6560] uppercase tracking-[0.4px]">Points (optional)</label>
          <input
            type="number"
            min="0"
            value={block.points}
            onChange={e => onChange({ ...block, points: e.target.value })}
            className={inputCls}
            placeholder="e.g. 100"
          />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold text-[#6B6560] uppercase tracking-[0.4px]">Due (days after lesson — optional)</label>
        <input
          type="number"
          min="0"
          value={block.dueInDays}
          onChange={e => onChange({ ...block, dueInDays: e.target.value })}
          className={inputCls}
          placeholder="e.g. 3"
        />
      </div>
    </div>
  )
}

function DocumentBlockEditor({ block, onChange }: { block: DocumentBlock; onChange: (b: DocumentBlock) => void }) {
  return (
    <div className="space-y-2">
      <input
        value={block.title}
        onChange={e => onChange({ ...block, title: e.target.value })}
        className={inputCls}
        placeholder="Document title (e.g. Course Reading Material)"
      />
      <input
        value={block.url}
        onChange={e => onChange({ ...block, url: e.target.value })}
        className={inputCls}
        placeholder="https://docs.google.com/... or https://dropbox.com/..."
      />
      <p className="text-[11px] text-[#A8A39C]">Supports Google Docs, Google Sheets, Dropbox, OneDrive and similar sharing links.</p>
    </div>
  )
}

function PdfBlockEditor({ block, onChange }: { block: PdfBlock; onChange: (b: PdfBlock) => void }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError]         = useState("")
  const { startUpload }           = useUploadThing("pdfUploader")
  const inputRef                  = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError("")

    if (file.size > 25 * 1024 * 1024) {
      setError("File exceeds 25 MB limit.")
      if (inputRef.current) inputRef.current.value = ""
      return
    }

    setUploading(true)
    try {
      const res = await startUpload([file])
      if (res?.[0]?.url) {
        onChange({
          ...block,
          url:      res[0].url,
          fileName: file.name,
          fileSize: (file.size / (1024 * 1024)).toFixed(2) + " MB",
        })
      }
    } catch {
      setError("Upload failed. Please try again.")
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-2">
      <input
        value={block.title}
        onChange={e => onChange({ ...block, title: e.target.value })}
        className={inputCls}
        placeholder="PDF title (e.g. Module Handbook)"
      />

      {block.url ? (
        <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-[10px] border border-[#E5E2DC] bg-[#FAFAF9]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-[8px] bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-[#1A1916] truncate">{block.fileName || "PDF File"}</p>
              {block.fileSize && <p className="text-[11px] text-[#A8A39C]">{block.fileSize}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onChange({ ...block, url: "", fileName: "", fileSize: "" })}
            className="w-6 h-6 rounded-full flex items-center justify-center text-[#A8A39C] hover:bg-red-50 hover:text-red-500 shrink-0 cursor-pointer transition-colors"
          >
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-[10px] text-[13px] font-semibold border border-dashed border-[#E5E2DC] text-[#6B6560] hover:border-[#0474C4] hover:text-[#0474C4] disabled:opacity-50 transition-colors cursor-pointer"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          {uploading ? "Uploading…" : "Upload PDF (max 25 MB)"}
        </button>
      )}

      {error && <p className="text-[11px] text-red-500">{error}</p>}
      <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={handleFile} />
    </div>
  )
}

function SurveyBlockEditor({ block, onChange }: { block: SurveyBlock; onChange: (b: SurveyBlock) => void }) {
  return (
    <div className="space-y-2">
      <input
        value={block.title}
        onChange={e => onChange({ ...block, title: e.target.value })}
        className={inputCls}
        placeholder="Survey title (e.g. Post-lesson Feedback)"
      />
      <input
        value={block.url}
        onChange={e => onChange({ ...block, url: e.target.value })}
        className={inputCls}
        placeholder="https://forms.google.com/... or https://typeform.com/..."
      />
      <p className="text-[11px] text-[#A8A39C]">Supports Google Forms, Typeform, SurveyMonkey and any embeddable form link.</p>
    </div>
  )
}

// ── Block type metadata ───────────────────────────────────────────────────────

const BLOCK_TYPES: {
  type:    ContentBlock["type"]
  label:   string
  icon:    React.ReactNode
  create:  () => ContentBlock
}[] = [
  {
    type:  "text",
    label: "Text Editor",
    icon:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
    create: () => ({ id: uid(), type: "text", content: "" }),
  },
  {
    type:  "video",
    label: "Video Block",
    icon:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>,
    create: () => ({ id: uid(), type: "video", url: "", caption: "" }),
  },
  {
    type:  "image",
    label: "Image Block",
    icon:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
    create: () => ({ id: uid(), type: "image", url: "", caption: "" }),
  },
  {
    type:  "document",
    label: "Document",
    icon:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    create: () => ({ id: uid(), type: "document", url: "", title: "" }),
  },
  {
    type:  "pdf",
    label: "PDF",
    icon:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 13h1a2 2 0 0 0 0-4H9v6"/><path d="M14 13h2"/><path d="M14 17h2"/><path d="M14 9h1"/></svg>,
    create: () => ({ id: uid(), type: "pdf", url: "", title: "", fileName: "", fileSize: "" }),
  },
  {
    type:  "quiz",
    label: "Quiz",
    icon:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
    create: () => ({ id: uid(), type: "quiz", question: "", options: ["", ""], correctIndex: 0 }),
  },
  {
    type:  "questionnaire",
    label: "Questionnaire",
    icon:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    create: () => ({ id: uid(), type: "questionnaire", title: "", questions: [""] }),
  },
  {
    type:  "survey",
    label: "Survey / Form",
    icon:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/><line x1="7" y1="8" x2="9" y2="8"/><line x1="7" y1="12" x2="9" y2="12"/><line x1="12" y1="8" x2="17" y2="8"/><line x1="12" y1="12" x2="17" y2="12"/></svg>,
    create: () => ({ id: uid(), type: "survey", url: "", title: "" }),
  },
  {
    type:  "assignment",
    label: "Assignment",
    icon:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    create: () => ({ id: uid(), type: "assignment", title: "", instructions: "", submissionType: "text", dueInDays: "", points: "" }),
  },
]

const TYPE_LABELS: Record<ContentBlock["type"], string> = {
  text:          "Text",
  video:         "Video",
  image:         "Image",
  document:      "Document",
  pdf:           "PDF",
  quiz:          "Quiz",
  questionnaire: "Questionnaire",
  survey:        "Survey / Form",
  assignment:    "Assignment",
}

const TYPE_COLORS: Record<ContentBlock["type"], string> = {
  text:          "bg-blue-50 text-blue-600 border-blue-200",
  video:         "bg-purple-50 text-purple-600 border-purple-200",
  image:         "bg-green-50 text-green-600 border-green-200",
  document:      "bg-sky-50 text-sky-600 border-sky-200",
  pdf:           "bg-red-50 text-red-500 border-red-200",
  quiz:          "bg-amber-50 text-amber-600 border-amber-200",
  questionnaire: "bg-pink-50 text-pink-600 border-pink-200",
  survey:        "bg-teal-50 text-teal-600 border-teal-200",
  assignment:    "bg-indigo-50 text-indigo-600 border-indigo-200",
}

// ── Floating block picker ─────────────────────────────────────────────────────

function BlockPicker({ onPick, onClose }: { onPick: (b: ContentBlock) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute left-0 bottom-full mb-2 z-50 bg-white border border-[#E5E2DC] rounded-xl shadow-xl p-3 w-80"
    >
      <p className="text-[10px] font-bold text-[#A8A39C] uppercase tracking-widest mb-2.5 px-1">Add Content Block</p>
      <div className="flex flex-wrap gap-1.5">
        {BLOCK_TYPES.map(bt => (
          <button
            key={bt.type}
            type="button"
            onClick={() => { onPick(bt.create()); onClose() }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-[8px] text-[12px] text-[#1A1916] hover:bg-[#F5F4F1] transition-colors cursor-pointer border border-[#E5E2DC] hover:border-[#0474C4]"
          >
            <span className={`w-5 h-5 rounded-[5px] flex items-center justify-center border ${TYPE_COLORS[bt.type]}`}>
              {bt.icon && <span className="scale-[0.75] flex">{bt.icon}</span>}
            </span>
            {bt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Single block card ─────────────────────────────────────────────────────────

function BlockCard({
  block,
  index,
  total,
  onChange,
  onRemove,
  onMove,
}: {
  block:    ContentBlock
  index:    number
  total:    number
  onChange: (b: ContentBlock) => void
  onRemove: () => void
  onMove:   (dir: -1 | 1) => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  const meta = BLOCK_TYPES.find(bt => bt.type === block.type)!

  return (
    <div className="border border-[#E5E2DC] rounded-[10px] bg-white overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-[#FAFAF9] border-b border-[#E5E2DC]">
        <div className="flex items-center gap-2">
          <span className={`w-6 h-6 rounded-[6px] flex items-center justify-center border text-[10px] ${TYPE_COLORS[block.type]}`}>
            {meta.icon}
          </span>
          <span className="text-[11px] font-bold text-[#6B6560] uppercase tracking-wide">{TYPE_LABELS[block.type]}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => onMove(-1)}
            className="w-6 h-6 flex items-center justify-center rounded text-[#A8A39C] hover:bg-[#E5E2DC] disabled:opacity-30 cursor-pointer disabled:cursor-default transition-colors"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="18 15 12 9 6 15"/></svg>
          </button>
          <button
            type="button"
            disabled={index === total - 1}
            onClick={() => onMove(1)}
            className="w-6 h-6 flex items-center justify-center rounded text-[#A8A39C] hover:bg-[#E5E2DC] disabled:opacity-30 cursor-pointer disabled:cursor-default transition-colors"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <button
            type="button"
            onClick={() => setCollapsed(c => !c)}
            className="w-6 h-6 flex items-center justify-center rounded text-[#A8A39C] hover:bg-[#E5E2DC] cursor-pointer transition-colors"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ transform: collapsed ? "rotate(-90deg)" : undefined, transition: "transform 0.15s" }}><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="w-6 h-6 flex items-center justify-center rounded text-[#A8A39C] hover:bg-red-50 hover:text-red-500 cursor-pointer transition-colors"
          >
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="px-3 py-3">
          {block.type === "text"          && <TextBlockEditor          block={block} onChange={b => onChange(b)} />}
          {block.type === "video"         && <VideoBlockEditor         block={block} onChange={b => onChange(b)} />}
          {block.type === "image"         && <ImageBlockEditor         block={block} onChange={b => onChange(b)} />}
          {block.type === "document"      && <DocumentBlockEditor      block={block} onChange={b => onChange(b)} />}
          {block.type === "pdf"           && <PdfBlockEditor           block={block} onChange={b => onChange(b)} />}
          {block.type === "quiz"          && <QuizBlockEditor          block={block} onChange={b => onChange(b)} />}
          {block.type === "questionnaire" && <QuestionnaireBlockEditor block={block} onChange={b => onChange(b)} />}
          {block.type === "survey"        && <SurveyBlockEditor        block={block} onChange={b => onChange(b)} />}
          {block.type === "assignment"    && <AssignmentBlockEditor    block={block} onChange={b => onChange(b)} />}
        </div>
      )}
    </div>
  )
}

// ── Main ContentBlockEditor ───────────────────────────────────────────────────

export default function ContentBlockEditor({
  blocks,
  onChange,
}: {
  blocks:   ContentBlock[]
  onChange: (blocks: ContentBlock[]) => void
}) {
  const [pickerOpen, setPickerOpen] = useState(false)

  function addBlock(block: ContentBlock) {
    onChange([...blocks, block])
  }

  function updateBlock(index: number, block: ContentBlock) {
    const next = [...blocks]
    next[index] = block
    onChange(next)
  }

  function removeBlock(index: number) {
    onChange(blocks.filter((_, i) => i !== index))
  }

  function moveBlock(index: number, dir: -1 | 1) {
    const next = [...blocks]
    const target = index + dir
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  return (
    <div className="space-y-2">
      {blocks.map((block, i) => (
        <BlockCard
          key={block.id}
          block={block}
          index={i}
          total={blocks.length}
          onChange={b => updateBlock(i, b)}
          onRemove={() => removeBlock(i)}
          onMove={dir => moveBlock(i, dir)}
        />
      ))}

      <div className="relative">
        <button
          type="button"
          onClick={() => setPickerOpen(o => !o)}
          className="flex items-center gap-2 text-[12px] font-semibold text-[#0474C4] hover:text-[#06457F] transition-colors cursor-pointer mt-1"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add content block
        </button>
        {pickerOpen && (
          <BlockPicker
            onPick={addBlock}
            onClose={() => setPickerOpen(false)}
          />
        )}
      </div>
    </div>
  )
}
