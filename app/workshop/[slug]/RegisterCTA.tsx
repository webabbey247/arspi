"use client"

import { useState } from "react"
import { ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import WorkshopRegistrationForm from "@/components/forms/WorkshopRegistrationForm"

type Props = {
  workshop: {
    id:    string
    title: string
    date:  string
    time:  string
    fee:   number
  }
}

export default function RegisterCTA({ workshop }: Props) {
  const [open, setOpen] = useState(false)
  const isPaid = workshop.fee > 0

  return (
    <>
      <div className="bg-white rounded border border-[#0474C4]/12 p-5 text-white">
        <div className="flex items-baseline justify-between mb-3">
          <span className="font-body text-[0.75rem] tracking-[0.06em] uppercase font-medium text-slate-400">
            Registration fee
          </span>
          <span className="font-heading text-[1.625rem] font-semibold tracking-[-0.01em] text-[#0474C4]">
            {isPaid ? `$${workshop.fee}` : "Free"}
          </span>
        </div>
        <Button
          className={`w-full h-12 rounded font-body text-[0.875rem] tracking-[0.02em] font-medium ${
            !isPaid
              ? "bg-[#0474C4] text-white hover:bg-white/90"
              : "bg-emerald-500 text-white hover:bg-emerald-600"
          }`}
          onClick={() => setOpen(true)}
        >
          {isPaid ? "Enrol Now" : "Register Free"}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {open && (
        <WorkshopRegistrationForm
          modalEvent={{
            id:    workshop.id,
            title: workshop.title,
            date:  workshop.date,
            time:  workshop.time,
            fee:   workshop.fee,
          }}
          setModalOpen={setOpen}
        />
      )}
    </>
  )
}
