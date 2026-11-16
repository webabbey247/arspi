import "server-only"
import { db } from "@/lib/db"
import { notifyAdmins, notifyProgrammeStaff, notifyUsers } from "@/services/notification.service"

/**
 * One function per event that raises an in-app alert, so the wording lives in
 * one place and each hook in the app is a single line. Callers wrap these in
 * notifySafely() — an alert must never break the action it reports.
 *
 * Who hears what:
 *   admins       — enquiries, career applications, workshop registrations,
 *                  new students, programme enrolments
 *   instructors  — work to mark and enrolments on their assigned programmes
 *                  (admins instead, while a programme is unassigned)
 *   learners     — their work was marked, their certificate was issued
 */

const fullName = (first?: string | null, last?: string | null, fallback = "Someone") =>
  [first, last].filter(Boolean).join(" ") || fallback

const learnerName = async (userId: string) => {
  const u = await db.user.findUnique({
    where: { id: userId },
    select: { email: true, profile: { select: { firstName: true, lastName: true } } },
  })
  return u ? fullName(u.profile?.firstName, u.profile?.lastName, u.email) : "A learner"
}

// ── Admin inbox ──────────────────────────────────────────────────────────────

export async function notifyNewEnquiry(e: { firstName: string; lastName: string; email: string; subject: string }) {
  const who = fullName(e.firstName, e.lastName, e.email)
  await notifyAdmins({
    type: "enquiry",
    title: `New enquiry from ${who}`,
    body: `${e.subject.replace(/_/g, " ").toLowerCase().replace(/^\w/, c => c.toUpperCase())} · ${e.email}`,
    link: "/administrator/enquiries",
    context: who,
  })
}

export async function notifyNewApplication(a: { careerId: string; fullName: string; email: string }) {
  const career = await db.career.findUnique({ where: { id: a.careerId }, select: { title: true } })
  await notifyAdmins({
    type: "career_application",
    title: `New application: ${career?.title ?? "a career posting"}`,
    body: `${a.fullName} (${a.email}) applied.`,
    link: `/administrator/careers/${a.careerId}`,
    context: career?.title ?? null,
  })
}

/** A confirmed workshop registration — free ones at sign-up, paid ones once
 *  Stripe confirms payment. The workshop's own instructor hears too. */
export async function notifyWorkshopRegistration(r: {
  workshopId: string | null; workshopTitle: string; firstName: string; lastName: string; email: string; paid: boolean
}) {
  const who = fullName(r.firstName, r.lastName, r.email)
  const n = {
    type: "workshop_registration",
    title: `New registration: ${r.workshopTitle}`,
    body: `${who} (${r.email}) registered${r.paid ? " and paid" : ""}.`,
    context: r.workshopTitle,
  }
  await notifyAdmins({ ...n, link: r.workshopId ? `/administrator/workshops/${r.workshopId}` : "/administrator/workshops" })
  if (r.workshopId) {
    const w = await db.workshop.findUnique({ where: { id: r.workshopId }, select: { instructorId: true } })
    if (w?.instructorId) await notifyUsers([w.instructorId], { ...n, link: "/instructor/workshops" })
  }
}

export async function notifyNewStudent(u: { id: string; email: string }) {
  await notifyAdmins({
    type: "new_student",
    title: "New student account",
    body: `${u.email} signed up.`,
    link: `/administrator/users/${u.id}`,
    context: u.email,
  })
}

export async function notifyEnrolment(e: { userId: string; courseId: string; paid?: boolean }) {
  const course = await db.course.findUnique({ where: { id: e.courseId }, select: { title: true, slug: true, instructorId: true } })
  if (!course) return
  const who = await learnerName(e.userId)
  const n = {
    type: "enrolment",
    title: `New enrolment: ${course.title}`,
    body: `${who} enrolled${e.paid ? " (paid)" : ""}.`,
    context: course.title,
  }
  await notifyAdmins({ ...n, link: `/administrator/programs/${course.slug}` })
  if (course.instructorId) await notifyUsers([course.instructorId], { ...n, link: "/instructor/students" })
}

// ── Instructor inbox ─────────────────────────────────────────────────────────

/** A learner handed in work that needs a human to mark it. */
export async function notifySubmission(s: { userId: string; courseId: string; itemTitle: string; kind: "assignment" | "project"; resubmitted?: boolean }) {
  const course = await db.course.findUnique({ where: { id: s.courseId }, select: { title: true, instructorId: true } })
  if (!course) return
  const who = await learnerName(s.userId)
  await notifyProgrammeStaff(s.courseId, {
    type: "submission",
    title: `${s.resubmitted ? "Resubmission" : "New submission"} to mark`,
    body: `${who} submitted “${s.itemTitle}”.`,
    link: course.instructorId ? "/instructor/grading" : "/administrator/grading",
    context: course.title,
  })
}

// ── Learner inbox ────────────────────────────────────────────────────────────

/** Marks were released on an assignment or project. */
export async function notifyMarked(m: {
  userId: string; courseId: string; itemTitle: string
  outcome: "passed" | "returned" | "accepted" | "graded"; scoreText?: string
}) {
  const course = await db.course.findUnique({ where: { id: m.courseId }, select: { title: true, slug: true } })
  if (!course) return
  const verdict = {
    passed:   "You passed.",
    accepted: "It was accepted.",
    returned: "It was returned — you can revise and resubmit.",
    graded:   "It has been graded.",
  }[m.outcome]
  await notifyUsers([m.userId], {
    type: "marked",
    title: `Your work was marked: ${m.itemTitle}`,
    body: [m.scoreText, verdict].filter(Boolean).join(" · "),
    link: `/student/programs/${course.slug}`,
    context: course.title,
  })
}

export async function notifyCertificate(c: { userId: string; courseId: string }) {
  const course = await db.course.findUnique({ where: { id: c.courseId }, select: { title: true } })
  await notifyUsers([c.userId], {
    type: "certificate",
    title: "Your certificate is ready",
    body: `Congratulations on completing ${course?.title ?? "your programme"}.`,
    link: "/student/certificates",
    context: course?.title ?? null,
  })
}
