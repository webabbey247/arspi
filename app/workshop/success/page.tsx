"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Suspense } from "react"

function SuccessContent() {
  const params    = useSearchParams()
  const sessionId = params.get("session_id")

  return (
    <div className="min-h-screen bg-[#EBF3FC] flex items-center justify-center px-6">
      <div className="bg-white rounded-2xl border border-[#0474C4]/20 shadow-xl w-full max-w-md p-10 flex flex-col items-center text-center gap-6">
        <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>

        <div>
          <h1 className="font-heading text-[1.75rem] tracking-[-0.01em] font-semibold text-[#0474C4] leading-tight mb-2">
            You&apos;re registered!
          </h1>
          <p className="font-body text-[0.9375rem] text-slate-500 leading-relaxed">
            Payment confirmed. A confirmation email will be sent to you shortly
            with joining instructions and calendar details.
          </p>
        </div>

        {sessionId && (
          <p className="font-body text-[0.75rem] text-slate-400">
            Reference: <span className="font-medium text-slate-500">{sessionId.slice(-12)}</span>
          </p>
        )}

        <div className="flex flex-col gap-2 w-full pt-2">
          <Button
            asChild
            className="w-full h-11 rounded-[32px] font-body text-[0.875rem] font-medium bg-[#0474C4] hover:bg-[#06457f] text-white"
          >
            <Link href="/workshops">Browse More Events</Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            className="w-full h-11 font-body text-[0.875rem] text-slate-500 hover:text-[#0474C4]"
          >
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function WorkshopSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  )
}
