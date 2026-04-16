"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { SubscriptionStatus } from "@/services/subscription.service"

type SubscriberRow = {
  id: string
  email: string
  status: SubscriptionStatus
  subscribedAt: string
  unsubscribedAt: string | null
}

const STATUS_COLORS: Record<SubscriptionStatus, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700",
  UNSUBSCRIBED: "bg-slate-100 text-slate-600",
}

function fmtDate(iso: string | null) {
  if (!iso) return "-"
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  })
}

function FilterDropdown({
  value,
  onChange,
}: {
  value: SubscriptionStatus | "ALL"
  onChange: (value: SubscriptionStatus | "ALL") => void
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

  const activeLabel = value === "ALL" ? "All" : value === "ACTIVE" ? "Active" : "Unsubscribed"

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
        Status
        {value !== "ALL" && (
          <span className="ml-1 bg-white text-[#0474C4] text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
            {activeLabel}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-20 bg-white border border-[#E5E2DC] rounded-xl shadow-lg py-1.5 min-w-36">
          {[
            { value: "ALL", label: "All" },
            { value: "ACTIVE", label: "Active" },
            { value: "UNSUBSCRIBED", label: "Unsubscribed" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value as SubscriptionStatus | "ALL")
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

export default function AdminSubscribersPage() {
  const [subscribers, setSubscribers] = useState<SubscriberRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | "ALL">("ALL")

  const fetchSubscribers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (statusFilter !== "ALL") params.set("status", statusFilter)

      const res = await fetch(`/api/admin/subscribers?${params.toString()}`)
      const data = await res.json().catch(() => [])
      if (res.ok) setSubscribers(Array.isArray(data) ? data : [])
      else setSubscribers([])
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  useEffect(() => {
    fetchSubscribers()
  }, [fetchSubscribers])

  return (
    <div className="px-8 py-8 max-w-350 mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[18px] font-extrabold text-[#1A1916]">Subscribers</h1>
          <p className="text-[#A8A39C] text-[13px] mt-0.5">Monitor newsletter signups and subscription status</p>
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
              placeholder="Search by email..."
              className="w-full pl-8 pr-3 py-2 text-[13px] bg-white border border-[#E5E2DC] rounded-[10px] text-[#1A1916] outline-none placeholder:text-[#A8A39C] focus:border-[#0474C4] transition-colors"
            />
          </div>
          <FilterDropdown value={statusFilter} onChange={setStatusFilter} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-[#FAFAF9] border-b border-[#E5E2DC]">
                {["Email", "Status", "Subscribed", "Unsubscribed"].map((col) => (
                  <th key={col} className="px-4 py-2.5 text-left text-[11px] font-bold text-[#A8A39C] tracking-[0.5px] uppercase whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-[#A8A39C]">Loading...</td></tr>
              ) : subscribers.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-[#A8A39C]">No subscribers found.</td></tr>
              ) : subscribers.map((subscriber) => (
                <tr key={subscriber.id} className="border-b border-[#F0EEE9] last:border-none hover:bg-[#FAFAF9] transition-colors">
                  <td className="px-4 py-3 font-semibold text-[#1A1916] whitespace-nowrap">{subscriber.email}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_COLORS[subscriber.status]}`}>
                      {subscriber.status === "ACTIVE" ? "Active" : "Unsubscribed"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#6B6560] whitespace-nowrap">{fmtDate(subscriber.subscribedAt)}</td>
                  <td className="px-4 py-3 text-[#6B6560] whitespace-nowrap">{fmtDate(subscriber.unsubscribedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-2.5 bg-[#FAFAF9] border-t border-[#E5E2DC]">
          <p className="text-[11px] text-[#A8A39C]">
            Showing <span className="font-semibold text-[#6B6560]">{subscribers.length}</span> {subscribers.length === 1 ? "subscriber" : "subscribers"}
          </p>
        </div>
      </div>
    </div>
  )
}
