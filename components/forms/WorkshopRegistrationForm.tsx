"use client"

import { useState } from "react"
import { useForm, type Resolver } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import { ChevronRight, Loader2, AlertCircle, X } from "lucide-react"
import { toast } from "sonner"
import * as yup from "yup"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const schema = yup.object({
  firstName:    yup.string().min(2, "At least 2 characters").required("Required").trim(),
  lastName:     yup.string().min(2, "At least 2 characters").required("Required").trim(),
  email:        yup.string().email("Invalid email").required("Required").lowercase().trim(),
  organisation: yup.string().trim().optional(),
})

type FormInput = yup.InferType<typeof schema>

type CheckResult =
  | { status: "none" }
  | { status: "confirmed" }
  | { status: "pending"; invoiceId: string; paymentDate: string }

function fmtPaymentDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso))
}

type ModalEvent = {
  id:    string
  title: string
  date:  string
  time:  string
  fee:   number
}

type Props = {
  modalEvent:   ModalEvent
  setModalOpen: (open: boolean) => void
}

export default function WorkshopRegistrationForm({ modalEvent, setModalOpen }: Props) {
  const isPaid = modalEvent.fee > 0

  const [alreadyRegistered, setAlreadyRegistered] = useState<"free-confirmed" | "paid-confirmed" | null>(null)
  const [pendingInfo, setPendingInfo]   = useState<{ invoiceId: string; paymentDate: string } | null>(null)
  const [redirecting, setRedirecting]   = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormInput>({
    resolver: yupResolver(schema) as Resolver<FormInput>,
  })

  function close() {
    setModalOpen(false)
  }

  async function checkRegistration(email: string): Promise<CheckResult | null> {
    try {
      const res = await fetch(
        `/api/workshop/check-registration?email=${encodeURIComponent(email)}&workshopId=${encodeURIComponent(modalEvent.id)}`
      )
      if (!res.ok) return null
      return (await res.json()) as CheckResult
    } catch {
      return null
    }
  }

  async function proceedToCheckout(data: FormInput) {
    const res = await fetch(`/api/workshops/${modalEvent.id}/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: data.firstName,
        lastName:  data.lastName,
        email:     data.email,
        organisation: data.organisation,
      }),
    })
    const json = await res.json()
    if (!res.ok) {
      toast.error(json.error ?? "Something went wrong.")
      return
    }
    if (typeof json.url === "string" && json.url.length > 0) {
      setRedirecting(true)
      window.location.assign(json.url)
      return
    }
    toast.error("Could not start checkout. Please try again.")
  }

  async function onSubmit(data: FormInput) {
    try {
      const check = await checkRegistration(data.email)
      if (check) {
        if (check.status === "confirmed") {
          setAlreadyRegistered(isPaid ? "paid-confirmed" : "free-confirmed")
          return
        }
        if (check.status === "pending" && isPaid) {
          setPendingInfo({ invoiceId: check.invoiceId, paymentDate: check.paymentDate })
          return
        }
      }

      if (isPaid) {
        await proceedToCheckout(data)
      } else {
        const res = await fetch("/api/workshop/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName:     data.firstName,
            lastName:      data.lastName,
            email:         data.email,
            organisation:  data.organisation,
            workshopId:    modalEvent.id,
            workshopTitle: modalEvent.title,
            workshopDate:  modalEvent.date,
            workshopTime:  modalEvent.time,
            fee:           modalEvent.fee,
          }),
        })
        const json = await res.json()
        if (!res.ok) {
          toast.error(json.error ?? "Something went wrong.")
          return
        }
        toast.success(json.message ?? "You're registered!")
        reset()
        setModalOpen(false)
      }
    } catch {
      toast.error("Network error. Please try again.")
    }
  }

  return (
    <div
      className="fixed inset-0 bg-[#181C2C]/70 z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={close}
    >
      <div
        className="bg-white rounded-lg w-full max-w-lg shadow-2xl overflow-hidden my-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#0474C4] px-6 py-5 flex items-start justify-between gap-4">
          <div>
            <p className="font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium text-white/65 mb-1">
              {isPaid ? "Enrol" : "Register"}
            </p>
            <h2 className="font-heading text-[1.125rem] tracking-[-0.005em] leading-tight font-semibold text-white">
              {modalEvent.title}
            </h2>
            <p className="font-body text-[0.75rem] text-white/70 mt-1">
              {modalEvent.date} · {modalEvent.time}
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            className="text-white/50 hover:text-white bg-white/10 hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition-colors shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {alreadyRegistered ? (
            <div className="border border-amber-300/50 rounded-md p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-body text-[0.9375rem] font-semibold text-ink mb-1">
                    You&apos;re already registered
                  </p>
                  <p className="font-body text-[0.8125rem] text-slate-600">
                    {alreadyRegistered === "paid-confirmed"
                      ? "Your seat is confirmed and your payment is complete."
                      : "We'll send you a reminder before the event."}
                  </p>
                  <button
                    type="button"
                    onClick={() => setAlreadyRegistered(null)}
                    className="font-body text-[0.75rem] tracking-[0.05em] uppercase font-medium text-[#0474C4] hover:text-[#06457f] mt-3"
                  >
                    Use a different email
                  </button>
                </div>
              </div>
            </div>
          ) : pendingInfo ? (
            <div className="border border-amber-300/50 rounded-md p-4 space-y-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-body text-[0.9375rem] font-semibold text-ink mb-1">Payment pending</p>
                  <p className="font-body text-[0.8125rem] text-slate-600">
                    You started a registration on {fmtPaymentDate(pendingInfo.paymentDate)} — reference{" "}
                    <span className="font-mono text-[0.75rem]">{pendingInfo.invoiceId}</span>.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  className="h-10 rounded px-4 font-body text-[0.8125rem] font-medium bg-[#0474C4] text-white hover:bg-[#06457f]"
                  onClick={async () => {
                    const data = getValues()
                    setPendingInfo(null)
                    await proceedToCheckout(data)
                  }}
                >
                  Resume payment
                </Button>
                <button
                  type="button"
                  onClick={() => setPendingInfo(null)}
                  className="font-body text-[0.75rem] tracking-[0.05em] uppercase font-medium text-slate-500 hover:text-ink"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <Input {...register("firstName")} placeholder="First name" className="font-body text-[0.875rem]" />
                  {errors.firstName && <p className="font-body text-[0.6875rem] text-red-500 mt-1">{errors.firstName.message}</p>}
                </div>
                <div>
                  <Input {...register("lastName")} placeholder="Last name" className="font-body text-[0.875rem]" />
                  {errors.lastName && <p className="font-body text-[0.6875rem] text-red-500 mt-1">{errors.lastName.message}</p>}
                </div>
              </div>

              <div>
                <Input type="email" {...register("email")} placeholder="Email address" className="font-body text-[0.875rem]" />
                {errors.email && <p className="font-body text-[0.6875rem] text-red-500 mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <Input {...register("organisation")} placeholder="Organisation (optional)" className="font-body text-[0.875rem]" />
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <div className="flex flex-col">
                  <span className="font-body text-[0.6875rem] tracking-[0.06em] uppercase font-medium text-slate-400">
                    Fee
                  </span>
                  <span className={`font-heading text-[1.25rem] font-semibold tracking-[-0.005em] ${isPaid ? "text-[#0474C4]" : "text-emerald-600"}`}>
                    {isPaid ? `$${modalEvent.fee}` : "Free"}
                  </span>
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting || redirecting}
                  className={`h-12 rounded py-2.5 px-6 font-body text-[0.875rem] tracking-[0.02em] font-medium text-white ${
                    isPaid ? "bg-[#0474C4] hover:bg-[#06457f]" : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  {redirecting ? (<><Loader2 className="h-4 w-4 animate-spin" /> Redirecting…</>)
                  : isSubmitting ? (<><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>)
                  : (<>{isPaid ? "Continue to checkout" : "Register Free"} <ChevronRight className="h-4 w-4" /></>)}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
