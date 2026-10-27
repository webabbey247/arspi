"use client"

import { useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { CheckCircle } from "lucide-react"
import Link from "next/link"
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
    <div className="min-h-screen flex items-center justify-center bg-[#F5F6FB] px-4 sm:px-6 py-12">
      <div className="w-full max-w-130">
        {/* Brand */}
        <Link href="/" className="flex items-center justify-center gap-3 no-underline mb-8">
          <span className="grid place-items-center w-[42px] h-[42px] rounded-[12px] bg-[linear-gradient(145deg,#2C2368,#6655DF)] text-white text-[15px] font-extrabold">
            AI
          </span>
          <b className="text-[19px] leading-[1.1] text-[#171C35]">ARPS Institute</b>
        </Link>

        <div className="bg-white border border-[#DFE2ED] rounded-[16px] p-6 sm:p-9">
          {done ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <h1 className="text-[28px] tracking-[-0.035em] font-extrabold text-[#171C35] mb-2">
                Password updated
              </h1>
              <p className="text-[15px] text-[#69708A]">
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
