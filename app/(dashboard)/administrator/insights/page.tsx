"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import dynamic from "next/dynamic"
import Image from "next/image"
import { useUploadThing } from "@/lib/uploadthing-client"

// Load Tiptap editor client-side only (uses browser APIs)
const RichTextEditor = dynamic(() => import("@/components/ui/RichTextEditor"), { ssr: false })

// ── Types ─────────────────────────────────────────────────────────────────────

type Category = {
  id: string
  name: string
  slug: string
  createdAt: string
  _count: { insights: number }
}

type Author = {
  id: string
  name: string
  jobTitle: string | null
  avatar: string | null
}

type Insight = {
  id: string
  title: string
  slug: string
  excerpt: string
  body: string
  featured: boolean
  published: boolean
  readTime: string
  coverImage: string | null
  publishedAt: string | null
  createdAt: string
  authorId: string | null
  author: Author | null
  categoryId: string | null
  category: Category | null
}

type Tab = "insights" | "categories"

// ── Helpers ───────────────────────────────────────────────────────────────────

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

// ── Badge ─────────────────────────────────────────────────────────────────────

function StatusBadge({ published, onClick, loading }: { published: boolean; onClick?: () => void; loading?: boolean }) {
  const base = "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold transition-opacity"
  const color = published ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
  const dot   = published ? "bg-emerald-500" : "bg-amber-400"

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        title={published ? "Click to set as Draft" : "Click to Publish"}
        className={`${base} ${color} cursor-pointer hover:opacity-70 disabled:opacity-40`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
        {loading ? "Saving…" : published ? "Published" : "Draft"}
      </button>
    )
  }

  return (
    <span className={`${base} ${color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {published ? "Published" : "Draft"}
    </span>
  )
}

// ── Confirm dialog ────────────────────────────────────────────────────────────

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

// ── Cover image upload field ──────────────────────────────────────────────────

function CoverImageUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
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
          <Image src={value} alt="Cover" fill className="object-cover" />
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
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-[10px] text-[13px] font-semibold border border-dashed border-[#E5E2DC] text-[#6B6560] hover:border-[#0474C4] hover:text-[#0474C4] disabled:opacity-50 transition-colors cursor-pointer"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        {uploading ? "Uploading…" : value ? "Replace image" : "Upload cover image"}
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  )
}

// ── Shared form helpers ───────────────────────────────────────────────────────

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

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex items-center gap-2 cursor-pointer">
      <span className={`relative w-9 h-5 rounded-full transition-colors ${checked ? "bg-[#0474C4]" : "bg-[#D9D6D0]"}`}>
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0"}`} />
      </span>
      <span className="text-[13px] font-medium text-[#1A1916]">{label}</span>
    </button>
  )
}

// ── Insight form modal ────────────────────────────────────────────────────────

type InsightFormValues = {
  title: string
  slug: string
  excerpt: string
  body: string
  categoryId: string
  authorId: string
  readTime: string
  coverImage: string
  featured: boolean
  published: boolean
}

const EMPTY_FORM: InsightFormValues = {
  title: "", slug: "", excerpt: "", body: "",
  categoryId: "", authorId: "", readTime: "5 min read",
  coverImage: "", featured: false, published: false,
}

function InsightModal({
  insight, categories, authors, onSave, onClose,
}: {
  insight: Insight | null
  categories: Category[]
  authors: Author[]
  onSave: (values: InsightFormValues) => Promise<void>
  onClose: () => void
}) {
  const [form, setForm]     = useState<InsightFormValues>(
    insight
      ? {
          title:      insight.title,
          slug:       insight.slug,
          excerpt:    insight.excerpt,
          body:       insight.body,
          categoryId: insight.categoryId ?? "",
          authorId:   insight.authorId   ?? "",
          readTime:   insight.readTime,
          coverImage: insight.coverImage ?? "",
          featured:   insight.featured,
          published:  insight.published,
        }
      : EMPTY_FORM
  )
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState("")
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => { titleRef.current?.focus() }, [])

  function set<K extends keyof InsightFormValues>(key: K, value: InsightFormValues[K]) {
    setForm(f => ({
      ...f,
      [key]: value,
      ...(key === "title" && !insight ? { slug: slugify(value as string) } : {}),
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSaving(true)
    try { await onSave(form) }
    catch (err) { setError(err instanceof Error ? err.message : "Something went wrong.") }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/40">
      <div className="bg-white h-full w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E2DC] shrink-0">
          <h2 className="text-[15px] font-bold text-[#1A1916]">{insight ? "Edit Insight" : "New Insight"}</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#F5F4F1] text-[#A8A39C] cursor-pointer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {error && <p className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

          {/* Cover image */}
          <Field label="Cover Image">
            <CoverImageUpload value={form.coverImage} onChange={url => set("coverImage", url)} />
          </Field>

          {/* Title */}
          <Field label="Title" required>
            <input ref={titleRef} value={form.title} onChange={e => set("title", e.target.value)} required className={inputCls} placeholder="e.g. The Future of Policy Research" />
          </Field>

          {/* Slug */}
          <Field label="Slug" hint="Auto-generated from title">
            <input value={form.slug} onChange={e => set("slug", e.target.value)} className={inputCls} placeholder="e.g. future-of-policy-research" />
          </Field>

          {/* Category + Author row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Category">
              <select value={form.categoryId} onChange={e => set("categoryId", e.target.value)} className={inputCls}>
                <option value="">— None —</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Author">
              <select value={form.authorId} onChange={e => set("authorId", e.target.value)} className={inputCls}>
                <option value="">— None —</option>
                {authors.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name}{a.jobTitle ? ` · ${a.jobTitle}` : ""}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {/* Excerpt */}
          <Field label="Excerpt" required>
            <textarea value={form.excerpt} onChange={e => set("excerpt", e.target.value)} required rows={3} className={inputCls} placeholder="A concise summary shown in listing pages…" />
          </Field>

          {/* Body — Tiptap rich text editor */}
          <Field label="Body" required>
            <RichTextEditor
              value={form.body}
              onChange={html => set("body", html)}
              placeholder="Write full article content here…"
              minHeight={320}
            />
          </Field>

          {/* Read time */}
          <Field label="Read Time">
            <input value={form.readTime} onChange={e => set("readTime", e.target.value)} className={inputCls} placeholder="e.g. 5 min read" />
          </Field>

          {/* Toggles */}
          <div className="flex items-center gap-6 pt-1">
            <Toggle label="Featured" checked={form.featured} onChange={v => set("featured", v)} />
            <Toggle label="Published" checked={form.published} onChange={v => set("published", v)} />
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#E5E2DC] shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-[10px] text-[13px] font-semibold border border-[#E5E2DC] text-[#6B6560] hover:bg-[#F5F4F1] cursor-pointer">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="px-5 py-2 rounded-[10px] text-[13px] font-semibold bg-[#0474C4] text-white hover:bg-[#06457F] disabled:opacity-50 cursor-pointer">
            {saving ? "Saving…" : insight ? "Save Changes" : "Create Insight"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Category modal ────────────────────────────────────────────────────────────

function CategoryModal({ category, onSave, onClose }: { category: Category | null; onSave: (name: string) => Promise<void>; onClose: () => void }) {
  const [name, setName]     = useState(category?.name ?? "")
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setError("")
    setSaving(true)
    try { await onSave(name.trim()) }
    catch (err) { setError(err instanceof Error ? err.message : "Something went wrong.") }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-[#E5E2DC]">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-[#FDF3E0] flex items-center justify-center shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0474C4" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-[#1A1916] leading-tight">{category ? "Edit Category" : "New Category"}</h2>
              <p className="text-[12px] text-[#A8A39C] mt-0.5">
                {category ? "Update the category name." : "Create a new insight category."}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#F5F4F1] text-[#A8A39C] cursor-pointer shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
          {error && <p className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
          <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Research" className={inputCls} required />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-[10px] text-[13px] font-semibold border border-[#E5E2DC] text-[#6B6560] hover:bg-[#F5F4F1] cursor-pointer">Cancel</button>
            <button type="submit" disabled={saving || !name.trim()} className="px-5 py-2 rounded-[10px] text-[13px] font-semibold bg-[#0474C4] text-white hover:bg-[#06457F] disabled:opacity-50 cursor-pointer">
              {saving ? "Saving…" : category ? "Save" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminInsightsPage() {
  const [tab, setTab] = useState<Tab>("insights")

  // Insights
  const [insights, setInsights]                 = useState<Insight[]>([])
  const [insightsLoading, setInsightsLoading]   = useState(true)
  const [insightSearch, setInsightSearch]       = useState("")
  const [insightFilter, setInsightFilter]       = useState("All")
  const [insightModal, setInsightModal]         = useState<"create" | Insight | null>(null)
  const [deleteInsight, setDeleteInsight]       = useState<Insight | null>(null)
  const [togglingIds, setTogglingIds]           = useState<Set<string>>(new Set())
  const [filterOpen, setFilterOpen]             = useState(false)
  const filterRef                               = useRef<HTMLDivElement>(null)

  // Categories
  const [categories, setCategories]                   = useState<Category[]>([])
  const [categoriesLoading, setCategoriesLoading]     = useState(true)
  const [categorySearch, setCategorySearch]           = useState("")
  const [categoryModal, setCategoryModal]             = useState<"create" | Category | null>(null)
  const [deleteCategory, setDeleteCategory]           = useState<Category | null>(null)

  // Authors (for dropdown)
  const [authors, setAuthors] = useState<Author[]>([])

  // ── Fetch ────────────────────────────────────────────────────────────────────

  const fetchInsights   = useCallback(async () => {
    setInsightsLoading(true)
    try { const r = await fetch("/api/insights"); const d = await r.json(); if (r.ok) setInsights(d.insights ?? []) }
    finally { setInsightsLoading(false) }
  }, [])

  const fetchCategories = useCallback(async () => {
    setCategoriesLoading(true)
    try { const r = await fetch("/api/insights/categories"); const d = await r.json(); if (r.ok) setCategories(d.categories ?? []) }
    finally { setCategoriesLoading(false) }
  }, [])

  const fetchAuthors = useCallback(async () => {
    const r = await fetch("/api/authors")
    const d = await r.json()
    if (r.ok) setAuthors(d.authors ?? [])
  }, [])

  useEffect(() => { fetchInsights(); fetchCategories(); fetchAuthors() }, [fetchInsights, fetchCategories, fetchAuthors])

  useEffect(() => {
    function h(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  // ── CSV export ───────────────────────────────────────────────────────────────

  function exportCSV() {
    const headers = ["Title", "Slug", "Category", "Author", "Status", "Featured", "Read Time", "Published At", "Created At"]
    const rows = filteredInsights.map(ins => [
      `"${ins.title.replace(/"/g, '""')}"`,
      ins.slug,
      ins.category?.name ?? "",
      ins.author?.name   ?? "",
      ins.published ? "Published" : "Draft",
      ins.featured  ? "Yes" : "No",
      ins.readTime,
      ins.publishedAt ? fmtDate(ins.publishedAt) : "",
      fmtDate(ins.createdAt),
    ])
    const csv  = [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement("a")
    a.href = url; a.download = `insights-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  // ── Insight CRUD ─────────────────────────────────────────────────────────────

  async function handleSaveInsight(values: InsightFormValues) {
    const editing = insightModal !== "create" ? insightModal : null
    const payload = {
      title:      values.title,
      slug:       values.slug || slugify(values.title),
      excerpt:    values.excerpt,
      body:       values.body,
      categoryId: values.categoryId || null,
      authorId:   values.authorId   || null,
      featured:   values.featured,
      published:  values.published,
      readTime:   values.readTime || "5 min read",
      coverImage: values.coverImage || null,
    }
    const res  = await fetch(editing ? `/api/insights/${editing.id}` : "/api/insights", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? "Failed to save insight.")
    setInsightModal(null)
    await fetchInsights()
  }

  async function handleTogglePublished(ins: Insight) {
    setTogglingIds(prev => new Set(prev).add(ins.id))
    try {
      await fetch(`/api/insights/${ins.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !ins.published }),
      })
      await fetchInsights()
    } finally {
      setTogglingIds(prev => { const s = new Set(prev); s.delete(ins.id); return s })
    }
  }

  async function handleDeleteInsight() {
    if (!deleteInsight) return
    await fetch(`/api/insights/${deleteInsight.id}`, { method: "DELETE" })
    setDeleteInsight(null)
    await fetchInsights()
  }

  // ── Category CRUD ─────────────────────────────────────────────────────────────

  async function handleSaveCategory(name: string) {
    const editing = categoryModal !== "create" ? categoryModal : null
    const res  = await fetch(editing ? `/api/insights/categories/${editing.id}` : "/api/insights/categories", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? "Failed to save category.")
    setCategoryModal(null)
    await fetchCategories()
  }

  async function handleDeleteCategory() {
    if (!deleteCategory) return
    const res  = await fetch(`/api/insights/categories/${deleteCategory.id}`, { method: "DELETE" })
    if (!res.ok) { const d = await res.json(); alert(d.error ?? "Failed to delete.") }
    setDeleteCategory(null)
    await fetchCategories()
  }

  // ── Derived ───────────────────────────────────────────────────────────────────

  const filteredInsights = insights.filter(ins => {
    const matchFilter =
      insightFilter === "All"       ? true :
      insightFilter === "Published" ? ins.published :
      insightFilter === "Drafts"    ? !ins.published :
      insightFilter === "Featured"  ? ins.featured :
      ins.category?.name === insightFilter

    const q = insightSearch.toLowerCase()
    return matchFilter && (
      !q ||
      ins.title.toLowerCase().includes(q) ||
      (ins.author?.name ?? "").toLowerCase().includes(q) ||
      (ins.category?.name ?? "").toLowerCase().includes(q)
    )
  })

  const filteredCategories = categories.filter(c =>
    !categorySearch || c.name.toLowerCase().includes(categorySearch.toLowerCase())
  )

  const filterOptions = ["All", "Published", "Drafts", "Featured", ...categories.map(c => c.name)]

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="px-8 py-8 max-w-350 mx-auto">

      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[18px] font-extrabold text-[#1A1916]">Insights</h1>
          <p className="text-[#A8A39C] text-[13px] mt-0.5">Manage articles, categories, and visibility</p>
        </div>
        <button
          onClick={() => tab === "insights" ? setInsightModal("create") : setCategoryModal("create")}
          className="flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[13px] font-semibold bg-[#0474C4] text-white hover:bg-[#06457F] transition-colors cursor-pointer"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          {tab === "insights" ? "New Insight" : "New Category"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-[#F5F4F1] rounded-[12px] p-1 w-fit">
        {(["insights", "categories"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-[9px] text-[13px] font-semibold capitalize transition-colors cursor-pointer ${tab === t ? "bg-white text-[#1A1916] shadow-sm" : "text-[#6B6560] hover:text-[#1A1916]"}`}>
            {t}
            <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab === t ? "bg-[#F5F4F1] text-[#6B6560]" : "bg-[#E5E2DC] text-[#A8A39C]"}`}>
              {t === "insights" ? insights.length : categories.length}
            </span>
          </button>
        ))}
      </div>

      {/* ── INSIGHTS TAB ──────────────────────────────────────────────────────── */}
      {tab === "insights" && (
        <div className="rounded-[14px] border border-[#E5E2DC] overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-[#E5E2DC]">
            <div className="relative w-full sm:w-64">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A39C]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input value={insightSearch} onChange={e => setInsightSearch(e.target.value)} placeholder="Search insights…" className="w-full pl-8 pr-3 py-2 text-[13px] bg-white border border-[#E5E2DC] rounded-[10px] text-[#1A1916] outline-none placeholder:text-[#A8A39C] focus:border-[#0474C4] transition-colors" />
            </div>

            <div className="ml-auto flex items-center gap-2">
              {/* Filter */}
              <div ref={filterRef} className="relative">
                <button
                  onClick={() => setFilterOpen(o => !o)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[13px] font-semibold border cursor-pointer transition-colors ${insightFilter !== "All" ? "bg-[#0474C4] text-white border-[#0474C4]" : "bg-white text-[#6B6560] border-[#E5E2DC] hover:border-[#0474C4] hover:text-[#0474C4]"}`}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                  Filter
                  {insightFilter !== "All" && <span className="ml-1 bg-white text-[#0474C4] text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">{insightFilter}</span>}
                </button>
                {filterOpen && (
                  <div className="absolute right-0 top-[calc(100%+6px)] z-20 bg-white border border-[#E5E2DC] rounded-xl shadow-lg py-1.5 min-w-36">
                    {filterOptions.map(f => (
                      <button key={f} onClick={() => { setInsightFilter(f); setFilterOpen(false) }}
                        className={`w-full flex items-center justify-between px-3.5 py-2 text-[13px] font-medium text-left cursor-pointer border-none transition-colors ${insightFilter === f ? "bg-[#FEF3C7] text-[#0474C4]" : "bg-transparent text-[#1A1916] hover:bg-[#F5F4F1]"}`}
                      >
                        {f}
                        {insightFilter === f && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Export CSV */}
              <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[13px] font-semibold border border-[#E5E2DC] text-[#6B6560] bg-white hover:border-[#0474C4] hover:text-[#0474C4] transition-colors cursor-pointer">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Export CSV
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-[#FAFAF9] border-b border-[#E5E2DC]">
                  {["Title", "Category", "Author", "Status", "Featured", "Date", ""].map(col => (
                    <th key={col} className="px-4 py-2.5 text-left text-[11px] font-bold text-[#A8A39C] tracking-[0.5px] uppercase whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {insightsLoading ? (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-[#A8A39C]">Loading…</td></tr>
                ) : filteredInsights.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-[#A8A39C]">No insights found.</td></tr>
                ) : filteredInsights.map(ins => (
                  <tr key={ins.id} className="border-b border-[#F0EEE9] last:border-none hover:bg-[#FAFAF9] transition-colors">
                    <td className="px-4 py-3 max-w-xs">
                      <p className="font-semibold text-[#1A1916] truncate">{ins.title}</p>
                      <p className="text-[11px] text-[#A8A39C] truncate">{ins.slug}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {ins.category
                        ? <span className="px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#4F46E5] text-[11px] font-semibold">{ins.category.name}</span>
                        : <span className="text-[#A8A39C]">—</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {ins.author ? (
                        <div className="flex items-center gap-2">
                          {ins.author.avatar
                            ? <Image src={ins.author.avatar} alt={ins.author.name} width={24} height={24} className="rounded-full w-6 h-6 object-cover border border-[#E5E2DC] shrink-0" />
                            : <div className="w-6 h-6 rounded-full bg-[#0474C4] flex items-center justify-center text-white text-[9px] font-semibold shrink-0">{ins.author.name.split(" ").map(p => p[0]).slice(0,2).join("").toUpperCase()}</div>
                          }
                          <span className="text-[#1A1916]">{ins.author.name}</span>
                        </div>
                      ) : <span className="text-[#A8A39C]">—</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap"><StatusBadge published={ins.published} onClick={() => handleTogglePublished(ins)} loading={togglingIds.has(ins.id)} /></td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {ins.featured ? <span className="text-amber-500">★</span> : <span className="text-[#E5E2DC]">★</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-[#6B6560]">{fmtDate(ins.createdAt)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setInsightModal(ins)} className="w-7 h-7 flex items-center justify-center rounded-[8px] border border-[#E5E2DC] text-[#6B6560] hover:border-[#0474C4] hover:text-[#0474C4] hover:bg-amber-50 cursor-pointer transition-colors">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button onClick={() => setDeleteInsight(ins)} className="w-7 h-7 flex items-center justify-center rounded-[8px] border border-red-200 bg-red-50 text-red-500 hover:border-red-400 hover:text-red-600 hover:bg-red-100 cursor-pointer transition-colors">
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
            <p className="text-[11px] text-[#A8A39C]">Showing <span className="font-semibold text-[#6B6560]">{filteredInsights.length}</span> of <span className="font-semibold text-[#6B6560]">{insights.length}</span> insights</p>
            {filteredInsights.length < insights.length && <p className="text-[11px] text-[#0474C4] font-semibold">{insights.length - filteredInsights.length} filtered out</p>}
          </div>
        </div>
      )}

      {/* ── CATEGORIES TAB ────────────────────────────────────────────────────── */}
      {tab === "categories" && (
        <div className="rounded-[14px] border border-[#E5E2DC] overflow-hidden">
          <div className="flex gap-2 px-4 py-3 bg-white border-b border-[#E5E2DC]">
            <div className="relative w-full sm:w-64">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A39C]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input value={categorySearch} onChange={e => setCategorySearch(e.target.value)} placeholder="Search categories…" className="w-full pl-8 pr-3 py-2 text-[13px] bg-white border border-[#E5E2DC] rounded-[10px] text-[#1A1916] outline-none placeholder:text-[#A8A39C] focus:border-[#0474C4] transition-colors" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-[#FAFAF9] border-b border-[#E5E2DC]">
                  {["Name", "Slug", "Insights", "Created", ""].map(col => (
                    <th key={col} className="px-4 py-2.5 text-left text-[11px] font-bold text-[#A8A39C] tracking-[0.5px] uppercase whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {categoriesLoading ? (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-[#A8A39C]">Loading…</td></tr>
                ) : filteredCategories.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-[#A8A39C]">No categories yet.</td></tr>
                ) : filteredCategories.map(cat => (
                  <tr key={cat.id} className="border-b border-[#F0EEE9] last:border-none hover:bg-[#FAFAF9] transition-colors">
                    <td className="px-4 py-3 font-semibold text-[#1A1916] whitespace-nowrap">{cat.name}</td>
                    <td className="px-4 py-3 text-[#6B6560] whitespace-nowrap">{cat.slug}</td>
                    <td className="px-4 py-3 whitespace-nowrap"><span className="px-2 py-0.5 rounded-full bg-[#F5F4F1] text-[#6B6560] text-[11px] font-semibold">{cat._count.insights}</span></td>
                    <td className="px-4 py-3 text-[#6B6560] whitespace-nowrap">{fmtDate(cat.createdAt)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setCategoryModal(cat)} className="w-7 h-7 flex items-center justify-center rounded-[8px] border border-[#E5E2DC] text-[#6B6560] hover:border-[#0474C4] hover:text-[#0474C4] hover:bg-amber-50 cursor-pointer transition-colors">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button onClick={() => setDeleteCategory(cat)} className="w-7 h-7 flex items-center justify-center rounded-[8px] border border-red-200 bg-red-50 text-red-500 hover:border-red-400 hover:text-red-600 hover:bg-red-100 cursor-pointer transition-colors">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-2.5 bg-[#FAFAF9] border-t border-[#E5E2DC]">
            <p className="text-[11px] text-[#A8A39C]"><span className="font-semibold text-[#6B6560]">{categories.length}</span> {categories.length === 1 ? "category" : "categories"} total</p>
          </div>
        </div>
      )}

      {/* Modals */}
      {insightModal !== null && (
        <InsightModal
          insight={insightModal === "create" ? null : insightModal}
          categories={categories}
          authors={authors}
          onSave={handleSaveInsight}
          onClose={() => setInsightModal(null)}
        />
      )}
      {categoryModal !== null && (
        <CategoryModal category={categoryModal === "create" ? null : categoryModal} onSave={handleSaveCategory} onClose={() => setCategoryModal(null)} />
      )}
      {deleteInsight && (
        <ConfirmDialog message={`Delete "${deleteInsight.title}"? This cannot be undone.`} onConfirm={handleDeleteInsight} onCancel={() => setDeleteInsight(null)} />
      )}
      {deleteCategory && (
        <ConfirmDialog message={`Delete category "${deleteCategory.name}"? This cannot be undone.`} onConfirm={handleDeleteCategory} onCancel={() => setDeleteCategory(null)} />
      )}
    </div>
  )
}
