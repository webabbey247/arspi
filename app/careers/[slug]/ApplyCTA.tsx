"use client"

import { useState } from "react"
import { ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import CareerApplicationForm from "@/components/forms/CareerApplicationForm"

type Props = {
  career: {
    slug:  string
    title: string
  }
}

export default function ApplyCTA({ career }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="bg-white border border-[#0474C4]/12 rounded p-5">
        <p className="font-body text-[0.75rem] tracking-[0.06em] uppercase font-medium text-slate-400 mb-3">
          Ready to apply?
        </p>
        <Button
          className="w-full h-12 rounded font-body text-[0.875rem] tracking-[0.02em] font-medium bg-[#0474C4] text-white hover:bg-[#06457f]"
          onClick={() => setOpen(true)}
        >
          Apply Now
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {open && (
        <CareerApplicationForm
          career={career}
          setModalOpen={setOpen}
        />
      )}
    </>
  )
}
