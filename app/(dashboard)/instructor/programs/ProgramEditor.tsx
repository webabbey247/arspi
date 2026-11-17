"use client"

// The programme editor (create/edit modal, AI course builder). Split out of
// page.tsx so the list loads without it — TipTap, react-hook-form, yup and
// the block editor only download when an editor actually opens.

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { useUploadThing } from "@/lib/uploadthing-client"
import { useForm, useFieldArray, Controller, useWatch, useController } from "react-hook-form"
import type { Control, UseFormRegister, FieldErrors } from "react-hook-form"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import ContentBlockEditor from "@/components/forms/ContentBlockEditor"
import { RubricScopeProvider } from "@/components/rubrics/RubricScope"
import FullRichTextEditor from "@/components/ui/RichTextEditor"
import { SearchableSelect } from "@/components/ui/SearchableSelect"
import type { ContentBlock } from "@/components/forms/ContentBlockEditor"
import AiFieldBuilderModal from "@/components/forms/AiFieldBuilderModal"
import { type CourseLevel, type Category, type Program, type FacilitatorItem, slugify, inputCls, Field, AiBuilderTrigger, Toggle } from "./program-shared"


// ── Thumbnail upload ───────────────────────────────────────────────────────────

export function ThumbnailUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false)
  const { startUpload } = useUploadThing("imageUploader")
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const res = await startUpload([file])
      if (res?.[0]?.url) onChange(res[0].url)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {value && (
        <div className="relative w-full h-32 rounded-[10px] overflow-hidden border border-[#DFE2ED]">
          <Image src={value} alt="Thumbnail" fill className="object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 cursor-pointer"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-[10px] text-[13px] font-semibold border border-dashed border-[#DFE2ED] text-[#69708A] hover:border-[#6655DF] hover:text-[#6655DF] disabled:opacity-50 transition-colors cursor-pointer"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        {uploading ? "Uploading…" : value ? "Replace thumbnail" : "Upload thumbnail"}
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  )
}

// ── Program modal (multi-step) ────────────────────────────────────────────────

export type Lesson = {
  id:          string
  title:       string
  description: string
  /** Optional rich-text intro shown to learners above the lesson content. */
  orientation?: string
  blocks:      ContentBlock[]
}
export type CurriculumItem = {
  id:      string
  title:   string
  desc:    string
  lessons: Lesson[]
}
export type FaqItem = { q: string; a: string }

export type ProgramFormValues = {
  // Step 1 — Basic Info + Programme Info (merged)
  title:       string
  slug:        string
  excerpt:     string
  thumbnail:   string
  pricing:     string
  paymentType: string
  price:       string
  level:       CourseLevel
  categoryId:  string
  tagline:     string
  featured:    boolean

  format:    string
  programFormatId: string
  duration:  string
  startDate: string
  endDate:   string
  cohortSize: string

  // Step 2 — Objectives
  overview:           string
  outlineIntro:       string
  targetAudience:     string[]
  learningObjectives: string[]
  whatIsIncluded:     string[]

  // Step 3 — Curriculum
  curriculum: CurriculumItem[]

  // Step 4 — Facilitators
  facilitators: FacilitatorItem[]

  // Step 5 — FAQs
  faqs: FaqItem[]
}

export const EMPTY_FORM: ProgramFormValues = {
  title: "", slug: "", excerpt: "", thumbnail: "",
  pricing: "free", paymentType: "", price: "0",
  level: "BEGINNER", categoryId: "", tagline: "", featured: false,
  format: "", programFormatId: "", duration: "", startDate: "", endDate: "", cohortSize: "",
  overview: "", outlineIntro: "", targetAudience: [], learningObjectives: [], whatIsIncluded: [],
  curriculum: [], facilitators: [], faqs: [],
}

// ── Format config ─────────────────────────────────────────────────────────────

export type FormatCfg = {
  durationLabel: string
  durationHint:  string
  showDates:     boolean
  showCohortSize: boolean
  endEditable:   boolean
  endHint:       string
  facilitatorRequired: boolean
}

export const FORMAT_CONFIGS: Record<string, FormatCfg> = {
  "Self-Paced": {
    durationLabel: "Est. Completion",
    durationHint:  "hours or weeks",
    showDates:      false,
    showCohortSize: false,
    endEditable:    false,
    endHint:        "",
    facilitatorRequired: false,
  },
  "Cohort Based": {
    durationLabel: "Duration",
    durationHint:  "Weeks",
    showDates:      true,
    showCohortSize: true,
    endEditable:    false,
    endHint:        "Auto-calculated from start date + duration",
    facilitatorRequired: true,
  },
  "Live Online": {
    durationLabel: "Session Duration",
    durationHint:  "hrs / session",
    showDates:      true,
    showCohortSize: false,
    endEditable:    true,
    endHint:        "Date of last session",
    facilitatorRequired: true,
  },
  "Blended": {
    durationLabel: "Programme Length",
    durationHint:  "Weeks",
    showDates:      true,
    showCohortSize: false,
    endEditable:    false,
    endHint:        "Auto-calculated from start date + duration",
    facilitatorRequired: true,
  },
}

// The Formats lookup names "Hybrid" and "In Person"; both run on dates like a
// blended cohort does.
FORMAT_CONFIGS["Hybrid"]    = FORMAT_CONFIGS["Blended"]
FORMAT_CONFIGS["In Person"] = FORMAT_CONFIGS["Blended"]

export const DEFAULT_FORMAT_CFG: FormatCfg = {
  durationLabel: "Duration",
  durationHint:  "Weeks",
  showDates:      false,
  showCohortSize: false,
  endEditable:    false,
  endHint:        "",
  facilitatorRequired: false,
}

// ── Step definitions ──────────────────────────────────────────────────────────

export const STEPS = [
  { label: "Basic Info",   desc: "Title, pricing & schedule"    },
  { label: "Objectives",   desc: "Outcomes & target audience"   },
  { label: "Curriculum",   desc: "Programme outline"            },
  { label: "Facilitators", desc: "Programme facilitators"       },
  { label: "FAQs",         desc: "Frequently asked questions"   },
]

// ── Validation schema ─────────────────────────────────────────────────────────

export const programSchema = yup.object({
  title:       yup.string().min(3, "Title must be at least 3 characters").max(255, "Title is too long").required("Title is required"),
  slug:        yup.string().test("slug-format", "Slug must be lowercase with hyphens only", v => !v || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v)).max(255, "Slug is too long"),
  excerpt:     yup.string().min(10, "Excerpt must be at least 10 characters").required("Excerpt / Summary is required"),
  thumbnail:   yup.string(),
  pricing:     yup.string().oneOf(["free", "paid"], "Invalid pricing").required("Pricing is required"),
  paymentType: yup.string().when("pricing", {
    is:   "paid",
    then: s => s.required("Payment type is required for paid programmes"),
  }),
  price:       yup.string(),
  level:       yup.string().oneOf(["BEGINNER", "INTERMEDIATE", "ADVANCED"], "Invalid level").required("Level is required"),
  categoryId:  yup.string(),
  tagline:     yup.string().max(500, "Tagline is too long"),
  featured:    yup.boolean().required(),

  format:    yup.string(),
  programFormatId: yup.string(),
  duration:  yup.string(),
  startDate: yup.string().when("format", {
    is:   (f: string) => ["Cohort Based", "Live Online", "Blended"].includes(f),
    then: s => s.required("Start date is required for this format"),
  }),
  endDate:   yup.string().when("format", {
    is:   (f: string) => ["Cohort Based", "Live Online", "Blended"].includes(f),
    then: s => s.required("End date is required for this format"),
  }),
  cohortSize: yup.string().when("format", {
    is:   "Cohort Based",
    then: s => s.required("Cohort size is required"),
  }),

  // Step 2
  overview:           yup.string(),
  outlineIntro:       yup.string().max(5000, "Keep the outline introduction under 5,000 characters"),
  targetAudience:     yup.array(yup.string().default("")).min(1, "Add at least one target audience entry"),
  learningObjectives: yup.array(yup.string().default("")).min(1, "Add at least one learning objective"),
  whatIsIncluded:     yup.array(yup.string().default("")).min(1, "Add at least one item"),

  // Step 3
  curriculum: yup.array(yup.object({
    id:    yup.string(),
    title: yup.string().required("Module title is required"),
    desc:  yup.string(),
    lessons: yup.array(yup.object({
      id:          yup.string(),
      title:       yup.string().required("Lesson title is required"),
      description: yup.string(),
      orientation: yup.string(),
      blocks:      yup.array(yup.mixed()).default([]),
    })),
  })),

  // Step 4
  facilitators: yup.array(yup.object({
    name:        yup.string().required("Full name is required"),
    imageUrl:    yup.string(),
    title:       yup.string().required("Title / Role is required"),
    bio:         yup.string().required("Biography is required").max(2000, "Biography is too long"),
    credentials: yup.string(),
  })).when("format", {
    is:   (f: string) => ["Cohort Based", "Live Online", "Blended"].includes(f),
    then: s => s.min(1, "At least one facilitator is required for this format"),
  }),

  // Step 5
  faqs: yup.array(yup.object({
    q: yup.string().required("Question is required"),
    a: yup.string(),
  })).min(1, "At least one FAQ is required"),
})

export const STEP_FIELDS: Record<number, (keyof ProgramFormValues)[]> = {
  1: ["title", "slug", "excerpt", "thumbnail", "pricing", "paymentType", "price", "level", "categoryId", "tagline", "featured", "format", "duration", "startDate", "endDate", "cohortSize"],
  2: ["overview", "targetAudience", "learningObjectives", "whatIsIncluded"],
  3: ["outlineIntro", "curriculum"],
  4: ["facilitators"],
  5: ["faqs"],
}

// ── Inline field error ────────────────────────────────────────────────────────

export function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="text-[11px] text-red-600 mt-0.5">{msg}</p>
}

// ── Step indicator ────────────────────────────────────────────────────────────

export function StepIndicator({ current, onJump }: { current: number; onJump?: (n: number) => void }) {
  return (
    <div className="flex items-start px-5 py-3 border-b border-[#DFE2ED] bg-[#FAFAFF] shrink-0 overflow-x-auto">
      {STEPS.map((s, i) => {
        const n = i + 1
        const done   = n < current
        const active = n === current
        return (
          <div key={i} className="flex items-start">
            {i > 0 && (
              <div className="flex items-center pt-2.75 shrink-0">
                <div className={`h-px w-5 ${done ? "bg-[#6655DF]" : "bg-[#DFE2ED]"}`} />
              </div>
            )}
            <button
              type="button"
              onClick={() => onJump?.(n)}
              className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group px-1"
            >
              <span className={`w-5.5 h-5.5 rounded-full text-[10px] font-bold flex items-center justify-center transition-all ${
                done   ? "bg-[#6655DF] text-white" :
                active ? "bg-[#6655DF] text-white shadow-sm shadow-[#6655DF]/30" :
                         "bg-[#DFE2ED] text-[#8A90A6] group-hover:bg-[#DDD9F4] group-hover:text-[#6655DF]"
              }`}>
                {done
                  ? <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>
                  : n}
              </span>
              <span className={`text-[9px] font-semibold tracking-wide whitespace-nowrap ${
                active ? "text-[#6655DF]" : done ? "text-[#6655DF]/60" : "text-[#8A90A6]"
              }`}>{s.label}</span>
            </button>
          </div>
        )
      })}
    </div>
  )
}

// ── Dynamic list editors ──────────────────────────────────────────────────────

export function StringListEditor({
  items, onChange, placeholder, addLabel = "Add item",
}: {
  items:        string[]
  onChange:     (v: string[]) => void
  placeholder?: string
  addLabel?:    string
}) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <input
            value={item}
            onChange={e => { const n = [...items]; n[i] = e.target.value; onChange(n) }}
            className={inputCls}
            placeholder={placeholder}
          />
          <button
            type="button"
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="w-8 h-9 flex items-center justify-center rounded-[8px] border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 shrink-0 cursor-pointer"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, ""])}
        className="flex items-center gap-1.5 text-[12px] font-semibold text-[#6655DF] hover:text-[#2C2368] transition-colors cursor-pointer mt-1"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        {addLabel}
      </button>
    </div>
  )
}

// ── Rich text editor (TipTap) ─────────────────────────────────────────────────

export function RichTextEditor({ value, onChange, placeholder }: {
  value:        string
  onChange:     (v: string) => void
  placeholder?: string
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: placeholder ?? "Start writing…" }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "px-3 py-2.5 min-h-[140px] text-[13px] text-[#171C35] outline-none [&_ul]:list-disc [&_ul]:ml-4 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:ml-4 [&_ol]:space-y-1 [&_p]:leading-relaxed",
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
      <button
        type="button"
        onClick={action}
        className={`w-7 h-7 flex items-center justify-center rounded text-[12px] transition-colors cursor-pointer ${
          active ? "bg-[#6655DF] text-white" : "text-[#69708A] hover:bg-[#DFE2ED]"
        }`}
      >
        {label}
      </button>
    )
  }

  return (
    <div className="border border-[#DFE2ED] rounded-[10px] overflow-hidden focus-within:border-[#6655DF] transition-colors">
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-[#DFE2ED] bg-[#FAFAFF]">
        {tb(!!editor?.isActive("bold"),        <b>B</b>,  () => editor?.chain().focus().toggleBold().run())}
        {tb(!!editor?.isActive("italic"),      <em>I</em>, () => editor?.chain().focus().toggleItalic().run())}
        {tb(!!editor?.isActive("bulletList"),
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1.5" fill="currentColor"/><circle cx="4" cy="12" r="1.5" fill="currentColor"/><circle cx="4" cy="18" r="1.5" fill="currentColor"/></svg>,
          () => editor?.chain().focus().toggleBulletList().run()
        )}
        {tb(!!editor?.isActive("orderedList"),
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>,
          () => editor?.chain().focus().toggleOrderedList().run()
        )}
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}

// ── Facilitator avatar upload ─────────────────────────────────────────────────

export function FacilitatorAvatarUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false)
  const { startUpload } = useUploadThing("imageUploader")
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const res = await startUpload([file])
      if (res?.[0]?.url) onChange(res[0].url)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div className="flex items-center gap-3">
      {value ? (
        <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-[#DFE2ED] shrink-0 group">
          <Image src={value} alt="Facilitator" fill className="object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute inset-0 bg-[#171C35]/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      ) : (
        <div className="w-14 h-14 rounded-full border-2 border-dashed border-[#DFE2ED] flex items-center justify-center shrink-0 text-[#8A90A6]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
        </div>
      )}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold border border-[#DFE2ED] rounded-[8px] text-[#69708A] hover:border-[#6655DF] hover:text-[#6655DF] disabled:opacity-50 transition-colors cursor-pointer"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        {uploading ? "Uploading…" : value ? "Change photo" : "Upload photo"}
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  )
}

// ── Lessons editor (nested within a chapter) ──────────────────────────────────

export function LessonItem({
  control, register, errors, moduleIndex, lessonIndex, onRemove, courseTitle, chapterTitle,
}: {
  control:      Control<ProgramFormValues>
  register:     UseFormRegister<ProgramFormValues>
  errors:       FieldErrors<ProgramFormValues>
  moduleIndex:  number
  lessonIndex:  number
  onRemove:     () => void
  courseTitle:  string
  chapterTitle: string
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lessonTitle = useWatch({ control, name: `curriculum.${moduleIndex}.lessons.${lessonIndex}.title` as any }) as string | undefined
  const { field: descriptionField } = useController({
    control,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    name: `curriculum.${moduleIndex}.lessons.${lessonIndex}.description` as any,
  })
  const lessonSummary = descriptionField.value as string | undefined
  const { field: orientationField } = useController({
    control,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    name: `curriculum.${moduleIndex}.lessons.${lessonIndex}.orientation` as any,
  })
  const [aiOpen, setAiOpen] = useState(false)
  const [orientationAiOpen, setOrientationAiOpen] = useState(false)

  return (
    <div className="border border-[#DFE2ED] rounded-[10px] bg-white overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-[#F5F6FB] border-b border-[#DFE2ED]">
        <span className="text-[10px] font-bold text-[#69708A] uppercase tracking-wide">Lesson {lessonIndex + 1}</span>
        <button type="button" onClick={onRemove} className="w-5 h-5 flex items-center justify-center rounded-full text-[#8A90A6] hover:bg-red-50 hover:text-red-500 cursor-pointer">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div className="px-3 py-3 space-y-3">
        <Field label="Title" required>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <input {...register(`curriculum.${moduleIndex}.lessons.${lessonIndex}.title` as any)} className={inputCls} placeholder="e.g. Introduction to Results Frameworks" />
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <FieldError msg={(errors.curriculum?.[moduleIndex] as any)?.lessons?.[lessonIndex]?.title?.message} />
        </Field>
        <Field label="Short Description" action={<AiBuilderTrigger onClick={() => setAiOpen(true)} />}>
          <RichTextEditor
            value={(lessonSummary as string) ?? ""}
            onChange={descriptionField.onChange}
            placeholder="Brief description of this lesson…"
          />
        </Field>
        {aiOpen && (
          <AiFieldBuilderModal
            title="AI Builder — Lesson Description"
            kind="lesson-summary"
            context={{ courseTitle, chapterTitle, lessonTitle: lessonTitle || undefined }}
            currentValue={lessonSummary ?? ""}
            onGenerated={html => descriptionField.onChange(html)}
            onClose={() => setAiOpen(false)}
          />
        )}
        <Field
          label="Lesson Orientation"
          hint="Optional. Shown to learners above the lesson content, under “Why this lesson matters”."
          action={<AiBuilderTrigger onClick={() => setOrientationAiOpen(true)} />}
        >
          {/* The shared editor, not this file's cut-down one: orientation is
              prose a learner reads, so it needs headings, links and lists. */}
          <FullRichTextEditor
            value={(orientationField.value as string) ?? ""}
            onChange={orientationField.onChange}
            placeholder="Why this lesson matters, and what it sets up…"
            minHeight={160}
          />
        </Field>
        {orientationAiOpen && (
          <AiFieldBuilderModal
            title="AI Builder — Lesson Orientation"
            kind="lesson-orientation"
            context={{ courseTitle, chapterTitle, lessonTitle: lessonTitle || undefined }}
            currentValue={(orientationField.value as string) ?? ""}
            onGenerated={html => orientationField.onChange(html)}
            onClose={() => setOrientationAiOpen(false)}
          />
        )}
        <Field label="Embedded Content">
          <Controller
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            name={`curriculum.${moduleIndex}.lessons.${lessonIndex}.blocks` as any}
            control={control}
            render={({ field }) => (
              <ContentBlockEditor
                blocks={(field.value as ContentBlock[]) ?? []}
                onChange={field.onChange}
                aiContext={{
                  courseTitle,
                  chapterTitle,
                  lessonTitle:   lessonTitle || undefined,
                  lessonSummary: lessonSummary || undefined,
                }}
              />
            )}
          />
        </Field>
      </div>
    </div>
  )
}

export function LessonsEditor({
  control, register, errors, moduleIndex,
}: {
  control:     Control<ProgramFormValues>
  register:    UseFormRegister<ProgramFormValues>
  errors:      FieldErrors<ProgramFormValues>
  moduleIndex: number
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    name: `curriculum.${moduleIndex}.lessons` as any,
  })
  const courseTitle  = (useWatch({ control, name: "title" }) as string | undefined) ?? ""
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chapterTitle = (useWatch({ control, name: `curriculum.${moduleIndex}.title` as any }) as string | undefined) ?? ""

  return (
    <div className="space-y-3">
      <p className="text-[11px] font-bold text-[#69708A] uppercase tracking-[0.4px]">Lessons</p>
      {fields.map((field, j) => (
        <LessonItem
          key={field.id}
          control={control}
          register={register}
          errors={errors}
          moduleIndex={moduleIndex}
          lessonIndex={j}
          onRemove={() => remove(j)}
          courseTitle={courseTitle}
          chapterTitle={chapterTitle}
        />
      ))}
      <button
        type="button"
        onClick={() => append({ id: crypto.randomUUID(), title: "", description: "", blocks: [] } as never)}
        className="flex items-center gap-1.5 text-[12px] font-semibold text-[#6655DF] hover:text-[#2C2368] transition-colors cursor-pointer"
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add Lesson
      </button>
    </div>
  )
}

// ── Curriculum chapter card ───────────────────────────────────────────────────

export function CurriculumModuleCard({
  control, register, errors, index, onRemove,
}: {
  control:  Control<ProgramFormValues>
  register: UseFormRegister<ProgramFormValues>
  errors:   FieldErrors<ProgramFormValues>
  index:    number
  onRemove: () => void
}) {
  const courseTitle = (useWatch({ control, name: "title" }) as string | undefined) ?? ""
  const moduleTitle = (useWatch({ control, name: `curriculum.${index}.title` }) as string | undefined) ?? ""
  const { field: descField } = useController({
    control,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    name: `curriculum.${index}.desc` as any,
  })
  const [aiOpen, setAiOpen] = useState(false)

  return (
    <div className="border border-[#DFE2ED] rounded-[12px] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#FAFAFF] border-b border-[#DFE2ED]">
        <span className="text-[11px] font-bold text-[#6655DF] uppercase tracking-wide">Module {index + 1}</span>
        <button type="button" onClick={onRemove} className="w-6 h-6 flex items-center justify-center rounded-full text-[#8A90A6] hover:bg-red-50 hover:text-red-500 cursor-pointer">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div className="px-4 py-3 space-y-3">
        <Field label="Title" required>
          <input {...register(`curriculum.${index}.title`)} className={inputCls} placeholder="e.g. Foundations of M&E" />
          <FieldError msg={errors.curriculum?.[index]?.title?.message} />
        </Field>
        <Field label="Description" action={<AiBuilderTrigger onClick={() => setAiOpen(true)} />}>
          <RichTextEditor
            value={(descField.value as string) ?? ""}
            onChange={descField.onChange}
            placeholder="Brief overview of this module…"
          />
        </Field>
        {aiOpen && (
          <AiFieldBuilderModal
            title="AI Builder — Module Description"
            kind="module"
            context={{ courseTitle, chapterTitle: moduleTitle || undefined }}
            currentValue={(descField.value as string) ?? ""}
            onGenerated={html => descField.onChange(html)}
            onClose={() => setAiOpen(false)}
          />
        )}
        <LessonsEditor control={control} register={register} errors={errors} moduleIndex={index} />
      </div>
    </div>
  )
}

// ── Curriculum editor ─────────────────────────────────────────────────────────

export function CurriculumEditor({
  control, register, errors,
}: {
  control:  Control<ProgramFormValues>
  register: UseFormRegister<ProgramFormValues>
  errors:   FieldErrors<ProgramFormValues>
}) {
  const { fields, append, remove } = useFieldArray({ control, name: "curriculum" })
  return (
    <div className="space-y-3">
      {fields.map((field, i) => (
        <CurriculumModuleCard
          key={field.id}
          control={control}
          register={register}
          errors={errors}
          index={i}
          onRemove={() => remove(i)}
        />
      ))}
      <button
        type="button"
        onClick={() => append({ id: crypto.randomUUID(), title: "", desc: "", lessons: [] })}
        className="flex items-center gap-1.5 text-[12px] font-semibold text-[#6655DF] hover:text-[#2C2368] transition-colors cursor-pointer"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add Module
      </button>
    </div>
  )
}

// ── Facilitators editor ───────────────────────────────────────────────────────

export function FacilitatorsEditor({
  control, register, errors,
}: {
  control:  Control<ProgramFormValues>
  register: UseFormRegister<ProgramFormValues>
  errors:   FieldErrors<ProgramFormValues>
}) {
  const { fields, append, remove } = useFieldArray({ control, name: "facilitators" })
  return (
    <div className="space-y-4">
      {fields.length === 0 && (
        <p className="text-[12px] text-[#8A90A6] italic">No facilitators added yet.</p>
      )}
      {fields.map((field, i) => (
        <div key={field.id} className="border border-[#DFE2ED] rounded-[12px] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#FAFAFF] border-b border-[#DFE2ED]">
            <span className="text-[11px] font-bold text-[#6655DF] uppercase tracking-wide">Facilitator {i + 1}</span>
            <button type="button" onClick={() => remove(i)} className="w-6 h-6 flex items-center justify-center rounded-full text-[#8A90A6] hover:bg-red-50 hover:text-red-500 cursor-pointer">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div className="px-4 py-4 space-y-3">
            <Field label="Photo" hint="optional">
              <Controller
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                name={`facilitators.${i}.imageUrl` as any}
                control={control}
                render={({ field }) => (
                  <FacilitatorAvatarUpload
                    value={(field.value as string) ?? ""}
                    onChange={field.onChange}
                  />
                )}
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Full Name" required>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <input {...register(`facilitators.${i}.name` as any)} className={inputCls} placeholder="e.g. Dr. Rachel Osei" />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <FieldError msg={(errors.facilitators?.[i] as any)?.name?.message} />
              </Field>
              <Field label="Title / Role" required>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <input {...register(`facilitators.${i}.title` as any)} className={inputCls} placeholder="e.g. Senior Researcher & M&E Specialist" />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <FieldError msg={(errors.facilitators?.[i] as any)?.title?.message} />
              </Field>
            </div>
            <Field label="Biography" required hint="max 2000 characters">
              <Controller
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                name={`facilitators.${i}.bio` as any}
                control={control}
                render={({ field }) => (
                  <RichTextEditor
                    value={(field.value as string) ?? ""}
                    onChange={field.onChange}
                    placeholder="Short biography of the programme facilitator…"
                  />
                )}
              />
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <FieldError msg={(errors.facilitators?.[i] as any)?.bio?.message} />
            </Field>
            <Field label="Credentials" hint="optional — separate by line">
              <textarea
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                {...register(`facilitators.${i}.credentials` as any)}
                rows={2}
                className={inputCls}
                placeholder="e.g. PhD Research Methods — University of Ghana"
              />
            </Field>
          </div>
        </div>
      ))}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {(errors.facilitators as any)?.message && (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        <p className="text-[11px] text-red-600">{(errors.facilitators as any).message}</p>
      )}
      <button
        type="button"
        onClick={() => append({ name: "", imageUrl: "", title: "", bio: "", credentials: "" })}
        className="flex items-center gap-1.5 text-[12px] font-semibold text-[#6655DF] hover:text-[#2C2368] transition-colors cursor-pointer"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add Facilitator
      </button>
    </div>
  )
}

// ── FAQ editor ────────────────────────────────────────────────────────────────

export function FaqEditor({
  control, register, errors,
}: {
  control:  Control<ProgramFormValues>
  register: UseFormRegister<ProgramFormValues>
  errors:   FieldErrors<ProgramFormValues>
}) {
  const { fields, append, remove } = useFieldArray({ control, name: "faqs" })
  return (
    <div className="space-y-3">
      {fields.map((field, i) => (
        <div key={field.id} className="border border-[#DFE2ED] rounded-[12px] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#FAFAFF] border-b border-[#DFE2ED]">
            <span className="text-[11px] font-bold text-[#69708A] uppercase tracking-wide">FAQ {i + 1}</span>
            <button
              type="button"
              onClick={() => remove(i)}
              className="w-6 h-6 flex items-center justify-center rounded-full text-[#8A90A6] hover:bg-red-50 hover:text-red-500 cursor-pointer"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div className="px-4 py-3 space-y-3">
            <Field label="Question" required>
              <input {...register(`faqs.${i}.q`)} className={inputCls} placeholder="e.g. Do I need prior M&E experience to enrol?" />
              <FieldError msg={errors.faqs?.[i]?.q?.message} />
            </Field>
            <Field label="Answer">
              <textarea {...register(`faqs.${i}.a`)} rows={3} className={inputCls} placeholder="Provide a clear, helpful answer…" />
            </Field>
          </div>
        </div>
      ))}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {(errors.faqs as any)?.message && (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        <p className="text-[11px] text-red-600">{(errors.faqs as any).message}</p>
      )}
      <button
        type="button"
        onClick={() => append({ q: "", a: "" })}
        className="flex items-center gap-1.5 text-[12px] font-semibold text-[#6655DF] hover:text-[#2C2368] transition-colors cursor-pointer"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add FAQ
      </button>
    </div>
  )
}

/** Gives every rubric picker inside the editor (assignment blocks) this
 *  programme's scope, so it can offer and create programme-specific rubrics.
 *  A programme that hasn't been saved yet has no id, so no scope. */
export function ProgramModal(props: React.ComponentProps<typeof ProgramModalInner>) {
  return (
    <RubricScopeProvider value={props.program ? { courseId: props.program.id, courseTitle: props.program.title } : null}>
      <ProgramModalInner {...props} />
    </RubricScopeProvider>
  )
}

// ── Category · Level · Programme type ────────────────────────────────────────

export const PRICING_OPTIONS = [
  { value: "free", label: "Free" },
  { value: "paid", label: "Paid" },
]

export const PAYMENT_TYPE_OPTIONS = [
  { value: "one-time",     label: "One-time payment" },
  { value: "subscription", label: "Subscription / Membership" },
  { value: "monthly",      label: "Monthly Payment Plan" },
]

export const LEVEL_OPTIONS = [
  { value: "BEGINNER",     label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED",     label: "Advanced" },
]

/** Same row as the admin editor: each a searchable select. Programme type
 *  sets both `programFormatId` and the `format` name. */
export function ClassificationRow({ control, setValue, errors, categories, formats, children }: {
  control:    Control<ProgramFormValues>
  setValue:   (name: "format" | "programFormatId", value: string, opts?: { shouldDirty?: boolean; shouldValidate?: boolean }) => void
  errors:     FieldErrors<ProgramFormValues>
  categories: Category[]
  formats:    { id: string; name: string }[]
  /** Rendered after Programme type, sharing its row (the Pricing field). */
  children?:  React.ReactNode
}) {
  const format = useWatch({ control, name: "format" })
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Field label="Category" required>
        <Controller
          control={control} name="categoryId"
          render={({ field }) => (
            <SearchableSelect
              label="Category" placeholder="— Select —" searchPlaceholder="Search categories"
              emptyMessage="No categories available."
              options={categories.map(c => ({ value: c.id, label: c.name }))}
              value={field.value ?? ""} onChange={field.onChange}
            />
          )}
        />
      </Field>
      <Field label="Level" required>
        <Controller
          control={control} name="level"
          render={({ field }) => (
            <SearchableSelect
              label="Level" searchPlaceholder="Search levels"
              options={LEVEL_OPTIONS}
              value={field.value ?? ""} onChange={field.onChange}
              invalid={!!errors.level}
            />
          )}
        />
        <FieldError msg={errors.level?.message} />
      </Field>
      <Field label="Programme type">
        <Controller
          control={control} name="programFormatId"
          render={({ field }) => {
            const current = field.value || formats.find(f => f.name === format)?.id || ""
            return (
              <SearchableSelect
                label="Programme type" placeholder="— Select —" searchPlaceholder="Search types"
                emptyMessage="No programme types available."
                options={formats.map(f => ({ value: f.id, label: f.name }))}
                value={current}
                onChange={id => {
                  field.onChange(id)
                  setValue("format", formats.find(f => f.id === id)?.name ?? "", { shouldDirty: true, shouldValidate: true })
                }}
              />
            )
          }}
        />
      </Field>
      {children}
    </div>
  )
}

export function ProgramModalInner({
  program, categories, formats, onSave, onClose,
}: {
  program:    Program | null
  categories: Category[]
  formats:    { id: string; name: string }[]
  onSave:     (values: ProgramFormValues) => Promise<void>
  onClose:    () => void
}) {
  const [step,        setStep]        = useState(1)
  const [saving,      setSaving]      = useState(false)
  const [serverError, setServerError] = useState("")

  const defaultValues: ProgramFormValues = program ? {
    title:       program.title,
    slug:        program.slug,
    excerpt:     program.excerpt,
    thumbnail:   program.thumbnail   ?? "",
    pricing:     program.pricing     ?? "free",
    paymentType: program.paymentType ?? "",
    price:       String(program.price),
    level:       program.level,
    categoryId:  program.categoryId  ?? "",
    tagline:     program.tagline     ?? "",
    featured:    program.featured,
    format:      program.format     ?? "",
    programFormatId: program.programFormatId ?? "",
    duration:    program.duration   ?? "",
    startDate:   program.startDate  ?? "",
    endDate:     program.endDate    ?? "",
    cohortSize:  program.cohortSize != null ? String(program.cohortSize) : "",
    overview:           program.overview ?? "",
    outlineIntro:       program.outlineIntro ?? "",
    targetAudience:     Array.isArray(program.targetAudience)     ? (program.targetAudience as string[])     : [],
    learningObjectives: Array.isArray(program.learningObjectives) ? (program.learningObjectives as string[]) : [],
    whatIsIncluded:     Array.isArray(program.whatIsIncluded)     ? (program.whatIsIncluded as string[])     : [],
    curriculum: Array.isArray(program.curriculum)
      ? (program.curriculum as Record<string, unknown>[]).map(m => ({
          // Backfill a stable id for curriculum authored before lesson-level
          // completion tracking existed — it's written back on next save.
          id:    typeof m.id === "string" && m.id ? m.id : crypto.randomUUID(),
          title: String(m.title ?? ""),
          desc:  String(m.desc  ?? ""),
          lessons: Array.isArray(m.lessons)
            ? (m.lessons as Record<string, unknown>[]).map(l => ({
                id:          typeof l.id === "string" && l.id ? l.id : crypto.randomUUID(),
                title:       String(l.title       ?? ""),
                description: String(l.description ?? ""),
                orientation: String(l.orientation ?? ""),
                blocks:      Array.isArray(l.blocks) ? l.blocks as ContentBlock[] : [],
              }))
            : [],
        }))
      : [],
    facilitators: Array.isArray(program.facilitators)
      ? (program.facilitators as Record<string, unknown>[]).map(f => ({
          name:        String(f.name        ?? ""),
          imageUrl:    String(f.imageUrl    ?? ""),
          title:       String(f.title       ?? ""),
          bio:         String(f.bio         ?? ""),
          credentials: String(f.credentials ?? ""),
        }))
      : [],
    faqs: Array.isArray(program.faqs) ? (program.faqs as FaqItem[]) : [],
  } : EMPTY_FORM

  const {
    register,
    control,
    handleSubmit,
    trigger,
    setValue,
    watch,
    formState: { errors },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<ProgramFormValues>({ resolver: yupResolver(programSchema) as any, defaultValues })

  // Auto-generate slug from title when creating
  const watchedTitle = watch("title")
  useEffect(() => {
    if (!program) {
      setValue("slug", slugify(watchedTitle ?? ""), { shouldValidate: false, shouldDirty: false })
    }
  }, [watchedTitle, program, setValue])

  // Format-aware config
  const watchedFormat = watch("format")
  const formatCfg     = FORMAT_CONFIGS[watchedFormat] ?? DEFAULT_FORMAT_CFG

  // Pricing watcher — clear price/paymentType when free
  const watchedPricing = watch("pricing")
  useEffect(() => {
    if (watchedPricing === "free") {
      setValue("price", "0", { shouldValidate: false, shouldDirty: false })
      setValue("paymentType", "", { shouldValidate: false, shouldDirty: false })
    }
  }, [watchedPricing, setValue])

  // Auto-compute end date from start date + duration (not for Live Online)
  const watchedStartDate = watch("startDate")
  const watchedDuration  = watch("duration")
  useEffect(() => {
    if (formatCfg.endEditable) return
    const weeks = parseInt(watchedDuration ?? "") || 0
    if (watchedStartDate && weeks > 0) {
      const d = new Date(watchedStartDate)
      d.setDate(d.getDate() + weeks * 7)
      setValue("endDate", d.toISOString().split("T")[0], { shouldValidate: false, shouldDirty: false })
    }
  }, [watchedStartDate, watchedDuration, formatCfg.endEditable, setValue])

  async function handleNext() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const valid = await trigger(STEP_FIELDS[step] as any)
    if (valid) {
      setServerError("")
      setStep(s => Math.min(s + 1, STEPS.length))
    }
  }

  function handleBack() {
    setServerError("")
    setStep(s => Math.max(s - 1, 1))
  }

  async function onSubmit(values: ProgramFormValues) {
    setSaving(true)
    setServerError("")
    try { await onSave(values) }
    catch (e) { setServerError(e instanceof Error ? e.message : "Something went wrong.") }
    finally { setSaving(false) }
  }

  const isLast = step === STEPS.length

  return (
    <div className="fixed inset-0 z-100 flex items-start justify-end bg-[#171C35]/40">
      <div className="bg-white h-full w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="bg-[linear-gradient(135deg,#241C61,#6756DF)] px-6 py-5 shrink-0 relative">
          <button type="button" onClick={onClose} className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/20 text-white uppercase tracking-wider">
              {program ? "Edit Program" : "New Program"}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-white/70 uppercase tracking-wider">
              {STEPS[step - 1].label}
            </span>
          </div>
          <h2 className="text-[18px] font-extrabold text-white leading-tight">
            {program ? program.title : "Create Program"}
          </h2>
          <p className="text-[12px] text-white/80 mt-1">
            {STEPS[step - 1].desc}
          </p>
        </div>

        {/* Step indicator */}
        <StepIndicator
          current={step}
          onJump={program ? n => { setServerError(""); setStep(n) } : undefined}
        />

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {serverError && (
            <p className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{serverError}</p>
          )}

          {/* Step 1 — Basic Info + Programme Info (merged) */}
          {step === 1 && <>
            <Field label="Thumbnail" required>
              <Controller
                name="thumbnail"
                control={control}
                render={({ field }) => <ThumbnailUpload value={field.value} onChange={field.onChange} />}
              />
            </Field>
            <Field label="Title" required>
              <input autoFocus {...register("title")} className={inputCls} placeholder="e.g. Policy Leadership Programme" />
              <FieldError msg={errors.title?.message} />
            </Field>
            <Field label="Slug" hint="auto-generated — read only">
              <input
                {...register("slug")}
                readOnly
                className={`${inputCls} bg-[#FAFAFF] text-[#69708A] cursor-default`}
              />
            </Field>
            <Field label="Excerpt / Summary" required hint="Short note shown on listing cards">
              <textarea {...register("excerpt")} rows={3} className={inputCls} placeholder="A concise summary of this programme…" />
              <FieldError msg={errors.excerpt?.message} />
            </Field>
            <Field label="Tagline" hint="Optional subtitle">
              <input {...register("tagline")} className={inputCls} placeholder="e.g. Master results-based frameworks and evaluation methods" />
              <FieldError msg={errors.tagline?.message} />
            </Field>
            {/* Category · Level / Programme type · Pricing */}
            <ClassificationRow control={control} setValue={setValue} errors={errors} categories={categories} formats={formats}>
              <Field label="Pricing" required>
                <Controller
                  control={control} name="pricing"
                  render={({ field }) => (
                    <SearchableSelect
                      label="Pricing" searchPlaceholder="Search pricing"
                      options={PRICING_OPTIONS}
                      value={field.value ?? ""} onChange={field.onChange}
                      invalid={!!errors.pricing}
                    />
                  )}
                />
                <FieldError msg={errors.pricing?.message} />
              </Field>
            </ClassificationRow>

            {/* Payment type · Price — only for paid programmes */}
            {watchedPricing === "paid" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Payment Type" required>
                  <Controller
                    control={control} name="paymentType"
                    render={({ field }) => (
                      <SearchableSelect
                        label="Payment type" placeholder="— Select —" searchPlaceholder="Search payment types"
                        options={PAYMENT_TYPE_OPTIONS}
                        value={field.value ?? ""} onChange={field.onChange}
                        invalid={!!errors.paymentType}
                      />
                    )}
                  />
                  <FieldError msg={errors.paymentType?.message} />
                </Field>
                <Field label="Price (USD)" required>
                  <input type="number" min="0" step="0.01" {...register("price")} className={inputCls} placeholder="e.g. 499" />
                  <FieldError msg={errors.price?.message} />
                </Field>
              </div>
            )}

            <div className="flex items-center gap-6 pt-1">
              <Controller
                name="featured"
                control={control}
                render={({ field }) => <Toggle label="Featured" checked={!!field.value} onChange={field.onChange} />}
              />
            </div>

            {/* Programme details */}
            <div className="border-t border-[#DFE2ED] pt-4">
              <p className="text-[11px] font-bold text-[#69708A] uppercase tracking-[0.4px] mb-3">Programme Details</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Format">
                  <select {...register("format")} className={inputCls}>
                    <option value="">— Select —</option>
                    <option value="Self-Paced">Self-Paced</option>
                    <option value="Cohort Based">Cohort Based</option>
                    <option value="Live Online">Live Online</option>
                    <option value="Blended">Blended</option>
                  </select>
                </Field>
                <Field label={formatCfg.durationLabel} hint={formatCfg.durationHint}>
                  <input type="number" min="1" {...register("duration")} className={inputCls} placeholder="e.g. 8" />
                </Field>
                {formatCfg.showDates && <>
                  <Field label="Start Date" required>
                    <input type="date" {...register("startDate")} className={inputCls} />
                    <FieldError msg={errors.startDate?.message} />
                  </Field>
                  <Field label="End Date" hint={formatCfg.endHint} required>
                    <input
                      type="date"
                      {...register("endDate")}
                      readOnly={!formatCfg.endEditable}
                      className={`${inputCls} ${!formatCfg.endEditable ? "bg-[#FAFAFF] text-[#69708A] cursor-default" : ""}`}
                    />
                    <FieldError msg={errors.endDate?.message} />
                  </Field>
                </>}
                {formatCfg.showCohortSize && (
                  <Field label="Cohort Size" required>
                    <input type="number" min="1" {...register("cohortSize")} className={inputCls} placeholder="e.g. 35" />
                    <FieldError msg={errors.cohortSize?.message} />
                  </Field>
                )}
              </div>
            </div>
          </>}

          {/* Step 2 — Objectives */}
          {step === 2 && <>
            <Field label="Overview">
              <Controller
                name="overview"
                control={control}
                render={({ field }) => (
                  <RichTextEditor
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder="A short overview of what this programme is about…"
                  />
                )}
              />
            </Field>
            <Field label="Learning Objectives" required>
              <Controller
                name="learningObjectives"
                control={control}
                render={({ field }) => (
                  <StringListEditor
                    items={field.value ?? []}
                    onChange={field.onChange}
                    placeholder="e.g. Design results-based M&E frameworks aligned to programme logics"
                    addLabel="Add objective"
                  />
                )}
              />
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <FieldError msg={(errors.learningObjectives as any)?.message} />
            </Field>
            <Field label="Target Audience" required>
              <Controller
                name="targetAudience"
                control={control}
                render={({ field }) => (
                  <StringListEditor
                    items={field.value ?? []}
                    onChange={field.onChange}
                    placeholder="e.g. Mid-career development practitioners"
                    addLabel="Add audience"
                  />
                )}
              />
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <FieldError msg={(errors.targetAudience as any)?.message} />
            </Field>
            <Field label="Highlights" required>
              <Controller
                name="whatIsIncluded"
                control={control}
                render={({ field }) => (
                  <StringListEditor
                    items={field.value ?? []}
                    onChange={field.onChange}
                    placeholder="e.g. 8 live virtual sessions (recorded)"
                    addLabel="Add item"
                  />
                )}
              />
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <FieldError msg={(errors.whatIsIncluded as any)?.message} />
            </Field>
          </>}

          {/* Step 3 — Curriculum */}
          {step === 3 && <>
            <p className="text-[13px] text-[#69708A] leading-relaxed">
              Build the programme outline. Each module appears as an accordion on the public page.
            </p>
            <Field label="Outline introduction" hint="Shown under “Programme Outline” on the public page. Leave empty to use a default sentence based on the number of modules.">
              <textarea
                {...register("outlineIntro")}
                rows={3}
                className={inputCls}
                placeholder="e.g. The programme runs over 7 modules. Each combines short videos, worked examples and a practical assignment…"
              />
              <FieldError msg={errors.outlineIntro?.message} />
            </Field>
            <CurriculumEditor control={control} register={register} errors={errors} />
          </>}

          {/* Step 4 — Facilitators */}
          {step === 4 && <>
            {formatCfg.facilitatorRequired && (
              <p className="text-[12px] text-[#6655DF] bg-[#EEECFF] rounded-[10px] px-3 py-2">
                At least one facilitator is required for <strong>{watchedFormat}</strong> programmes.
              </p>
            )}
            <FacilitatorsEditor control={control} register={register} errors={errors} />
          </>}

          {/* Step 5 — FAQs */}
          {step === 5 && <>
            <p className="text-[13px] text-[#69708A] leading-relaxed">
              Add frequently asked questions shown in an accordion on the programme page. At least one FAQ is required.
            </p>
            <FaqEditor control={control} register={register} errors={errors} />
          </>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#DFE2ED] bg-[#FAFAFF] shrink-0">
          <span className="text-[12px] text-[#8A90A6] font-medium">
            Step <span className="text-[#171C35] font-bold">{step}</span> of {STEPS.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={step === 1 ? onClose : handleBack}
              className="px-4 py-2 rounded-[10px] text-[13px] font-semibold border border-[#DFE2ED] text-[#69708A] hover:bg-[#F5F6FB] cursor-pointer"
            >
              {step === 1 ? "Cancel" : "Back"}
            </button>
            {isLast ? (
              <button
                type="button"
                onClick={handleSubmit(onSubmit)}
                disabled={saving}
                className="px-5 py-2 rounded-[10px] text-[13px] font-semibold bg-[#6655DF] text-white hover:bg-[#2C2368] disabled:opacity-50 cursor-pointer"
              >
                {saving ? "Saving…" : program ? "Save Changes" : "Create Program"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1.5 px-5 py-2 rounded-[10px] text-[13px] font-semibold bg-[#6655DF] text-white hover:bg-[#2C2368] cursor-pointer"
              >
                Next
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
