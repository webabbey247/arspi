"use client"

import { useParams } from "next/navigation"
import StudentProgramPlayer from "@/components/programs/StudentProgramPlayer"
import { staffProgramHref } from "@/lib/program-preview-links"

/** "Preview as student": the learner's course player, read-only. The preview
 *  API re-checks access — admins can preview any programme, drafts included. */
const StudentPreviewPage = () => {
  const { slug } = useParams<{ slug: string }>()
  return (
    <StudentProgramPlayer
      slug={slug}
      preview={{ role: "ADMIN", backHref: staffProgramHref("ADMIN", slug) }}
    />
  )
}

export default StudentPreviewPage
