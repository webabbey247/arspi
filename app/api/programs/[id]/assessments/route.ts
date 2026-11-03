import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireCourseEditor } from "@/lib/guard"
import { db } from "@/lib/db"

type Context = { params: Promise<{ id: string }> }

const questionSchema = z.object({
  id:           z.string().min(1),
  prompt:       z.string().min(1),
  options:      z.array(z.string().min(1)).min(2).max(8),
  correctIndex: z.number().int().min(0),
  points:       z.number().min(0.25).max(100).default(1),
}).refine(q => q.correctIndex < q.options.length, {
  message: "correctIndex must point at one of the options.",
})

const criterionSchema = z.object({
  id:        z.string().min(1),
  criterion: z.string().min(1),
  maxPoints: z.number().min(1).max(100),
})

const createSchema = z.object({
  kind:           z.enum(["CHAPTER_QUIZ", "PROJECT"]),
  title:          z.string().min(2).max(255),
  instructions:   z.string().nullable().optional(),
  chapterId:      z.string().nullable().optional(),
  questions:      z.array(questionSchema).optional(),
  rubric:         z.array(criterionSchema).optional(),
  drawCount:      z.number().int().min(1).nullable().optional(),
  shuffleOptions: z.boolean().optional(),
  orderIndex:     z.number().int().min(0).optional(),
}).superRefine((v, ctx) => {
  if (v.kind === "CHAPTER_QUIZ") {
    if (!v.questions?.length) {
      ctx.addIssue({ code: "custom", message: "A chapter quiz needs at least one question." })
    }
    if (v.drawCount && v.questions && v.drawCount > v.questions.length) {
      ctx.addIssue({ code: "custom", message: "drawCount cannot exceed the number of questions." })
    }
  }
  if (v.kind === "PROJECT" && !v.rubric?.length) {
    ctx.addIssue({ code: "custom", message: "A project needs at least one rubric criterion." })
  }
})

/** GET /api/programs/[id]/assessments — admin view, answer key included.
 *  Admin-only: this is the one place `correctIndex` is legitimately served. */
export async function GET(_req: NextRequest, { params }: Context) {
  try {
    const { id } = await params
    const guard = await requireCourseEditor(id)
    if (!guard.ok) return guard.response
    const [course, assessments] = await Promise.all([
      db.course.findUnique({ where: { id } }),
      db.assessment.findMany({
        where:   { courseId: id },
        orderBy: [{ kind: "asc" }, { orderIndex: "asc" }],
      }),
    ])
    if (!course) return NextResponse.json({ error: "Program not found." }, { status: 404 })

    // Chapters ride along so the authoring UI doesn't have to be handed the
    // curriculum separately by every page that mounts it.
    const chapters = (Array.isArray(course.curriculum) ? course.curriculum : [])
      .map((c: unknown) => c as { id?: string; title?: string })
      .filter(c => c?.id && c?.title)
      .map(c => ({ id: c.id!, title: c.title! }))

    return NextResponse.json({
      assessments,
      chapters,
      policy: {
        gradingEnabled:          course.gradingEnabled,
        quizWeight:              course.quizWeight,
        projectWeight:           course.projectWeight,
        passMark:                course.passMark,
        componentPassMark:       course.componentPassMark,
        maxQuizAttempts:         course.maxQuizAttempts,
        attemptCooldownHours:    course.attemptCooldownHours,
        maxProjectResubmissions: course.maxProjectResubmissions,
      },
    })
  } catch (error) {
    console.error("[GET /api/programs/[id]/assessments]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

const policySchema = z.object({
  gradingEnabled:          z.boolean().optional(),
  quizWeight:              z.number().int().min(0).max(100).optional(),
  projectWeight:           z.number().int().min(0).max(100).optional(),
  passMark:                z.number().int().min(0).max(100).optional(),
  componentPassMark:       z.number().int().min(0).max(100).optional(),
  maxQuizAttempts:         z.number().int().min(1).max(20).optional(),
  attemptCooldownHours:    z.number().int().min(0).max(720).optional(),
  maxProjectResubmissions: z.number().int().min(0).max(20).optional(),
})

/** PATCH /api/programs/[id]/assessments — the course's grading policy.
 *  Lives on this route rather than the program PUT so instructors reach it
 *  through the same course-scoped guard as the assessments themselves. */
export async function PATCH(req: NextRequest, { params }: Context) {
  try {
    const { id } = await params
    const guard = await requireCourseEditor(id)
    if (!guard.ok) return guard.response

    const parsed = policySchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 })
    }
    const d = parsed.data

    // The two halves have to add up, or "out of 100" stops being true.
    if (d.quizWeight !== undefined && d.projectWeight !== undefined
        && d.quizWeight + d.projectWeight !== 100) {
      return NextResponse.json({ error: "Quiz and project weights must add up to 100." }, { status: 400 })
    }

    const course = await db.course.update({ where: { id }, data: d })
    return NextResponse.json({
      policy: {
        gradingEnabled: course.gradingEnabled, quizWeight: course.quizWeight,
        projectWeight: course.projectWeight, passMark: course.passMark,
        componentPassMark: course.componentPassMark, maxQuizAttempts: course.maxQuizAttempts,
        attemptCooldownHours: course.attemptCooldownHours,
        maxProjectResubmissions: course.maxProjectResubmissions,
      },
    })
  } catch (error) {
    console.error("[PATCH /api/programs/[id]/assessments]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

/** POST /api/programs/[id]/assessments — create a chapter quiz or the project. */
export async function POST(req: NextRequest, { params }: Context) {
  try {
    const { id } = await params
    const guard = await requireCourseEditor(id)
    if (!guard.ok) return guard.response
    const course = await db.course.findUnique({ where: { id } })
    if (!course) return NextResponse.json({ error: "Program not found." }, { status: 404 })

    const parsed = createSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 })
    }
    const data = parsed.data

    // Chapters live in the curriculum JSON and have no row of their own, so a
    // stale chapterId would silently orphan the quiz. Check it still resolves.
    if (data.kind === "CHAPTER_QUIZ" && data.chapterId) {
      const chapters = Array.isArray(course.curriculum) ? course.curriculum as { id?: string }[] : []
      if (!chapters.some(c => c?.id === data.chapterId)) {
        return NextResponse.json({ error: "That chapter no longer exists in this programme." }, { status: 400 })
      }
    }

    // One project per course — the 50% project weight has nowhere to split.
    if (data.kind === "PROJECT") {
      const existing = await db.assessment.count({ where: { courseId: id, kind: "PROJECT" } })
      if (existing > 0) {
        return NextResponse.json({ error: "This programme already has a project." }, { status: 409 })
      }
    }

    const assessment = await db.assessment.create({
      data: {
        courseId:       id,
        kind:           data.kind,
        title:          data.title,
        instructions:   data.instructions ?? null,
        chapterId:      data.kind === "CHAPTER_QUIZ" ? data.chapterId ?? null : null,
        questions:      data.kind === "CHAPTER_QUIZ" ? data.questions : undefined,
        rubric:         data.kind === "PROJECT"      ? data.rubric    : undefined,
        drawCount:      data.drawCount ?? null,
        shuffleOptions: data.shuffleOptions ?? true,
        orderIndex:     data.orderIndex ?? 0,
      },
    })

    return NextResponse.json({ assessment }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/programs/[id]/assessments]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
