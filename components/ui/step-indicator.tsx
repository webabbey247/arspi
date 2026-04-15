import { cn } from '@/lib/utils';
import {Fragment} from 'react'

const StepIndicator = ({ steps } : { steps: { label: string; status: "active" | "done" | "pending" }[] }) => {
  return (
    <div className="flex items-center gap-0 mb-8">
            {steps.map((s, i) => (
              <Fragment key={s.label}>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center font-body text-[0.75rem] font-medium transition-all",
                    s.status === "active" ? "bg-[#0474C4] text-white" :
                    s.status === "done"   ? "bg-emerald-600 text-white" :
                    "bg-[#EBF3FC] border border-[#EBF3FC]/25 text-slate-400"
                  )}>
                    {s.status === "done" ? "✓" : i + 1}
                  </div>
                  <span className={cn(
                    "font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium transition-colors",
                    s.status === "active" ? "text-slate-600" :
                    s.status === "done"   ? "text-emerald-600" : "text-slate-400"
                  )}>
                    {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && <div className="flex-1 h-px bg-[#0474C4]/20 mx-3" />}
              </Fragment>
            ))}
          </div>
  )
}

export default StepIndicator