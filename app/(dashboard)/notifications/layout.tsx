import { requireAuth } from "@/lib/session"
import DashboardShell from "@/components/layout/DashboardShell"

/** Shared by every role, like /settings: signed in is enough. */
export default async function NotificationsLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth()
  return <DashboardShell user={session}>{children}</DashboardShell>
}
