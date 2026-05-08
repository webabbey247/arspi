"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import { useUploadThing } from "@/lib/uploadthing-client"
import { useForm, Controller } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"

// ── Types ─────────────────────────────────────────────────────────────────────

type OfficeRegion = "AFRICA" | "AMERICAS" | "ASIA" | "EUROPE" | "OCEANIA" | "MIDDLE_EAST"

type Office = {
  id:           string
  city:         string
  country:      string
  region:       OfficeRegion
  addressLine1: string
  addressLine2: string | null
  postalCode:   string | null
  phone:        string | null
  email:        string | null
  mapUrl:       string | null
  coverImage:   string | null
  displayOrder: number
  active:       boolean
  createdAt:    string
  updatedAt:    string
}

const REGION_LABELS: Record<OfficeRegion, string> = {
  AFRICA:      "Africa",
  AMERICAS:    "Americas",
  ASIA:        "Asia",
  EUROPE:      "Europe",
  OCEANIA:     "Oceania",
  MIDDLE_EAST: "Middle East",
}

const REGION_OPTIONS: { id: OfficeRegion; label: string }[] = [
  { id: "AFRICA",      label: "Africa" },
  { id: "AMERICAS",    label: "Americas" },
  { id: "ASIA",        label: "Asia" },
  { id: "EUROPE",      label: "Europe" },
  { id: "OCEANIA",     label: "Oceania" },
  { id: "MIDDLE_EAST", label: "Middle East" },
]

type FormValues = {
  city:         string
  country:      string
  region:       OfficeRegion
  addressLine1: string
  addressLine2: string
  postalCode:   string
  phone:        string
  email:        string
  mapUrl:       string
  coverImage:   string
  displayOrder: string
  active:       boolean
}

const EMPTY: FormValues = {
  city: "", country: "", region: "AFRICA",
  addressLine1: "", addressLine2: "", postalCode: "",
  phone: "", email: "", mapUrl: "", coverImage: "",
  displayOrder: "0", active: true,
}

const officeSchema = yup.object({
  city:         yup.string().min(1, "City is required").required("City is required"),
  country:      yup.string().min(1, "Country is required").required("Country is required"),
  region:       yup.string().oneOf(["AFRICA", "AMERICAS", "ASIA", "EUROPE", "OCEANIA", "MIDDLE_EAST"]).required(),
  addressLine1: yup.string().min(1, "Address is required").required("Address is required"),
  addressLine2: yup.string(),
  postalCode:   yup.string(),
  phone:        yup.string(),
  email:        yup.string().test("email", "Must be a valid email", v => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)),
  mapUrl:       yup.string().test("url", "Must be a valid URL", v => !v || /^https?:\/\/.+/.test(v)),
  coverImage:   yup.string(),
  displayOrder: yup.string(),
  active:       yup.boolean().required(),
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

function CoverUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
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
          <Image src={value} alt="Office" fill className="object-cover" />
          <button type="button" onClick={() => onChange("")} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 cursor-pointer">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      )}
      <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className="flex items-center justify-center gap-2 w-full py-2.5 rounded-[10px] text-[13px] font-semibold border border-dashed border-[#E5E2DC] text-[#6B6560] hover:border-[#0474C4] hover:text-[#0474C4] disabled:opacity-50 transition-colors cursor-pointer">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        {uploading ? "Uploading…" : value ? "Replace cover" : "Upload cover"}
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
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

// ── Drawer ────────────────────────────────────────────────────────────────────

function OfficeDrawer({
  office, onSave, onClose,
}: {
  office:  Office | null
  onSave:  (v: FormValues) => Promise<void>
  onClose: () => void
}) {
  const [saving, setSaving]           = useState(false)
  const [serverError, setServerError] = useState("")

  const defaultValues: FormValues = office ? {
    city:         office.city,
    country:      office.country,
    region:       office.region,
    addressLine1: office.addressLine1,
    addressLine2: office.addressLine2 ?? "",
    postalCode:   office.postalCode   ?? "",
    phone:        office.phone        ?? "",
    email:        office.email        ?? "",
    mapUrl:       office.mapUrl       ?? "",
    coverImage:   office.coverImage   ?? "",
    displayOrder: String(office.displayOrder),
    active:       office.active,
  } : EMPTY

  const { register, control, handleSubmit, formState: { errors } } =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useForm<FormValues>({ resolver: yupResolver(officeSchema) as any, defaultValues })

  async function onSubmit(values: FormValues) {
    setSaving(true); setServerError("")
    try { await onSave(values) }
    catch (e) { setServerError(e instanceof Error ? e.message : "Something went wrong.") }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-100 flex items-start justify-end bg-black/40">
      <div className="bg-white h-full w-full max-w-xl shadow-2xl flex flex-col overflow-hidden">
        <div className="bg-[#0474C4] px-6 py-5 shrink-0 relative">
          <button type="button" onClick={onClose} className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/20 text-white uppercase tracking-wider mb-2">
            {office ? "Edit Office" : "New Office"}
          </span>
          <h2 className="text-[18px] font-extrabold text-white leading-tight">
            {office ? `${office.city}, ${office.country}` : "Create Office"}
          </h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {serverError && <p className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{serverError}</p>}

          <Field label="Cover image (optional)">
            <Controller name="coverImage" control={control} render={({ field }) => <CoverUpload value={field.value} onChange={field.onChange} />} />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="City" required>
              <input autoFocus {...register("city")} className={inputCls} placeholder="e.g. Lagos" />
              <FieldError msg={errors.city?.message} />
            </Field>
            <Field label="Country" required>
              <input {...register("country")} className={inputCls} placeholder="e.g. Nigeria" />
              <FieldError msg={errors.country?.message} />
            </Field>
          </div>

          <Field label="Region" required>
            <select {...register("region")} className={inputCls}>
              {REGION_OPTIONS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </Field>

          <Field label="Address line 1" required>
            <input {...register("addressLine1")} className={inputCls} placeholder="e.g. 12 Adeola Odeku Street" />
            <FieldError msg={errors.addressLine1?.message} />
          </Field>

          <Field label="Address line 2 (optional)">
            <input {...register("addressLine2")} className={inputCls} placeholder="Suite, building, etc." />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Postal code">
              <input {...register("postalCode")} className={inputCls} placeholder="e.g. 101241" />
            </Field>
            <Field label="Phone">
              <input {...register("phone")} className={inputCls} placeholder="+234 1 234 5678" />
            </Field>
          </div>

          <Field label="Email">
            <input type="email" {...register("email")} className={inputCls} placeholder="lagos@arpsinstitute.org" />
            <FieldError msg={errors.email?.message} />
          </Field>

          <Field label="Map URL" hint="Google Maps share link (optional)">
            <input {...register("mapUrl")} className={inputCls} placeholder="https://maps.google.com/…" />
            <FieldError msg={errors.mapUrl?.message} />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Display order">
              <input type="number" min="0" {...register("displayOrder")} className={inputCls} placeholder="0" />
            </Field>
            <Field label="Status">
              <div className="pt-1.5">
                <Controller
                  name="active"
                  control={control}
                  render={({ field }) => <Toggle label={field.value ? "Active" : "Hidden"} checked={!!field.value} onChange={field.onChange} />}
                />
              </div>
            </Field>
          </div>
        </form>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#E5E2DC] bg-[#FAFAF9] shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-[10px] text-[13px] font-semibold border border-[#E5E2DC] text-[#6B6560] hover:bg-[#F5F4F1] cursor-pointer">Cancel</button>
          <button type="button" onClick={handleSubmit(onSubmit)} disabled={saving} className="px-5 py-2 rounded-[10px] text-[13px] font-semibold bg-[#0474C4] text-white hover:bg-[#06457F] disabled:opacity-50 cursor-pointer">
            {saving ? "Saving…" : office ? "Save Changes" : "Create Office"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function AdminGlobalOfficesPage() {
  const [offices, setOffices]     = useState<Office[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState("")
  const [regionFilter, setRegionFilter] = useState<"All" | OfficeRegion>("All")
  const [drawer, setDrawer]       = useState<"create" | Office | null>(null)
  const [toDelete, setToDelete]   = useState<Office | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const filterRef                 = useRef<HTMLDivElement>(null)
  const PAGE_SIZE                 = 20
  const [page, setPage]           = useState(1)

  const fetchOffices = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch("/api/global-offices")
      const d = await r.json()
      if (r.ok) setOffices(d.offices ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchOffices() }, [fetchOffices])

  useEffect(() => {
    function h(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  useEffect(() => { setPage(1) }, [search, regionFilter])

  async function handleSave(values: FormValues) {
    const editing = drawer !== "create" ? drawer : null
    const payload = {
      city:         values.city,
      country:      values.country,
      region:       values.region,
      addressLine1: values.addressLine1,
      addressLine2: values.addressLine2 || null,
      postalCode:   values.postalCode   || null,
      phone:        values.phone        || null,
      email:        values.email        || null,
      mapUrl:       values.mapUrl       || null,
      coverImage:   values.coverImage   || null,
      displayOrder: parseInt(values.displayOrder, 10) || 0,
      active:       values.active,
    }
    const res = await fetch(editing ? `/api/global-offices/${editing.id}` : "/api/global-offices", {
      method:  editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? "Failed to save.")
    setDrawer(null)
    await fetchOffices()
  }

  async function handleDelete() {
    if (!toDelete) return
    const res = await fetch(`/api/global-offices/${toDelete.id}`, { method: "DELETE" })
    if (!res.ok && res.status !== 204) {
      const d = await res.json().catch(() => ({}))
      alert(d.error ?? "Failed to delete.")
      return
    }
    setToDelete(null)
    await fetchOffices()
  }

  const filtered = offices.filter(o => {
    const matchRegion = regionFilter === "All" || o.region === regionFilter
    const q = search.toLowerCase()
    return matchRegion && (
      !q ||
      o.city.toLowerCase().includes(q) ||
      o.country.toLowerCase().includes(q) ||
      (o.email ?? "").toLowerCase().includes(q)
    )
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="px-8 py-8 max-w-350 mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[18px] font-extrabold text-[#1A1916]">Global Offices</h1>
          <p className="text-[#A8A39C] text-[13px] mt-0.5">Manage international office locations shown on the contact page</p>
        </div>
        <button
          onClick={() => setDrawer("create")}
          className="flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[13px] font-semibold bg-[#0474C4] text-white hover:bg-[#06457F] transition-colors cursor-pointer"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Office
        </button>
      </div>

      <div className="rounded-[14px] border border-[#E5E2DC] overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-[#E5E2DC]">
          <div className="relative w-full sm:w-64">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A39C]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search offices…" className="w-full pl-8 pr-3 py-2 text-[13px] bg-white border border-[#E5E2DC] rounded-[10px] text-[#1A1916] outline-none placeholder:text-[#A8A39C] focus:border-[#0474C4] transition-colors" />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div ref={filterRef} className="relative">
              <button
                onClick={() => setFilterOpen(o => !o)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[13px] font-semibold border cursor-pointer transition-colors ${regionFilter !== "All" ? "bg-[#0474C4] text-white border-[#0474C4]" : "bg-white text-[#6B6560] border-[#E5E2DC] hover:border-[#0474C4] hover:text-[#0474C4]"}`}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                Region
                {regionFilter !== "All" && <span className="ml-1 bg-white text-[#0474C4] text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">{REGION_LABELS[regionFilter]}</span>}
              </button>
              {filterOpen && (
                <div className="absolute right-0 top-[calc(100%+6px)] z-20 bg-white border border-[#E5E2DC] rounded-xl shadow-lg py-1.5 min-w-44">
                  {(["All", ...Object.keys(REGION_LABELS) as OfficeRegion[]] as const).map(r => (
                    <button key={r} onClick={() => { setRegionFilter(r as typeof regionFilter); setFilterOpen(false) }}
                      className={`w-full flex items-center justify-between px-3.5 py-2 text-[13px] font-medium text-left cursor-pointer border-none transition-colors ${regionFilter === r ? "bg-[#EEF6FF] text-[#0474C4]" : "bg-transparent text-[#1A1916] hover:bg-[#F5F4F1]"}`}
                    >
                      {r === "All" ? "All Regions" : REGION_LABELS[r as OfficeRegion]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-[#FAFAF9] border-b border-[#E5E2DC]">
                {["City", "Country", "Region", "Phone", "Order", "Active", ""].map(col => (
                  <th key={col} className="px-4 py-2.5 text-left text-[11px] font-bold text-[#A8A39C] tracking-[0.5px] uppercase whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-[#A8A39C]">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-[#A8A39C]">No offices yet.</td></tr>
              ) : paginated.map(o => (
                <tr key={o.id} className="border-b border-[#F0EEE9] last:border-none hover:bg-[#FAFAF9] transition-colors">
                  <td className="px-4 py-3 font-semibold text-[#1A1916] whitespace-nowrap">{o.city}</td>
                  <td className="px-4 py-3 text-[#6B6560] whitespace-nowrap">{o.country}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#4F46E5] text-[11px] font-semibold">{REGION_LABELS[o.region]}</span>
                  </td>
                  <td className="px-4 py-3 text-[#6B6560] whitespace-nowrap">{o.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-[#6B6560] whitespace-nowrap">{o.displayOrder}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${o.active ? "bg-emerald-50 text-emerald-700" : "bg-[#F5F4F1] text-[#6B6560]"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${o.active ? "bg-emerald-500" : "bg-[#A8A39C]"}`} />
                      {o.active ? "Active" : "Hidden"}
                    </span>
                  </td>
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
              <>Showing <span className="font-semibold text-[#6B6560]">0</span> of <span className="font-semibold text-[#6B6560]">{offices.length}</span> offices</>
            ) : (
              <>Showing <span className="font-semibold text-[#6B6560]">{(page - 1) * PAGE_SIZE + 1}</span>–<span className="font-semibold text-[#6B6560]">{Math.min(page * PAGE_SIZE, filtered.length)}</span> of <span className="font-semibold text-[#6B6560]">{filtered.length}</span> {filtered.length === 1 ? "office" : "offices"}</>
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
        <OfficeDrawer
          office={drawer === "create" ? null : drawer}
          onSave={handleSave}
          onClose={() => setDrawer(null)}
        />
      )}
      {toDelete && (
        <ConfirmDialog
          message={`Delete ${toDelete.city}, ${toDelete.country}? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  )
}
