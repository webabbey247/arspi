import { requireRole } from "@/lib/session"
import DashboardShell from "@/components/layout/DashboardShell"

export default async function InstructorLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("INSTRUCTOR")
  return <DashboardShell user={session}>{children}</DashboardShell>
}
