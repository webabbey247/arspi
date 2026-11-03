"use client"

import GradingQueue from "@/components/assessments/GradingQueue"

/** Project grading. The queue component is shared with the administrator
 *  dashboard; the API decides scope, so an instructor only ever sees
 *  submissions on programmes they teach while an admin sees all of them. */
const GradingPage = () => (
  <div className="max-w-350 mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
    <div className="mb-6">
      <span className="block text-[12px] tracking-[0.12em] uppercase font-extrabold text-[#6655DF] mb-1.5">Instructor</span>
      <h1 className="text-[clamp(28px,3.4vw,40px)] leading-[1.1] tracking-[-0.035em] font-extrabold text-[#171C35]">Grading</h1>
      <p className="text-[#69708A] text-[15px] mt-1.5 max-w-180">Review and mark project submissions</p>
    </div>
    <GradingQueue />
  </div>
)

export default GradingPage
