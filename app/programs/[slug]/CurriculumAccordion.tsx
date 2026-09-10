"use client"

import { useState } from "react"

type Module = { week?: string; title: string; desc?: string; topics?: string[] }

/** Single-open curriculum accordion — first module open by default. Uses the
 *  CSS grid-template-rows 0fr→1fr technique for a smooth height transition
 *  without measuring pixel heights (content length varies per programme). */
export default function CurriculumAccordion({ modules }: { modules: Module[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <div className="grid gap-2 mt-8">
      {modules.map((mod, i) => {
        const open = openIndex === i
        return (
          <div key={i} className={`border border-[#EAE5DC] rounded-[3px] overflow-hidden ${open ? "bg-[#FFFDFA]" : "bg-[#FAF6EF]"}`}>
            <button
              type="button"
              onClick={() => setOpenIndex(open ? null : i)}
              className="w-full flex items-center gap-4 px-5 py-4 cursor-pointer text-left"
            >
              <span
                className={`shrink-0 font-body text-[10.5px] tracking-[0.12em] uppercase px-2.5 py-[5px] rounded-[2px] transition-colors duration-200 ${
                  open ? "bg-[#0B2239] text-[#BFE0D6]" : "bg-[#E8F5F0] text-[#0B2239]"
                }`}
              >
                {mod.week ?? `Week ${i + 1}`}
              </span>
              <span className="font-heading text-[18px] leading-[1.3] flex-1 text-[#0B2239]">{mod.title}</span>
              <span className={`text-[12px] transition-colors duration-200 ${open ? "text-[#0B2239]" : "text-[#5A6675]"}`}>
                {open ? "▲" : "▼"}
              </span>
            </button>

            <div
              className="grid transition-[grid-template-rows] duration-300 ease-out"
              style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
            >
              <div className="overflow-hidden">
                <div className="px-5 pb-5 pt-0 bg-[#FAF6EF] border-t border-[#EFE9DE]">
                  {mod.desc && (
                    <p className="mt-4 font-body text-[15px] leading-[1.6] text-[#3E4A59] max-w-[44em]">{mod.desc}</p>
                  )}
                  {mod.topics && mod.topics.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3.5">
                      {mod.topics.map((t) => (
                        <span key={t} className="font-body text-[12.5px] text-[#0B2239] bg-[#E8F5F0] rounded-[2px] px-2.5 py-1.5">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
