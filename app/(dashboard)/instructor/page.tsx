import { requireRole } from "@/lib/session"
import InstructorDashboard from "@/components/dashboard/instructor/InstructorDashboard"

/** Instructor home. The role check stays server-side; the dashboard loads its
 *  data from /api/instructor/dashboard. */
export default async function InstructorPage() {
  const session = await requireRole("INSTRUCTOR")
  return <InstructorDashboard firstName={session.firstName ?? null} />
}
