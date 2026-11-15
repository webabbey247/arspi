import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireProgramPreview } from "@/lib/program-preview"
import { findQuizBlock } from "@/services/lesson-progress.service"

type Context = { params: Promise<{ slug: string; blockId: string }> }

const bodySchema = z.object({
  selectedIndex: z.number().int().min(0),
  variantIndex:  z.number().int().min(0).max(20).default(0),
})

/** POST — check a quiz answer in a staff preview. Same rule as the learner
 *  route (original question or a variant), but nothing is recorded. */
export async function POST(req: NextRequest, { params }: Context) {
  try {
    const { slug, blockId } = await params
    const auth = await requireProgramPreview(slug)
    if (!auth.ok) return auth.response

    const parsed = bodySchema.safeParse(await req.json())
    if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 })

    const found = findQuizBlock(auth.program.curriculum, blockId)
    if (!found) return NextResponse.json({ error: "Quiz not found in this program." }, { status: 404 })

    const { selectedIndex, variantIndex } = parsed.data
    const key = variantIndex <= 0 ? found.correctIndex : found.variantKeys[variantIndex - 1] ?? -1
    return NextResponse.json({ correct: key >= 0 && key === selectedIndex })
  } catch (error) {
    console.error("[POST /api/preview/programs/[slug]/quizzes/[blockId]]", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
