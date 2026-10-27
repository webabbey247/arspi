import { requireRole } from "@/lib/session"

export default async function InstructorPage() {
  const session = await requireRole("INSTRUCTOR")

  return (
    <div className="max-w-350 mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="mb-7">
        <span className="block text-[12px] tracking-[0.12em] uppercase font-extrabold text-[#6655DF] mb-1.5">Instructor</span>
        <h1 className="text-[clamp(28px,3.4vw,40px)] leading-[1.1] tracking-[-0.035em] font-extrabold text-[#171C35]">
          Good day, {session.firstName ?? session.email}.
        </h1>
        <p className="text-[#69708A] text-[15px] mt-1.5 max-w-180">
          Create, review and deliver your programmes and workshops from one workspace.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "My Courses",      value: "—", note: "Programmes you teach" },
          { label: "Total Students",  value: "—", note: "Across all programmes" },
          { label: "Avg. Completion", value: "—", note: "Learner progress" },
        ].map(({ label, value, note }) => (
          <article
            key={label}
            className="grid bg-white border border-[#DFE2ED] rounded-[16px] p-5"
          >
            <span className="text-[#69708A]">{label}</span>
            <b className="text-[31px] text-[#171C35] my-1">{value}</b>
            <small className="text-[#69708A]">{note}</small>
          </article>
        ))}
      </div>
    </div>
  )
}
