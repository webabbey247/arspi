import "server-only"
import { db } from "@/lib/db"
import { sendNoticeEmail } from "@/lib/email"
import { absoluteAppUrl } from "@/lib/app-url"
import { activeAdmins, notifyUsers } from "@/services/notification.service"

const nameOf = (u: { email: string; profile: { firstName: string | null; lastName: string | null } | null } | null) =>
  !u ? "An instructor" : [u.profile?.firstName, u.profile?.lastName].filter(Boolean).join(" ") || u.email

/** Email is best-effort: the in-app alert is the record, so a mail outage
 *  never blocks assigning, submitting or approving. */
async function safeEmail(fn: () => Promise<void>) {
  try { await fn() } catch (e) { console.error("[program review email]", e) }
}

/**
 * Assigns a programme to an instructor for review and grading. The programme's
 * `instructorId` is what scopes everything an instructor sees — their
 * programme list, the grading queues and the student preview — so this is
 * the single switch that hands it over.
 */
export async function assignProgram(programId: string, instructorId: string) {
  const [program, instructor] = await Promise.all([
    db.course.findUnique({ where: { id: programId }, select: { id: true, title: true, slug: true, instructorId: true } }),
    db.user.findUnique({
      where: { id: instructorId },
      select: { id: true, email: true, role: true, status: true, profile: { select: { firstName: true, lastName: true } } },
    }),
  ])
  if (!program) return { ok: false as const, status: 404, error: "Program not found." }
  if (!instructor || instructor.role !== "INSTRUCTOR") return { ok: false as const, status: 400, error: "Choose an instructor." }
  if (instructor.status !== "ACTIVE") return { ok: false as const, status: 400, error: "That instructor's account is disabled." }
  if (program.instructorId === instructorId) return { ok: true as const, changed: false, instructorName: nameOf(instructor) }

  await db.course.update({
    where: { id: programId },
    // A different reviewer starts fresh: any earlier submission was someone else's.
    data:  { instructorId, submittedForReviewAt: null, submittedById: null, submissionNote: null },
  })

  // Reassignment: the previous instructor loses access, so tell them why the
  // programme disappeared from their list. In-app only — it isn't news that
  // needs an inbox.
  if (program.instructorId) {
    await notifyUsers([program.instructorId], {
      type: "program_reassigned",
      context: program.title,
      title: `${program.title} was reassigned`,
      body: "An administrator moved this programme to another instructor.",
      link: "/instructor/programs",
    })
  }

  // The public programme page: a draft opens in preview for its assigned
  // instructor (the programme 404 page sends staff into preview), and a live
  // programme is simply its public page.
  const link = `/programs/${program.slug}`
  await notifyUsers([instructorId], {
    type: "program_assigned",
      context: program.title,
    title: `New programme to review: ${program.title}`,
    body: "Review and edit it, then submit it for approval.",
    link,
  })
  await safeEmail(() => sendNoticeEmail({
    to: instructor.email,
    subject: `Programme assigned to you: ${program.title}`,
    heading: "A programme has been assigned to you",
    paragraphs: [
      `"${program.title}" has been assigned to you for review and grading.`,
      "Review its content, make any edits it needs, then submit it for approval. You'll also mark its learners' submissions.",
    ],
    cta: { label: "Open the programme", url: absoluteAppUrl(link) },
  }))

  return { ok: true as const, changed: true, instructorName: nameOf(instructor) }
}

/** The assigned instructor hands the programme to admins for approval. */
export async function submitProgramForReview(programId: string, instructorId: string, note?: string) {
  const program = await db.course.findUnique({
    where:  { id: programId },
    select: {
      id: true, title: true, slug: true, status: true, instructorId: true, submittedForReviewAt: true,
      instructor: { select: { email: true, profile: { select: { firstName: true, lastName: true } } } },
    },
  })
  if (!program) return { ok: false as const, status: 404, error: "Program not found." }
  if (program.instructorId !== instructorId) return { ok: false as const, status: 403, error: "Forbidden" }

  const cleanNote = note?.trim().slice(0, 2000) || null
  await db.course.update({
    where: { id: programId },
    data:  { submittedForReviewAt: new Date(), submittedById: instructorId, submissionNote: cleanNote },
  })

  const who = nameOf(program.instructor)
  const link = `/administrator/programs/${program.slug}`
  const admins = await activeAdmins()
  await notifyUsers(admins.map(a => a.id), {
    type: "program_submitted",
      context: program.title,
    title: `${program.title} is ready for approval`,
    body: `Submitted by ${who}${cleanNote ? ` — "${cleanNote.slice(0, 140)}"` : ""}`,
    link,
  })
  if (admins.length > 0) {
    await safeEmail(() => sendNoticeEmail({
      to: admins.map(a => a.email),
      subject: `Approval needed: ${program.title}`,
      heading: "A programme is ready for approval",
      paragraphs: [
        `${who} has submitted "${program.title}" for approval.`,
        ...(cleanNote ? [`Their note: ${cleanNote}`] : []),
        "Review it, preview it as a public visitor or a student, and approve it to publish it.",
      ],
      cta: { label: "Review the programme", url: absoluteAppUrl(link) },
    }))
  }
  return { ok: true as const, resubmitted: !!program.submittedForReviewAt }
}

/** Called when an admin publishes a programme: clears a pending submission
 *  and tells the instructor who submitted it. */
export async function onProgramPublished(programId: string) {
  const program = await db.course.findUnique({
    where:  { id: programId },
    select: { title: true, slug: true, submittedForReviewAt: true, submittedById: true,
              submittedBy: { select: { email: true } } },
  })
  if (!program?.submittedForReviewAt) return
  await db.course.update({
    where: { id: programId },
    data:  { submittedForReviewAt: null, submissionNote: null },
  })
  if (!program.submittedById) return
  // The public programme page: a draft opens in preview for its assigned
  // instructor (the programme 404 page sends staff into preview), and a live
  // programme is simply its public page.
  const link = `/programs/${program.slug}`
  await notifyUsers([program.submittedById], {
    type: "program_approved",
      context: program.title,
    title: `${program.title} was approved`,
    body: "It's now live on the public site.",
    link,
  })
  if (program.submittedBy?.email) {
    const email = program.submittedBy.email
    await safeEmail(() => sendNoticeEmail({
      to: email,
      subject: `Approved: ${program.title}`,
      heading: "Your programme was approved",
      paragraphs: [`"${program.title}" has been approved and is now live.`],
      cta: { label: "Open the programme", url: absoluteAppUrl(link) },
    }))
  }
}
