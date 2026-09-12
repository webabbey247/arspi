import type { Metadata } from "next"
import { requireAuth } from "@/lib/session"

/** Belt-and-braces with robots.txt: every dashboard route is session-gated, so
 *  a crawler only ever sees a redirect — but an explicit noindex means nothing
 *  here can end up in an index even if a route is ever made public. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Ensures no unauthenticated request reaches any dashboard route.
  // Role-specific layouts do a finer-grained check with requireRole().
  await requireAuth()

  return <>{children}</>
}
