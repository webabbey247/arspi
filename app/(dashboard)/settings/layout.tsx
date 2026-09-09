import { requireAuth } from "@/lib/session"
import DashboardShell from "@/components/layout/DashboardShell"

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth()
  return <DashboardShell user={session}>{children}</DashboardShell>
}
