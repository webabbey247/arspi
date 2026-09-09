// One-time (idempotent) backfill: stamps a stable `id` onto every curriculum
// chapter/lesson that doesn't already have one, so existing programs work with
// lesson-level student progress tracking without needing to be re-saved by an
// admin first. Safe to re-run — courses with fully-stamped curriculum are skipped.
//
// Run with: npx tsx prisma/scripts/backfill-curriculum-ids.ts

import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import { randomUUID } from "crypto"

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })

type Lesson  = { id?: string; [key: string]: unknown }
type Chapter = { id?: string; lessons?: Lesson[]; [key: string]: unknown }

async function main() {
  const courses = await db.course.findMany({
    where:  { curriculum: { not: undefined } },
    select: { id: true, title: true, curriculum: true },
  })

  let updated = 0
  for (const course of courses) {
    if (!Array.isArray(course.curriculum)) continue

    let changed = false
    const next = (course.curriculum as Chapter[]).map(chapter => {
      if (!chapter.id) changed = true
      const lessons = Array.isArray(chapter.lessons)
        ? chapter.lessons.map(lesson => {
            if (!lesson.id) changed = true
            return { ...lesson, id: lesson.id ?? randomUUID() }
          })
        : chapter.lessons
      return { ...chapter, id: chapter.id ?? randomUUID(), lessons }
    })

    if (changed) {
      await db.course.update({ where: { id: course.id }, data: { curriculum: next } })
      updated++
      console.log(`Backfilled curriculum ids — "${course.title}"`)
    }
  }

  console.log(`Done. ${updated}/${courses.length} programs updated.`)
}

main()
  .catch(err => { console.error(err); process.exitCode = 1 })
  .finally(() => db.$disconnect())
