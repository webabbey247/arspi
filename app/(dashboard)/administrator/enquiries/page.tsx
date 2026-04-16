"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { ContactStatus, ContactSubject } from "@/services/contact.service"

type EnquiryRow = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  subject: ContactSubject
  message: string
  status: ContactStatus
  createdAt: string
}

const SUBJECT_LABELS: Record<ContactSubject, string> = {
  ENQUIRY: "Enquiry",
  PROGRAMS: "Programs",
  PARTNERSHIPS: "Partnerships",
  MEDIA: "Media",
  OTHER: "Other",
}

const STATUS_COLORS: Record<ContactStatus, string> = {
  NEW: "bg-amber-50 text-amber-700",
  READ: "bg-blue-50 text-blue-700",
  REPLIED: "bg-emerald-50 text-emerald-700",
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  })
}

function fullName(row: EnquiryRow) {
  return `${row.firstName} ${row.lastName}`.trim()
}

function previewMessage(message: string) {
  return message.length > 72 ? `${message.slice(0, 72)}...` : message
}

function FilterDropdown<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T | "ALL"
  options: Array<{ value: T | "ALL"; label: string }>
  onChange: (value: T | "ALL") => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const activeLabel = options.find((option) => option.value === value)?.label ?? label

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((current) => !current)}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[13px] font-semibold border cursor-pointer transition-colors ${
          value !== "ALL"
            ? "bg-[#0474C4] text-white border-[#0474C4]"
            : "bg-white text-[#6B6560] border-[#E5E2DC] hover:border-[#0474C4] hover:text-[#0474C4]"
        }`}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
        {label}
        {value !== "ALL" && (
          <span className="ml-1 bg-white text-[#0474C4] text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
            {activeLabel}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-20 bg-white border border-[#E5E2DC] rounded-xl shadow-lg py-1.5 min-w-36">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value)
                setOpen(false)
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2 text-[13px] font-medium text-left cursor-pointer border-none transition-colors ${
                value === option.value ? "bg-[#EBF3FC] text-[#0474C4]" : "bg-transparent text-[#1A1916] hover:bg-[#F5F4F1]"
              }`}
            >
              {option.label}
              {value === option.value && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AdminEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<EnquiryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<ContactStatus | "ALL">("ALL")
  const [subjectFilter, setSubjectFilter] = useState<ContactSubject | "ALL">("ALL")

  const fetchEnquiries = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (statusFilter !== "ALL") params.set("status", statusFilter)
      if (subjectFilter !== "ALL") params.set("subject", subjectFilter)

      const res = await fetch(`/api/admin/enquiries?${params.toString()}`)
      const data = await res.json().catch(() => [])
      if (res.ok) setEnquiries(Array.isArray(data) ? data : [])
      else setEnquiries([])
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, subjectFilter])

  useEffect(() => {
    fetchEnquiries()
  }, [fetchEnquiries])

  return (
    <div className="px-8 py-8 max-w-350 mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[18px] font-extrabold text-[#1A1916]">Enquiries</h1>
          <p className="text-[#A8A39C] text-[13px] mt-0.5">Review all contact form submissions from the public website</p>
        </div>
      </div>

      <div className="rounded-[14px] border border-[#E5E2DC] overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-[#E5E2DC]">
          <div className="relative w-full">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A39C]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, email, or message..."
              className="w-full pl-8 pr-3 py-2 text-[13px] bg-white border border-[#E5E2DC] rounded-[10px] text-[#1A1916] outline-none placeholder:text-[#A8A39C] focus:border-[#0474C4] transition-colors"
            />
          </div>
          <FilterDropdown
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "ALL", label: "All" },
              { value: "NEW", label: "New" },
              { value: "READ", label: "Read" },
              { value: "REPLIED", label: "Replied" },
            ]}
          />
          <FilterDropdown
            label="Subject"
            value={subjectFilter}
            onChange={setSubjectFilter}
            options={[
              { value: "ALL", label: "All" },
              { value: "ENQUIRY", label: "Enquiry" },
              { value: "PROGRAMS", label: "Programs" },
              { value: "PARTNERSHIPS", label: "Partnerships" },
              { value: "MEDIA", label: "Media" },
              { value: "OTHER", label: "Other" },
            ]}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-[#FAFAF9] border-b border-[#E5E2DC]">
                {["Sender", "Subject", "Message", "Phone", "Status", "Received"].map((col) => (
                  <th key={col} className="px-4 py-2.5 text-left text-[11px] font-bold text-[#A8A39C] tracking-[0.5px] uppercase whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-[#A8A39C]">Loading...</td></tr>
              ) : enquiries.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-[#A8A39C]">No enquiries found.</td></tr>
              ) : enquiries.map((enquiry) => (
                <tr key={enquiry.id} className="border-b border-[#F0EEE9] last:border-none hover:bg-[#FAFAF9] transition-colors align-top">
                  <td className="px-4 py-3 min-w-56">
                    <div className="font-semibold text-[#1A1916] whitespace-nowrap">{fullName(enquiry)}</div>
                    <div className="text-[#6B6560] mt-0.5">{enquiry.email}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-full bg-[#EBF3FC] text-[#0474C4] text-[11px] font-semibold">
                      {SUBJECT_LABELS[enquiry.subject]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#6B6560] min-w-90 whitespace-normal break-words">{previewMessage(enquiry.message)}</td>
                  <td className="px-4 py-3 text-[#6B6560] whitespace-nowrap">{enquiry.phone ?? "-"}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_COLORS[enquiry.status]}`}>
                      {enquiry.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#6B6560] whitespace-nowrap">{fmtDate(enquiry.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-2.5 bg-[#FAFAF9] border-t border-[#E5E2DC]">
          <p className="text-[11px] text-[#A8A39C]">
            Showing <span className="font-semibold text-[#6B6560]">{enquiries.length}</span> {enquiries.length === 1 ? "enquiry" : "enquiries"}
          </p>
        </div>
      </div>
    </div>
  )
}
