"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useForm, type Resolver } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import { Check, ShieldCheck, GraduationCap, User as UserIcon, X } from "lucide-react"
import { cn } from "@/lib/utils"

// ── Types ─────────────────────────────────────────────────────────────────────

type UserRole   = "ADMIN" | "INSTRUCTOR" | "USER"
type UserStatus = "ACTIVE" | "DISABLED"

type UserRow = {
  id:            string
  email:         string
  role:          UserRole
  status:        UserStatus
  emailVerified: boolean
  hasProfile:    boolean
  createdAt:     string
  profile: {
    firstName:    string | null
    lastName:     string | null
    avatar:       string | null
    organisation: string | null
    jobTitle:     string | null
  } | null
  _count: { enrollments: number }
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN:      "Admin",
  INSTRUCTOR: "Instructor",
  USER:       "User",
}

const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN:      "bg-blue-50 text-blue-700",
  INSTRUCTOR: "bg-purple-50 text-purple-700",
  USER:       "bg-[#F5F4F1] text-[#6B6560]",
}

const ROLE_ICONS: Record<UserRole, React.ReactNode> = {
  ADMIN:      <ShieldCheck className="w-3 h-3" />,
  INSTRUCTOR: <GraduationCap className="w-3 h-3" />,
  USER:       <UserIcon className="w-3 h-3" />,
}

const STATUS_COLORS: Record<UserStatus, string> = {
  ACTIVE:   "bg-emerald-50 text-emerald-700",
  DISABLED: "bg-red-50 text-red-600",
}

const AVATAR_PALETTE = [
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function avatarColor(id: string) {
  return AVATAR_PALETTE[id.charCodeAt(0) % AVATAR_PALETTE.length]
}

function fullName(profile: UserRow["profile"], email: string) {
  if (profile?.firstName || profile?.lastName) {
    return [profile.firstName, profile.lastName].filter(Boolean).join(" ")
  }
  return email.split("@")[0]
}

function initials(profile: UserRow["profile"], email: string) {
  return fullName(profile, email).slice(0, 2).toUpperCase()
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  })
}

function exportCSV(rows: UserRow[]) {
  const header = ["Name", "Email", "Role", "Status", "Email Verified", "Enrollments", "Joined"]
  const body   = rows.map(u => [
    fullName(u.profile, u.email),
    u.email,
    ROLE_LABELS[u.role],
    u.status === "ACTIVE" ? "Active" : "Disabled",
    u.emailVerified ? "Yes" : "No",
    String(u._count.enrollments),
    fmtDate(u.createdAt),
  ])
  const csv  = [header, ...body].map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement("a")
  a.href     = url
  a.download = `users-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Validation Schemas ────────────────────────────────────────────────────────

type PasswordValues = { newPassword: string; confirmPassword: string }

const passwordSchema = yup.object({
  newPassword: yup
    .string()
    .min(8, "At least 8 characters")
    .required("Password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("newPassword")], "Passwords do not match")
    .required("Please confirm the password"),
}) as yup.ObjectSchema<PasswordValues>

const inputCls =
  "w-full px-3 py-2.5 rounded-lg border border-[#E5E2DC] text-sm text-[#1A1916] bg-white " +
  "focus:outline-none focus:ring-2 focus:ring-[#0474C4]/30 focus:border-[#0474C4] transition-colors"

const labelCls = "block text-xs font-medium text-[#6B6760] mb-1.5 uppercase tracking-wide"

// ── SetPasswordDialog ─────────────────────────────────────────────────────────

function SetPasswordDialog({
  user, onClose, onSave,
}: {
  user: UserRow
  onClose: () => void
  onSave: (data: PasswordValues) => Promise<void>
}) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<PasswordValues>({
    resolver: yupResolver(passwordSchema) as Resolver<PasswordValues>,
  })

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/50"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-sm bg-white rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E2DC] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-[#FDF3E0] flex items-center justify-center shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0474C4" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-[#1A1916] leading-tight">Set New Password</h2>
              <p className="text-[12px] text-[#A8A39C] mt-0.5">Update the user&apos;s login password.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#F5F4F1] text-[#A8A39C] cursor-pointer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSave)} className="px-5 py-5 space-y-4">
          <p className="text-xs text-[#6B6760]">
            Setting a new password for <span className="font-medium text-[#1A1916]">{user.email}</span>
          </p>
          <div>
            <label className={labelCls}>New Password</label>
            <input type="password" {...register("newPassword")} placeholder="Min. 8 characters" className={inputCls} autoComplete="new-password" />
            {errors.newPassword && <p className="text-xs text-red-500 mt-1">{errors.newPassword.message}</p>}
          </div>
          <div>
            <label className={labelCls}>Confirm Password</label>
            <input type="password" {...register("confirmPassword")} placeholder="Repeat password" className={inputCls} autoComplete="new-password" />
            {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-[#E5E2DC] text-sm font-medium text-[#6B6760] hover:bg-[#F5F4F1] transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2.5 rounded-lg bg-[#0474C4] text-white text-sm font-medium hover:bg-[#06457F] disabled:opacity-50 transition-colors">
              {isSubmitting ? "Updating…" : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const router = useRouter()

  const [users,        setUsers]        = useState<UserRow[]>([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState("")
  const [roleFilter,   setRoleFilter]   = useState<UserRole | "ALL">("ALL")
  const [statusFilter, setStatusFilter] = useState<UserStatus | "ALL">("ALL")
  const [roleOpen,     setRoleOpen]     = useState(false)
  const [statusOpen,   setStatusOpen]   = useState(false)
  const [pwdUser,      setPwdUser]      = useState<UserRow | null>(null)
  const [toast,        setToast]        = useState<{ msg: string; ok: boolean } | null>(null)

  const roleRef   = useRef<HTMLDivElement>(null)
  const statusRef = useRef<HTMLDivElement>(null)

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  // Close dropdowns on outside click
  useEffect(() => {
    function h(e: MouseEvent) {
      if (roleRef.current   && !roleRef.current.contains(e.target as Node))   setRoleOpen(false)
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setStatusOpen(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams()
      if (roleFilter   !== "ALL") p.set("role",   roleFilter)
      if (statusFilter !== "ALL") p.set("status", statusFilter)
      if (search)                 p.set("search", search)
      const res  = await fetch(`/api/admin/users?${p}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        showToast(err.error ?? `Error ${res.status}: Failed to load users`, false)
        return
      }
      const data = await res.json()
      setUsers(Array.isArray(data) ? data : [])
    } catch {
      showToast("Network error — could not reach server", false)
    } finally {
      setLoading(false)
    }
  }, [search, roleFilter, statusFilter])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  // ── Actions ───────────────────────────────────────────────────────────────

  async function handleSetPassword(data: PasswordValues) {
    if (!pwdUser) return
    const res = await fetch(`/api/admin/users/${pwdUser.id}/password`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ newPassword: data.newPassword }),
    })
    if (res.ok) {
      showToast("Password updated successfully")
      setPwdUser(null)
    } else {
      const err = await res.json().catch(() => ({}))
      showToast(err.error ?? "Failed to update password", false)
    }
  }

  async function toggleStatus(user: UserRow) {
    const newStatus: UserStatus = user.status === "ACTIVE" ? "DISABLED" : "ACTIVE"
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      showToast(newStatus === "ACTIVE" ? "Account approved" : "Account disabled")
      fetchUsers()
    } else {
      showToast("Failed to update status", false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="px-8 py-8 max-w-350 mx-auto">

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
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[18px] font-extrabold text-[#1A1916]">Users</h1>
          <p className="text-[#A8A39C] text-[13px] mt-0.5">Manage registered accounts and access levels</p>
        </div>
      </div>

      {/* Table card */}
      <div className="rounded-[14px] border border-[#E5E2DC] overflow-hidden">

        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-[#E5E2DC]">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A39C]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search users…"
              className="w-full pl-8 pr-3 py-2 text-[13px] bg-white border border-[#E5E2DC] rounded-[10px] text-[#1A1916] outline-none placeholder:text-[#A8A39C] focus:border-[#0474C4] transition-colors"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">

            {/* Role filter */}
            <div ref={roleRef} className="relative">
              <button
                onClick={() => { setRoleOpen(o => !o); setStatusOpen(false) }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[13px] font-semibold border cursor-pointer transition-colors",
                  roleFilter !== "ALL"
                    ? "bg-[#0474C4] text-white border-[#0474C4]"
                    : "bg-white text-[#6B6560] border-[#E5E2DC] hover:border-[#0474C4] hover:text-[#0474C4]"
                )}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                </svg>
                Role
                {roleFilter !== "ALL" && (
                  <span className="ml-1 bg-white text-[#0474C4] text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                    {ROLE_LABELS[roleFilter]}
                  </span>
                )}
              </button>
              {roleOpen && (
                <div className="absolute right-0 top-[calc(100%+6px)] z-20 bg-white border border-[#E5E2DC] rounded-xl shadow-lg py-1.5 min-w-36">
                  {(["ALL", "ADMIN", "INSTRUCTOR", "USER"] as const).map(r => (
                    <button
                      key={r}
                      onClick={() => { setRoleFilter(r); setRoleOpen(false) }}
                      className={cn(
                        "w-full flex items-center justify-between px-3.5 py-2 text-[13px] font-medium text-left cursor-pointer border-none transition-colors",
                        roleFilter === r
                          ? "bg-[#EBF3FC] text-[#0474C4]"
                          : "bg-transparent text-[#1A1916] hover:bg-[#F5F4F1]"
                      )}
                    >
                      {r === "ALL" ? "All Roles" : ROLE_LABELS[r]}
                      {roleFilter === r && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Status filter */}
            <div ref={statusRef} className="relative">
              <button
                onClick={() => { setStatusOpen(o => !o); setRoleOpen(false) }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[13px] font-semibold border cursor-pointer transition-colors",
                  statusFilter !== "ALL"
                    ? "bg-[#0474C4] text-white border-[#0474C4]"
                    : "bg-white text-[#6B6560] border-[#E5E2DC] hover:border-[#0474C4] hover:text-[#0474C4]"
                )}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
                </svg>
                Status
                {statusFilter !== "ALL" && (
                  <span className="ml-1 bg-white text-[#0474C4] text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                    {statusFilter === "ACTIVE" ? "Active" : "Disabled"}
                  </span>
                )}
              </button>
              {statusOpen && (
                <div className="absolute right-0 top-[calc(100%+6px)] z-20 bg-white border border-[#E5E2DC] rounded-xl shadow-lg py-1.5 min-w-36">
                  {(["ALL", "ACTIVE", "DISABLED"] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => { setStatusFilter(s); setStatusOpen(false) }}
                      className={cn(
                        "w-full flex items-center justify-between px-3.5 py-2 text-[13px] font-medium text-left cursor-pointer border-none transition-colors",
                        statusFilter === s
                          ? "bg-[#EBF3FC] text-[#0474C4]"
                          : "bg-transparent text-[#1A1916] hover:bg-[#F5F4F1]"
                      )}
                    >
                      {s === "ALL" ? "All Status" : s === "ACTIVE" ? "Active" : "Disabled"}
                      {statusFilter === s && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Export CSV */}
            <button
              onClick={() => exportCSV(users)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[13px] font-semibold border border-[#E5E2DC] bg-white text-[#6B6560] hover:border-[#0474C4] hover:text-[#0474C4] cursor-pointer transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export CSV
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-[#FAFAF9] border-b border-[#E5E2DC]">
                {["User", "Role", "Status", "Verified", "Enrolled", "Joined", ""].map((col, i) => (
                  <th key={i} className="px-4 py-2.5 text-left text-[11px] font-bold text-[#A8A39C] tracking-[0.5px] uppercase whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-[#A8A39C] text-[13px]">
                    Loading…
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-[#A8A39C] text-[13px]">
                    No users found.
                  </td>
                </tr>
              ) : users.map(user => (
                <tr key={user.id} className="border-b border-[#F0EEE9] last:border-none hover:bg-[#FAFAF9] transition-colors">

                  {/* User */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {user.profile?.avatar ? (
                        <Image src={user.profile.avatar} alt="" width={36} height={36} className="rounded-full object-cover shrink-0" />
                      ) : (
                        <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0", avatarColor(user.id))}>
                          {initials(user.profile, user.email)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-[#1A1916] leading-tight truncate">{fullName(user.profile, user.email)}</p>
                        <p className="text-[11px] text-[#A8A39C] mt-0.5 truncate">{user.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold", ROLE_COLORS[user.role])}>
                      {ROLE_ICONS[user.role]}
                      {ROLE_LABELS[user.role]}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold", STATUS_COLORS[user.status])}>
                      {user.status === "ACTIVE" ? "Active" : "Disabled"}
                    </span>
                  </td>

                  {/* Verified */}
                  <td className="px-4 py-3">
                    <span className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold",
                      user.emailVerified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                    )}>
                      {user.emailVerified ? "Verified" : "Pending"}
                    </span>
                  </td>

                  {/* Enrollments */}
                  <td className="px-4 py-3 text-[#6B6560]">
                    {user._count.enrollments}
                  </td>

                  {/* Joined */}
                  <td className="px-4 py-3 text-[#6B6560] whitespace-nowrap">
                    {fmtDate(user.createdAt)}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => router.push(`/administrator/users/${user.id}`)}
                        title="View"
                        className="w-7 h-7 flex items-center justify-center rounded-[8px] border border-[#E5E2DC] bg-white text-[#6B6560] hover:border-[#0474C4] hover:text-[#0474C4] transition-colors cursor-pointer"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => setPwdUser(user)}
                        title="Set Password"
                        className="w-7 h-7 flex items-center justify-center rounded-[8px] border border-[#E5E2DC] bg-white text-[#6B6560] hover:border-[#0474C4] hover:text-[#0474C4] transition-colors cursor-pointer"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => toggleStatus(user)}
                        title={user.status === "ACTIVE" ? "Disable account" : "Approve account"}
                        className={cn(
                          "w-7 h-7 flex items-center justify-center rounded-[8px] border transition-colors cursor-pointer",
                          user.status === "ACTIVE"
                            ? "border-red-200 bg-red-50 text-red-500 hover:bg-red-100 hover:border-red-300"
                            : "border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:border-emerald-300"
                        )}
                      >
                        {user.status === "ACTIVE" ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                          </svg>
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#FAFAF9] border-t border-[#E5E2DC]">
          <p className="text-[11px] text-[#A8A39C]">
            Showing <span className="font-semibold text-[#6B6560]">{users.length}</span>{" "}
            {users.length === 1 ? "user" : "users"}
          </p>
          {(roleFilter !== "ALL" || statusFilter !== "ALL" || search) && (
            <button
              onClick={() => { setSearch(""); setRoleFilter("ALL"); setStatusFilter("ALL") }}
              className="text-[11px] text-[#0474C4] font-semibold hover:underline cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Password dialog */}
      {pwdUser && (
        <SetPasswordDialog
          user={pwdUser}
          onClose={() => setPwdUser(null)}
          onSave={handleSetPassword}
        />
      )}

    </div>
  )
}
