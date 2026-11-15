"use client"

import { useParams } from "next/navigation"
import StudentProgramPlayer from "@/components/programs/StudentProgramPlayer"

const StudentCoursePlayerPage = () => {
  const { slug } = useParams<{ slug: string }>()
  return <StudentProgramPlayer slug={slug} />
}

export default StudentCoursePlayerPage
