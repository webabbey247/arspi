"use client"

import { useState } from "react"

type Faq = { q: string; a: string }

/** Single-open FAQ accordion — all closed by default, +/− toggle. Same
 *  smooth-height technique as CurriculumAccordion. */
export default function FaqAccordion({ faqs }: { faqs: Faq[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="border-t border-[#EAE5DC]">
      {faqs.map((faq, i) => {
        const open = openIndex === i
        return (
          <div key={i} className="border-b border-[#EAE5DC]">
            <button
              type="button"
              onClick={() => setOpenIndex(open ? null : i)}
              className="w-full flex items-center gap-4 py-[18px] cursor-pointer text-left"
            >
              <span className="flex-1 font-body text-[16px] text-[#0B2239]">{faq.q}</span>
              <span className="text-[13px] text-[#5A6675] shrink-0">{open ? "−" : "+"}</span>
            </button>
            <div
              className="grid transition-[grid-template-rows] duration-300 ease-out"
              style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
            >
              <div className="overflow-hidden">
                <p className="mb-5 max-w-[42em] font-body text-[15px] leading-[1.62] text-[#3E4A59]">{faq.a}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
