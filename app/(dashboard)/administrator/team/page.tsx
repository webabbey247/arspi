"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import { useUploadThing } from "@/lib/uploadthing-client"

// ── Types ─────────────────────────────────────────────────────────────────────

type TeamCategory = "EXECUTIVE_MANAGEMENT" | "STAFF"

type TeamMember = {
  id:           string
  name:         string
  position:     string
  category:     TeamCategory
  coverImage:   string | null
  description:  string | null
  displayOrder: number
  createdAt:    string
  updatedAt:    string
}

const CATEGORY_LABEL: Record<TeamCategory, string> = {
  EXECUTIVE_MANAGEMENT: "Executive Management",
  STAFF:                "Our Staff",
}

const CATEGORY_OPTIONS: { id: TeamCategory; label: string }[] = [
  { id: "EXECUTIVE_MANAGEMENT", label: "Executive Management" },
  { id: "STAFF",                label: "Our Staff" },
]

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
          <button onClick={onCancel} className="px-4 py-2 rounded text-[13px] font-semibold border border-[#E5E2DC] text-[#6B6560] hover:bg-[#F5F4F1] cursor-pointer">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded text-[13px] font-semibold bg-red-600 text-white hover:bg-red-700 cursor-pointer">Delete</button>
        </div>
      </div>
    </div>
  )
}

// ── Cover image upload ───────────────────────────────────────────────────────

function CoverUpload({
  value, onChange,
}: {
  value: string; onChange: (url: string) => void
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
    <div className="flex flex-col gap-2">
      {value ? (
        <div className="relative w-full aspect-3/4 max-w-48 rounded overflow-hidden border border-[#E5E2DC] bg-[#F5F4F1]">
          <Image src={value} alt="Cover" fill className="object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 cursor-pointer"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      ) : (
        <div className="w-full aspect-3/4 max-w-48 rounded bg-[#F5F4F1] border border-dashed border-[#E5E2DC] flex items-center justify-center text-[#A8A39C]">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        </div>
      )}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="px-3 py-1.5 rounded text-[12px] font-semibold border border-[#E5E2DC] text-[#6B6560] hover:border-[#0474C4] hover:text-[#0474C4] disabled:opacity-50 transition-colors cursor-pointer w-fit"
      >
        {uploading ? "Uploading…" : value ? "Replace cover" : "Upload cover"}
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  )
}

// ── Form ──────────────────────────────────────────────────────────────────────

const inputCls = "w-full px-3 py-2 text-[13px] bg-white border border-[#E5E2DC] rounded text-[#1A1916] outline-none placeholder:text-[#A8A39C] focus:border-[#0474C4] transition-colors resize-none"

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

type FormValues = {
  name:         string
  position:     string
  category:     TeamCategory
  coverImage:   string
  description:  string
  displayOrder: string
}

const EMPTY: FormValues = {
  name:         "",
  position:     "",
  category:     "STAFF",
  coverImage:   "",
  description:  "",
  displayOrder: "0",
}

function MemberDrawer({
  member, onSave, onClose,
}: {
  member: TeamMember | null
  onSave: (v: FormValues) => Promise<void>
  onClose: () => void
}) {
  const [form, setForm] = useState<FormValues>(
    member
      ? {
          name:         member.name,
          position:     member.position,
          category:     member.category,
          coverImage:   member.coverImage  ?? "",
          description:  member.description ?? "",
          displayOrder: String(member.displayOrder),
        }
      : EMPTY
  )
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState("")

  function set<K extends keyof FormValues>(key: K, val: FormValues[K]) {
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
          <h2 className="text-[15px] font-bold text-[#1A1916]">{member ? "Edit Team Member" : "New Team Member"}</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#F5F4F1] text-[#A8A39C] cursor-pointer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {error && <p className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

          <Field label="Cover photo">
            <CoverUpload value={form.coverImage} onChange={url => set("coverImage", url)} />
          </Field>

          <Field label="Full Name" required>
            <input
              autoFocus
              value={form.name}
              onChange={e => set("name", e.target.value)}
              required
              className={inputCls}
              placeholder="e.g. Joaquin Duato"
            />
          </Field>

          <Field label="Position" required>
            <input
              value={form.position}
              onChange={e => set("position", e.target.value)}
              required
              className={inputCls}
              placeholder="e.g. Chairman and Chief Executive Officer"
            />
          </Field>

          <Field label="Category" required>
            <select
              value={form.category}
              onChange={e => set("category", e.target.value as TeamCategory)}
              className={inputCls}
            >
              {CATEGORY_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </Field>

          <Field label="Display order" required>
            <input
              type="number"
              step="1"
              value={form.displayOrder}
              onChange={e => set("displayOrder", e.target.value)}
              className={inputCls}
              placeholder="0"
            />
          </Field>

          <Field label="Short description (optional)">
            <textarea
              value={form.description}
              onChange={e => set("description", e.target.value)}
              rows={3}
              className={inputCls}
              placeholder="Internal notes — not shown on the public team page yet."
            />
          </Field>
        </form>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#E5E2DC] shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded text-[13px] font-semibold border border-[#E5E2DC] text-[#6B6560] hover:bg-[#F5F4F1] cursor-pointer">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="px-5 py-2 rounded text-[13px] font-semibold bg-[#0474C4] text-white hover:bg-[#06457F] disabled:opacity-50 cursor-pointer">
            {saving ? "Saving…" : member ? "Save Changes" : "Create Member"}
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

export default function AdminTeamPage() {
  const [members, setMembers]   = useState<TeamMember[]>([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState("")
  const [drawer, setDrawer]     = useState<"create" | TeamMember | null>(null)
  const [toDelete, setToDelete] = useState<TeamMember | null>(null)
  const PAGE_SIZE               = 20
  const [page, setPage]         = useState(1)

  const fetchMembers = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/admin/team?page=${page}&limit=${PAGE_SIZE}`)
      const data = await res.json()
      if (res.ok) {
        setMembers(data.members ?? [])
        setTotal(data.pagination?.total ?? 0)
      }
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { fetchMembers() }, [fetchMembers])

  // Reset to page 1 when search changes (search is applied client-side)
  useEffect(() => { setPage(1) }, [search])

  async function handleSave(values: FormValues) {
    const editing = drawer !== "create" ? drawer : null
    const payload = {
      name:         values.name,
      position:     values.position,
      category:     values.category,
      coverImage:   values.coverImage  || null,
      description:  values.description || null,
      displayOrder: parseInt(values.displayOrder, 10) || 0,
    }
    const res  = await fetch(editing ? `/api/admin/team/${editing.id}` : "/api/admin/team", {
      method:  editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? "Failed to save.")
    setDrawer(null)
    await fetchMembers()
  }

  async function handleDelete() {
    if (!toDelete) return
    const res = await fetch(`/api/admin/team/${toDelete.id}`, { method: "DELETE" })
    if (!res.ok && res.status !== 204) {
      const data = await res.json()
      alert(data.error ?? "Failed to delete.")
    }
    setToDelete(null)
    await fetchMembers()
  }

  // Client-side search across the current page
  const filtered = members.filter(m =>
    !search
      || m.name.toLowerCase().includes(search.toLowerCase())
      || m.position.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const startIdx   = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const endIdx     = Math.min(page * PAGE_SIZE, total)

  return (
    <div className="px-8 py-8 max-w-350 mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[18px] font-extrabold text-[#1A1916]">Team</h1>
          <p className="text-[#A8A39C] text-[13px] mt-0.5">Manage executive management and staff profiles displayed on the public team page</p>
        </div>
        <button
          onClick={() => setDrawer("create")}
          className="flex items-center gap-1.5 px-4 py-2 rounded text-[13px] font-semibold bg-[#0474C4] text-white hover:bg-[#06457F] transition-colors cursor-pointer"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Member
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
              placeholder="Search members…"
              className="w-full pl-8 pr-3 py-2 text-[13px] bg-white border border-[#E5E2DC] rounded text-[#1A1916] outline-none placeholder:text-[#A8A39C] focus:border-[#0474C4] transition-colors"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-[#FAFAF9] border-b border-[#E5E2DC]">
                {["Member", "Position", "Category", "Order", "Updated", ""].map(col => (
                  <th key={col} className="px-4 py-2.5 text-left text-[11px] font-bold text-[#A8A39C] tracking-[0.5px] uppercase whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-[#A8A39C]">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-[#A8A39C]">No team members found.</td></tr>
              ) : filtered.map(m => (
                <tr key={m.id} className="border-b border-[#F0EEE9] last:border-none hover:bg-[#FAFAF9] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      {m.coverImage ? (
                        <Image src={m.coverImage} alt={m.name} width={36} height={48} className="w-9 h-12 rounded-md object-cover border border-[#E5E2DC] shrink-0" />
                      ) : (
                        <div className="w-9 h-12 rounded-md bg-[#0474C4] flex items-center justify-center text-white text-[11px] font-semibold shrink-0">
                          {m.name.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase()}
                        </div>
                      )}
                      <span className="font-semibold text-[#1A1916] whitespace-nowrap">{m.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#6B6560]">{m.position}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${m.category === "EXECUTIVE_MANAGEMENT" ? "bg-[#FEF3C7] text-[#B45309]" : "bg-[#EBF3FC] text-[#0474C4]"}`}>
                      {CATEGORY_LABEL[m.category]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#6B6560] whitespace-nowrap">{m.displayOrder}</td>
                  <td className="px-4 py-3 text-[#6B6560] whitespace-nowrap">{fmtDate(m.updatedAt)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setDrawer(m)} className="w-7 h-7 flex items-center justify-center rounded-[8px] border border-[#E5E2DC] text-[#6B6560] hover:border-[#0474C4] hover:text-[#0474C4] hover:bg-amber-50 cursor-pointer transition-colors">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button onClick={() => setToDelete(m)} className="w-7 h-7 flex items-center justify-center rounded-[8px] border border-red-200 bg-red-50 text-red-500 hover:border-red-400 hover:text-red-600 hover:bg-red-100 cursor-pointer transition-colors">
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
            {total === 0 ? (
              <>Showing <span className="font-semibold text-[#6B6560]">0</span> of <span className="font-semibold text-[#6B6560]">0</span> members</>
            ) : (
              <>Showing <span className="font-semibold text-[#6B6560]">{startIdx}</span>–<span className="font-semibold text-[#6B6560]">{endIdx}</span> of <span className="font-semibold text-[#6B6560]">{total}</span> {total === 1 ? "member" : "members"}</>
            )}
          </p>
          {total > 0 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded-[8px] text-[12px] font-semibold border border-[#E5E2DC] bg-white text-[#6B6560] hover:border-[#0474C4] hover:text-[#0474C4] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                Prev
              </button>
              <span className="text-[11px] font-semibold text-[#6B6560] px-2">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1 rounded-[8px] text-[12px] font-semibold border border-[#E5E2DC] bg-white text-[#6B6560] hover:border-[#0474C4] hover:text-[#0474C4] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {drawer !== null && (
        <MemberDrawer
          member={drawer === "create" ? null : drawer}
          onSave={handleSave}
          onClose={() => setDrawer(null)}
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
