"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import { useUploadThing } from "@/lib/uploadthing-client"
import { TableSkeletonRows, SkeletonCardList } from "@/components/ui/skeleton"
import { AdminPageHeader, RowActions, RowIcon, StatTile } from "@/components/admin/AdminKit"

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#171C35]/40">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
        <p className="text-[14px] text-[#171C35] mb-5">{message}</p>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded text-[13px] font-semibold border border-[#DFE2ED] text-[#69708A] hover:bg-[#F5F6FB] cursor-pointer">Cancel</button>
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
        <div className="relative w-full aspect-3/4 max-w-48 rounded overflow-hidden border border-[#DFE2ED] bg-[#F5F6FB]">
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
        <div className="w-full aspect-3/4 max-w-48 rounded bg-[#F5F6FB] border border-dashed border-[#DFE2ED] flex items-center justify-center text-[#8A90A6]">
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
        className="px-3 py-1.5 rounded text-[12px] font-semibold border border-[#DFE2ED] text-[#69708A] hover:border-[#6655DF] hover:text-[#6655DF] disabled:opacity-50 transition-colors cursor-pointer w-fit"
      >
        {uploading ? "Uploading…" : value ? "Replace cover" : "Upload cover"}
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  )
}

// ── Form ──────────────────────────────────────────────────────────────────────

const inputCls = "w-full px-3 py-2 text-[13px] bg-white border border-[#DFE2ED] rounded text-[#171C35] outline-none placeholder:text-[#8A90A6] focus:border-[#6655DF] transition-colors resize-none"

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-bold text-[#69708A] uppercase tracking-[0.4px]">
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
    <div className="fixed inset-0 z-100 flex items-start justify-end bg-[#171C35]/40">
      <div className="bg-white h-full w-full max-w-md shadow-2xl flex flex-col overflow-hidden">
        <div className="bg-[linear-gradient(135deg,#241C61,#6756DF)] px-6 py-5 shrink-0 relative">
          <button type="button" onClick={onClose} className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/20 text-white uppercase tracking-wider">
              {member ? "Edit Member" : "New Member"}
            </span>
          </div>
          <h2 className="text-[18px] font-extrabold text-white leading-tight">
            {member ? member.name : "Create Team Member"}
          </h2>
          <p className="text-[12px] text-white/80 mt-1">
            {member ? "Update the team member profile and click save." : "Add a new member to the team page."}
          </p>
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

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#DFE2ED] shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded text-[13px] font-semibold border border-[#DFE2ED] text-[#69708A] hover:bg-[#F5F6FB] cursor-pointer">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="px-5 py-2 rounded text-[13px] font-semibold bg-[#6655DF] text-white hover:bg-[#2C2368] disabled:opacity-50 cursor-pointer">
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

  /** Category counts feed the first tile's meter, so the mix is visible
   *  without opening the filter. */
  const teamStats = {
    leadership: members.filter(m => m.category === "EXECUTIVE_MANAGEMENT").length,
    withPhoto:  members.filter(m => !!m.coverImage).length,
    categories: new Set(members.map(m => m.category)).size,
    byCategory: (Object.keys(CATEGORY_LABEL) as TeamCategory[])
      .map((c, i) => ({
        label: CATEGORY_LABEL[c].toLowerCase(),
        value: members.filter(m => m.category === c).length,
        tone:  (["emerald", "amber", "sky", "slate"] as const)[i % 4],
      }))
      .filter(b => b.value > 0),
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-350 mx-auto">
      <AdminPageHeader
        title="Team"
        description="Executive management and staff profiles, as shown on the public team page."
        actions={
          <button
            onClick={() => setDrawer("create")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[14px] font-bold bg-[#6655DF] text-white hover:bg-[#2C2368] transition-colors cursor-pointer"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Member
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 mt-6">
        <StatTile
          label="Members" value={members.length} loading={loading}
          motif="dots" accent="text-[#6655DF]" tone="bg-[#EEECFF] text-[#6655DF]"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>}
          breakdown={teamStats.byCategory}
        />
        <StatTile
          label="Leadership" value={teamStats.leadership} loading={loading}
          motif="rings" accent="text-amber-600" tone="bg-amber-50 text-amber-600"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
          hint="Executive management"
        />
        <StatTile
          label="With a photo" value={teamStats.withPhoto} loading={loading}
          motif="hatch" accent="text-emerald-600" tone="bg-emerald-50 text-emerald-600"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>}
          hint={`${members.length - teamStats.withPhoto} still missing one`}
        />
        <StatTile
          label="Categories" value={teamStats.categories} loading={loading}
          motif="grid" accent="text-sky-600" tone="bg-sky-50 text-sky-600"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>}
          hint="Groups on the public page"
        />
      </div>

      {/* Table card */}
      <div className="rounded-[16px] border border-[#DFE2ED] overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-3 sm:px-4 py-3 bg-white border-b border-[#DFE2ED]">
          <div className="relative w-full sm:w-64">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A90A6]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search members…"
              className="w-full pl-8 pr-3 py-2 text-[13px] bg-white border border-[#DFE2ED] rounded text-[#171C35] outline-none placeholder:text-[#8A90A6] focus:border-[#6655DF] transition-colors"
            />
          </div>
        </div>

        {/* Table — desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-[#FAFAFF] border-b border-[#DFE2ED]">
                {["Member", "Position", "Category", "Order", "Updated", ""].map(col => (
                  <th key={col} className="px-4 py-2.5 text-left text-[11px] font-bold text-[#8A90A6] tracking-[0.5px] uppercase whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonRows colSpan={6} />
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-[#8A90A6]">No team members found.</td></tr>
              ) : filtered.map(m => (
                <tr key={m.id} className="border-b border-[#F0EFFA] last:border-none hover:bg-[#FAFAFF] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      {m.coverImage ? (
                        <Image src={m.coverImage} alt={m.name} width={36} height={48} className="w-9 h-12 rounded-md object-cover border border-[#DFE2ED] shrink-0" />
                      ) : (
                        <div className="w-9 h-12 rounded-md bg-[#6655DF] flex items-center justify-center text-white text-[11px] font-semibold shrink-0">
                          {m.name.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase()}
                        </div>
                      )}
                      <span className="font-semibold text-[#171C35] whitespace-nowrap">{m.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#69708A]">{m.position}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${m.category === "EXECUTIVE_MANAGEMENT" ? "bg-[#FEF3C7] text-[#B45309]" : "bg-[#EEECFF] text-[#6655DF]"}`}>
                      {CATEGORY_LABEL[m.category]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#69708A] whitespace-nowrap">{m.displayOrder}</td>
                  <td className="px-4 py-3 text-[#69708A] whitespace-nowrap">{fmtDate(m.updatedAt)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <RowActions
                      label={`Actions for ${m.name}`}
                      items={[
                        { label: "Edit member",   icon: RowIcon.edit,  onSelect: () => setDrawer(m) },
                        { type: "separator" },
                        { label: "Delete member", icon: RowIcon.trash, danger: true, onSelect: () => setToDelete(m) },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cards — mobile */}
        <div className="md:hidden flex flex-col">
          {loading ? (
            <SkeletonCardList />
          ) : filtered.length === 0 ? (
            <div className="px-4 py-10 text-center text-[#8A90A6] text-[13px]">No team members found.</div>
          ) : filtered.map(m => (
            <div key={m.id} className="px-4 py-4 border-b border-[#F0EFFA] last:border-none flex flex-col gap-3">
              <div className="flex items-start gap-3">
                {m.coverImage ? (
                  <Image src={m.coverImage} alt={m.name} width={40} height={40} className="w-10 h-10 rounded-[8px] object-cover border border-[#DFE2ED] shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-[8px] bg-[#6655DF] flex items-center justify-center text-white text-[12px] font-semibold shrink-0">
                    {m.name.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[#171C35] text-[14px] leading-tight">{m.name}</p>
                  <p className="text-[12px] text-[#8A90A6] mt-0.5 line-clamp-2">{m.position}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${m.category === "EXECUTIVE_MANAGEMENT" ? "bg-[#FEF3C7] text-[#B45309]" : "bg-[#EEECFF] text-[#6655DF]"}`}>
                  {CATEGORY_LABEL[m.category]}
                </span>
              </div>

              <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[12px]">
                <div>
                  <dt className="text-[10px] uppercase tracking-wide text-[#8A90A6] font-semibold">Order</dt>
                  <dd className="text-[#171C35] font-medium">{m.displayOrder}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-wide text-[#8A90A6] font-semibold">Updated</dt>
                  <dd className="text-[#171C35] font-medium">{fmtDate(m.updatedAt)}</dd>
                </div>
              </dl>

              <RowActions
                label={`Actions for ${m.name}`}
                items={[
                  { label: "Edit member",   icon: RowIcon.edit,  onSelect: () => setDrawer(m) },
                  { type: "separator" },
                  { label: "Delete member", icon: RowIcon.trash, danger: true, onSelect: () => setToDelete(m) },
                ]}
              />
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-3 sm:px-4 py-2.5 bg-[#FAFAFF] border-t border-[#DFE2ED]">
          <p className="text-[11px] text-[#8A90A6]">
            {total === 0 ? (
              <>Showing <span className="font-semibold text-[#69708A]">0</span> of <span className="font-semibold text-[#69708A]">0</span> members</>
            ) : (
              <>Showing <span className="font-semibold text-[#69708A]">{startIdx}</span>–<span className="font-semibold text-[#69708A]">{endIdx}</span> of <span className="font-semibold text-[#69708A]">{total}</span> {total === 1 ? "member" : "members"}</>
            )}
          </p>
          {total > 0 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded-[8px] text-[12px] font-semibold border border-[#DFE2ED] bg-white text-[#69708A] hover:border-[#6655DF] hover:text-[#6655DF] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                Prev
              </button>
              <span className="text-[11px] font-semibold text-[#69708A] px-2">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1 rounded-[8px] text-[12px] font-semibold border border-[#DFE2ED] bg-white text-[#69708A] hover:border-[#6655DF] hover:text-[#6655DF] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
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
