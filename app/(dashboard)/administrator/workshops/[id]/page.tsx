"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

// ── Types ─────────────────────────────────────────────────────────────────────

type WorkshopType     = "FREE" | "PAID"
type WorkshopCategory = "SHORT_COURSE" | "WEBINAR" | "MASTERCLASS" | "CONFERENCE" | "WORKSHOP"
type RegistrationStatus = "PENDING" | "CONFIRMED" | "CANCELLED"
type PaymentMethod    = "CARD" | "PAYPAL" | "BANK_TRANSFER" | null

type Workshop = {
  id:          string
  title:       string
  slug:        string
  description: string
  type:        WorkshopType
  category:    WorkshopCategory
  fee:         number
  featured:    boolean
  published:   boolean
  date:        string | null
  time:        string
  duration:    string
  facilitator: string
  capacity:    number
  registered:  number
  coverImage:  string | null
  createdAt:   string
  updatedAt:   string
  _count?: { registrations: number }
}

type Registration = {
  id:            string
  firstName:     string
  lastName:      string
  email:         string
  organisation:  string | null
  paymentMethod: PaymentMethod
  status:        RegistrationStatus
  fee:           number
  createdAt:     string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<WorkshopCategory, string> = {
  SHORT_COURSE: "Short Course",
  WEBINAR:      "Webinar",
  MASTERCLASS:  "Masterclass",
  CONFERENCE:   "Conference",
  WORKSHOP:     "Workshop",
}

const CATEGORY_COLORS: Record<WorkshopCategory, string> = {
  SHORT_COURSE: "bg-teal-50 text-teal-700",
  WEBINAR:      "bg-blue-50 text-blue-700",
  MASTERCLASS:  "bg-purple-50 text-purple-700",
  CONFERENCE:   "bg-rose-50 text-rose-700",
  WORKSHOP:     "bg-amber-50 text-amber-700",
}

const STATUS_COLORS: Record<RegistrationStatus, string> = {
  CONFIRMED: "bg-emerald-50 text-emerald-700",
  PENDING:   "bg-amber-50 text-amber-700",
  CANCELLED: "bg-red-50 text-red-600",
}

const PAYMENT_LABELS: Record<string, string> = {
  CARD:          "Card",
  PAYPAL:        "PayPal",
  BANK_TRANSFER: "Bank Transfer",
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null) {
  if (!iso) return "TBA"
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  })
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  })
}

function exportCSV(registrations: Registration[], workshopTitle: string) {
  const headers = ["First Name", "Last Name", "Email", "Organisation", "Payment Method", "Status", "Fee", "Registered At"]
  const rows = registrations.map(r => [
    r.firstName,
    r.lastName,
    r.email,
    r.organisation ?? "",
    r.paymentMethod ? PAYMENT_LABELS[r.paymentMethod] ?? r.paymentMethod : "—",
    r.status,
    r.fee.toString(),
    fmtDateTime(r.createdAt),
  ])
  const csv = [headers, ...rows].map(row => row.map(v => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n")
  const blob = new Blob([csv], { type: "text/csv" })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement("a")
  a.href     = url
  a.download = `${workshopTitle.replace(/\s+/g, "-").toLowerCase()}-registrations.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── InfoRow ───────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 py-3 border-b border-[#F0EEE9] last:border-none">
      <span className="w-32 shrink-0 text-[12px] font-medium text-[#A8A39C] uppercase tracking-wide pt-0.5">
        {label}
      </span>
      <span className="text-[13px] text-[#1A1916] flex-1">{value ?? <span className="text-[#A8A39C]">—</span>}</span>
    </div>
  )
}

// ── StatCard ──────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent }: { label: string; value: React.ReactNode; sub?: string; accent?: string }) {
  return (
    <div className="rounded-[14px] border border-[#E5E2DC] bg-white px-5 py-4 flex flex-col gap-1">
      <p className="text-[11px] font-bold text-[#A8A39C] uppercase tracking-wide">{label}</p>
      <p className={cn("text-[26px] font-extrabold leading-tight", accent ?? "text-[#1A1916]")}>{value}</p>
      {sub && <p className="text-[12px] text-[#A8A39C]">{sub}</p>}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function WorkshopDetailPage() {
  const { id }  = useParams<{ id: string }>()
  const router  = useRouter()

  const [workshop,      setWorkshop]      = useState<Workshop | null>(null)
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading,       setLoading]       = useState(true)
  const [regLoading,    setRegLoading]    = useState(true)
  const [toast,         setToast]         = useState<{ msg: string; ok: boolean } | null>(null)

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  // Fetch workshop + registrations in parallel
  useEffect(() => {
    async function loadWorkshop() {
      try {
        const res = await fetch(`/api/workshops/${id}`)
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          showToast(err.error ?? `Error ${res.status}`, false)
          return
        }
        const data = await res.json()
        setWorkshop(data.workshop)
      } catch {
        showToast("Failed to load workshop", false)
      } finally {
        setLoading(false)
      }
    }

    async function loadRegistrations() {
      try {
        const res = await fetch(`/api/workshops/${id}/registrations`)
        if (!res.ok) return
        const data = await res.json()
        setRegistrations(data.registrations ?? [])
      } catch {
        // non-critical
      } finally {
        setRegLoading(false)
      }
    }

    loadWorkshop()
    loadRegistrations()
  }, [id])

  // ── Derived analytics ───────────────────────────────────────────────────────

  const totalRegistered = registrations.length
  const confirmed       = registrations.filter(r => r.status === "CONFIRMED").length
  const pending         = registrations.filter(r => r.status === "PENDING").length
  const revenue         = registrations
    .filter(r => r.status === "CONFIRMED")
    .reduce((sum, r) => sum + r.fee, 0)

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="px-8 py-8 max-w-350 mx-auto">
        <div className="h-64 flex items-center justify-center text-[#A8A39C] text-[13px]">
          Loading…
        </div>
      </div>
    )
  }

  if (!workshop) {
    return (
      <div className="px-8 py-8 max-w-350 mx-auto">
        <div className="h-64 flex items-center justify-center text-[#A8A39C] text-[13px]">
          Workshop not found.
        </div>
      </div>
    )
  }

  const registrationCount = workshop._count?.registrations ?? totalRegistered
  const fillPct = workshop.capacity > 0
    ? Math.min(100, Math.round((registrationCount / workshop.capacity) * 100))
    : 0

  return (
    <div className="px-8 py-8 max-w-350 mx-auto space-y-5">

      {/* Toast */}
      {toast && (
        <div className={cn(
          "fixed top-4 right-4 z-100 px-4 py-3 rounded-lg shadow-lg text-[13px] font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150",
          toast.ok
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
            : "bg-red-50 text-red-600 border border-red-200"
        )}>
          {toast.ok ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
          {toast.msg}
        </div>
      )}

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/administrator/workshops")}
            className="w-8 h-8 flex items-center justify-center rounded-[8px] border border-[#E5E2DC] bg-white text-[#6B6560] hover:border-[#0474C4] hover:text-[#0474C4] transition-colors cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div>
            <h1 className="text-[18px] font-extrabold text-[#1A1916]">{workshop.title}</h1>
            <p className="text-[#A8A39C] text-[13px] mt-0.5">Created {fmtDate(workshop.createdAt)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {registrations.length > 0 && (
            <button
              onClick={() => exportCSV(registrations, workshop.title)}
              className="h-8 px-3.5 rounded-[8px] border border-[#E5E2DC] bg-white text-[#6B6560] text-[13px] font-medium hover:border-[#0474C4] hover:text-[#0474C4] transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Analytics cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Registered"
          value={totalRegistered}
          sub={`of ${workshop.capacity} capacity`}
        />
        <StatCard
          label="Revenue"
          value={workshop.fee > 0 ? `$${revenue.toLocaleString()}` : "—"}
          sub={workshop.fee > 0 ? `from ${confirmed} confirmed` : "Free workshop"}
          accent={workshop.fee > 0 ? "text-emerald-700" : undefined}
        />
        <StatCard
          label="Confirmed"
          value={confirmed}
          sub={`${totalRegistered > 0 ? Math.round((confirmed / totalRegistered) * 100) : 0}% of registrations`}
          accent="text-emerald-700"
        />
        <StatCard
          label="Pending"
          value={pending}
          sub={workshop.fee > 0 ? "Awaiting payment" : "Awaiting confirmation"}
          accent={pending > 0 ? "text-amber-600" : undefined}
        />
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left — workshop info */}
        <div className="col-span-1 lg:col-span-2 space-y-5">

          {/* Details card */}
          <div className="rounded-[14px] border border-[#E5E2DC] bg-white overflow-hidden">
            <div className="px-5 py-3 border-b border-[#E5E2DC] bg-[#FAFAF9]">
              <p className="text-[11px] font-bold text-[#A8A39C] uppercase tracking-wide">Workshop Details</p>
            </div>
            <div className="px-5">
              <InfoRow label="Title"       value={workshop.title} />
              <InfoRow label="Slug"        value={<span className="font-mono text-[12px] text-[#6B6560]">{workshop.slug}</span>} />
              <InfoRow label="Category"    value={
                <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-semibold", CATEGORY_COLORS[workshop.category])}>
                  {CATEGORY_LABELS[workshop.category]}
                </span>
              } />
              <InfoRow label="Type"        value={
                <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-semibold",
                  workshop.type === "FREE" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"
                )}>
                  {workshop.type === "FREE" ? "Free" : "Paid"}
                </span>
              } />
              <InfoRow label="Fee"         value={workshop.fee > 0 ? `$${workshop.fee}` : "Free"} />
              <InfoRow label="Date"        value={fmtDate(workshop.date)} />
              <InfoRow label="Time"        value={workshop.time || "—"} />
              <InfoRow label="Duration"    value={workshop.duration} />
              <InfoRow label="Facilitator" value={workshop.facilitator || "—"} />
              <InfoRow label="Capacity"    value={`${workshop.capacity} seats`} />
            </div>
          </div>

        
        </div>

        {/* Right — status + capacity */}
        <div className="space-y-5">

          {/* Description */}
          <div className="rounded-[14px] border border-[#E5E2DC] bg-white overflow-hidden">
            <div className="px-5 py-3 border-b border-[#E5E2DC] bg-[#FAFAF9]">
              <p className="text-[11px] font-bold text-[#A8A39C] uppercase tracking-wide">Description</p>
            </div>
            <div className="px-5 py-4">
              <p className="text-[13px] text-[#1A1916] leading-relaxed whitespace-pre-wrap">{workshop.description}</p>
            </div>
          </div>


          {/* Status card */}
          <div className="rounded-[14px] border border-[#E5E2DC] bg-white overflow-hidden">
            <div className="px-5 py-3 border-b border-[#E5E2DC] bg-[#FAFAF9]">
              <p className="text-[11px] font-bold text-[#A8A39C] uppercase tracking-wide">Status</p>
            </div>
            <div className="p-5 space-y-4">
              {[
                {
                  label: "Published",
                  value: (
                    <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-semibold",
                      workshop.published ? "bg-emerald-50 text-emerald-700" : "bg-[#F5F4F1] text-[#6B6560]"
                    )}>
                      {workshop.published ? "Published" : "Draft"}
                    </span>
                  ),
                },
                {
                  label: "Featured",
                  value: (
                    <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-semibold",
                      workshop.featured ? "bg-amber-50 text-amber-700" : "bg-[#F5F4F1] text-[#6B6560]"
                    )}>
                      {workshop.featured ? "Yes" : "No"}
                    </span>
                  ),
                },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-[13px] text-[#6B6560]">{label}</span>
                  {value}
                </div>
              ))}
            </div>
          </div>

          {/* Capacity card */}
          <div className="rounded-[14px] border border-[#E5E2DC] bg-white overflow-hidden">
            <div className="px-5 py-3 border-b border-[#E5E2DC] bg-[#FAFAF9]">
              <p className="text-[11px] font-bold text-[#A8A39C] uppercase tracking-wide">Capacity</p>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-end justify-between">
                <span className="text-[26px] font-extrabold text-[#1A1916] leading-tight">{registrationCount}</span>
                <span className="text-[13px] text-[#A8A39C] mb-1">/ {workshop.capacity}</span>
              </div>
              <div className="h-2 bg-[#F0EEE9] rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", fillPct >= 90 ? "bg-red-500" : fillPct >= 70 ? "bg-amber-500" : "bg-[#0474C4]")}
                  style={{ width: `${fillPct}%` }}
                />
              </div>
              <p className="text-[12px] text-[#A8A39C]">{fillPct}% full · {Math.max(0, workshop.capacity - registrationCount)} seats remaining</p>
            </div>
          </div>

        </div>
      </div>

      {/* Registrations table */}
      <div className="rounded-[14px] border border-[#E5E2DC] bg-white overflow-hidden">
        <div className="px-5 py-3 border-b border-[#E5E2DC] bg-[#FAFAF9] flex items-center justify-between">
          <p className="text-[11px] font-bold text-[#A8A39C] uppercase tracking-wide">
            Registrations
            {!regLoading && (
              <span className="ml-2 text-[#1A1916]">{totalRegistered}</span>
            )}
          </p>
          {!regLoading && registrations.length > 0 && (
            <button
              onClick={() => exportCSV(registrations, workshop.title)}
              className="text-[11px] font-semibold text-[#0474C4] hover:text-[#06457F] transition-colors cursor-pointer"
            >
              Export CSV
            </button>
          )}
        </div>

        {regLoading ? (
          <div className="p-8 flex items-center justify-center text-[13px] text-[#A8A39C]">
            Loading registrations…
          </div>
        ) : registrations.length === 0 ? (
          <div className="p-8 flex items-center justify-center text-[13px] text-[#A8A39C]">
            No registrations yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[#F0EEE9]">
                  {["Name", "Email", "Organisation", "Payment", "Status", "Fee", "Registered"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-[#A8A39C] uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {registrations.map((r, i) => (
                  <tr
                    key={r.id}
                    className={cn("border-b border-[#F0EEE9] last:border-none hover:bg-[#FAFAF9] transition-colors", i % 2 === 0 ? "" : "bg-[#FAFAF9]/40")}
                  >
                    <td className="px-4 py-3 font-medium text-[#1A1916] whitespace-nowrap">
                      {r.firstName} {r.lastName}
                    </td>
                    <td className="px-4 py-3 text-[#6B6560]">{r.email}</td>
                    <td className="px-4 py-3 text-[#6B6560]">{r.organisation ?? <span className="text-[#A8A39C]">—</span>}</td>
                    <td className="px-4 py-3 text-[#6B6560] whitespace-nowrap">
                      {r.paymentMethod ? PAYMENT_LABELS[r.paymentMethod] ?? r.paymentMethod : <span className="text-[#A8A39C]">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-semibold", STATUS_COLORS[r.status])}>
                        {r.status.charAt(0) + r.status.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#6B6560] whitespace-nowrap">
                      {r.fee > 0 ? `$${r.fee}` : <span className="text-emerald-700 font-medium">Free</span>}
                    </td>
                    <td className="px-4 py-3 text-[#6B6560] whitespace-nowrap">{fmtDateTime(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}
