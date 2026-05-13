"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { useForm, Controller, type Resolver } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import { Check, X, ShieldCheck, GraduationCap, User as UserIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useUploadThing } from "@/lib/uploadthing-client"
import type { AccountProfile } from "@/services/profile.service"

type Role = "ADMIN" | "INSTRUCTOR" | "USER"

const ROLE_LABELS: Record<Role, string> = {
  ADMIN:      "Admin",
  INSTRUCTOR: "Instructor",
  USER:       "Student",
}

const ROLE_COLORS: Record<Role, string> = {
  ADMIN:      "bg-blue-50 text-blue-700",
  INSTRUCTOR: "bg-purple-50 text-purple-700",
  USER:       "bg-[#F5F4F1] text-[#6B6560]",
}

const ROLE_ICONS: Record<Role, React.ReactNode> = {
  ADMIN:      <ShieldCheck className="w-3 h-3" />,
  INSTRUCTOR: <GraduationCap className="w-3 h-3" />,
  USER:       <UserIcon className="w-3 h-3" />,
}

// ── Shared input classes ──────────────────────────────────────────────────────

const inputCls =
  "w-full px-3 py-2.5 rounded-[10px] border border-[#E5E2DC] text-[13px] text-[#1A1916] bg-white " +
  "focus:outline-none focus:ring-2 focus:ring-[#0474C4]/20 focus:border-[#0474C4] transition-colors " +
  "placeholder:text-[#A8A39C] disabled:bg-[#F5F4F1] disabled:text-[#A8A39C] " +
  "read-only:bg-[#F5F4F1] read-only:text-[#A8A39C] read-only:cursor-not-allowed read-only:focus:ring-0 read-only:focus:border-[#E5E2DC]"
const labelCls = "block text-[11px] font-semibold text-[#6B6560] mb-1.5 uppercase tracking-[0.5px]"

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

const TABS: { id: Tab; label: string }[] = [
  { id: "profile",  label: "Profile" },
  { id: "contact",  label: "Contact Information" },
  { id: "password", label: "Change Password" },
  { id: "config",   label: "Configuration" },
  { id: "billings", label: "Billings" },
]

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
    const resp = await fetch("/api/auth/logout")
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

  const initials = profile
    ? (profile.firstName || profile.lastName)
      ? [profile.firstName, profile.lastName].filter(Boolean).map(s => s![0]?.toUpperCase()).join("")
      : profile.email[0]?.toUpperCase()
    : "?"

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-3xl mx-auto">

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
      <div className="mb-6">
        <h1 className="text-[18px] font-extrabold text-[#1A1916]">Settings</h1>
        <p className="text-[#A8A39C] text-[13px] mt-0.5">Manage your profile, security and account preferences</p>
      </div>

      {/* Identity header */}
      <section className="rounded-[14px] border border-[#E5E2DC] bg-white px-4 sm:px-5 py-4 mb-6 flex items-center gap-3 sm:gap-4 flex-wrap">
        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border border-[#E5E2DC] bg-[#F5F4F1] shrink-0">
          {avatar ? (
            <Image src={avatar} alt="Avatar" fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-heading text-[1.125rem] font-semibold text-[#0474C4]">
              {initials}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[15px] text-[#1A1916] truncate">
            {profile
              ? [profile.firstName, profile.lastName].filter(Boolean).join(" ") || profile.email.split("@")[0]
              : "—"}
          </p>
          <p className="text-[12px] text-[#A8A39C] truncate">{profile?.email ?? ""}</p>
        </div>
        <span className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold shrink-0",
          ROLE_COLORS[role],
        )}>
          {ROLE_ICONS[role]}
          {ROLE_LABELS[role]}
        </span>
      </section>

      {/* Tabs section */}
      <section className="rounded-[14px] border border-[#E5E2DC] bg-white overflow-hidden mb-6">
        <div className="border-b border-[#E5E2DC] bg-[#FAFAF9] overflow-x-auto">
          <div className="flex gap-1 px-2 sm:px-3 pt-2 min-w-fit">
            {TABS.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={cn(
                  "shrink-0 whitespace-nowrap px-4 py-2.5 text-[13px] font-semibold border-b-2 -mb-px transition-colors cursor-pointer",
                  activeTab === t.id
                    ? "border-[#0474C4] text-[#0474C4]"
                    : "border-transparent text-[#6B6560] hover:text-[#1A1916]",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 sm:p-5">

          {activeTab === "profile" && (
            <div className="space-y-5">
              {/* Avatar */}
              <div className="flex items-center gap-4 flex-wrap pb-4 border-b border-[#F0EEE9]">
                <div className="relative w-20 h-20 rounded-full overflow-hidden border border-[#E5E2DC] bg-[#F5F4F1] shrink-0">
                  {avatar ? (
                    <Image src={avatar} alt="Avatar" fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-heading text-[1.25rem] font-semibold text-[#0474C4]">
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
                      className="px-3 py-1.5 rounded-[10px] text-[12px] font-semibold bg-[#0474C4] text-white hover:bg-[#06457F] disabled:opacity-50 cursor-pointer transition-colors"
                    >
                      {uploading ? "Uploading…" : avatar ? "Replace photo" : "Upload photo"}
                    </button>
                    {avatar && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="px-3 py-1.5 rounded-[10px] text-[12px] font-semibold border border-[#E5E2DC] text-[#6B6560] hover:border-red-300 hover:text-red-600 cursor-pointer transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-[#A8A39C]">JPG, PNG or WEBP. Max 4 MB.</p>
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
                        className="px-2 py-2.5 rounded-l-[10px] border border-r-0 border-[#E5E2DC] text-[13px] text-[#1A1916] bg-[#FAFAF9] focus:outline-none focus:ring-2 focus:ring-[#0474C4]/20 focus:border-[#0474C4] transition-colors disabled:opacity-50 cursor-pointer"
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
                    className="px-4 py-2 rounded-[10px] text-[13px] font-semibold bg-[#0474C4] text-white hover:bg-[#06457F] disabled:opacity-50 cursor-pointer transition-colors"
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
                  <h3 className="font-semibold text-[13px] text-[#1A1916]">Change password</h3>
                  <p className="text-[12px] text-[#A8A39C] mt-0.5">Use at least 8 characters with an uppercase letter and a number.</p>
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
                    className="px-4 py-2 rounded-[10px] text-[13px] font-semibold bg-[#0474C4] text-white hover:bg-[#06457F] disabled:opacity-50 cursor-pointer transition-colors"
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
                  className="px-4 py-2 rounded-[10px] text-[13px] font-semibold bg-[#0474C4] text-white hover:bg-[#06457F] disabled:opacity-50 cursor-pointer transition-colors"
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

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#F0EEE9]">
                <div className="min-w-0">
                  <p className="font-semibold text-[13px] text-[#1A1916]">Email notifications</p>
                  <p className="text-[12px] text-[#A8A39C] mt-0.5">Receive product updates, course announcements and research highlights.</p>
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
                        field.value ? "bg-[#0474C4]" : "bg-[#E5E2DC]",
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
                  className="px-4 py-2 rounded-[10px] text-[13px] font-semibold bg-[#0474C4] text-white hover:bg-[#06457F] disabled:opacity-50 cursor-pointer transition-colors"
                >
                  {configForm.formState.isSubmitting ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          )}

          {activeTab === "billings" && (
            <div className="flex flex-col items-center text-center py-10 px-4">
              <div className="w-14 h-14 rounded-full bg-[#F5F4F1] flex items-center justify-center mb-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#A8A39C" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="6" width="20" height="14" rx="2"/>
                  <line x1="2" y1="10" x2="22" y2="10"/>
                  <line x1="6" y1="15" x2="10" y2="15"/>
                </svg>
              </div>
              <h3 className="font-heading text-[14px] font-semibold text-[#1A1916]">No billing on file</h3>
              <p className="text-[12px] text-[#A8A39C] mt-1 max-w-sm">
                When you purchase a program or workshop, your receipts and payment methods will appear here.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Danger zone */}
      <section className="rounded-[14px] border border-red-200 bg-white overflow-hidden">
        <header className="px-4 sm:px-5 py-4 border-b border-red-100 bg-red-50/60">
          <h2 className="font-heading text-[14px] font-semibold text-red-700">Danger zone</h2>
          <p className="text-[12px] text-red-500/80 mt-0.5">Sensitive actions that affect access to your account.</p>
        </header>

        <div className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[#F0EEE9]">
            <div className="min-w-0">
              <p className="font-semibold text-[13px] text-[#1A1916]">Sign out</p>
              <p className="text-[12px] text-[#A8A39C] mt-0.5">End the current session and return to the login page.</p>
            </div>
            <button
              type="button"
              onClick={handleSignOutAll}
              className="self-start sm:self-auto px-4 py-2 rounded-[10px] text-[13px] font-semibold border border-[#E5E2DC] text-[#6B6560] hover:border-[#0474C4] hover:text-[#0474C4] cursor-pointer transition-colors"
            >
              Sign out
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-[13px] text-[#1A1916]">Delete account</p>
              <p className="text-[12px] text-[#A8A39C] mt-0.5">Disables your account immediately. Contact support to restore access.</p>
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

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-200 flex items-center justify-center bg-black/50 backdrop-blur-[2px] px-4"
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
                className="w-full px-4 py-2 text-[13px] font-medium text-[#6B6560] hover:text-[#1A1916] cursor-pointer"
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
