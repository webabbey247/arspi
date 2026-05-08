"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { useUploadThing } from "@/lib/uploadthing-client"
import { useForm, Controller, useFieldArray } from "react-hook-form"
import type { Control, UseFormRegister, FieldErrors } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import LinkExtension from "@tiptap/extension-link"

// ── Types ─────────────────────────────────────────────────────────────────────

type ProjectStatus = "COMPLETE" | "ACTIVE"

type Taxonomy = {
  id:        string
  name:      string
  slug:      string
  createdAt: string
  _count:    { projects: number }
}

type ProjectPerson = {
  imageUrl: string | null
  name:     string
  role:     string | null
}

type Project = {
  id:           string
  title:        string
  slug:         string
  excerpt:      string
  description:  string
  coverImage:   string | null
  status:       ProjectStatus
  client:       string
  clientLogo:   string | null
  startDate:    string | null
  endDate:      string | null
  displayOrder: number

  divisionId:   string | null
  division:     Taxonomy | null
  departmentId: string | null
  department:   Taxonomy | null
  services:     Taxonomy[]

  investigators: ProjectPerson[]
  members:       ProjectPerson[]

  createdAt:    string
  updatedAt:    string
}

type Tab = "projects" | "divisions" | "departments" | "services"

const TAXONOMY_TABS: Exclude<Tab, "projects">[] = ["divisions", "departments", "services"]

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<ProjectStatus, string> = {
  COMPLETE: "Complete",
  ACTIVE:   "Active",
}

const STATUS_COLORS: Record<ProjectStatus, string> = {
  COMPLETE: "bg-emerald-50 text-emerald-700",
  ACTIVE:   "bg-amber-50 text-amber-700",
}

// Each taxonomy tab → singular noun used in modal headers/error messages,
// API endpoint, and the JSON key returned by the GET endpoint.
const TAXONOMY_CONFIG: Record<Exclude<Tab, "projects">, {
  label:       string
  singular:    string
  endpoint:    string  // /api/projects/<endpoint>
  listKey:     string  // JSON property in GET response (plural)
  itemKey:     string  // JSON property in POST/PUT response (singular)
}> = {
  divisions:   { label: "Divisions",   singular: "division",   endpoint: "divisions",   listKey: "divisions",   itemKey: "division" },
  departments: { label: "Departments", singular: "department", endpoint: "departments", listKey: "departments", itemKey: "department" },
  services:    { label: "Services",    singular: "service",    endpoint: "services",    listKey: "services",    itemKey: "service" },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_]+/g, "-").replace(/^-+|-+$/g, "")
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

// ── Shared UI ─────────────────────────────────────────────────────────────────

const inputCls = "w-full px-3 py-2 text-[13px] bg-white border border-[#E5E2DC] rounded-[10px] text-[#1A1916] outline-none placeholder:text-[#A8A39C] focus:border-[#0474C4] transition-colors resize-none"

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-bold text-[#6B6560] uppercase tracking-[0.4px]">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        {hint && <span className="ml-1 text-[10px] font-normal normal-case text-[#A8A39C]">({hint})</span>}
      </label>
      {children}
    </div>
  )
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="text-[11px] text-red-600 mt-0.5">{msg}</p>
}

function ConfirmDialog({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
        <p className="text-[14px] text-[#1A1916] mb-5">{message}</p>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-[10px] text-[13px] font-semibold border border-[#E5E2DC] text-[#6B6560] hover:bg-[#F5F4F1] cursor-pointer">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-[10px] text-[13px] font-semibold bg-red-600 text-white hover:bg-red-700 cursor-pointer">Delete</button>
        </div>
      </div>
    </div>
  )
}

// ── Image upload ──────────────────────────────────────────────────────────────

function ImageUpload({ value, onChange, label }: { value: string; onChange: (url: string) => void; label?: string }) {
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
        <div className="relative w-full h-32 rounded-[10px] overflow-hidden border border-[#E5E2DC]">
          <Image src={value} alt={label ?? "Image"} fill className="object-cover" />
          <button type="button" onClick={() => onChange("")} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 cursor-pointer">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      )}
      <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className="flex items-center justify-center gap-2 w-full py-2.5 rounded-[10px] text-[13px] font-semibold border border-dashed border-[#E5E2DC] text-[#6B6560] hover:border-[#0474C4] hover:text-[#0474C4] disabled:opacity-50 transition-colors cursor-pointer">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        {uploading ? "Uploading…" : value ? "Replace" : "Upload"}
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  )
}

// ── Rich text editor ──────────────────────────────────────────────────────────

function RichTextEditor({ value, onChange, placeholder }: {
  value:        string
  onChange:     (v: string) => void
  placeholder?: string
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: placeholder ?? "Start writing…" }),
      LinkExtension.configure({
        openOnClick: false,
        autolink:    true,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          "px-3 py-2.5 min-h-[220px] text-[13px] text-[#1A1916] outline-none " +
          "[&_h1]:text-[1.5rem] [&_h1]:font-semibold [&_h1]:mt-3 [&_h1]:mb-2 " +
          "[&_h2]:text-[1.25rem] [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-2 " +
          "[&_h3]:text-[1.05rem] [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1.5 " +
          "[&_ul]:list-disc [&_ul]:ml-4 [&_ul]:space-y-1 " +
          "[&_ol]:list-decimal [&_ol]:ml-4 [&_ol]:space-y-1 " +
          "[&_p]:leading-relaxed [&_p]:mb-2 " +
          "[&_blockquote]:border-l-2 [&_blockquote]:border-[#0474C4] [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-[#6B6560] " +
          "[&_code]:bg-[#F5F4F1] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[12px] [&_code]:font-mono " +
          "[&_pre]:bg-[#1A1916] [&_pre]:text-white [&_pre]:p-3 [&_pre]:rounded-[8px] [&_pre]:font-mono [&_pre]:text-[12px] [&_pre]:overflow-x-auto " +
          "[&_pre_code]:bg-transparent [&_pre_code]:text-white [&_pre_code]:p-0 " +
          "[&_a]:text-[#0474C4] [&_a]:underline " +
          "[&_hr]:my-3 [&_hr]:border-t [&_hr]:border-[#E5E2DC]",
      },
    },
  })

  useEffect(() => {
    if (editor && !editor.isFocused && value !== editor.getHTML()) {
      editor.commands.setContent(value || "")
    }
  }, [value, editor])

  function btn(active: boolean, action: () => void, title: string, children: React.ReactNode, disabled = false) {
    return (
      <button
        type="button"
        title={title}
        onClick={action}
        disabled={disabled}
        className={`min-w-7 h-7 px-1.5 flex items-center justify-center rounded text-[12px] font-semibold transition-colors cursor-pointer ${
          active ? "bg-[#0474C4] text-white"
                 : "text-[#6B6560] hover:bg-[#E5E2DC] disabled:opacity-30 disabled:cursor-not-allowed"
        }`}
      >
        {children}
      </button>
    )
  }

  function setLink() {
    if (!editor) return
    const prev = editor.getAttributes("link").href ?? ""
    const url  = window.prompt("URL (leave empty to remove):", prev)
    if (url === null) return
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }
    const href = /^https?:\/\//.test(url) ? url : `https://${url}`
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run()
  }

  if (!editor) return null

  return (
    <div className="border border-[#E5E2DC] rounded-[10px] overflow-hidden focus-within:border-[#0474C4] transition-colors bg-white">
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-[#E5E2DC] bg-[#FAFAF9]">
        {/* Headings */}
        {btn(editor.isActive("heading", { level: 1 }), () => editor.chain().focus().toggleHeading({ level: 1 }).run(), "Heading 1", "H1")}
        {btn(editor.isActive("heading", { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), "Heading 2", "H2")}
        {btn(editor.isActive("heading", { level: 3 }), () => editor.chain().focus().toggleHeading({ level: 3 }).run(), "Heading 3", "H3")}
        {btn(editor.isActive("paragraph"),             () => editor.chain().focus().setParagraph().run(),               "Paragraph", "P")}

        <span className="w-px h-4 bg-[#E5E2DC] mx-1" />

        {/* Inline marks */}
        {btn(editor.isActive("bold"),   () => editor.chain().focus().toggleBold().run(),   "Bold",   <b>B</b>)}
        {btn(editor.isActive("italic"), () => editor.chain().focus().toggleItalic().run(), "Italic", <em>I</em>)}
        {btn(editor.isActive("strike"), () => editor.chain().focus().toggleStrike().run(), "Strike",
          <span style={{ textDecoration: "line-through" }}>S</span>)}
        {btn(editor.isActive("code"),   () => editor.chain().focus().toggleCode().run(),   "Inline code",
          <span className="font-mono">{`<>`}</span>)}
        {btn(editor.isActive("link"),   setLink, "Link",
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        )}

        <span className="w-px h-4 bg-[#E5E2DC] mx-1" />

        {/* Lists & blocks */}
        {btn(editor.isActive("bulletList"), () => editor.chain().focus().toggleBulletList().run(), "Bullet list",
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1.5" fill="currentColor"/><circle cx="4" cy="12" r="1.5" fill="currentColor"/><circle cx="4" cy="18" r="1.5" fill="currentColor"/></svg>
        )}
        {btn(editor.isActive("orderedList"), () => editor.chain().focus().toggleOrderedList().run(), "Numbered list",
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>
        )}
        {btn(editor.isActive("blockquote"), () => editor.chain().focus().toggleBlockquote().run(), "Blockquote",
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h2"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h2"/></svg>
        )}
        {btn(editor.isActive("codeBlock"), () => editor.chain().focus().toggleCodeBlock().run(), "Code block",
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
        )}
        {btn(false, () => editor.chain().focus().setHorizontalRule().run(), "Horizontal rule",
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="3" y1="12" x2="21" y2="12"/></svg>
        )}

        <span className="w-px h-4 bg-[#E5E2DC] mx-1" />

        {/* History */}
        {btn(false, () => editor.chain().focus().undo().run(), "Undo",
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-15-6.7L3 13"/></svg>,
          !editor.can().undo()
        )}
        {btn(false, () => editor.chain().focus().redo().run(), "Redo",
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 15-6.7L21 13"/></svg>,
          !editor.can().redo()
        )}
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}

// ── Multi-select chips ────────────────────────────────────────────────────────

function MultiChipSelect({
  options, selected, onChange, emptyLabel,
}: {
  options:    Taxonomy[]
  selected:   string[]
  onChange:   (next: string[]) => void
  emptyLabel: string
}) {
  function toggle(id: string) {
    if (selected.includes(id)) onChange(selected.filter(x => x !== id))
    else onChange([...selected, id])
  }
  if (options.length === 0) {
    return <p className="text-[12px] text-[#A8A39C] italic py-2">{emptyLabel}</p>
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(o => {
        const isOn = selected.includes(o.id)
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => toggle(o.id)}
            className={`px-2.5 py-1 rounded-full text-[12px] font-medium border transition-colors cursor-pointer ${
              isOn
                ? "bg-[#0474C4] text-white border-[#0474C4]"
                : "bg-white text-[#6B6560] border-[#E5E2DC] hover:border-[#0474C4] hover:text-[#0474C4]"
            }`}
          >
            {o.name}
          </button>
        )
      })}
    </div>
  )
}

// ── Person avatar (compact circular upload) ───────────────────────────────────

function PersonAvatarUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
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
        <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-[#E5E2DC] shrink-0 group">
          <Image src={value} alt="Photo" fill className="object-cover" />
          <button type="button" onClick={() => onChange("")}
            className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      ) : (
        <div className="w-12 h-12 rounded-full border-2 border-dashed border-[#E5E2DC] flex items-center justify-center shrink-0 text-[#A8A39C]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
        </div>
      )}
      <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
        className="px-2.5 py-1 text-[11px] font-semibold border border-[#E5E2DC] rounded-[8px] text-[#6B6560] hover:border-[#0474C4] hover:text-[#0474C4] disabled:opacity-50 transition-colors cursor-pointer">
        {uploading ? "Uploading…" : value ? "Change" : "Upload"}
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  )
}

// ── People array editor (used for Investigators and Members) ──────────────────

function PeopleArrayEditor({
  control, register, errors, name, requireAtLeastOne,
}: {
  control:  Control<ProjectFormValues>
  register: UseFormRegister<ProjectFormValues>
  errors:   FieldErrors<ProjectFormValues>
  name:     "investigators" | "members"
  requireAtLeastOne: boolean
}) {
  const { fields, append, remove } = useFieldArray({ control, name })
  // Top-level array errors (min(1) etc.) come back as { message } rather than
  // a per-index array; surface that string for the global error line.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const arrayError = (errors[name] as any)?.message as string | undefined

  return (
    <div className="space-y-3">
      {fields.length === 0 && (
        <p className="text-[12px] text-[#A8A39C] italic">No {name === "investigators" ? "investigators" : "members"} added yet.</p>
      )}
      {fields.map((field, i) => (
        <div key={field.id} className="border border-[#E5E2DC] rounded-[10px] bg-white p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#6B6560] uppercase tracking-wide">
              {name === "investigators" ? "Investigator" : "Member"} {i + 1}
            </span>
            <button
              type="button"
              onClick={() => {
                if (requireAtLeastOne && fields.length === 1) return
                remove(i)
              }}
              disabled={requireAtLeastOne && fields.length === 1}
              title={requireAtLeastOne && fields.length === 1 ? "At least one is required" : "Remove"}
              className="w-6 h-6 flex items-center justify-center rounded-full text-[#A8A39C] hover:bg-red-50 hover:text-red-500 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#A8A39C] disabled:cursor-not-allowed cursor-pointer"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <Field label="Profile photo" hint="optional">
            <Controller
              name={`${name}.${i}.imageUrl` as const}
              control={control}
              render={({ field }) => <PersonAvatarUpload value={field.value ?? ""} onChange={field.onChange} />}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Full name" required>
              <input
                {...register(`${name}.${i}.name` as const)}
                className={inputCls}
                placeholder="e.g. Dr. Rachel Osei"
              />
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <FieldError msg={(errors[name] as any)?.[i]?.name?.message} />
            </Field>
            <Field label="Role / position" hint="optional">
              <input
                {...register(`${name}.${i}.role` as const)}
                className={inputCls}
                placeholder="e.g. Principal Investigator"
              />
            </Field>
          </div>
        </div>
      ))}

      {arrayError && <p className="text-[11px] text-red-600">{arrayError}</p>}

      <button
        type="button"
        onClick={() => append({ imageUrl: "", name: "", role: "" })}
        className="flex items-center gap-1.5 text-[12px] font-semibold text-[#0474C4] hover:text-[#06457F] transition-colors cursor-pointer"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add {name === "investigators" ? "Investigator" : "Member"}
      </button>
    </div>
  )
}

// ── Project drawer ────────────────────────────────────────────────────────────

type PersonFormValues = {
  imageUrl: string
  name:     string
  role:     string
}

type ProjectFormValues = {
  title:        string
  slug:         string
  excerpt:      string
  description:  string
  coverImage:   string
  status:       ProjectStatus
  client:       string
  clientLogo:   string
  divisionId:   string
  departmentId: string
  serviceIds:   string[]
  investigators: PersonFormValues[]
  members:       PersonFormValues[]
  startDate:    string
  endDate:      string
}

const EMPTY_PROJECT: ProjectFormValues = {
  title: "", slug: "", excerpt: "", description: "", coverImage: "",
  status: "ACTIVE", client: "", clientLogo: "",
  divisionId: "", departmentId: "", serviceIds: [],
  investigators: [{ imageUrl: "", name: "", role: "" }],
  members:       [],
  startDate: "", endDate: "",
}

const projectSchema = yup.object({
  title:        yup.string().min(3, "Title must be at least 3 characters").max(255).required("Title is required"),
  slug:         yup.string().test("slug-format", "Slug must be lowercase with hyphens only", v => !v || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v)).max(255),
  excerpt:      yup.string().min(10, "Excerpt must be at least 10 characters").required("Excerpt is required"),
  description:  yup.string().min(10, "Description must be at least 10 characters").required("Description is required"),
  coverImage:   yup.string(),
  status:       yup.string().oneOf(["COMPLETE", "ACTIVE"]).required(),
  client:       yup.string().min(1, "Client is required").required("Client is required"),
  clientLogo:   yup.string(),
  investigators: yup.array(yup.object({
    imageUrl: yup.string(),
    name:     yup.string().required("Investigator name is required"),
    role:     yup.string(),
  })).min(1, "At least one project investigator is required").required(),
  members:       yup.array(yup.object({
    imageUrl: yup.string(),
    name:     yup.string().required("Member name is required"),
    role:     yup.string(),
  })),
  divisionId:   yup.string(),
  departmentId: yup.string(),
  serviceIds:   yup.array(yup.string().default("")),
  startDate:    yup.string(),
  endDate:      yup.string(),
})

function ProjectDrawer({
  project, divisions, departments, services, onSave, onClose,
}: {
  project:     Project | null
  divisions:   Taxonomy[]
  departments: Taxonomy[]
  services:    Taxonomy[]
  onSave:      (v: ProjectFormValues) => Promise<void>
  onClose:     () => void
}) {
  const [saving, setSaving]           = useState(false)
  const [serverError, setServerError] = useState("")

  const defaultValues: ProjectFormValues = project ? {
    title:        project.title,
    slug:         project.slug,
    excerpt:      project.excerpt,
    description:  project.description,
    coverImage:   project.coverImage   ?? "",
    status:       project.status,
    client:       project.client,
    clientLogo:   project.clientLogo   ?? "",
    divisionId:   project.divisionId   ?? "",
    departmentId: project.departmentId ?? "",
    serviceIds:   project.services.map(s => s.id),
    investigators: project.investigators.length > 0
      ? project.investigators.map(p => ({ imageUrl: p.imageUrl ?? "", name: p.name, role: p.role ?? "" }))
      : [{ imageUrl: "", name: "", role: "" }],
    members: project.members.map(p => ({ imageUrl: p.imageUrl ?? "", name: p.name, role: p.role ?? "" })),
    startDate:    project.startDate ? project.startDate.slice(0, 10) : "",
    endDate:      project.endDate   ? project.endDate.slice(0, 10)   : "",
  } : EMPTY_PROJECT

  const { register, control, handleSubmit, setValue, watch, formState: { errors } } =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useForm<ProjectFormValues>({ resolver: yupResolver(projectSchema) as any, defaultValues })

  const watchedTitle = watch("title")
  useEffect(() => {
    if (!project) setValue("slug", slugify(watchedTitle ?? ""), { shouldValidate: false, shouldDirty: false })
  }, [watchedTitle, project, setValue])

  async function onSubmit(values: ProjectFormValues) {
    setSaving(true); setServerError("")
    try { await onSave(values) }
    catch (e) { setServerError(e instanceof Error ? e.message : "Something went wrong.") }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-100 flex items-start justify-end bg-black/40">
      <div className="bg-white h-full w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="bg-[#0474C4] px-6 py-5 shrink-0 relative">
          <button type="button" onClick={onClose} className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/20 text-white uppercase tracking-wider mb-2">
            {project ? "Edit Project" : "New Project"}
          </span>
          <h2 className="text-[18px] font-extrabold text-white leading-tight">
            {project ? project.title : "Create Project"}
          </h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {serverError && <p className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{serverError}</p>}

          <Field label="Cover image">
            <Controller name="coverImage" control={control} render={({ field }) => <ImageUpload value={field.value} onChange={field.onChange} label="Cover" />} />
          </Field>

          <Field label="Title" required>
            <input autoFocus {...register("title")} className={inputCls} placeholder="e.g. Youth & Teen Math Mindset Study" />
            <FieldError msg={errors.title?.message} />
          </Field>

          <Field label="Slug" hint="auto-generated — read only">
            <input {...register("slug")} readOnly className={`${inputCls} bg-[#FAFAF9] text-[#6B6560] cursor-default`} />
          </Field>

          <Field label="Excerpt" required hint="Short summary shown on cards">
            <textarea {...register("excerpt")} rows={3} className={inputCls} placeholder="Examining how students' perceptions of math influence performance" />
            <FieldError msg={errors.excerpt?.message} />
          </Field>

          <Field label="Full Description" required>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <RichTextEditor
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  placeholder="Detailed case study content — headings, lists, links, quotes, code…"
                />
              )}
            />
            <FieldError msg={errors.description?.message} />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Project Status" required>
              <select {...register("status")} className={inputCls}>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETE">Complete</option>
              </select>
            </Field>
            <Field label="Division">
              <select {...register("divisionId")} className={inputCls}>
                <option value="">— None —</option>
                {divisions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Department">
            <select {...register("departmentId")} className={inputCls}>
              <option value="">— None —</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </Field>

          <Field label="Services" hint="select all that apply">
            <Controller
              name="serviceIds"
              control={control}
              render={({ field }) => (
                <MultiChipSelect
                  options={services}
                  selected={field.value ?? []}
                  onChange={field.onChange}
                  emptyLabel="No services defined yet — add some on the Services tab."
                />
              )}
            />
          </Field>

          <div className="border-t border-[#E5E2DC] pt-4">
            <p className="text-[11px] font-bold text-[#6B6560] uppercase tracking-[0.4px] mb-3">Project Investigators <span className="text-red-500">*</span></p>
            <PeopleArrayEditor
              control={control}
              register={register}
              errors={errors}
              name="investigators"
              requireAtLeastOne
            />
          </div>

          <div className="border-t border-[#E5E2DC] pt-4">
            <p className="text-[11px] font-bold text-[#6B6560] uppercase tracking-[0.4px] mb-3">Project Members <span className="font-normal normal-case text-[10px] text-[#A8A39C]">(optional)</span></p>
            <PeopleArrayEditor
              control={control}
              register={register}
              errors={errors}
              name="members"
              requireAtLeastOne={false}
            />
          </div>

          <Field label="Client" required>
            <input {...register("client")} className={inputCls} placeholder="e.g. Gates Foundation" />
            <FieldError msg={errors.client?.message} />
          </Field>

          <Field label="Client logo (optional)">
            <Controller name="clientLogo" control={control} render={({ field }) => <ImageUpload value={field.value} onChange={field.onChange} label="Client logo" />} />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Start date">
              <input type="date" {...register("startDate")} className={inputCls} />
            </Field>
            <Field label="End date">
              <input type="date" {...register("endDate")} className={inputCls} />
            </Field>
          </div>
        </form>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#E5E2DC] bg-[#FAFAF9] shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-[10px] text-[13px] font-semibold border border-[#E5E2DC] text-[#6B6560] hover:bg-[#F5F4F1] cursor-pointer">Cancel</button>
          <button type="button" onClick={handleSubmit(onSubmit)} disabled={saving} className="px-5 py-2 rounded-[10px] text-[13px] font-semibold bg-[#0474C4] text-white hover:bg-[#06457F] disabled:opacity-50 cursor-pointer">
            {saving ? "Saving…" : project ? "Save Changes" : "Create Project"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Taxonomy modal (used for division / department / service) ───────────────

function TaxonomyModal({
  item, singular, onSave, onClose,
}: {
  item:     Taxonomy | null
  singular: string
  onSave:   (name: string) => Promise<void>
  onClose:  () => void
}) {
  const [name, setName]     = useState(item?.name ?? "")
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setError(""); setSaving(true)
    try { await onSave(name.trim()) }
    catch (err) { setError(err instanceof Error ? err.message : "Something went wrong.") }
    finally { setSaving(false) }
  }

  const Capital = singular.charAt(0).toUpperCase() + singular.slice(1)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="bg-[#0474C4] p-5 flex items-start justify-between gap-4">
          <div>
            <div className="font-heading text-[1.125rem] tracking-[-0.005em] leading-[1.3] font-medium text-slate-300">
              {item ? `Edit ${Capital}` : `New ${Capital}`}
            </div>
            <div className="font-body text-[0.75rem] tracking-[0em] leading-normal font-normal text-slate-300 mt-0.5">
              {item ? `Update the ${singular} name.` : `Create a new project ${singular}.`}
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-white/35 hover:text-white text-xl leading-none shrink-0 bg-[#EDF2FB]/20 rounded-full w-8 h-8 flex items-center justify-center transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
          {error && <p className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
          <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder={`e.g. ${Capital} name`} className={inputCls} required />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-[10px] text-[13px] font-semibold border border-[#E5E2DC] text-[#6B6560] hover:bg-[#F5F4F1] cursor-pointer">Cancel</button>
            <button type="submit" disabled={saving || !name.trim()} className="px-5 py-2 rounded-[10px] text-[13px] font-semibold bg-[#0474C4] text-white hover:bg-[#06457F] disabled:opacity-50 cursor-pointer">
              {saving ? "Saving…" : item ? "Save" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Taxonomy tab body (table + search + pagination, reused 4×) ───────────────

function TaxonomyTab({
  label, singular, items, loading, onCreateClick, onEdit, onDelete,
}: {
  label:         string
  singular:      string
  items:         Taxonomy[]
  loading:       boolean
  onCreateClick: () => void
  onEdit:        (item: Taxonomy) => void
  onDelete:      (item: Taxonomy) => void
}) {
  const PAGE_SIZE       = 20
  const [search, setSearchInner] = useState("")
  const [page, setPage]          = useState(1)

  function setSearch(v: string) {
    setSearchInner(v)
    setPage(1)
  }
  // Suppress unused-var lint for onCreateClick (button lives in page header)
  void onCreateClick

  const filtered = items.filter(i =>
    !search || i.name.toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="rounded-[14px] border border-[#E5E2DC] overflow-hidden">
      <div className="flex gap-2 px-4 py-3 bg-white border-b border-[#E5E2DC]">
        <div className="relative w-full sm:w-64">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A39C]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${label.toLowerCase()}…`} className="w-full pl-8 pr-3 py-2 text-[13px] bg-white border border-[#E5E2DC] rounded-[10px] text-[#1A1916] outline-none placeholder:text-[#A8A39C] focus:border-[#0474C4] transition-colors" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-[#FAFAF9] border-b border-[#E5E2DC]">
              {["Name", "Slug", "Projects", "Created", ""].map(col => (
                <th key={col} className="px-4 py-2.5 text-left text-[11px] font-bold text-[#A8A39C] tracking-[0.5px] uppercase whitespace-nowrap">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-[#A8A39C]">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-[#A8A39C]">No {singular + "s"} yet.</td></tr>
            ) : paginated.map(item => (
              <tr key={item.id} className="border-b border-[#F0EEE9] last:border-none hover:bg-[#FAFAF9] transition-colors">
                <td className="px-4 py-3 font-semibold text-[#1A1916] whitespace-nowrap">{item.name}</td>
                <td className="px-4 py-3 text-[#6B6560] whitespace-nowrap">{item.slug}</td>
                <td className="px-4 py-3 whitespace-nowrap"><span className="px-2 py-0.5 rounded-full bg-[#F5F4F1] text-[#6B6560] text-[11px] font-semibold">{item._count.projects}</span></td>
                <td className="px-4 py-3 text-[#6B6560] whitespace-nowrap">{fmtDate(item.createdAt)}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <button onClick={() => onEdit(item)} className="w-7 h-7 flex items-center justify-center rounded-[8px] border border-[#E5E2DC] text-[#6B6560] hover:border-[#0474C4] hover:text-[#0474C4] hover:bg-amber-50 cursor-pointer transition-colors">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button onClick={() => onDelete(item)} className="w-7 h-7 flex items-center justify-center rounded-[8px] border border-red-200 bg-red-50 text-red-500 hover:border-red-400 hover:text-red-600 hover:bg-red-100 cursor-pointer transition-colors">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-4 py-2.5 bg-[#FAFAF9] border-t border-[#E5E2DC]">
        <p className="text-[11px] text-[#A8A39C]">
          {filtered.length === 0 ? (
            <>Showing <span className="font-semibold text-[#6B6560]">0</span> of <span className="font-semibold text-[#6B6560]">{items.length}</span> {label.toLowerCase()}</>
          ) : (
            <>Showing <span className="font-semibold text-[#6B6560]">{(page - 1) * PAGE_SIZE + 1}</span>–<span className="font-semibold text-[#6B6560]">{Math.min(page * PAGE_SIZE, filtered.length)}</span> of <span className="font-semibold text-[#6B6560]">{filtered.length}</span> {label.toLowerCase()}</>
          )}
        </p>
        {filtered.length > 0 && (
          <div className="flex items-center gap-1.5">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 rounded-[8px] text-[12px] font-semibold border border-[#E5E2DC] bg-white text-[#6B6560] hover:border-[#0474C4] hover:text-[#0474C4] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors">Prev</button>
            <span className="text-[11px] font-semibold text-[#6B6560] px-2">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1 rounded-[8px] text-[12px] font-semibold border border-[#E5E2DC] bg-white text-[#6B6560] hover:border-[#0474C4] hover:text-[#0474C4] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors">Next</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminProjectsPage() {
  const [tab, setTab] = useState<Tab>("projects")

  // Bundle state — projects + all taxonomy lists arrive in one /api/projects GET
  const [projects, setProjects]       = useState<Project[]>([])
  const [divisions, setDivisions]     = useState<Taxonomy[]>([])
  const [departments, setDepartments] = useState<Taxonomy[]>([])
  const [services, setServices]       = useState<Taxonomy[]>([])
  const [loading, setLoading]         = useState(true)

  // UI state
  const [search, setSearchInner]              = useState("")
  const [statusFilter, setStatusFilterInner]  = useState<"All" | ProjectStatus>("All")
  const [projectDrawer, setProjectDrawer]     = useState<"create" | Project | null>(null)
  const [deleteProj, setDeleteProj]           = useState<Project | null>(null)
  const [statusOpen, setStatusOpen]           = useState(false)
  const statusRef                             = useRef<HTMLDivElement>(null)
  const PAGE_SIZE                             = 20
  const [page, setPage]                       = useState(1)

  // Reset to page 1 whenever a filter or search changes (avoids setState-in-effect)
  function setSearch(v: string) {
    setSearchInner(v)
    setPage(1)
  }
  function setStatusFilter(v: "All" | ProjectStatus) {
    setStatusFilterInner(v)
    setPage(1)
  }

  // Modal state for whichever taxonomy tab is active
  const [taxonomyModal, setTaxonomyModal]   = useState<{ tab: Exclude<Tab, "projects">; item: Taxonomy | null } | null>(null)
  const [taxonomyDelete, setTaxonomyDelete] = useState<{ tab: Exclude<Tab, "projects">; item: Taxonomy } | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch("/api/projects")
      const d = await r.json()
      if (r.ok) {
        setProjects(d.projects    ?? [])
        setDivisions(d.divisions   ?? [])
        setDepartments(d.departments ?? [])
        setServices(d.services    ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // Items for a given taxonomy tab
  function itemsForTab(t: Exclude<Tab, "projects">): Taxonomy[] {
    switch (t) {
      case "divisions":   return divisions
      case "departments": return departments
      case "services":    return services
    }
  }

  useEffect(() => {
    function h(e: MouseEvent) {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setStatusOpen(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  function exportCSV() {
    const headers = ["Title", "Slug", "Status", "Client", "Division", "Department", "Services", "Created"]
    const rows = filteredProjects.map(p => [
      `"${p.title.replace(/"/g, '""')}"`,
      p.slug,
      p.status,
      `"${p.client.replace(/"/g, '""')}"`,
      p.division?.name   ?? "",
      p.department?.name ?? "",
      `"${p.services.map(s => s.name).join("; ")}"`,
      fmtDate(p.createdAt),
    ])
    const csv  = [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement("a")
    a.href = url; a.download = `projects-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  async function handleSaveProject(values: ProjectFormValues) {
    const editing = projectDrawer !== "create" ? projectDrawer : null
    const payload = {
      title:        values.title,
      slug:         values.slug || slugify(values.title),
      excerpt:      values.excerpt,
      description:  values.description,
      coverImage:   values.coverImage  || null,
      status:       values.status,
      client:       values.client,
      clientLogo:   values.clientLogo  || null,
      divisionId:   values.divisionId   || null,
      departmentId: values.departmentId || null,
      serviceIds:   values.serviceIds   ?? [],
      investigators: values.investigators
        .filter(p => p.name.trim())
        .map(p => ({
          imageUrl: p.imageUrl?.trim() || null,
          name:     p.name.trim(),
          role:     p.role?.trim() || null,
        })),
      members: values.members
        .filter(p => p.name.trim())
        .map(p => ({
          imageUrl: p.imageUrl?.trim() || null,
          name:     p.name.trim(),
          role:     p.role?.trim() || null,
        })),
      startDate:    values.startDate    || null,
      endDate:      values.endDate      || null,
    }
    const res  = await fetch(editing ? `/api/projects/${editing.id}` : "/api/projects", {
      method:  editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? "Failed to save project.")
    setProjectDrawer(null)
    await fetchAll()
  }

  async function handleDeleteProject() {
    if (!deleteProj) return
    const res = await fetch(`/api/projects/${deleteProj.id}`, { method: "DELETE" })
    if (!res.ok && res.status !== 204) {
      const d = await res.json().catch(() => ({}))
      alert(d.error ?? "Failed to delete project.")
      return
    }
    setDeleteProj(null)
    await fetchAll()
  }

  // ── Generic taxonomy save/delete dispatchers ────────────────────────────

  async function handleSaveTaxonomy(name: string) {
    if (!taxonomyModal) return
    const cfg = TAXONOMY_CONFIG[taxonomyModal.tab]
    const item = taxonomyModal.item
    const res  = await fetch(item ? `/api/projects/${cfg.endpoint}/${item.id}` : `/api/projects/${cfg.endpoint}`, {
      method:  item ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ name }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? "Failed to save.")
    setTaxonomyModal(null)
    await fetchAll()
  }

  async function handleDeleteTaxonomy() {
    if (!taxonomyDelete) return
    const cfg = TAXONOMY_CONFIG[taxonomyDelete.tab]
    const res = await fetch(`/api/projects/${cfg.endpoint}/${taxonomyDelete.item.id}`, { method: "DELETE" })
    if (!res.ok && res.status !== 204) {
      const d = await res.json().catch(() => ({}))
      alert(d.error ?? "Failed to delete.")
    }
    setTaxonomyDelete(null)
    await fetchAll()
  }

  // ── Derived ───────────────────────────────────────────────────────────────

  const filteredProjects = projects.filter(p => {
    const matchStatus = statusFilter === "All" || p.status === statusFilter
    const q = search.toLowerCase()
    return matchStatus && (
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.client.toLowerCase().includes(q) ||
      (p.division?.name   ?? "").toLowerCase().includes(q) ||
      (p.department?.name ?? "").toLowerCase().includes(q)
    )
  })

  const totalPages        = Math.max(1, Math.ceil(filteredProjects.length / PAGE_SIZE))
  const paginatedProjects = filteredProjects.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const counts = {
    all:      projects.length,
    active:   projects.filter(p => p.status === "ACTIVE").length,
    complete: projects.filter(p => p.status === "COMPLETE").length,
  }

  // CTA button label & handler depending on active tab
  function newButton() {
    if (tab === "projects") {
      return { label: "New Project", onClick: () => setProjectDrawer("create") }
    }
    const cfg = TAXONOMY_CONFIG[tab]
    return { label: `New ${cfg.singular.charAt(0).toUpperCase() + cfg.singular.slice(1)}`, onClick: () => setTaxonomyModal({ tab, item: null }) }
  }
  const cta = newButton()

  function tabCount(t: Tab): number {
    if (t === "projects") return projects.length
    return itemsForTab(t).length
  }

  return (
    <div className="px-8 py-8 max-w-350 mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[18px] font-extrabold text-[#1A1916]">Research Projects</h1>
          <p className="text-[#A8A39C] text-[13px] mt-0.5">Manage projects, divisions, departments and services</p>
        </div>
        <button
          onClick={cta.onClick}
          className="flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[13px] font-semibold bg-[#0474C4] text-white hover:bg-[#06457F] transition-colors cursor-pointer"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          {cta.label}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 mb-5 bg-[#F5F4F1] rounded-[12px] p-1 w-fit">
        {(["projects", ...TAXONOMY_TABS] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-[9px] text-[13px] font-semibold capitalize transition-colors cursor-pointer ${tab === t ? "bg-white text-[#1A1916] shadow-sm" : "text-[#6B6560] hover:text-[#1A1916]"}`}>
            {t}
            <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab === t ? "bg-[#F5F4F1] text-[#6B6560]" : "bg-[#E5E2DC] text-[#A8A39C]"}`}>
              {tabCount(t)}
            </span>
          </button>
        ))}
      </div>

      {/* Projects tab */}
      {tab === "projects" && (
        <div className="rounded-[14px] border border-[#E5E2DC] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-[#E5E2DC]">
            <div className="relative w-full sm:w-64">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A39C]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects…" className="w-full pl-8 pr-3 py-2 text-[13px] bg-white border border-[#E5E2DC] rounded-[10px] text-[#1A1916] outline-none placeholder:text-[#A8A39C] focus:border-[#0474C4] transition-colors" />
            </div>

            <div className="ml-auto flex items-center gap-2">
              <div ref={statusRef} className="relative">
                <button
                  onClick={() => setStatusOpen(o => !o)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[13px] font-semibold border cursor-pointer transition-colors ${statusFilter !== "All" ? "bg-[#0474C4] text-white border-[#0474C4]" : "bg-white text-[#6B6560] border-[#E5E2DC] hover:border-[#0474C4] hover:text-[#0474C4]"}`}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                  Project Status
                  {statusFilter !== "All" && <span className="ml-1 bg-white text-[#0474C4] text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">{STATUS_LABELS[statusFilter]}</span>}
                </button>
                {statusOpen && (
                  <div className="absolute right-0 top-[calc(100%+6px)] z-20 bg-white border border-[#E5E2DC] rounded-xl shadow-lg py-1.5 min-w-36">
                    {([
                      ["All",      counts.all],
                      ["ACTIVE",   counts.active],
                      ["COMPLETE", counts.complete],
                    ] as const).map(([label, count]) => (
                      <button key={label} onClick={() => { setStatusFilter(label as typeof statusFilter); setStatusOpen(false) }}
                        className={`w-full flex items-center justify-between px-3.5 py-2 text-[13px] font-medium text-left cursor-pointer border-none transition-colors ${statusFilter === label ? "bg-[#EEF6FF] text-[#0474C4]" : "bg-transparent text-[#1A1916] hover:bg-[#F5F4F1]"}`}
                      >
                        <span>{label === "All" ? "All Statuses" : STATUS_LABELS[label as ProjectStatus]}</span>
                        <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#F5F4F1] text-[#6B6560]">{count}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[13px] font-semibold border border-[#E5E2DC] text-[#6B6560] bg-white hover:border-[#0474C4] hover:text-[#0474C4] transition-colors cursor-pointer">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Export CSV
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-[#FAFAF9] border-b border-[#E5E2DC]">
                  {["Project", "Status", "Client", "Division", "Department", "Services", ""].map((col, i) => (
                    <th key={i} className="px-4 py-2.5 text-left text-[11px] font-bold text-[#A8A39C] tracking-[0.5px] uppercase whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-[#A8A39C]">Loading…</td></tr>
                ) : filteredProjects.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-[#A8A39C]">No projects found.</td></tr>
                ) : paginatedProjects.map(p => (
                  <tr key={p.id} className="border-b border-[#F0EEE9] last:border-none hover:bg-[#FAFAF9] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.coverImage ? (
                          <div className="relative w-9 h-9 rounded-[8px] overflow-hidden shrink-0 border border-[#E5E2DC]">
                            <Image src={p.coverImage} alt={p.title} fill className="object-cover" />
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-[8px] bg-[#EEF6FF] flex items-center justify-center shrink-0">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0474C4" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
                          </div>
                        )}
                        <p className="font-semibold text-[#1A1916] leading-tight line-clamp-1">{p.title}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_COLORS[p.status]}`}>{STATUS_LABELS[p.status]}</span>
                    </td>
                    <td className="px-4 py-3 text-[#6B6560] whitespace-nowrap">{p.client}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {p.division ? <span className="px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#4F46E5] text-[11px] font-semibold">{p.division.name}</span> : <span className="text-[#A8A39C]">—</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {p.department ? <span className="text-[12px] text-[#1A1916]">{p.department.name}</span> : <span className="text-[#A8A39C]">—</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {p.services.length === 0 ? (
                        <span className="text-[#A8A39C]">—</span>
                      ) : (
                        <span className="text-[12px] text-[#6B6560]" title={p.services.map(s => s.name).join(", ")}>
                          {p.services[0].name}
                          {p.services.length > 1 && <span className="text-[#A8A39C]"> +{p.services.length - 1}</span>}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Link href={`/our-research/research-projects/${p.slug}`} target="_blank" title="View public page" className="w-7 h-7 flex items-center justify-center rounded-[8px] border border-[#E5E2DC] text-[#6B6560] hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                        </Link>
                        <button onClick={() => setProjectDrawer(p)} className="w-7 h-7 flex items-center justify-center rounded-[8px] border border-[#E5E2DC] text-[#6B6560] hover:border-[#0474C4] hover:text-[#0474C4] hover:bg-amber-50 cursor-pointer transition-colors">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button onClick={() => setDeleteProj(p)} className="w-7 h-7 flex items-center justify-center rounded-[8px] border border-red-200 bg-red-50 text-red-500 hover:border-red-400 hover:text-red-600 hover:bg-red-100 cursor-pointer transition-colors">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-4 py-2.5 bg-[#FAFAF9] border-t border-[#E5E2DC]">
            <p className="text-[11px] text-[#A8A39C]">
              {filteredProjects.length === 0 ? (
                <>Showing <span className="font-semibold text-[#6B6560]">0</span> of <span className="font-semibold text-[#6B6560]">{projects.length}</span> projects</>
              ) : (
                <>Showing <span className="font-semibold text-[#6B6560]">{(page - 1) * PAGE_SIZE + 1}</span>–<span className="font-semibold text-[#6B6560]">{Math.min(page * PAGE_SIZE, filteredProjects.length)}</span> of <span className="font-semibold text-[#6B6560]">{filteredProjects.length}</span> {filteredProjects.length === 1 ? "project" : "projects"}</>
              )}
            </p>
            {filteredProjects.length > 0 && (
              <div className="flex items-center gap-1.5">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 rounded-[8px] text-[12px] font-semibold border border-[#E5E2DC] bg-white text-[#6B6560] hover:border-[#0474C4] hover:text-[#0474C4] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors">Prev</button>
                <span className="text-[11px] font-semibold text-[#6B6560] px-2">{page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1 rounded-[8px] text-[12px] font-semibold border border-[#E5E2DC] bg-white text-[#6B6560] hover:border-[#0474C4] hover:text-[#0474C4] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors">Next</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Taxonomy tabs */}
      {TAXONOMY_TABS.map(t => {
        if (tab !== t) return null
        const cfg = TAXONOMY_CONFIG[t]
        return (
          <TaxonomyTab
            key={t}
            label={cfg.label}
            singular={cfg.singular}
            items={itemsForTab(t)}
            loading={loading}
            onCreateClick={() => setTaxonomyModal({ tab: t, item: null })}
            onEdit={item => setTaxonomyModal({ tab: t, item })}
            onDelete={item => setTaxonomyDelete({ tab: t, item })}
          />
        )
      })}

      {/* Modals */}
      {projectDrawer !== null && (
        <ProjectDrawer
          project={projectDrawer === "create" ? null : projectDrawer}
          divisions={divisions}
          departments={departments}
          services={services}
          onSave={handleSaveProject}
          onClose={() => setProjectDrawer(null)}
        />
      )}
      {taxonomyModal !== null && (
        <TaxonomyModal
          item={taxonomyModal.item}
          singular={TAXONOMY_CONFIG[taxonomyModal.tab].singular}
          onSave={handleSaveTaxonomy}
          onClose={() => setTaxonomyModal(null)}
        />
      )}
      {deleteProj && (
        <ConfirmDialog
          message={`Delete "${deleteProj.title}"? This cannot be undone.`}
          onConfirm={handleDeleteProject}
          onCancel={() => setDeleteProj(null)}
        />
      )}
      {taxonomyDelete && (
        <ConfirmDialog
          message={`Delete ${TAXONOMY_CONFIG[taxonomyDelete.tab].singular} "${taxonomyDelete.item.name}"? This cannot be undone.`}
          onConfirm={handleDeleteTaxonomy}
          onCancel={() => setTaxonomyDelete(null)}
        />
      )}
    </div>
  )
}
