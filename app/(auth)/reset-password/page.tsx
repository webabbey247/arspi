"use client"

import { useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { CheckCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import ResetPasswordForm from "@/components/forms/ResetPasswordForm"

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const token        = searchParams.get("token") ?? ""

  const [showPw, setShowPw] = useState(false)
  const [done,   setDone]   = useState(false)

  function handleSuccess() {
    setDone(true)
    setTimeout(() => router.push("/login"), 3000)
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
          {done ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <h1 className="font-heading text-[1.375rem] font-semibold text-[#071639] mb-2">
                Password updated
              </h1>
              <p className="font-body text-[0.875rem] text-slate-500">
                Your password has been changed. Redirecting you to sign in…
              </p>
            </div>
          ) : (
            <ResetPasswordForm
              token={token}
              showPw={showPw}
              setShowPw={setShowPw}
              onSuccess={handleSuccess}
            />
          )}
        </div>
      </div>
    </div>
  )
}
