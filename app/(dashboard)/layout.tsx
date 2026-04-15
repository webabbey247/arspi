import { requireAuth } from "@/lib/session"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Ensures no unauthenticated request reaches any dashboard route.
  // Role-specific layouts do a finer-grained check with requireRole().
  await requireAuth()

  return <>{children}</>
}
