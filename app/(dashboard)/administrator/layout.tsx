import { requireRole } from "@/lib/session"
import DashboardShell from "@/components/layout/DashboardShell"

export default async function AdministratorLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("ADMIN")
  return <DashboardShell user={session}>{children}</DashboardShell>
}
