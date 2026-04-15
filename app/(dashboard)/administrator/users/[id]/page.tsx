"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { useForm, type Resolver } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import { Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

// ── Types ─────────────────────────────────────────────────────────────────────

type UserRole   = "ADMIN" | "INSTRUCTOR" | "USER"
type UserStatus = "ACTIVE" | "DISABLED"

type UserDetail = {
  id:            string
  email:         string
  role:          UserRole
  status:        UserStatus
  emailVerified: boolean
  hasProfile:    boolean
  hasInterests:  boolean
  createdAt:     string
  profile: {
    firstName:     string | null
    lastName:      string | null
    avatar:        string | null
    bio:           string | null
    phone:         string | null
    country:       string | null
    jobTitle:      string | null
    organisation:  string | null
    roleType:      string | null
    interests:     string[]
    referralSource:string | null
    emailOptIn:    boolean
  } | null
  _count: {
    enrollments:       number
    lessonCompletions: number
    certificates:      number
  }
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

function fullName(profile: UserDetail["profile"], email: string) {
  if (profile?.firstName || profile?.lastName) {
    return [profile.firstName, profile.lastName].filter(Boolean).join(" ")
  }
  return email.split("@")[0]
}

function initials(profile: UserDetail["profile"], email: string) {
  return fullName(profile, email).slice(0, 2).toUpperCase()
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  })
}

// ── Password Schema ───────────────────────────────────────────────────────────

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
  email, onClose, onSave,
}: {
  email:   string
  onClose: () => void
  onSave:  (data: PasswordValues) => Promise<void>
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

        <form onSubmit={handleSubmit(onSave)} className="px-6 py-5 space-y-4">
          <p className="text-[13px] text-[#6B6760]">
            Setting a new password for <span className="font-semibold text-[#1A1916]">{email}</span>
          </p>
          <div>
            <label className={labelCls}>New Password</label>
            <input type="password" {...register("newPassword")} placeholder="Min. 8 characters" className={inputCls} autoComplete="new-password" />
            {errors.newPassword && <p className="text-[11px] text-red-500 mt-1">{errors.newPassword.message}</p>}
          </div>
          <div>
            <label className={labelCls}>Confirm Password</label>
            <input type="password" {...register("confirmPassword")} placeholder="Repeat password" className={inputCls} autoComplete="new-password" />
            {errors.confirmPassword && <p className="text-[11px] text-red-500 mt-1">{errors.confirmPassword.message}</p>}
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-[10px] border border-[#E5E2DC] text-[13px] font-semibold text-[#6B6560] hover:bg-[#F5F4F1] transition-colors cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2.5 rounded-[10px] bg-[#0474C4] text-white text-[13px] font-semibold hover:bg-[#06457F] disabled:opacity-50 transition-colors cursor-pointer">
              {isSubmitting ? "Updating…" : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── InfoRow ───────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 py-3 border-b border-[#F0EEE9] last:border-none">
      <span className="w-36 shrink-0 text-[12px] font-medium text-[#A8A39C] uppercase tracking-wide pt-0.5">
        {label}
      </span>
      <span className="text-[13px] text-[#1A1916] flex-1">{value ?? <span className="text-[#A8A39C]">—</span>}</span>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function UserDetailPage() {
  const { id }   = useParams<{ id: string }>()
  const router   = useRouter()

  const [user,      setUser]      = useState<UserDetail | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [menuOpen,  setMenuOpen]  = useState(false)
  const [pwdOpen,   setPwdOpen]   = useState(false)
  const [toast,     setToast]     = useState<{ msg: string; ok: boolean } | null>(null)

  const menuRef = useRef<HTMLDivElement>(null)

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  // Close menu on outside click
  useEffect(() => {
    function h(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  // Fetch user detail
  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/admin/users/${id}`)
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          showToast(err.error ?? `Error ${res.status}`, false)
          return
        }
        setUser(await res.json())
      } catch {
        showToast("Failed to load user", false)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  // ── Actions ───────────────────────────────────────────────────────────────

  async function changeRole(role: UserRole) {
    setMenuOpen(false)
    const res = await fetch(`/api/admin/users/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ role }),
    })
    if (res.ok) {
      setUser(prev => prev ? { ...prev, role } : prev)
      showToast(`Role updated to ${ROLE_LABELS[role]}`)
    } else {
      const err = await res.json().catch(() => ({}))
      showToast(err.error ?? "Failed to update role", false)
    }
  }

  async function toggleStatus() {
    if (!user) return
    setMenuOpen(false)
    const newStatus: UserStatus = user.status === "ACTIVE" ? "DISABLED" : "ACTIVE"
    const res = await fetch(`/api/admin/users/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      setUser(prev => prev ? { ...prev, status: newStatus } : prev)
      showToast(newStatus === "ACTIVE" ? "Account approved" : "Account disabled")
    } else {
      showToast("Failed to update status", false)
    }
  }

  async function handleSetPassword(data: PasswordValues) {
    const res = await fetch(`/api/admin/users/${id}/password`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ newPassword: data.newPassword }),
    })
    if (res.ok) {
      showToast("Password updated successfully")
      setPwdOpen(false)
    } else {
      const err = await res.json().catch(() => ({}))
      showToast(err.error ?? "Failed to update password", false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="px-8 py-8 max-w-350 mx-auto">
        <div className="h-64 flex items-center justify-center text-[#A8A39C] text-[13px]">
          Loading…
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="px-8 py-8 max-w-350 mx-auto">
        <div className="h-64 flex items-center justify-center text-[#A8A39C] text-[13px]">
          User not found.
        </div>
      </div>
    )
  }

  const name = fullName(user.profile, user.email)

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
            onClick={() => router.push("/administrator/users")}
            className="w-8 h-8 flex items-center justify-center rounded-[8px] border border-[#E5E2DC] bg-white text-[#6B6560] hover:border-[#0474C4] hover:text-[#0474C4] transition-colors cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div>
            <h1 className="text-[18px] font-extrabold text-[#1A1916]">{name}</h1>
            <p className="text-[#A8A39C] text-[13px] mt-0.5">Joined {fmtDate(user.createdAt)}</p>
          </div>
        </div>

        {/* Actions — single ⋯ menu */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="w-8 h-8 flex items-center justify-center rounded-[8px] border border-[#E5E2DC] bg-white text-[#6B6560] hover:border-[#0474C4] hover:text-[#0474C4] transition-colors cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>
            </svg>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-[calc(100%+6px)] z-20 bg-white border border-[#E5E2DC] rounded-xl shadow-lg py-1.5 w-52">

              {/* Update Role section */}
              <p className="px-3.5 pt-1 pb-1 text-[11px] font-bold text-[#A8A39C] uppercase tracking-wide">
                Update Role
              </p>
              {(["USER", "INSTRUCTOR", "ADMIN"] as UserRole[]).map(r => (
                <button
                  key={r}
                  onClick={() => changeRole(r)}
                  className={cn(
                    "w-full flex items-center justify-between px-3.5 py-2 text-[13px] font-medium text-left cursor-pointer border-none transition-colors",
                    user.role === r
                      ? "bg-[#EBF3FC] text-[#0474C4]"
                      : "bg-transparent text-[#1A1916] hover:bg-[#F5F4F1]"
                  )}
                >
                  {ROLE_LABELS[r]}
                  {user.role === r && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </button>
              ))}

              <div className="my-1.5 border-t border-[#F0EEE9]" />

              {/* Change Password */}
              <button
                onClick={() => { setMenuOpen(false); setPwdOpen(true) }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] font-medium text-left text-[#1A1916] hover:bg-[#F5F4F1] cursor-pointer border-none transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Change Password
              </button>

              <div className="my-1.5 border-t border-[#F0EEE9]" />

              {/* Approve / Disable */}
              <button
                onClick={toggleStatus}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] font-medium text-left cursor-pointer border-none transition-colors",
                  user.status === "ACTIVE"
                    ? "text-red-600 hover:bg-red-50"
                    : "text-emerald-700 hover:bg-emerald-50"
                )}
              >
                {user.status === "ACTIVE" ? (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                    </svg>
                    Disable Account
                  </>
                ) : (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Approve Account
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left — profile + onboarding */}
        <div className="col-span-1 lg:col-span-2 space-y-5">

          {/* Identity card */}
          <div className="rounded-[14px] border border-[#E5E2DC] bg-white overflow-hidden">
            <div className="px-5 py-3 border-b border-[#E5E2DC] bg-[#FAFAF9]">
              <p className="text-[11px] font-bold text-[#A8A39C] uppercase tracking-wide">Profile</p>
            </div>
            <div className="px-5 py-4 flex items-center gap-4 border-b border-[#F0EEE9]">
              {user.profile?.avatar ? (
                <Image src={user.profile.avatar} alt="" width={56} height={56} className="rounded-full object-cover shrink-0" />
              ) : (
                <div className={cn("w-14 h-14 rounded-full flex items-center justify-center text-base font-bold shrink-0", avatarColor(user.id))}>
                  {initials(user.profile, user.email)}
                </div>
              )}
              <div>
                <p className="text-[15px] font-bold text-[#1A1916]">{name}</p>
                <p className="text-[13px] text-[#A8A39C]">{user.email}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-semibold", ROLE_COLORS[user.role])}>
                    {ROLE_LABELS[user.role]}
                  </span>
                  <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-semibold", STATUS_COLORS[user.status])}>
                    {user.status === "ACTIVE" ? "Active" : "Disabled"}
                  </span>
                  {user.emailVerified && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                      Verified
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="px-5 divide-y-0">
              <InfoRow label="Job Title"    value={user.profile?.jobTitle} />
              <InfoRow label="Organisation" value={user.profile?.organisation} />
              <InfoRow label="Role Type"    value={user.profile?.roleType} />
              <InfoRow label="Country"      value={user.profile?.country} />
              <InfoRow label="Phone"        value={user.profile?.phone} />
              <InfoRow label="Bio"          value={user.profile?.bio
                ? <span className="whitespace-pre-wrap leading-relaxed">{user.profile.bio}</span>
                : null}
              />
            </div>
          </div>

          {/* Interests & onboarding */}
          <div className="rounded-[14px] border border-[#E5E2DC] bg-white overflow-hidden">
            <div className="px-5 py-3 border-b border-[#E5E2DC] bg-[#FAFAF9]">
              <p className="text-[11px] font-bold text-[#A8A39C] uppercase tracking-wide">Onboarding & Interests</p>
            </div>
            <div className="px-5">
              <InfoRow label="Profile set up"    value={
                <span className={user.hasProfile ? "text-emerald-600" : "text-amber-600"}>
                  {user.hasProfile ? "Completed" : "Incomplete"}
                </span>
              } />
              <InfoRow label="Interests set up"  value={
                <span className={user.hasInterests ? "text-emerald-600" : "text-amber-600"}>
                  {user.hasInterests ? "Completed" : "Incomplete"}
                </span>
              } />
              <InfoRow label="Referral source"   value={user.profile?.referralSource} />
              <InfoRow label="Email opt-in"      value={
                <span className={user.profile?.emailOptIn ? "text-emerald-600" : "text-[#6B6560]"}>
                  {user.profile?.emailOptIn ? "Subscribed" : "Unsubscribed"}
                </span>
              } />
              <InfoRow label="Interests" value={
                user.profile?.interests?.length
                  ? (
                    <div className="flex flex-wrap gap-1.5">
                      {user.profile.interests.map(i => (
                        <span key={i} className="px-2 py-0.5 rounded-full bg-[#EBF3FC] text-[#0474C4] text-[11px] font-semibold">
                          {i}
                        </span>
                      ))}
                    </div>
                  )
                  : null
              } />
            </div>
          </div>
        </div>

        {/* Right — account stats */}
        <div className="space-y-5">

          {/* Stats */}
          <div className="rounded-[14px] border border-[#E5E2DC] bg-white overflow-hidden">
            <div className="px-5 py-3 border-b border-[#E5E2DC] bg-[#FAFAF9]">
              <p className="text-[11px] font-bold text-[#A8A39C] uppercase tracking-wide">Activity</p>
            </div>
            <div className="p-5 space-y-4">
              {[
                { label: "Enrollments",   value: user._count.enrollments },
                { label: "Lessons Done",  value: user._count.lessonCompletions },
                { label: "Certificates",  value: user._count.certificates },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-[13px] text-[#6B6560]">{label}</span>
                  <span className="text-[15px] font-bold text-[#1A1916]">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Account */}
          <div className="rounded-[14px] border border-[#E5E2DC] bg-white overflow-hidden">
            <div className="px-5 py-3 border-b border-[#E5E2DC] bg-[#FAFAF9]">
              <p className="text-[11px] font-bold text-[#A8A39C] uppercase tracking-wide">Account</p>
            </div>
            <div className="px-5 divide-y-0">
              <InfoRow label="Email"         value={user.email} />
              <InfoRow label="Verified"      value={
                <span className={user.emailVerified ? "text-emerald-600" : "text-amber-600"}>
                  {user.emailVerified ? "Yes" : "No"}
                </span>
              } />
              <InfoRow label="Joined"        value={fmtDate(user.createdAt)} />
            </div>
          </div>

        </div>
      </div>

      {/* Password dialog */}
      {pwdOpen && (
        <SetPasswordDialog
          email={user.email}
          onClose={() => setPwdOpen(false)}
          onSave={handleSetPassword}
        />
      )}

    </div>
  )
}
