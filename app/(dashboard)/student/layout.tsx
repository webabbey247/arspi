import { requireRole } from "@/lib/session"
import DashboardHeader from "@/components/layout/DashboardHeader"
import DashboardSidebar from "@/components/layout/DashboardSidebar"

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("USER")

  return (
    <div className="flex flex-col h-screen bg-[#F5F4F1] overflow-hidden">
      <DashboardHeader user={session} />
      <div className="flex flex-1 overflow-hidden">
        <DashboardSidebar userRole={session.role} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
