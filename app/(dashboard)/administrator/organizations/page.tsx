"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import { useUploadThing } from "@/lib/uploadthing-client"
import { useForm, Controller } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"

// ── Types ─────────────────────────────────────────────────────────────────────

type Organization = {
  id:           string
  name:         string
  logo:         string
  url:          string | null
  description:  string | null
  displayOrder: number
  createdAt:    string
  updatedAt:    string
}

type OrgFormValues = {
  name:         string
  logo:         string
  url:          string
  description:  string
  displayOrder: string
}

const EMPTY: OrgFormValues = { name: "", logo: "", url: "", description: "", displayOrder: "0" }

const orgSchema = yup.object({
  name:         yup.string().min(1, "Name is required").max(255).required("Name is required"),
  logo:         yup.string().min(1, "Logo is required").required("Logo is required"),
  url:          yup.string().test("url", "Must be a valid URL", v => !v || /^https?:\/\/.+/.test(v)),
  description:  yup.string(),
  displayOrder: yup.string(),
})

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

function LogoUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
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
        <div className="relative w-24 h-16 rounded-[8px] overflow-hidden border border-[#E5E2DC] bg-white shrink-0 flex items-center justify-center">
          <Image src={value} alt="Logo" fill className="object-contain p-2" />
          <button type="button" onClick={() => onChange("")} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 cursor-pointer">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      ) : (
        <div className="w-24 h-16 rounded-[8px] border-2 border-dashed border-[#E5E2DC] flex items-center justify-center text-[#A8A39C] shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
        </div>
      )}
      <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className="px-3 py-1.5 text-[12px] font-semibold border border-[#E5E2DC] rounded-[8px] text-[#6B6560] hover:border-[#0474C4] hover:text-[#0474C4] disabled:opacity-50 transition-colors cursor-pointer">
        {uploading ? "Uploading…" : value ? "Replace logo" : "Upload logo"}
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  )
}

// ── Drawer ────────────────────────────────────────────────────────────────────

function OrgDrawer({
  organization, onSave, onClose,
}: {
  organization: Organization | null
  onSave:       (v: OrgFormValues) => Promise<void>
  onClose:      () => void
}) {
  const [saving, setSaving]           = useState(false)
  const [serverError, setServerError] = useState("")

  const defaultValues: OrgFormValues = organization ? {
    name:         organization.name,
    logo:         organization.logo,
    url:          organization.url ?? "",
    description:  organization.description ?? "",
    displayOrder: String(organization.displayOrder),
  } : EMPTY

  const { register, control, handleSubmit, formState: { errors } } =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useForm<OrgFormValues>({ resolver: yupResolver(orgSchema) as any, defaultValues })

  async function onSubmit(values: OrgFormValues) {
    setSaving(true); setServerError("")
    try { await onSave(values) }
    catch (e) { setServerError(e instanceof Error ? e.message : "Something went wrong.") }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-100 flex items-start justify-end bg-black/40">
      <div className="bg-white h-full w-full max-w-md shadow-2xl flex flex-col overflow-hidden">
        <div className="bg-[#0474C4] px-6 py-5 shrink-0 relative">
          <button type="button" onClick={onClose} className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/20 text-white uppercase tracking-wider mb-2">
            {organization ? "Edit Organization" : "New Organization"}
          </span>
          <h2 className="text-[18px] font-extrabold text-white leading-tight">
            {organization ? organization.name : "Create Organization"}
          </h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {serverError && <p className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{serverError}</p>}

          <Field label="Logo" required>
            <Controller name="logo" control={control} render={({ field }) => <LogoUpload value={field.value} onChange={field.onChange} />} />
            <FieldError msg={errors.logo?.message} />
          </Field>

          <Field label="Name" required>
            <input autoFocus {...register("name")} className={inputCls} placeholder="e.g. AmeriSpeak" />
            <FieldError msg={errors.name?.message} />
          </Field>

          <Field label="External URL" hint="https://… (optional)">
            <input {...register("url")} className={inputCls} placeholder="https://example.com" />
            <FieldError msg={errors.url?.message} />
          </Field>

          <Field label="Short description (optional)">
            <textarea {...register("description")} rows={3} className={inputCls} placeholder="Brief description shown on hover or detail view" />
          </Field>

          <Field label="Display order">
            <input type="number" min="0" {...register("displayOrder")} className={inputCls} placeholder="0" />
          </Field>
        </form>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#E5E2DC] bg-[#FAFAF9] shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-[10px] text-[13px] font-semibold border border-[#E5E2DC] text-[#6B6560] hover:bg-[#F5F4F1] cursor-pointer">Cancel</button>
          <button type="button" onClick={handleSubmit(onSubmit)} disabled={saving} className="px-5 py-2 rounded-[10px] text-[13px] font-semibold bg-[#0474C4] text-white hover:bg-[#06457F] disabled:opacity-50 cursor-pointer">
            {saving ? "Saving…" : organization ? "Save Changes" : "Create Organization"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

export default function AdminOrganizationsPage() {
  const [orgs, setOrgs]         = useState<Organization[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState("")
  const [drawer, setDrawer]     = useState<"create" | Organization | null>(null)
  const [toDelete, setToDelete] = useState<Organization | null>(null)
  const PAGE_SIZE               = 20
  const [page, setPage]         = useState(1)

  const fetchOrgs = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch("/api/organizations")
      const d = await r.json()
      if (r.ok) setOrgs(d.organizations ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchOrgs() }, [fetchOrgs])
  useEffect(() => { setPage(1) }, [search])

  async function handleSave(values: OrgFormValues) {
    const editing = drawer !== "create" ? drawer : null
    const payload = {
      name:         values.name,
      logo:         values.logo,
      url:          values.url || null,
      description:  values.description || null,
      displayOrder: parseInt(values.displayOrder, 10) || 0,
    }
    const res = await fetch(editing ? `/api/organizations/${editing.id}` : "/api/organizations", {
      method:  editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? "Failed to save.")
    setDrawer(null)
    await fetchOrgs()
  }

  async function handleDelete() {
    if (!toDelete) return
    const res = await fetch(`/api/organizations/${toDelete.id}`, { method: "DELETE" })
    if (!res.ok && res.status !== 204) {
      const d = await res.json().catch(() => ({}))
      alert(d.error ?? "Failed to delete.")
      return
    }
    setToDelete(null)
    await fetchOrgs()
  }

  const filtered = orgs.filter(o =>
    !search || o.name.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="px-8 py-8 max-w-350 mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[18px] font-extrabold text-[#1A1916]">Organizations</h1>
          <p className="text-[#A8A39C] text-[13px] mt-0.5">Affiliated organisations shown on the research projects page</p>
        </div>
        <button
          onClick={() => setDrawer("create")}
          className="flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[13px] font-semibold bg-[#0474C4] text-white hover:bg-[#06457F] transition-colors cursor-pointer"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Organization
        </button>
      </div>

      <div className="rounded-[14px] border border-[#E5E2DC] overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-[#E5E2DC]">
          <div className="relative w-full sm:w-64">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A39C]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search organizations…" className="w-full pl-8 pr-3 py-2 text-[13px] bg-white border border-[#E5E2DC] rounded-[10px] text-[#1A1916] outline-none placeholder:text-[#A8A39C] focus:border-[#0474C4] transition-colors" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-[#FAFAF9] border-b border-[#E5E2DC]">
                {["Logo", "Name", "URL", "Order", "Updated", ""].map(col => (
                  <th key={col} className="px-4 py-2.5 text-left text-[11px] font-bold text-[#A8A39C] tracking-[0.5px] uppercase whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-[#A8A39C]">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-[#A8A39C]">No organizations yet.</td></tr>
              ) : paginated.map(o => (
                <tr key={o.id} className="border-b border-[#F0EEE9] last:border-none hover:bg-[#FAFAF9] transition-colors">
                  <td className="px-4 py-3">
                    <div className="relative w-16 h-10 bg-white border border-[#E5E2DC] rounded-md overflow-hidden flex items-center justify-center">
                      <Image src={o.logo} alt={o.name} fill className="object-contain p-1.5" />
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-[#1A1916] whitespace-nowrap">{o.name}</td>
                  <td className="px-4 py-3 text-[#6B6560] whitespace-nowrap">
                    {o.url ? <a href={o.url} target="_blank" rel="noreferrer" className="text-[#0474C4] hover:underline">{o.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}</a> : <span className="text-[#A8A39C]">—</span>}
                  </td>
                  <td className="px-4 py-3 text-[#6B6560] whitespace-nowrap">{o.displayOrder}</td>
                  <td className="px-4 py-3 text-[#6B6560] whitespace-nowrap">{fmtDate(o.updatedAt)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setDrawer(o)} className="w-7 h-7 flex items-center justify-center rounded-[8px] border border-[#E5E2DC] text-[#6B6560] hover:border-[#0474C4] hover:text-[#0474C4] hover:bg-amber-50 cursor-pointer transition-colors">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button onClick={() => setToDelete(o)} className="w-7 h-7 flex items-center justify-center rounded-[8px] border border-red-200 bg-red-50 text-red-500 hover:border-red-400 hover:text-red-600 hover:bg-red-100 cursor-pointer transition-colors">
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
              <>Showing <span className="font-semibold text-[#6B6560]">0</span> of <span className="font-semibold text-[#6B6560]">{orgs.length}</span> organizations</>
            ) : (
              <>Showing <span className="font-semibold text-[#6B6560]">{(page - 1) * PAGE_SIZE + 1}</span>–<span className="font-semibold text-[#6B6560]">{Math.min(page * PAGE_SIZE, filtered.length)}</span> of <span className="font-semibold text-[#6B6560]">{filtered.length}</span> {filtered.length === 1 ? "organization" : "organizations"}</>
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

      {drawer !== null && (
        <OrgDrawer
          organization={drawer === "create" ? null : drawer}
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
