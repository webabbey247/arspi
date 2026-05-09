# Programs Template

Source of truth for creating new sample programmes (stored as `Course` rows). Used by [`prisma/seed-programs.ts`](../prisma/seed-programs.ts) and as a reference when authoring programmes by hand.

> **Note.** "Programme" and "Course" are the same entity. The DB model is `Course`; the product surface calls them programmes.

---

## Prerequisites

Before a programme can be created, the DB must contain:

| Required          | Where checked                                                   |
| ----------------- | ---------------------------------------------------------------- |
| Admin user        | `User` with `role = ADMIN` — used as `instructorId`              |
| Category          | `Category` row with the target slug                              |
| ProgramLevel      | `ProgramLevel` row (`beginner` / `intermediate` / `advanced` / `all-levels`) |
| ProgramFormat     | `ProgramFormat` row (`self-paced` / `cohort-based` / `live-online` / `hybrid` / `in-person`) |
| ProgramPricing    | `ProgramPricing` row (`free` / `paid`)                           |

The seed script resolves all of these by `slug` at runtime — no hard-coded IDs.

---

## Field reference

### Required (Step 1 — Basic Info)

| Field          | Type          | Notes                                                                    |
| -------------- | ------------- | ------------------------------------------------------------------------ |
| `title`        | string        | 3–255 chars                                                              |
| `slug`         | string        | Auto-derived from title; lowercase + hyphens                             |
| `tagline`      | string        | ≤ 500 chars; subtitle shown beneath the title                            |
| `excerpt`      | string        | ≥ 10 chars; shown on listing cards                                       |
| `thumbnail`    | string (URL)  | Cover image; uploaded via UploadThing in the form                        |
| `level`        | enum          | `BEGINNER` \| `INTERMEDIATE` \| `ADVANCED`                               |
| `categoryId`   | FK → Category | Resolved from `categorySlug`                                             |
| `pricing`      | enum          | `free` \| `paid`                                                         |
| `paymentType`  | enum \| null  | `one-time` \| `subscription` \| `monthly` — required when `pricing=paid` |
| `price`        | number        | Required when `pricing=paid`; `0` for free                               |

### Toggles

| Field                  | Type    | Effect                                                                                       |
| ---------------------- | ------- | -------------------------------------------------------------------------------------------- |
| `featured`             | boolean | Highlights the programme on the home page                                                    |
| `predefinedAnalytics`  | boolean | When `true`, Metrics + Social Proof inputs are persisted and rendered. When `false`, those fields are forced to `null` regardless of what's in the form. |

### Analytics-gated (only when `predefinedAnalytics = true`)

| Field            | Type    | Notes                                |
| ---------------- | ------- | ------------------------------------ |
| `rating`         | float   | 0–5                                  |
| `reviewCount`    | int     | ≥ 0                                  |
| `enrolledCount`  | int     | ≥ 0                                  |
| `countriesCount` | int     | ≥ 0                                  |

### Programme details (Step 1 hides these for now; data layer keeps them)

| Field         | Type             | Notes                                          |
| ------------- | ---------------- | ---------------------------------------------- |
| `duration`    | string \| null   | Free-text: `"6"` (weeks), `"8 hours"`, `"1.5"` |
| `format`      | string \| null   | Display label matching the lookup name         |
| `startDate`   | ISO date \| null | Required for cohort/live/hybrid in legacy form |
| `endDate`     | ISO date \| null | Required for cohort/live/hybrid in legacy form |
| `cohortSize`  | int \| null      | Required for `Cohort Based` only               |

### Rich content (Steps 2–5)

| Field               | Shape                                                                 |
| ------------------- | --------------------------------------------------------------------- |
| `overview`          | HTML string (TipTap)                                                  |
| `targetAudience`    | `string[]` — at least one entry                                       |
| `learningObjectives`| `string[]` — at least one entry                                       |
| `whatIsIncluded`    | `string[]` — at least one entry; **labelled "Highlights" in UI**      |
| `faqs`              | `{ q: string; a: string }[]` — at least one entry                     |
| `facilitators`      | `{ name; title; bio (HTML); imageUrl?; credentials? }[]`              |
| `curriculum`        | `{ title; desc?; lessons: { title; description?; blocks? }[] }[]`     |

---

## Editorial conventions

- **Tagline.** One short imperative sentence. Don't restate the title.
- **Excerpt.** 1–2 sentences. State the format and audience explicitly.
- **Overview.** HTML with `<p>` paragraphs. Lead with what the participant walks away with, not credentials of the institute.
- **Learning objectives.** Verb-led, observable. Avoid "understand" / "be aware of" — use "design", "apply", "produce", "communicate".
- **Highlights (`whatIsIncluded`).** Concrete deliverables — sessions, assignments, certificate, hours of access. Avoid marketing claims.
- **FAQs.** Real questions a prospective participant would ask. Each answer ≥ 2 sentences when possible.
- **Pricing.** USD. `free` → `price=0`, `paymentType=null`. `paid` → set `paymentType` to one of the three enum values.
- **Analytics.** Only set the metrics fields when `predefinedAnalytics = true`. The seed script enforces this.

---

## The 6 sample programmes

One per category. The full data lives in [`prisma/seed-programs.ts`](../prisma/seed-programs.ts).

| # | Title                                          | Category                           | Format       | Level         | Pricing                | Featured | Analytics |
| - | ---------------------------------------------- | ---------------------------------- | ------------ | ------------- | ---------------------- | -------- | --------- |
| 1 | Curriculum Design for Adult Learners           | Education and Learning Sciences    | Cohort Based | Intermediate  | Paid · one-time · $750  | —        | ✓         |
| 2 | Data Storytelling for Researchers              | Applied Research and Analytics     | Self-Paced   | Beginner      | Free                    | ✓        | —         |
| 3 | Strategic Leadership in the Public Sector      | Leadership and Management Sciences | Live Online  | Advanced      | Paid · subscription · $1800 | —    | ✓         |
| 4 | AI for Knowledge Workers                       | IT and Digital Innovation          | Cohort Based | All Levels    | Paid · one-time · $950  | ✓        | ✓         |
| 5 | Evidence-Based Policy Analysis                 | Social Sciences and Public Policy  | Hybrid       | Advanced      | Paid · one-time · $2200 | —        | —         |
| 6 | Participatory Action Research Methods          | Participatory Action Research      | In Person    | Intermediate  | Free                    | —        | ✓         |

The mix is intentional — every Step 1 toggle and every pricing/format combination is exercised at least once across the six.

---

## Running the seed

```bash
# Local dev
npx tsx prisma/seed-programs.ts

# Or add to package.json scripts:
#   "seed:programs": "tsx prisma/seed-programs.ts"
# then:
npm run seed:programs
```

The script is **idempotent** — every programme is upserted by `slug`, so re-running updates existing rows in place rather than creating duplicates.

If a category/level/format/pricing slug isn't found, the corresponding ID is set to `null` rather than throwing — re-run after the lookup tables are populated.

---

## Adding a 7th programme (or replacing one)

1. Open [`prisma/seed-programs.ts`](../prisma/seed-programs.ts).
2. Add a new entry to the `SAMPLES` array following the `SampleProgram` type.
3. Use a **unique slug** — the upsert key.
4. Pick a `categorySlug` from the prerequisites table above (case-sensitive).
5. Re-run `npx tsx prisma/seed-programs.ts`.

To delete a sample, remove the entry from `SAMPLES` and run a manual `DELETE FROM courses WHERE slug = '…';` in the SQL editor — the script does not delete rows.
