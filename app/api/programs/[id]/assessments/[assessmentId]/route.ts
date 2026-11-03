import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireCourseEditor } from "@/lib/guard"
import { db } from "@/lib/db"

type Context = { params: Promise<{ id: string; assessmentId: string }> }

const questionSchema = z.object({
  id:           z.string().min(1),
  prompt:       z.string().min(1),
  options:      z.array(z.string().min(1)).min(2).max(8),
  correctIndex: z.number().int().min(0),
  points:       z.number().min(0.25).max(100).default(1),
}).refine(q => q.correctIndex < q.options.length, {
  message: "correctIndex must point at one of the options.",
})

const updateSchema = z.object({
  title:          z.string().min(2).max(255).optional(),
  instructions:   z.string().nullable().optional(),
  chapterId:      z.string().nullable().optional(),
  questions:      z.array(questionSchema).optional(),
  rubric:         z.array(z.object({
    id: z.string().min(1), criterion: z.string().min(1), maxPoints: z.number().min(1).max(100),
  })).optional(),
  drawCount:      z.number().int().min(1).nullable().optional(),
  shuffleOptions: z.boolean().optional(),
  orderIndex:     z.number().int().min(0).optional(),
})

export async function PATCH(req: NextRequest, { params }: Context) {
  try {
    const { id, assessmentId } = await params
    const guard = await requireCourseEditor(id)
    if (!guard.ok) return guard.response
    const existing = await db.assessment.findUnique({ where: { id: assessmentId } })
    if (!existing || existing.courseId !== id) {
      return NextResponse.json({ error: "Assessment not found." }, { status: 404 })
    }

    const parsed = updateSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 })
    }
    const d = parsed.data

    // Attempts pin their own questions at start, so editing here can't corrupt
    // an in-flight attempt — but it does change what later attempts sit, and
    // it reshuffles the best-of comparison. Warn rather than block.
    const graded = await db.assessmentAttempt.count({
      where: { assessmentId, status: { in: ["GRADED", "SUBMITTED"] } },
    })

    const assessment = await db.assessment.update({
      where: { id: assessmentId },
      data: {
        ...(d.title          !== undefined && { title: d.title }),
        ...(d.instructions   !== undefined && { instructions: d.instructions }),
        ...(d.chapterId      !== undefined && { chapterId: d.chapterId }),
        ...(d.questions      !== undefined && { questions: d.questions }),
        ...(d.rubric         !== undefined && { rubric: d.rubric }),
        ...(d.drawCount      !== undefined && { drawCount: d.drawCount }),
        ...(d.shuffleOptions !== undefined && { shuffleOptions: d.shuffleOptions }),
        ...(d.orderIndex     !== undefined && { orderIndex: d.orderIndex }),
      },
    })

    return NextResponse.json({ assessment, gradedAttempts: graded })
  } catch (error) {
    console.error("[PATCH /api/programs/[id]/assessments/[assessmentId]]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Context) {
  try {
    const { id, assessmentId } = await params
    const guard = await requireCourseEditor(id)
    if (!guard.ok) return guard.response
    const existing = await db.assessment.findUnique({ where: { id: assessmentId } })
    if (!existing || existing.courseId !== id) {
      return NextResponse.json({ error: "Assessment not found." }, { status: 404 })
    }

    // Attempts cascade, so deleting a graded assessment destroys marks that
    // students' final grades were computed from. Refuse and let the admin
    // decide, rather than silently wiping the record.
    const attempts = await db.assessmentAttempt.count({ where: { assessmentId } })
    if (attempts > 0) {
      return NextResponse.json(
        { error: `${attempts} student attempt${attempts === 1 ? "" : "s"} exist for this assessment. Remove them first if you really mean to delete it.` },
        { status: 409 },
      )
    }

    await db.assessment.delete({ where: { id: assessmentId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/programs/[id]/assessments/[assessmentId]]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
