import { requireRole } from "@/lib/session"

export default async function InstructorPage() {
  const session = await requireRole("INSTRUCTOR")

  return (
    <div>
      <h1 className="font-heading text-[1.75rem] tracking-[-0.01em] font-semibold text-[#071639] mb-1">
        Instructor Dashboard
      </h1>
      <p className="font-body text-[0.875rem] text-slate-500 mb-8">
        Welcome back, {session.firstName ?? session.email}.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {[
          { label: "My Courses",      value: "—" },
          { label: "Total Students",  value: "—" },
          { label: "Avg. Completion", value: "—" },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="bg-white border border-[#0474C4]/15 rounded-md px-5 py-4"
          >
            <p className="font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium text-slate-400 mb-1">
              {label}
            </p>
            <p className="font-heading text-[1.5rem] font-semibold text-[#071639]">{value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
