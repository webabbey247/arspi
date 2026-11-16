"use client"

import UsersDirectory from "@/components/admin/UsersDirectory"

/** Students: every account with the USER role. Sign-ups land here by default. */
export default function StudentsPage() {
  return <UsersDirectory audience="students" />
}
