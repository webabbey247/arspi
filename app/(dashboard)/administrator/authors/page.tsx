"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import { useUploadThing } from "@/lib/uploadthing-client"

// ── Types ─────────────────────────────────────────────────────────────────────

type Author = {
  id: string
  name: string
  jobTitle: string | null
  bio: string | null
  avatar: string | null
  createdAt: string
  _count: { insights: number }
}

// ── Confirm dialog ────────────────────────────────────────────────────────────

function ConfirmDialog({
  message, onConfirm, onCancel,
}: {
  message: string; onConfirm: () => void; onCancel: () => void
}) {
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

// ── Avatar upload field ───────────────────────────────────────────────────────

function AvatarUpload({
  value,
  onChange,
}: {
  value: string
  onChange: (url: string) => void
}) {
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
        <Image src={value} alt="Avatar" width={48} height={48} className="rounded-full object-cover border border-[#E5E2DC]" />
      ) : (
        <div className="w-12 h-12 rounded-full bg-[#F5F4F1] border border-[#E5E2DC] flex items-center justify-center text-[#A8A39C]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
      )}
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="px-3 py-1.5 rounded-[8px] text-[12px] font-semibold border border-[#E5E2DC] text-[#6B6560] hover:border-[#0474C4] hover:text-[#0474C4] disabled:opacity-50 transition-colors cursor-pointer"
        >
          {uploading ? "Uploading…" : "Upload photo"}
        </button>
        {value && (
          <button type="button" onClick={() => onChange("")} className="text-[11px] text-red-500 hover:underline cursor-pointer text-left">Remove</button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  )
}

// ── Author modal ──────────────────────────────────────────────────────────────

const inputCls = "w-full px-3 py-2 text-[13px] bg-white border border-[#E5E2DC] rounded-[10px] text-[#1A1916] outline-none placeholder:text-[#A8A39C] focus:border-[#0474C4] transition-colors resize-none"

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-bold text-[#6B6560] uppercase tracking-[0.4px]">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

type FormValues = { name: string; jobTitle: string; bio: string; avatar: string }
const EMPTY: FormValues = { name: "", jobTitle: "", bio: "", avatar: "" }

function AuthorModal({
  author, onSave, onClose,
}: {
  author: Author | null
  onSave: (v: FormValues) => Promise<void>
  onClose: () => void
}) {
  const [form, setForm]     = useState<FormValues>(
    author ? { name: author.name, jobTitle: author.jobTitle ?? "", bio: author.bio ?? "", avatar: author.avatar ?? "" } : EMPTY
  )
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState("")

  function set(key: keyof FormValues, val: string) {
    setForm(f => ({ ...f, [key]: val }))
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
      <div className="bg-white h-full w-full max-w-md shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E2DC] shrink-0">
          <h2 className="text-[15px] font-bold text-[#1A1916]">{author ? "Edit Author" : "New Author"}</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#F5F4F1] text-[#A8A39C] cursor-pointer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {error && <p className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

          <Field label="Avatar photo">
            <AvatarUpload value={form.avatar} onChange={url => set("avatar", url)} />
          </Field>

          <Field label="Full Name" required>
            <input autoFocus value={form.name} onChange={e => set("name", e.target.value)} required className={inputCls} placeholder="e.g. Dr. Rachel Osei" />
          </Field>

          <Field label="Job Title / Role">
            <input value={form.jobTitle} onChange={e => set("jobTitle", e.target.value)} className={inputCls} placeholder="e.g. M&E Specialist" />
          </Field>

          <Field label="Bio">
            <textarea value={form.bio} onChange={e => set("bio", e.target.value)} rows={4} className={inputCls} placeholder="Short author biography…" />
          </Field>
        </form>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#E5E2DC] shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-[10px] text-[13px] font-semibold border border-[#E5E2DC] text-[#6B6560] hover:bg-[#F5F4F1] cursor-pointer">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="px-5 py-2 rounded-[10px] text-[13px] font-semibold bg-[#0474C4] text-white hover:bg-[#06457F] disabled:opacity-50 cursor-pointer">
            {saving ? "Saving…" : author ? "Save Changes" : "Create Author"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

export default function AdminAuthorsPage() {
  const [authors, setAuthors]     = useState<Author[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState("")
  const [modal, setModal]         = useState<"create" | Author | null>(null)
  const [toDelete, setToDelete]   = useState<Author | null>(null)

  const fetchAuthors = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch("/api/authors")
      const data = await res.json()
      if (res.ok) setAuthors(data.authors ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAuthors() }, [fetchAuthors])

  async function handleSave(values: FormValues) {
    const editing = modal !== "create" ? modal : null
    const payload = {
      name:     values.name,
      jobTitle: values.jobTitle || null,
      bio:      values.bio      || null,
      avatar:   values.avatar   || null,
    }
    const res  = await fetch(editing ? `/api/authors/${editing.id}` : "/api/authors", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? "Failed to save.")
    setModal(null)
    await fetchAuthors()
  }

  async function handleDelete() {
    if (!toDelete) return
    const res  = await fetch(`/api/authors/${toDelete.id}`, { method: "DELETE" })
    if (!res.ok) {
      const data = await res.json()
      alert(data.error ?? "Failed to delete.")
    }
    setToDelete(null)
    await fetchAuthors()
  }

  const filtered = authors.filter(a =>
    !search || a.name.toLowerCase().includes(search.toLowerCase()) || (a.jobTitle ?? "").toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="px-8 py-8 max-w-350 mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[18px] font-extrabold text-[#1A1916]">Authors</h1>
          <p className="text-[#A8A39C] text-[13px] mt-0.5">Manage insight authors and their profiles</p>
        </div>
        <button
          onClick={() => setModal("create")}
          className="flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[13px] font-semibold bg-[#0474C4] text-white hover:bg-[#06457F] transition-colors cursor-pointer"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Author
        </button>
      </div>

      {/* Table card */}
      <div className="rounded-[14px] border border-[#E5E2DC] overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-[#E5E2DC]">
          <div className="relative w-full sm:w-64">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A39C]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search authors…"
              className="w-full pl-8 pr-3 py-2 text-[13px] bg-white border border-[#E5E2DC] rounded-[10px] text-[#1A1916] outline-none placeholder:text-[#A8A39C] focus:border-[#0474C4] transition-colors"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-[#FAFAF9] border-b border-[#E5E2DC]">
                {["Author", "Job Title", "Insights", "Joined", ""].map(col => (
                  <th key={col} className="px-4 py-2.5 text-left text-[11px] font-bold text-[#A8A39C] tracking-[0.5px] uppercase whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-[#A8A39C]">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-[#A8A39C]">No authors found.</td></tr>
              ) : filtered.map(a => (
                <tr key={a.id} className="border-b border-[#F0EEE9] last:border-none hover:bg-[#FAFAF9] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      {a.avatar ? (
                        <Image src={a.avatar} alt={a.name} width={32} height={32} className="rounded-full w-8 h-8 object-cover border border-[#E5E2DC] shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#0474C4] flex items-center justify-center text-white text-[11px] font-semibold shrink-0">
                          {a.name.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase()}
                        </div>
                      )}
                      <span className="font-semibold text-[#1A1916] whitespace-nowrap">{a.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#6B6560] whitespace-nowrap">{a.jobTitle ?? "—"}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-full bg-[#F5F4F1] text-[#6B6560] text-[11px] font-semibold">{a._count.insights}</span>
                  </td>
                  <td className="px-4 py-3 text-[#6B6560] whitespace-nowrap">{fmtDate(a.createdAt)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setModal(a)} className="w-7 h-7 flex items-center justify-center rounded-[8px] border border-[#E5E2DC] text-[#6B6560] hover:border-[#0474C4] hover:text-[#0474C4] hover:bg-amber-50 cursor-pointer transition-colors">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button onClick={() => setToDelete(a)} className="w-7 h-7 flex items-center justify-center rounded-[8px] border border-red-200 bg-red-50 text-red-500 hover:border-red-400 hover:text-red-600 hover:bg-red-100 cursor-pointer transition-colors">
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
          <p className="text-[11px] text-[#A8A39C]">
            <span className="font-semibold text-[#6B6560]">{authors.length}</span> {authors.length === 1 ? "author" : "authors"} total
          </p>
        </div>
      </div>

      {/* Modals */}
      {modal !== null && (
        <AuthorModal
          author={modal === "create" ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
      {toDelete && (
        <ConfirmDialog
          message={`Delete "${toDelete.name}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  )
}
