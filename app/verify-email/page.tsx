"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { CheckCircle, XCircle, Mail } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type VerifyStatus = "idle" | "verifying" | "success" | "error"

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const token        = searchParams.get("token")

  const [status,       setStatus]       = useState<VerifyStatus>(token ? "verifying" : "idle")
  const [verifyError,  setVerifyError]  = useState("")
  const [email,        setEmail]        = useState("")
  const [resendSent,   setResendSent]   = useState(false)
  const [resendError,  setResendError]  = useState("")
  const [isResending,  setIsResending]  = useState(false)

  // If a token is present in the URL, verify it on mount
  useEffect(() => {
    if (!token) return

    fetch("/api/auth/verify-email", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ token }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setStatus("success")
          setTimeout(() => router.push("/login"), 3000)
        } else {
          setStatus("error")
          setVerifyError(data.error ?? "Verification failed.")
        }
      })
      .catch(() => {
        setStatus("error")
        setVerifyError("Something went wrong. Please try again.")
      })
  }, [token, router])

  async function handleResend(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setResendError("")
    setIsResending(true)
    try {
      await fetch("/api/auth/resend-verification", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: email.trim() }),
      })
      setResendSent(true)
    } catch {
      setResendError("Something went wrong. Please try again.")
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-sky-pale px-6 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/">
            <Image
              src="/images/arps-institute-logo.webp"
              alt="ARPS Institute"
              width={148}
              height={29}
              className="h-8 w-auto"
            />
          </Link>
        </div>

        <div className="bg-white border border-[#0474C4]/15 rounded-lg p-8 shadow-sm">

          {/* ── Verifying (spinner) ── */}
          {status === "verifying" && (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full border-2 border-[#0474C4]/20 border-t-[#0474C4] animate-spin mx-auto mb-4" />
              <p className="font-body text-[0.875rem] text-slate-500">Verifying your email…</p>
            </div>
          )}

          {/* ── Success ── */}
          {status === "success" && (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <h1 className="font-heading text-[1.375rem] font-semibold text-[#071639] mb-2">
                Email verified
              </h1>
              <p className="font-body text-[0.875rem] text-slate-500">
                Your email has been confirmed. Redirecting you to sign in…
              </p>
            </div>
          )}

          {/* ── Token error ── */}
          {status === "error" && (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-4">
                <XCircle className="h-6 w-6 text-red-500" />
              </div>
              <h1 className="font-heading text-[1.375rem] font-semibold text-[#071639] mb-2">
                Link invalid or expired
              </h1>
              <p className="font-body text-[0.875rem] text-slate-500 mb-6">{verifyError}</p>
              <p className="font-body text-[0.8125rem] text-slate-400 mb-4">
                Enter your email below to receive a new verification link.
              </p>
              <ResendForm
                email={email}
                setEmail={setEmail}
                sent={resendSent}
                error={resendError}
                loading={isResending}
                onSubmit={handleResend}
              />
            </div>
          )}

          {/* ── Idle (post-registration / login redirect) ── */}
          {status === "idle" && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-[#EBF3FC] flex items-center justify-center shrink-0">
                  <Mail className="h-5 w-5 text-[#0474C4]" />
                </div>
                <div>
                  <h1 className="font-heading text-[1.25rem] font-semibold text-[#071639]">
                    Check your inbox
                  </h1>
                  <p className="font-body text-[0.8125rem] text-slate-500">
                    We sent a verification link to your email address.
                  </p>
                </div>
              </div>

              <p className="font-body text-[0.875rem] text-slate-600 mb-6">
                Click the link in the email to activate your account. If you don&apos;t see it,
                check your spam folder.
              </p>

              <div className="border-t border-slate-100 pt-6">
                <p className="font-body text-[0.8125rem] text-slate-500 mb-4">
                  Didn&apos;t receive it? Enter your email to resend.
                </p>
                <ResendForm
                  email={email}
                  setEmail={setEmail}
                  sent={resendSent}
                  error={resendError}
                  loading={isResending}
                  onSubmit={handleResend}
                />
              </div>
            </div>
          )}

          <p className="text-center font-body text-[0.75rem] text-slate-400 mt-6">
            <Link href="/login" className="text-[#0474C4] hover:text-[#06457F] transition-colors font-medium">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function ResendForm({
  email, setEmail, sent, error, loading, onSubmit,
}: {
  email: string
  setEmail: (v: string) => void
  sent: boolean
  error: string
  loading: boolean
  onSubmit: (e: React.FormEvent) => void
}) {
  if (sent) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-sm px-4 py-3 font-body text-[0.875rem] text-emerald-700">
        ✓ Verification email sent — check your inbox.
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <Input
        type="email"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="font-body text-[0.875rem] bg-sky-light border border-[#0474C4]/25 rounded-sm px-3 py-2 text-ink outline-none focus:border-[#0474C4] placeholder:text-slate-400"
      />
      {error && <p className="font-body text-[0.6875rem] text-red-500">{error}</p>}
      <Button
        type="submit"
        disabled={loading}
        className="h-12 rounded-[32px] py-2.5 px-5 font-body text-[0.875rem] tracking-[0.02em] font-medium text-[#EBF3FC] bg-[#0474C4] hover:bg-[#06457f] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Sending…" : "Resend verification email"}
      </Button>
    </form>
  )
}
