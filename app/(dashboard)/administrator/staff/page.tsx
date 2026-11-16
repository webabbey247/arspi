"use client"

import UsersDirectory from "@/components/admin/UsersDirectory"

/** Staff & Roles: admins and instructors, plus instructor invite / import. */
export default function StaffPage() {
  return <UsersDirectory audience="staff" />
}
