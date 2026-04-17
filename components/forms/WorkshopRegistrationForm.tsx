"use client"

import { useForm, type Resolver } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import { ChevronRight, Loader2, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import * as yup from "yup"

// Free-only schema — no paymentMethod field needed
const freeSchema = yup.object({
  firstName:    yup.string().min(2, "At least 2 characters").required("Required").trim(),
  lastName:     yup.string().min(2, "At least 2 characters").required("Required").trim(),
  email:        yup.string().email("Invalid email").required("Required").lowercase().trim(),
  organisation: yup.string().trim().optional(),
})

type FreeInput = yup.InferType<typeof freeSchema>

type ModalEvent = {
  id:    string   // DB workshop ID
  title: string
  date:  string
  time:  string
  fee:   number
}

const WorkshopRegistrationForm = ({
  modalEvent,
  setModalOpen,
}: {
  modalEvent: ModalEvent
  setModalOpen: (open: boolean) => void
}) => {
  const isPaid = modalEvent.fee > 0

  // Free workshops use a simpler schema; paid workshops collect info then redirect to Stripe
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FreeInput>({
    resolver: yupResolver(freeSchema) as Resolver<FreeInput>,
  })

  const onSubmit = async (data: FreeInput) => {
    try {
      if (isPaid) {
        // ── Paid: create Stripe Checkout Session ──────────────────────
        const res = await fetch(`/api/workshops/${modalEvent.id}/checkout`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            firstName:    data.firstName,
            lastName:     data.lastName,
            email:        data.email,
            organisation: data.organisation,
          }),
        })

        const json = await res.json()

        if (!res.ok) {
          toast.error(json.error ?? "Something went wrong.")
          return
        }

        // Redirect to Stripe hosted checkout page
        if (json.url) {
          window.location.href = json.url
        }
      } else {
        // ── Free: register directly ───────────────────────────────────
        const res = await fetch("/api/workshop/register", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
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
      className="fixed inset-0 bg-[#181C2C]/70 z-50 flex items-center justify-center p-4"
      onClick={() => setModalOpen(false)}
    >
      <form
        className="bg-[#EBF3FC] rounded-lg w-full max-w-lg overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        {/* Header */}
        <div className="bg-[#0474C4] p-6 flex items-start justify-between gap-4">
          <div>
            <div className="font-heading text-[1.375rem] tracking-[-0.005em] leading-[1.3] font-medium text-white/90">
              {modalEvent.title}
            </div>
            <div className="font-body text-[0.8125rem] tracking-[0em] leading-normal font-normal text-white/70 mt-1">
              {modalEvent.date} · {modalEvent.time}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(false)}
            className="text-white/35 hover:text-white text-xl leading-none shrink-0 bg-[#EDF2FB]/20 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-slate-400">
                First Name
              </label>
              <Input
                {...register("firstName")}
                className="font-body text-[0.875rem] bg-sky-light border border-[#0474C4]/25 rounded-sm px-3 py-2 text-ink outline-none focus:border-[#0474C4] placeholder:text-slate-400"
                placeholder="e.g. Amara"
              />
              {errors.firstName && (
                <p className="text-[0.72rem] text-red-500">{errors.firstName.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-slate-400">
                Last Name
              </label>
              <Input
                {...register("lastName")}
                className="font-body text-[0.875rem] bg-sky-light border border-[#0474C4]/25 rounded-sm px-3 py-2 text-ink outline-none focus:border-[#0474C4] placeholder:text-slate-400"
                placeholder="e.g. Diallo"
              />
              {errors.lastName && (
                <p className="text-[0.72rem] text-red-500">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-slate-400">
              Email Address
            </label>
            <Input
              type="email"
              {...register("email")}
              className="font-body text-[0.875rem] bg-sky-light border border-[#0474C4]/25 rounded-sm px-3 py-2 text-ink outline-none focus:border-[#0474C4] placeholder:text-slate-400"
              placeholder="your@email.com"
            />
            {errors.email && (
              <p className="text-[0.72rem] text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-slate-400">
              Organisation <span className="normal-case font-normal">(optional)</span>
            </label>
            <Input
              {...register("organisation")}
              className="font-body text-[0.875rem] bg-sky-light border border-[#0474C4]/25 rounded-sm px-3 py-2 text-ink outline-none focus:border-[#0474C4] placeholder:text-slate-400"
              placeholder="e.g. University of Ghana"
            />
          </div>

          {isPaid && (
            <div className="flex items-start gap-3 bg-[#0474C4]/6 border border-[#0474C4]/20 rounded-lg px-4 py-3 text-[0.8125rem] text-[#0474C4]">
              <svg className="w-4 h-4 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                <line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
              <span className="font-body leading-snug">
                You will be redirected to our secure Stripe payment page to complete your&nbsp;
                <span className="font-semibold">${modalEvent.fee}</span> payment.
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-4 flex items-center justify-between gap-4 border-t border-[#0474C4]/18">
          <span className="font-body text-[0.75rem] leading-normal font-normal text-slate-400">
            {isPaid ? `Fee: $${modalEvent.fee}` : "Free — no payment required"}
          </span>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-12 rounded-[32px] py-2.5 px-5 font-body text-[0.875rem] tracking-[0.02em] font-medium text-[#EBF3FC] bg-[#0474C4] hover:bg-[#06457f] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                {isPaid ? "Proceed to Payment" : "Confirm Registration"}
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default WorkshopRegistrationForm
