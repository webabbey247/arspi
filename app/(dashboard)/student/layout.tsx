import { requireRole } from "@/lib/session"
import DashboardShell from "@/components/layout/DashboardShell"

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("USER")
  return <DashboardShell user={session}>{children}</DashboardShell>
}
