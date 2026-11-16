import { redirect } from "next/navigation"

/** The old combined list is now split into Students and Staff & Roles; keep
 *  old links and bookmarks working. User detail pages stay at /users/[id]. */
export default function UsersIndex() {
  redirect("/administrator/students")
}
