"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { useForm, Controller, type Resolver } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import { Check, X, ShieldCheck, GraduationCap, User as UserIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useUploadThing } from "@/lib/uploadthing-client"
import { SettingsSkeleton } from "@/components/ui/skeleton"
import type { AccountProfile } from "@/services/profile.service"

type Role = "ADMIN" | "INSTRUCTOR" | "USER"

const ROLE_LABELS: Record<Role, string> = {
  ADMIN:      "Admin",
  INSTRUCTOR: "Instructor",
  USER:       "Student",
}


const ROLE_ICONS: Record<Role, React.ReactNode> = {
  ADMIN:      <ShieldCheck className="w-3 h-3" />,
  INSTRUCTOR: <GraduationCap className="w-3 h-3" />,
  USER:       <UserIcon className="w-3 h-3" />,
}

// ── Shared input classes ──────────────────────────────────────────────────────

const inputCls =
  "w-full px-3 py-2.5 rounded-[10px] border border-[#DFE2ED] text-[13px] text-[#171C35] bg-white " +
  "focus:outline-none focus:ring-2 focus:ring-[#6655DF]/20 focus:border-[#6655DF] transition-colors " +
  "placeholder:text-[#8A90A6] disabled:bg-[#F5F6FB] disabled:text-[#8A90A6] " +
  "read-only:bg-[#F5F6FB] read-only:text-[#8A90A6] read-only:cursor-not-allowed read-only:focus:ring-0 read-only:focus:border-[#DFE2ED]"
const labelCls = "block text-[11px] font-semibold text-[#69708A] mb-1.5 uppercase tracking-[0.5px]"

// ── Profile form ──────────────────────────────────────────────────────────────

type ProfileValues = {
  firstName:        string
  lastName:         string
  phoneCountryCode: string
  phone:            string
  country:          string
  jobTitle:         string
  organisation:     string
  bio:              string
  dateOfBirth:      string
}

const profileSchema: yup.ObjectSchema<ProfileValues> = yup.object({
  firstName:        yup.string().trim().min(2, "Min 2 characters").max(50).required("First name is required"),
  lastName:         yup.string().trim().min(2, "Min 2 characters").max(50).required("Last name is required"),
  phoneCountryCode: yup.string().trim().default("+234"),
  phone:            yup.string().trim().max(50).default(""),
  country:          yup.string().trim().max(100).default(""),
  jobTitle:         yup.string().trim().max(100).default(""),
  organisation:     yup.string().trim().max(150).default(""),
  bio:              yup.string().trim().max(500, "Max 500 characters").default(""),
  dateOfBirth:      yup.string().trim().default(""),
})

// ── Password form ─────────────────────────────────────────────────────────────

type PasswordValues = {
  currentPassword: string
  newPassword:     string
  confirmPassword: string
}

const passwordSchema: yup.ObjectSchema<PasswordValues> = yup.object({
  currentPassword: yup.string().required("Current password is required"),
  newPassword: yup
    .string()
    .min(8, "Min 8 characters")
    .matches(/[A-Z]/, "Must contain an uppercase letter")
    .matches(/[0-9]/, "Must contain a number")
    .required("New password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("newPassword")], "Passwords do not match")
    .required("Please confirm the new password"),
})

// ── Contact Information form ──────────────────────────────────────────────────

type ContactInfoValues = {
  addressLine1: string
  addressLine2: string
  city:         string
  state:        string
  postalCode:   string
}

const contactInfoSchema: yup.ObjectSchema<ContactInfoValues> = yup.object({
  addressLine1: yup.string().trim().max(150).default(""),
  addressLine2: yup.string().trim().max(150).default(""),
  city:         yup.string().trim().max(80).default(""),
  state:        yup.string().trim().max(80).default(""),
  postalCode:   yup.string().trim().max(20).default(""),
})

// ── Configuration form ────────────────────────────────────────────────────────

type ConfigValues = {
  language:   string
  timezone:   string
  emailOptIn: boolean
}

const configSchema: yup.ObjectSchema<ConfigValues> = yup.object({
  language:   yup.string().trim().default(""),
  timezone:   yup.string().trim().default(""),
  emailOptIn: yup.boolean().default(true),
})

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "fr", label: "French" },
  { value: "es", label: "Spanish" },
  { value: "pt", label: "Portuguese" },
  { value: "ar", label: "Arabic" },
]

const TIMEZONE_OPTIONS: string[] = (() => {
  try {
    return (Intl as unknown as { supportedValuesOf(key: string): string[] })
      .supportedValuesOf("timeZone")
  } catch {
    return []
  }
})()

// Country codes for phone picker. Listed longest-first so that splitPhone
// matches "+234" before it would match "+2".
const COUNTRY_CODES = [
  { code: "+971", flag: "🇦🇪", country: "United Arab Emirates" },
  { code: "+254", flag: "🇰🇪", country: "Kenya" },
  { code: "+234", flag: "🇳🇬", country: "Nigeria" },
  { code: "+233", flag: "🇬🇭", country: "Ghana" },
  { code: "+91",  flag: "🇮🇳", country: "India" },
  { code: "+86",  flag: "🇨🇳", country: "China" },
  { code: "+81",  flag: "🇯🇵", country: "Japan" },
  { code: "+61",  flag: "🇦🇺", country: "Australia" },
  { code: "+55",  flag: "🇧🇷", country: "Brazil" },
  { code: "+49",  flag: "🇩🇪", country: "Germany" },
  { code: "+44",  flag: "🇬🇧", country: "United Kingdom" },
  { code: "+34",  flag: "🇪🇸", country: "Spain" },
  { code: "+33",  flag: "🇫🇷", country: "France" },
  { code: "+27",  flag: "🇿🇦", country: "South Africa" },
  { code: "+20",  flag: "🇪🇬", country: "Egypt" },
  { code: "+1",   flag: "🇺🇸", country: "USA / Canada" },
] as const

function splitPhone(phone: string | null | undefined): { code: string; number: string } {
  const trimmed = (phone ?? "").trim()
  if (!trimmed) return { code: "+234", number: "" }
  for (const c of COUNTRY_CODES) {
    if (trimmed.startsWith(c.code)) {
      return { code: c.code, number: trimmed.slice(c.code.length).trim() }
    }
  }
  return { code: "+234", number: trimmed }
}

function combinePhone(code: string, number: string): string {
  const cleaned = number.trim()
  if (!cleaned) return ""
  return `${code} ${cleaned}`
}

type Tab = "profile" | "contact" | "password" | "config" | "billings"

const TABS: { id: Tab; label: string; hint: string; icon: React.ReactNode }[] = [
  { id: "profile",  label: "Profile",  hint: "Name, photo and bio",
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  { id: "contact",  label: "Contact",  hint: "Email, phone and address",
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16v16H4z"/><polyline points="4 7 12 13 20 7"/></svg> },
  { id: "password", label: "Security", hint: "Password and access",
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> },
  { id: "config",   label: "Preferences", hint: "How the app behaves",
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9z"/></svg> },
  { id: "billings", label: "Billing",  hint: "Payments and invoices",
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg> },
]

const dash = (v: string | number | null | undefined) =>
  v === null || v === undefined || v === "" ? "—" : String(v)

/** A titled card with an icon and a note — the unit every settings panel is
 *  built from, matching the console's Section. */
function Section({
  icon, title, note, action, children,
}: {
  icon: React.ReactNode; title: string; note?: string
  action?: React.ReactNode; children: React.ReactNode
}) {
  return (
    <section className="min-w-0 rounded-[16px] border border-[#DFE2ED] bg-white overflow-hidden">
      <div className="flex items-start gap-3 px-4 sm:px-5 py-4 border-b border-[#F0EFFA]">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-[#EEECFF] text-[#6655DF]">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[14px] font-bold text-[#171C35]">{title}</h2>
          {note && <p className="text-[12px] font-bold text-[#8A90A6] mt-0.5">{note}</p>}
        </div>
        {action}
      </div>
      <div className="px-4 sm:px-5 py-5">{children}</div>
    </section>
  )
}

/** Label-over-value, the console's Fact. */
function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] tracking-[0.12em] uppercase font-extrabold text-[#8A90A6]">{label}</dt>
      <dd className="mt-1 text-[14px] font-bold text-[#171C35] break-words">{value}</dd>
    </div>
  )
}

/** Icon chip beside a label/value, for contact details. */
function ContactTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-[12px] border border-[#DFE2ED] bg-[#FAFAFF] px-4 py-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[9px] bg-white text-[#6655DF] ring-1 ring-[#DFE2ED]">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] tracking-[0.12em] uppercase font-extrabold text-[#8A90A6]">{label}</p>
        <p className="mt-0.5 text-[14px] font-bold text-[#171C35] break-words">{value}</p>
      </div>
    </div>
  )
}

/** How much of the optional profile is filled in, as a ring. */
function CompletenessRing({ value }: { value: number }) {
  const r = 34
  const c = 2 * Math.PI * r
  return (
    <div className="flex items-center gap-3.5">
      <svg viewBox="0 0 90 90" className="h-22 w-22 shrink-0" role="img" aria-label={`Profile ${value}% complete`}>
        <circle cx="45" cy="45" r={r} fill="none" stroke="#F0EFFA" strokeWidth="9" />
        <circle
          cx="45" cy="45" r={r} fill="none" strokeWidth="9" strokeLinecap="round"
          stroke={value >= 80 ? "#0ca30c" : "#6655DF"}
          strokeDasharray={`${(c * value) / 100} ${c}`}
          transform="rotate(-90 45 45)"
        />
        <text x="45" y="50" textAnchor="middle" fontSize="17" fontWeight="800" fill="#171C35">{value}%</text>
      </svg>
      <div className="min-w-0">
        <p className="text-[14px] font-bold text-[#171C35]">Profile complete</p>
        <p className="text-[12px] font-bold text-[#8A90A6] mt-0.5">Optional details included</p>
      </div>
    </div>
  )
}

/** Animated aurora backdrop for the settings banner. CSS gradients and a slow
 *  transform rather than a GIF: no asset to ship, sharp at any size, and it
 *  honours prefers-reduced-motion for free via the motion-safe variant. */
const AURORA =
  "[background-image:radial-gradient(60%_80%_at_15%_20%,rgba(168,139,255,0.55),transparent_60%)," +
  "radial-gradient(50%_70%_at_85%_30%,rgba(97,196,255,0.45),transparent_60%)," +
  "radial-gradient(60%_90%_at_60%_100%,rgba(255,170,120,0.35),transparent_60%)]"

/** Faint dot grid, the texture most SaaS settings pages use behind a hero. */
const DOTS =
  "[background-image:radial-gradient(rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:18px_18px]"

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [profile,  setProfile]  = useState<AccountProfile | null>(null)
  const [role,     setRole]     = useState<Role>("USER")
  const [loading,  setLoading]  = useState(true)
  const [avatar,   setAvatar]   = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [toast,    setToast]    = useState<{ msg: string; ok: boolean } | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>("profile")
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const { startUpload } = useUploadThing("imageUploader")

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  // Profile form
  const profileForm = useForm<ProfileValues>({
    resolver:      yupResolver(profileSchema) as Resolver<ProfileValues>,
    defaultValues: {
      firstName: "", lastName: "", phoneCountryCode: "+234", phone: "",
      country: "", jobTitle: "", organisation: "", bio: "", dateOfBirth: "",
    },
  })

  // Password form
  const passwordForm = useForm<PasswordValues>({
    resolver: yupResolver(passwordSchema) as Resolver<PasswordValues>,
  })

  // Contact information form
  const contactInfoForm = useForm<ContactInfoValues>({
    resolver:      yupResolver(contactInfoSchema) as Resolver<ContactInfoValues>,
    defaultValues: { addressLine1: "", addressLine2: "", city: "", state: "", postalCode: "" },
  })

  // Configuration form
  const configForm = useForm<ConfigValues>({
    resolver:      yupResolver(configSchema) as Resolver<ConfigValues>,
    defaultValues: { language: "", timezone: "", emailOptIn: true },
  })

  // Load profile
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [profileRes, meRes] = await Promise.all([
          fetch("/api/account/profile"),
          fetch("/api/auth/me"),
        ])
        if (cancelled) return

        let me: { role?: Role; firstName?: string | null; lastName?: string | null; email?: string } | null = null
        if (meRes.ok) {
          me = await meRes.json()
          if (me?.role) setRole(me.role as Role)
        }

        if (profileRes.ok) {
          const data = (await profileRes.json()) as AccountProfile
          setProfile(data)
          setAvatar(data.avatar)
          const { code: phoneCode, number: phoneNumber } = splitPhone(data.phone)
          profileForm.reset({
            firstName:        data.firstName    ?? me?.firstName ?? "",
            lastName:         data.lastName     ?? me?.lastName  ?? "",
            phoneCountryCode: phoneCode,
            phone:            phoneNumber,
            country:          data.country      ?? "",
            jobTitle:         data.jobTitle     ?? "",
            organisation:     data.organisation ?? "",
            bio:              data.bio          ?? "",
            dateOfBirth:      data.dateOfBirth ? data.dateOfBirth.slice(0, 10) : "",
          })
          contactInfoForm.reset({
            addressLine1: data.addressLine1 ?? "",
            addressLine2: data.addressLine2 ?? "",
            city:         data.city         ?? "",
            state:        data.state        ?? "",
            postalCode:   data.postalCode   ?? "",
          })
          configForm.reset({
            language:   data.language ?? "",
            timezone:   data.timezone ?? "",
            emailOptIn: data.emailOptIn,
          })
        } else if (me) {
          profileForm.reset({
            firstName:        me.firstName ?? "",
            lastName:         me.lastName  ?? "",
            phoneCountryCode: "+234",
            phone:            "",
            country:          "",
            jobTitle:         "",
            organisation:     "",
            bio:              "",
            dateOfBirth:      "",
          })
          if (me.email) {
            setProfile({
              email:        me.email,
              firstName:    me.firstName ?? null,
              lastName:     me.lastName  ?? null,
              avatar:       null,
              bio:          null,
              phone:        null,
              country:      null,
              jobTitle:     null,
              organisation: null,
              addressLine1: null,
              addressLine2: null,
              city:         null,
              state:        null,
              postalCode:   null,
              dateOfBirth:  null,
              language:     null,
              timezone:     null,
              emailOptIn:   true,
            })
          }
        }
      } catch {
        showToast("Could not load your account details.", false)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [profileForm, contactInfoForm, configForm])

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const res = await startUpload([file])
      const url = res?.[0]?.url ?? null
      if (!url) {
        showToast("Upload failed. Please try a different image.", false)
        return
      }
      setAvatar(url)
      const resp = await fetch("/api/account/profile", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ avatar: url }),
      })
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}))
        showToast(err.error ?? "Could not save avatar.", false)
        return
      }
      showToast("Profile photo updated.")
    } finally {
      setUploading(false)
      if (avatarInputRef.current) avatarInputRef.current.value = ""
    }
  }

  async function handleRemoveAvatar() {
    setAvatar(null)
    const resp = await fetch("/api/account/profile", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ avatar: null }),
    })
    if (!resp.ok) {
      showToast("Could not remove avatar.", false)
      return
    }
    showToast("Profile photo removed.")
  }

  async function onSaveProfile(data: ProfileValues) {
    const combinedPhone = combinePhone(data.phoneCountryCode, data.phone)
    const payload = {
      firstName:    data.firstName,
      lastName:     data.lastName,
      phone:        combinedPhone   || null,
      country:      data.country      || null,
      jobTitle:     data.jobTitle     || null,
      organisation: data.organisation || null,
      bio:          data.bio          || null,
      dateOfBirth:  data.dateOfBirth  || null,
    }
    const resp = await fetch("/api/account/profile", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    })
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}))
      showToast(err.error ?? "Could not save profile.", false)
      return
    }
    const updated = (await resp.json()) as AccountProfile
    setProfile(updated)
    showToast("Profile saved.")
  }

  async function onSaveContactInfo(data: ContactInfoValues) {
    const payload = {
      addressLine1: data.addressLine1 || null,
      addressLine2: data.addressLine2 || null,
      city:         data.city         || null,
      state:        data.state        || null,
      postalCode:   data.postalCode   || null,
    }
    const resp = await fetch("/api/account/profile", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    })
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}))
      showToast(err.error ?? "Could not save contact information.", false)
      return
    }
    const updated = (await resp.json()) as AccountProfile
    setProfile(updated)
    showToast("Contact information saved.")
  }

  async function onSaveConfig(data: ConfigValues) {
    const payload = {
      language:   data.language || null,
      timezone:   data.timezone || null,
      emailOptIn: data.emailOptIn,
    }
    const resp = await fetch("/api/account/profile", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    })
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}))
      showToast(err.error ?? "Could not save configuration.", false)
      return
    }
    const updated = (await resp.json()) as AccountProfile
    setProfile(updated)
    showToast("Configuration saved.")
  }

  async function onChangePassword(data: PasswordValues) {
    const resp = await fetch("/api/account/password", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ currentPassword: data.currentPassword, newPassword: data.newPassword }),
    })
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}))
      showToast(err.error ?? "Could not change password.", false)
      return
    }
    passwordForm.reset({ currentPassword: "", newPassword: "", confirmPassword: "" })
    showToast("Password updated.")
  }

  async function handleSignOutAll() {
    const resp = await fetch("/api/auth/logout", { method: "POST" })
    if (resp.redirected) {
      window.location.href = resp.url
    } else {
      window.location.href = "/login"
    }
  }

  async function handleDeleteAccount() {
    const resp = await fetch("/api/account/delete", { method: "POST" })
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}))
      showToast(err.error ?? "Could not delete account.", false)
      setConfirmDelete(false)
      return
    }
    window.location.href = "/login"
  }

  const fullName = profile
    ? [profile.firstName, profile.lastName].filter(Boolean).join(" ")
    : ""

  /** Optional fields only — the ring measures how much of the record the
   *  person has chosen to fill in, not whether the account is usable. */
  const optionalFields = [
    profile?.firstName, profile?.lastName, profile?.avatar, profile?.bio,
    profile?.phone, profile?.country, profile?.jobTitle, profile?.organisation,
    profile?.addressLine1, profile?.city, profile?.timezone, profile?.language,
  ]
  const completeness = Math.round(
    (optionalFields.filter(f => f !== null && f !== undefined && f !== "").length / optionalFields.length) * 100,
  )

  const initials = profile
    ? (profile.firstName || profile.lastName)
      ? [profile.firstName, profile.lastName].filter(Boolean).map(s => s![0]?.toUpperCase()).join("")
      : profile.email[0]?.toUpperCase()
    : "?"

  if (loading) return <SettingsSkeleton />

  return (
    <div className="w-full">

      {/* Toast */}
      {toast && (
        <div className={cn(
          "fixed top-4 right-4 left-4 sm:left-auto z-100 px-4 py-3 rounded-lg shadow-lg text-[13px] font-medium flex items-center gap-2",
          toast.ok
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
            : "bg-red-50 text-red-600 border border-red-200",
        )}>
          {toast.ok ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
          {toast.msg}
        </div>
      )}

      {/* Page header */}
      <div className="px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        <div className="max-w-400 mx-auto">
          <span className="block text-[12px] tracking-[0.12em] uppercase font-extrabold text-[#6655DF] mb-1.5">Account</span>
          <h1 className="text-[clamp(28px,3.4vw,40px)] leading-[1.1] tracking-[-0.035em] font-extrabold text-[#171C35]">Settings</h1>
          <p className="text-[#69708A] text-[15px] mt-1.5 max-w-180">Your profile, contact details, security and preferences</p>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 pb-10 pt-5">
        <div className="max-w-400 mx-auto">

          {/* Identity banner — decorative strip with the avatar overlapping it,
              then the facts that identify this account. */}
          <div className="overflow-hidden rounded-[16px] border border-[#DFE2ED] bg-white">
            <div className={cn("relative h-24 overflow-hidden bg-[#0E1230]", DOTS)}>
              <div className={cn("absolute inset-0 opacity-70 blur-2xl motion-safe:animate-[pulse_9s_ease-in-out_infinite]", AURORA)} />
            </div>

            <div className="px-4 sm:px-5 pb-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex min-w-0 items-end gap-4">
                  <span className="relative z-10 -mt-8 flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[18px] bg-[#EEECFF] ring-4 ring-white">
                    {loading ? null : avatar ? (
                      <Image src={avatar} alt="Avatar" fill className="object-cover" />
                    ) : (
                      <span className="text-[20px] font-extrabold text-[#6655DF]">{initials}</span>
                    )}
                  </span>
                  <div className="min-w-0 pb-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="min-w-0 text-[20px] font-extrabold tracking-[-0.02em] text-[#171C35] break-words">
                        {loading ? "…" : fullName || profile?.email.split("@")[0] || "—"}
                      </h2>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EEECFF] text-[#6655DF] text-[11px] tracking-[0.12em] uppercase font-extrabold">
                        {ROLE_ICONS[role]}
                        {ROLE_LABELS[role]}
                      </span>
                    </div>
                    <p className="mt-1 text-[13px] font-bold text-[#8A90A6] truncate">{profile?.email ?? ""}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => { setActiveTab("profile"); avatarInputRef.current?.click() }}
                  disabled={uploading}
                  className="flex h-9 shrink-0 items-center gap-1.5 self-start rounded-[10px] border border-[#DFE2ED] bg-white px-3.5 text-[14px] font-bold text-[#171C35] hover:border-[#6655DF] hover:text-[#6655DF] disabled:opacity-50 cursor-pointer transition-colors sm:self-auto"
                >
                  {uploading ? "Uploading…" : avatar ? "Replace photo" : "Add photo"}
                </button>
              </div>

              {/* Key facts */}
              <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-[#F0EFFA] pt-4 sm:grid-cols-4">
                <Fact label="Job title"    value={dash(profile?.jobTitle)} />
                <Fact label="Organisation" value={dash(profile?.organisation)} />
                <Fact label="Country"      value={dash(profile?.country)} />
                <Fact label="Timezone"     value={dash(profile?.timezone)} />
              </dl>
            </div>
          </div>

          {/* Tabs — label over hint, the active one filled */}
          <div role="tablist" aria-label="Settings" className="mt-5 flex w-full overflow-x-auto rounded-[14px] border border-[#DFE2ED] bg-white p-1 sm:inline-flex sm:w-auto">
            {TABS.map(t => {
              const active = activeTab === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  id={`settings-tab-${t.id}`}
                  aria-selected={active}
                  aria-controls={`settings-panel-${t.id}`}
                  onClick={() => setActiveTab(t.id)}
                  className={cn(
                    "min-w-0 shrink-0 flex-1 rounded-[11px] px-3 py-2 text-left transition-colors cursor-pointer sm:flex-none sm:px-4",
                    active ? "bg-[#171C35] text-white shadow-sm" : "text-[#171C35] hover:bg-[#F5F6FB]",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span className={cn("shrink-0", active ? "text-white" : "text-[#8A90A6]")}>{t.icon}</span>
                    <span className="block text-[14px] font-bold whitespace-nowrap">{t.label}</span>
                  </span>
                  <span className={cn("mt-0.5 block text-[11px] font-bold whitespace-nowrap", active ? "text-white/60" : "text-[#8A90A6]")}>
                    {t.hint}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Active panel */}
          <div
            role="tabpanel"
            id={`settings-panel-${activeTab}`}
            aria-labelledby={`settings-tab-${activeTab}`}
            className="mt-5"
          >

          {activeTab === "profile" && (
            <div className="space-y-5">

              {/* At a glance — the record as it stands, beside the details
                  needed to reach this person. Two columns from xl, stacked
                  below it, matching the console's settings layout. */}
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
                <Section
                  icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
                  title="At a glance"
                  note="How you appear across the platform."
                  action={<CompletenessRing value={completeness} />}
                >
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
                    <Fact label="Full name"    value={dash(fullName)} />
                    <Fact label="Email"        value={profile?.email ?? "—"} />
                    <Fact label="Role"         value={ROLE_LABELS[role]} />
                    <Fact label="Job title"    value={dash(profile?.jobTitle)} />
                    <Fact label="Organisation" value={dash(profile?.organisation)} />
                    <Fact label="Language"     value={dash(profile?.language)} />
                  </dl>
                  {profile?.bio ? (
                    <blockquote className="mt-5 border-l-2 border-[#6655DF] pl-4 text-[14px] leading-relaxed text-[#69708A] italic">
                      {profile.bio}
                    </blockquote>
                  ) : null}
                </Section>

                <Section
                  icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16v16H4z"/><polyline points="4 7 12 13 20 7"/></svg>}
                  title="Reach you"
                  note="Used for receipts and account notices."
                >
                  <div className="grid gap-2.5">
                    <ContactTile
                      icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16v16H4z"/><polyline points="4 7 12 13 20 7"/></svg>}
                      label="Email" value={profile?.email ?? "—"}
                    />
                    <ContactTile
                      icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.1 9.9a16 16 0 0 0 6 6l1.26-1.26a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z"/></svg>}
                      label="Phone" value={dash(profile?.phone)}
                    />
                    <ContactTile
                      icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z"/><circle cx="12" cy="10" r="3"/></svg>}
                      label="Location"
                      value={[profile?.city, profile?.state, profile?.country].filter(Boolean).join(", ") || "—"}
                    />
                  </div>
                </Section>
              </div>

              {/* Avatar */}
              <div className="flex items-center gap-4 flex-wrap pb-4 border-b border-[#F0EFFA]">
                <div className="relative w-20 h-20 rounded-full overflow-hidden border border-[#DFE2ED] bg-[#F5F6FB] shrink-0">
                  {avatar ? (
                    <Image src={avatar} alt="Avatar" fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-heading text-[1.25rem] font-semibold text-[#6655DF]">
                      {initials}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={uploading}
                      className="px-3 py-1.5 rounded-[10px] text-[12px] font-semibold bg-[#6655DF] text-white hover:bg-[#2C2368] disabled:opacity-50 cursor-pointer transition-colors"
                    >
                      {uploading ? "Uploading…" : avatar ? "Replace photo" : "Upload photo"}
                    </button>
                    {avatar && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="px-3 py-1.5 rounded-[10px] text-[12px] font-semibold border border-[#DFE2ED] text-[#69708A] hover:border-red-300 hover:text-red-600 cursor-pointer transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-[#8A90A6]">JPG, PNG or WEBP. Max 4 MB.</p>
                  <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </div>
              </div>

              <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>First name</label>
                    <input {...profileForm.register("firstName")} className={inputCls} placeholder="Jane" readOnly />
                    {profileForm.formState.errors.firstName && (
                      <p className="text-[11px] text-red-500 mt-1">{profileForm.formState.errors.firstName.message}</p>
                    )}
                  </div>
                  <div>
                    <label className={labelCls}>Last name</label>
                    <input {...profileForm.register("lastName")} className={inputCls} placeholder="Doe" readOnly />
                    {profileForm.formState.errors.lastName && (
                      <p className="text-[11px] text-red-500 mt-1">{profileForm.formState.errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>Phone</label>
                    <div className="flex">
                      <select
                        {...profileForm.register("phoneCountryCode")}
                        disabled={loading}
                        className="px-2 py-2.5 rounded-l-[10px] border border-r-0 border-[#DFE2ED] text-[13px] text-[#171C35] bg-[#FAFAFF] focus:outline-none focus:ring-2 focus:ring-[#6655DF]/20 focus:border-[#6655DF] transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {COUNTRY_CODES.map(c => (
                          <option key={c.code} value={c.code}>
                            {c.flag} {c.code}
                          </option>
                        ))}
                      </select>
                      <input
                        {...profileForm.register("phone")}
                        className={`${inputCls} rounded-l-none min-w-0`}
                        placeholder="800 000 0000"
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Email</label>
                    <input value={profile?.email ?? ""} readOnly className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Date of birth</label>
                    <input type="date" {...profileForm.register("dateOfBirth")} className={inputCls} disabled={loading} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>Job title</label>
                    <input {...profileForm.register("jobTitle")} className={inputCls} placeholder="Senior Researcher" disabled={loading} />
                  </div>
                  <div>
                    <label className={labelCls}>Organisation</label>
                    <input {...profileForm.register("organisation")} className={inputCls} placeholder="ARPS Institute" disabled={loading} />
                  </div>
                  <div>
                    <label className={labelCls}>Country</label>
                    <input {...profileForm.register("country")} className={inputCls} placeholder="Nigeria" disabled={loading} />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Bio</label>
                  <textarea
                    {...profileForm.register("bio")}
                    className={`${inputCls} min-h-24 resize-y`}
                    placeholder="A short introduction about yourself"
                    disabled={loading}
                  />
                  {profileForm.formState.errors.bio && (
                    <p className="text-[11px] text-red-500 mt-1">{profileForm.formState.errors.bio.message}</p>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={profileForm.formState.isSubmitting || loading}
                    className="px-4 py-2 rounded-[10px] text-[13px] font-semibold bg-[#6655DF] text-white hover:bg-[#2C2368] disabled:opacity-50 cursor-pointer transition-colors"
                  >
                    {profileForm.formState.isSubmitting ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === "password" && (
            <div className="space-y-5">
              <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
                <div>
                  <h3 className="font-semibold text-[13px] text-[#171C35]">Change password</h3>
                  <p className="text-[12px] text-[#8A90A6] mt-0.5">Use at least 8 characters with an uppercase letter and a number.</p>
                </div>

                <div>
                  <label className={labelCls}>Current password</label>
                  <input
                    type="password"
                    {...passwordForm.register("currentPassword")}
                    className={inputCls}
                    autoComplete="current-password"
                  />
                  {passwordForm.formState.errors.currentPassword && (
                    <p className="text-[11px] text-red-500 mt-1">{passwordForm.formState.errors.currentPassword.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>New password</label>
                    <input
                      type="password"
                      {...passwordForm.register("newPassword")}
                      className={inputCls}
                      autoComplete="new-password"
                    />
                    {passwordForm.formState.errors.newPassword && (
                      <p className="text-[11px] text-red-500 mt-1">{passwordForm.formState.errors.newPassword.message}</p>
                    )}
                  </div>
                  <div>
                    <label className={labelCls}>Confirm new password</label>
                    <input
                      type="password"
                      {...passwordForm.register("confirmPassword")}
                      className={inputCls}
                      autoComplete="new-password"
                    />
                    {passwordForm.formState.errors.confirmPassword && (
                      <p className="text-[11px] text-red-500 mt-1">{passwordForm.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={passwordForm.formState.isSubmitting}
                    className="px-4 py-2 rounded-[10px] text-[13px] font-semibold bg-[#6655DF] text-white hover:bg-[#2C2368] disabled:opacity-50 cursor-pointer transition-colors"
                  >
                    {passwordForm.formState.isSubmitting ? "Updating…" : "Update password"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === "contact" && (
            <form onSubmit={contactInfoForm.handleSubmit(onSaveContactInfo)} className="space-y-4">
              <div>
                <label className={labelCls}>Address line 1</label>
                <input {...contactInfoForm.register("addressLine1")} className={inputCls} placeholder="123 Main Street" disabled={loading} />
              </div>
              <div>
                <label className={labelCls}>Address line 2</label>
                <input {...contactInfoForm.register("addressLine2")} className={inputCls} placeholder="Apt, suite, floor (optional)" disabled={loading} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>City</label>
                  <input {...contactInfoForm.register("city")} className={inputCls} placeholder="Lagos" disabled={loading} />
                </div>
                <div>
                  <label className={labelCls}>State / Province</label>
                  <input {...contactInfoForm.register("state")} className={inputCls} placeholder="Lagos State" disabled={loading} />
                </div>
                <div>
                  <label className={labelCls}>Postal code</label>
                  <input {...contactInfoForm.register("postalCode")} className={inputCls} placeholder="100001" disabled={loading} />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={contactInfoForm.formState.isSubmitting || loading}
                  className="px-4 py-2 rounded-[10px] text-[13px] font-semibold bg-[#6655DF] text-white hover:bg-[#2C2368] disabled:opacity-50 cursor-pointer transition-colors"
                >
                  {contactInfoForm.formState.isSubmitting ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          )}

          {activeTab === "config" && (
            <form onSubmit={configForm.handleSubmit(onSaveConfig)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Language</label>
                  <select {...configForm.register("language")} className={inputCls} disabled={loading}>
                    <option value="">Select language…</option>
                    {LANGUAGE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Timezone</label>
                  <select {...configForm.register("timezone")} className={inputCls} disabled={loading}>
                    <option value="">Auto-detect from device</option>
                    {TIMEZONE_OPTIONS.map(tz => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#F0EFFA]">
                <div className="min-w-0">
                  <p className="font-semibold text-[13px] text-[#171C35]">Email notifications</p>
                  <p className="text-[12px] text-[#8A90A6] mt-0.5">Receive product updates, course announcements and research highlights.</p>
                </div>
                <Controller
                  name="emailOptIn"
                  control={configForm.control}
                  render={({ field }) => (
                    <button
                      type="button"
                      role="switch"
                      aria-checked={field.value}
                      onClick={() => field.onChange(!field.value)}
                      disabled={loading}
                      className={cn(
                        "relative w-10 h-5 rounded-full transition-colors cursor-pointer shrink-0 disabled:opacity-50",
                        field.value ? "bg-[#6655DF]" : "bg-[#DFE2ED]",
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all",
                          field.value ? "left-5" : "left-0.5",
                        )}
                      />
                    </button>
                  )}
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={configForm.formState.isSubmitting || loading}
                  className="px-4 py-2 rounded-[10px] text-[13px] font-semibold bg-[#6655DF] text-white hover:bg-[#2C2368] disabled:opacity-50 cursor-pointer transition-colors"
                >
                  {configForm.formState.isSubmitting ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          )}

          {activeTab === "billings" && (
            <div className="flex flex-col items-center text-center py-10 px-4">
              <div className="w-14 h-14 rounded-full bg-[#F5F6FB] flex items-center justify-center mb-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8A90A6" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="6" width="20" height="14" rx="2"/>
                  <line x1="2" y1="10" x2="22" y2="10"/>
                  <line x1="6" y1="15" x2="10" y2="15"/>
                </svg>
              </div>
              <h3 className="font-heading text-[14px] font-semibold text-[#171C35]">No billing on file</h3>
              <p className="text-[12px] text-[#8A90A6] mt-1 max-w-sm">
                When you purchase a program or workshop, your receipts and payment methods will appear here.
              </p>
            </div>
          )}
          </div>

          {/* Danger zone */}
          <section className="mt-5 rounded-[16px] border border-red-200 bg-white overflow-hidden">
        <header className="px-4 sm:px-5 py-4 border-b border-red-100 bg-red-50/60">
          <h2 className="font-heading text-[14px] font-semibold text-red-700">Danger zone</h2>
          <p className="text-[12px] text-red-500/80 mt-0.5">Sensitive actions that affect access to your account.</p>
        </header>

        <div className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[#F0EFFA]">
            <div className="min-w-0">
              <p className="font-semibold text-[13px] text-[#171C35]">Sign out</p>
              <p className="text-[12px] text-[#8A90A6] mt-0.5">End the current session and return to the login page.</p>
            </div>
            <button
              type="button"
              onClick={handleSignOutAll}
              className="self-start sm:self-auto px-4 py-2 rounded-[10px] text-[13px] font-semibold border border-[#DFE2ED] text-[#69708A] hover:border-[#6655DF] hover:text-[#6655DF] cursor-pointer transition-colors"
            >
              Sign out
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-[13px] text-[#171C35]">Delete account</p>
              <p className="text-[12px] text-[#8A90A6] mt-0.5">Disables your account immediately. Contact support to restore access.</p>
            </div>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="self-start sm:self-auto px-4 py-2 rounded-[10px] text-[13px] font-semibold bg-red-600 text-white hover:bg-red-700 cursor-pointer transition-colors"
            >
              Delete account
            </button>
          </div>
            </div>
          </section>

        </div>
      </div>

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-200 flex items-center justify-center bg-[#171C35]/50 backdrop-blur-[2px] px-4"
          onClick={e => { if (e.target === e.currentTarget) setConfirmDelete(false) }}
        >
          <div className="bg-white rounded-2xl w-full max-w-sm mx-4 shadow-2xl overflow-hidden">
            <div className="bg-red-600 p-5">
              <div className="font-heading text-[1.125rem] font-medium text-white">Delete your account?</div>
              <div className="font-body text-[12px] text-white/85 mt-0.5">
                You will be signed out and your account will be disabled. You can contact support to restore access.
              </div>
            </div>
            <div className="px-5 py-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleDeleteAccount}
                className="w-full px-4 py-2.5 rounded-[10px] text-[13px] font-semibold bg-red-600 text-white hover:bg-red-700 cursor-pointer"
              >
                Yes, delete my account
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="w-full px-4 py-2 text-[13px] font-medium text-[#69708A] hover:text-[#171C35] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
