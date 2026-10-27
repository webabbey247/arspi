import type { ContentBlock } from "@/components/forms/ContentBlockEditor"

/** Browser-side orchestration for the multi-agent course builder.
 *
 *  The work is split across four short requests rather than one long one, and
 *  driven from here: outline → chapters (fanned out) → lessons (fanned out) →
 *  cover image. Each call stays well inside a function timeout, each unit can
 *  be retried on its own, and progress is genuinely per-item instead of a
 *  spinner over an opaque request. */

export type Provider = "anthropic" | "openai"
export type LessonFocus = "teach" | "practice" | "assess" | "reflect"

export type GlossaryEntry = { term: string; definition: string }

export type PlannedLesson = {
  id:            string
  title:         string
  description:   string
  focus:         LessonFocus
  brief:         string
  mustCover:     string[]
  mustNotCover:  string[]
  wantsDiagram:  boolean
}

export type OutlineResult = {
  title: string; excerpt: string; tagline: string; overview: string
  learningObjectives: string[]; targetAudience: string[]; whatIsIncluded: string[]
  glossary: GlossaryEntry[]
  chapters: { id: string; title: string; desc: string; outcome: string }[]
  faqs: { q: string; a: string }[]
  categoryId: string; level: string; levelLabel: string; categoryName: string
}

export type BuiltLesson = PlannedLesson & { blocks: ContentBlock[] }
export type BuiltChapter = { id: string; title: string; desc: string; lessons: BuiltLesson[] }

export type Progress = {
  phase:   "outline" | "chapters" | "lessons" | "media" | "done"
  message: string
  done?:   number
  total?:  number
}

async function postJson<T>(url: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
    signal,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as { error?: string }).error ?? "Request failed.")
  return data as T
}

/** Runs `fn` over `items` with at most `limit` in flight. Provider rate limits,
 *  not cost, are what bound this. */
async function mapWithConcurrency<T, R>(
  items: T[], limit: number, fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let cursor = 0
  async function worker() {
    for (;;) {
      const i = cursor++
      if (i >= items.length) return
      results[i] = await fn(items[i], i)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}

/** Validates every Mermaid diagram the model produced, repairing what fails.
 *
 *  Lesson agents pick any Mermaid type they like, so malformed source is
 *  expected rather than exceptional. mermaid is already loaded in the browser,
 *  which makes validation free — one repair attempt fixes most failures, and
 *  anything still broken is dropped rather than shipped to a learner. */
async function validateDiagrams(
  blocks: ContentBlock[], provider: Provider, signal?: AbortSignal
): Promise<ContentBlock[]> {
  const diagrams = blocks.filter(b => b.type === "diagram")
  if (diagrams.length === 0) return blocks

  const mermaid = (await import("mermaid")).default
  mermaid.initialize({ startOnLoad: false, securityLevel: "strict", theme: "neutral" })

  const out: ContentBlock[] = []
  for (const block of blocks) {
    if (block.type !== "diagram") { out.push(block); continue }

    try {
      await mermaid.parse(block.code)
      out.push(block)
      continue
    } catch (e) {
      const parseError = e instanceof Error ? e.message : String(e)
      try {
        const { code } = await postJson<{ code: string }>(
          "/api/programs/ai-generate/diagram",
          { provider, code: block.code, error: parseError, caption: block.caption },
          signal
        )
        await mermaid.parse(code)       // must survive a second parse to ship
        out.push({ ...block, code })
      } catch {
        // Unrepairable — drop the block. A missing diagram is a far smaller
        // problem than a broken one in front of a student.
      }
    }
  }
  return out
}

export type BuildInput = {
  topic: string; categoryId: string; level: string; notes?: string
  provider: Provider
  /** Generate a cover image. The form requires a thumbnail, so without this the
   *  admin has to supply one by hand before the draft can be saved. */
  withCoverImage: boolean
  /** Render each chapter's lesson text to a downloadable PDF handout. */
  withHandouts: boolean
}

/** react-pdf renders primitives, not markup, so lesson HTML is flattened to
 *  plain text with paragraph breaks preserved before it reaches the handout. */
function blocksToPlainText(blocks: ContentBlock[]): string {
  return blocks
    .filter(b => b.type === "text")
    .map(b => (b as Extract<ContentBlock, { type: "text" }>).content
      .replace(/<\/(p|div|h[1-6]|li)>/gi, "\n\n")
      .replace(/<li[^>]*>/gi, "- ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
      .replace(/\n{3,}/g, "\n\n")
      .trim())
    .filter(Boolean)
    .join("\n\n")
}

type RefMap = Record<string, { title: string; url: string }[]>

export type BuildResult = {
  outline:   OutlineResult
  chapters:  BuiltChapter[]
  thumbnail: string | null
}

/** Runs the whole pipeline, reporting progress as it goes. */
export async function buildCourse(
  input: BuildInput,
  onProgress: (p: Progress) => void,
  signal?: AbortSignal
): Promise<BuildResult> {
  // ── Phase 1 — outline ────────────────────────────────────────────────────
  onProgress({ phase: "outline", message: "Planning the programme outline…" })
  const { outline } = await postJson<{ outline: OutlineResult }>(
    "/api/programs/ai-generate/outline",
    {
      topic: input.topic, categoryId: input.categoryId,
      level: input.level, notes: input.notes, provider: input.provider,
    },
    signal
  )

  // The cover runs alongside the text work rather than after it — image
  // generation is slow and nothing downstream depends on it.
  const coverPromise = input.withCoverImage
    ? postJson<{ url: string }>(
        "/api/programs/ai-generate/image",
        {
          kind: "cover", courseTitle: outline.title,
          context: outline.overview.replace(/<[^>]+>/g, " ").slice(0, 800),
          categoryName: outline.categoryName,
        },
        signal
      ).then(r => r.url).catch(() => null)   // a missing cover must not fail the course
    : Promise.resolve(null)

  // ── Phase 2 — one agent per chapter ──────────────────────────────────────
  const chapterCount = outline.chapters.length
  let chaptersDone = 0
  onProgress({
    phase: "chapters",
    message: `Outline ready — planning ${chapterCount} chapter${chapterCount === 1 ? "" : "s"}…`,
    done: 0, total: chapterCount,
  })

  const plans = await mapWithConcurrency(outline.chapters, 3, async chapter => {
    const { lessons } = await postJson<{ lessons: PlannedLesson[] }>(
      "/api/programs/ai-generate/chapter",
      {
        provider:       input.provider,
        courseTitle:    outline.title,
        courseOverview: outline.overview.replace(/<[^>]+>/g, " ").slice(0, 2000),
        levelLabel:     outline.levelLabel,
        glossary:       outline.glossary,
        chapter:        { title: chapter.title, desc: chapter.desc.replace(/<[^>]+>/g, " "), outcome: chapter.outcome },
        siblingChapters: outline.chapters
          .filter(c => c.id !== chapter.id)
          .map(c => ({ title: c.title, outcome: c.outcome })),
      },
      signal
    )
    chaptersDone++
    onProgress({
      phase: "chapters",
      message: `Planned "${chapter.title}" — ${lessons.length} lesson${lessons.length === 1 ? "" : "s"}`,
      done: chaptersDone, total: chapterCount,
    })
    return { chapter, lessons }
  })

  // ── Phase 3 — one agent per lesson ───────────────────────────────────────
  const jobs = plans.flatMap(({ chapter, lessons }) =>
    lessons.map(lesson => ({ chapter, lesson }))
  )
  let lessonsDone = 0
  onProgress({
    phase: "lessons",
    message: `Writing ${jobs.length} lesson${jobs.length === 1 ? "" : "s"}…`,
    done: 0, total: jobs.length,
  })

  const written = await mapWithConcurrency(jobs, 5, async job => {
    let blocks: ContentBlock[] = []
    try {
      const res = await postJson<{ blocks: ContentBlock[] }>(
        "/api/programs/ai-generate/lesson",
        {
          provider:     input.provider,
          courseTitle:  outline.title,
          chapterTitle: job.chapter.title,
          levelLabel:   outline.levelLabel,
          glossary:     outline.glossary,
          lesson:       job.lesson,
        },
        signal
      )
      blocks = await validateDiagrams(res.blocks, input.provider, signal)
    } catch {
      // One failed lesson shouldn't cost the other fifteen. It lands empty and
      // the admin can regenerate it from the review step.
      blocks = []
    }
    lessonsDone++
    onProgress({
      phase: "lessons",
      message: `Wrote ${lessonsDone}/${jobs.length}: ${job.lesson.title}`,
      done: lessonsDone, total: jobs.length,
    })
    return { ...job.lesson, blocks }
  })

  // Reassemble in outline order — concurrency means they finish out of order.
  let cursor = 0
  const chapters: BuiltChapter[] = plans.map(({ chapter, lessons }) => ({
    id:    chapter.id,
    title: chapter.title,
    desc:  chapter.desc,
    lessons: lessons.map(() => written[cursor++]),
  }))

  // ── Phase 4 — enrichment: real URLs, chapter handouts, cover ─────────────
  // Everything here is additive. A failure costs the course an attachment, not
  // the course, so each branch swallows its own errors.
  onProgress({ phase: "media", message: "Finding reference links and building handouts…" })

  const allLessonTitles = chapters.flatMap(c => c.lessons.map(l => l.title))

  const referencesPromise = allLessonTitles.length > 0
    ? postJson<{ references: Record<string, { title: string; url: string }[]> }>(
        "/api/programs/ai-generate/references",
        {
          provider: input.provider, topic: input.topic,
          categoryName: outline.categoryName, levelLabel: outline.levelLabel,
          lessonTitles: allLessonTitles,
        },
        signal
      ).then(r => r.references).catch((): RefMap => ({}))
    : Promise.resolve<RefMap>({})

  const handoutsPromise = input.withHandouts
    ? mapWithConcurrency(chapters, 3, async chapter => {
        const lessons = chapter.lessons
          .map(l => ({ title: l.title, body: blocksToPlainText(l.blocks) }))
          .filter(l => l.body.trim().length > 0)
        if (lessons.length === 0) return null
        try {
          return await postJson<{ url: string; title: string; fileName: string; fileSize: string }>(
            "/api/programs/ai-generate/handout",
            { courseTitle: outline.title, chapterTitle: chapter.title, lessons },
            signal
          )
        } catch {
          return null
        }
      })
    : Promise.resolve(chapters.map(() => null))

  const [references, handouts, thumbnail] = await Promise.all([
    referencesPromise, handoutsPromise, coverPromise,
  ])

  // Attach: reference links onto their lesson, the handout onto the chapter's
  // first lesson so it sits at the top of the chapter's material.
  chapters.forEach((chapter, ci) => {
    chapter.lessons.forEach(lesson => {
      for (const ref of references[lesson.title] ?? []) {
        lesson.blocks.push({
          id: crypto.randomUUID(), type: "document", url: ref.url, title: ref.title,
        })
      }
    })
    const handout = handouts[ci]
    if (handout && chapter.lessons[0]) {
      chapter.lessons[0].blocks.push({
        id: crypto.randomUUID(), type: "pdf",
        url: handout.url, title: handout.title,
        fileName: handout.fileName, fileSize: handout.fileSize,
      })
    }
  })

  onProgress({ phase: "done", message: "Done" })
  return { outline, chapters, thumbnail }
}

/** Rewrites a single lesson. Same endpoint the build uses — which is why the
 *  brief is persisted on the lesson. */
export async function regenerateLesson(opts: {
  provider:     Provider
  courseTitle:  string
  chapterTitle: string
  levelLabel:   string
  glossary:     GlossaryEntry[]
  lesson: {
    title: string; description?: string; focus?: LessonFocus
    brief?: string; mustCover?: string[]; mustNotCover?: string[]
  }
  instruction?: string
}): Promise<ContentBlock[]> {
  const { blocks } = await postJson<{ blocks: ContentBlock[] }>(
    "/api/programs/ai-generate/lesson",
    {
      provider:     opts.provider,
      courseTitle:  opts.courseTitle,
      chapterTitle: opts.chapterTitle,
      levelLabel:   opts.levelLabel,
      glossary:     opts.glossary,
      lesson: {
        title:        opts.lesson.title,
        description:  opts.lesson.description,
        focus:        opts.lesson.focus ?? "teach",
        brief:        opts.lesson.brief,
        mustCover:    opts.lesson.mustCover    ?? [],
        mustNotCover: opts.lesson.mustNotCover ?? [],
        wantsDiagram: false,
      },
      instruction: opts.instruction,
    }
  )
  return validateDiagrams(blocks, opts.provider)
}
