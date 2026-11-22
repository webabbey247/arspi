import { cn } from "@/lib/utils"

/** The "Why ARPS Institute" points. Shown on the About page and the homepage;
 *  edit them here and both update. */
export const STRATEGIC_ADVANTAGES = [
  "Earn a respected certificate on your own schedule through advanced, self-paced programmes with practical assignments you can apply at work straight away",
  "Strengthen your research skills, from design and methods to data analysis, writing and grant applications, through structured training and live expert workshops, many of them free",
  "Give your institution smarter, purpose-built digital tools that replace spreadsheets and email chains with clear, accountable workflows",
  "Get expert support for your organisation's consulting, monitoring and evaluation, and policy research needs, so your decisions rest on credible evidence",
  "Stay ahead with applied research and a free knowledge hub of insights and practice guides from experienced scholars and practitioners",
  "Learn and work with us from anywhere in the world, fully online, with no travel and no geographical barriers",
] as const

/**
 * "Strategic Advantages / Why ARPS Institute": a kicker, a heading and the
 * bordered list of points.
 *
 * `stacked` (About page) puts the heading above the list, filling the column
 * it's placed in. `split` (homepage) is a full-width section with the heading
 * on the left and the list on the right, matching the homepage's other
 * two-column sections.
 */
export default function StrategicAdvantages({ layout = "stacked", className }: {
  layout?: "stacked" | "split"
  className?: string
}) {
  const heading = (
    <div className="flex flex-col gap-3 sm:gap-4">
      <p className="font-body text-[0.6875rem] sm:text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#0474C4]">
        Strategic Advantages
      </p>
      <h2 className="font-heading text-[1.5rem] sm:text-[1.625rem] md:text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-[#071639]">
        Why ARPS Institute
      </h2>
    </div>
  )

  const list = (
    <ul className={cn("flex flex-col gap-px bg-slate-200 border border-slate-200", layout === "stacked" && "mt-6 sm:mt-8")}>
      {STRATEGIC_ADVANTAGES.map((item) => (
        <li
          key={item}
          className="bg-white py-3.5 sm:py-4 md:py-[1.2rem] px-4 sm:px-5 md:px-6 flex items-start gap-3 sm:gap-3.5"
        >
          {/* Points can wrap to two lines; keep the dot level with the first. */}
          <span className="w-2 h-2 rounded-full bg-[#0474C4] shrink-0 mt-[0.55em]" aria-hidden />
          <span className="font-body text-[0.8125rem] sm:text-[0.875rem] tracking-[0em] leading-[1.6] font-normal text-slate-600">
            {item}
          </span>
        </li>
      ))}
    </ul>
  )

  if (layout === "split") {
    return (
      <section className={cn(
        "py-12 sm:py-16 md:py-20 lg:py-28 px-4 sm:px-6 md:px-10 lg:px-16 xl:px-20 grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-8 md:gap-10 lg:gap-24 items-start bg-white w-full",
        className,
      )}>
        {heading}
        {list}
      </section>
    )
  }

  return (
    <div className={className}>
      {heading}
      {list}
    </div>
  )
}
