# Implementation Checklist — ARPS Institute Platform

A feature-by-feature catalog of what's built in this repository, organized by area
rather than by when it was built. For chronological build history and the reasoning
behind specific decisions, see `task.md`. For the security audit, see
`SECURITY-REVIEW.md`.

Legend: `[x]` shipped and verified · `[~]` shipped, partial/known gap noted inline ·
`[ ]` not built (listed for completeness where a natural counterpart exists).

---

## 1. Public marketing site

- [x] Home, About, Support, Team, Contact, Solutions (+ `mentortrack`, `resolverite`
      sub-pages) — static/informational pages.
- [x] **Programs** — public catalog (`/programs`, `/programs/[slug]`), filterable by
      category/level/pricing, program detail page (curriculum, facilitators, FAQs,
      rating/enrolled/countries stats), Stripe checkout for paid programs
      (`/api/programs/[id]/checkout`), free-program direct enrollment.
- [x] **Workshops** — public catalog (`/workshop`, `/workshop/[slug]`, `/workshop/archive`,
      `/workshop/success`), registration flow with Stripe checkout for paid workshops
      (`/api/workshops/[id]/checkout`), confirmation emails on successful payment via the
      Stripe webhook.
- [x] **Insights** (blog/articles) — public listing + detail (`/insights`,
      `/insights/[slug]`), categorized, author bylines.
- [x] **Careers** — public listing + detail (`/careers`, `/careers/[slug]`), department
      filter, public application submission (résumé/cover-letter upload via
      `documentUploader`, intentionally unauthenticated — see SECURITY-REVIEW.md #7).
- [x] **Our Research** — `Research Trainings` (formerly the standalone public research
      page) and `Research Projects` under an "Our Research" navbar dropdown; research
      projects filterable by division/department/service/status, each with a counted
      filter sidebar and pagination; "Organizations we've worked with" section.
- [x] **Global Offices** — public listing of office locations by region, integrated into
      the Contact page.
- [x] Contact form (`/contact` → `/api/contact`, rate-limited, stored as
      `ContactMessage`) and newsletter signup (`/api/newsletter/subscribe`, rate-limited).
- [x] Public certificate verification (`/verify/[token]` + `/api/certificates/verify/[token]`
      + `.../download` for the PDF) — no login required, by design (a certificate's whole
      point is third-party-verifiable).
- [x] `/unauthorized` — shown when an authenticated user's role doesn't permit a route.

## 2. Authentication & session

- [x] Email/password registration — 2-step onboarding (`basic-information` →
      `learning-interests`), the second step triggers a verification email.
- [x] Email verification (`/email-verification`, `/api/auth/verify-email`,
      `/api/auth/resend-verification` — rate-limited).
- [x] Login / logout (`/api/auth/login`, `/api/auth/logout`).
- [x] Forgot / reset password (`/api/auth/forgot-password`, `/api/auth/reset-password`) —
      hashed, expiring, single-use tokens (`PasswordResetToken`); response doesn't leak
      whether an email exists.
- [x] **3-cookie session architecture** (`lib/session.ts`, `lib/session-cookie.ts`,
      `lib/env.ts`): short-lived signed-JWT **access** token (15 min), longer-lived
      signed-JWT **refresh** token (1 day, or 30 with "remember me", rotates every use),
      and an HMAC-signed **session** cookie mirroring the refresh lifetime for read-only
      display use in Server Components. `getSession()` (read-only, safe anywhere) vs.
      `getSessionAndRefresh()` (persists rotated cookies, Route Handlers/Server Actions
      only) — split to respect Next's "no cookie writes during a Server Component render"
      rule.
- [x] **Login lockout** (`lib/login-rate-limit.ts`) — locks an email+IP pair out after
      `LOGIN_MAX_ATTEMPTS` (default 5) genuine credential failures for
      `LOGIN_LOCKOUT_SECONDS` (default 900); a disabled-account 403 does **not** count
      against the lockout (a correct password was already proven).
- [x] Disabled-account handling — `loginUser()` checks `status !== "ACTIVE"` **after**
      password verification (not before), so a prober can't learn an account is disabled
      just from its email.
- [x] **`proxy.ts`** (this Next.js version's `middleware.ts`) — Edge-safe fast pre-filter:
      verifies the access token, falls back to refresh-token-signature verification (no
      DB) before redirecting, and enforces **strict one-role-per-route-prefix** RBAC
      (`/administrator` → ADMIN only, `/instructor` → INSTRUCTOR only, `/student` → USER
      only — no hierarchy leakage). Backed by an authoritative, DB-backed
      `requireRole()` check in every dashboard layout — the proxy is documented as "not
      the sole security boundary."
- [x] `lib/guard.ts` — `requireApiRole()`/`requireApiSession()` for API routes, applied to
      the AI/student routes built this session; ~40 older routes still use their original
      equivalent inline check (unchanged, still correct — not a gap, just not
      de-duplicated yet).
- [x] **Google + LinkedIn social login** (`arctic` OAuth client) — full authorization-code
      handshake with state + nonce + PKCE (Google), short-lived single-use handshake
      cookies, auto-link-by-verified-email to an existing password account, or create a
      new user (`emailVerified: true` immediately, skips this app's own verification-email
      flow since the provider already proved the email). Every failure mode redirects to
      `/login?error=...` — never a raw 500.
      - `[ ]` Not yet tested end-to-end against real Google/LinkedIn OAuth apps — needs
        real `GOOGLE_CLIENT_ID`/`SECRET` and `LINKEDIN_CLIENT_ID`/`SECRET` (the user
        creates these; placeholders are in `.env.example`).

## 3. Role-based dashboards

Shared shell: `app/(dashboard)/layout.tsx` (any authenticated role) → per-role layout
(`requireRole()`) → `DashboardShell` (sidebar + header, mobile-responsive, closes the
mobile sidebar on route change). Skeleton loaders (`components/ui/skeleton.tsx`) applied
across all three roles' loading states.

### Administrator (`/administrator`)
- [x] Dashboard overview (analytics cards, recent activity).
- [x] **Programs** — full CRUD, multi-step form (curriculum builder with
      chapters/lessons/content-blocks), Draft/Published workflow, AI Course Builder (§4),
      "Expand with AI" per-block (§4), curriculum-item stable IDs for progress tracking.
- [x] **Workshops** — full CRUD, registration management.
- [x] **Users** — list/detail/edit, role assignment, enable/disable, admin-initiated
      password reset (`/api/admin/users/[id]/password`).
- [x] **Certificates** — searchable list of every issued certificate, revoke action.
- [x] **Careers** — postings CRUD, departments CRUD, per-posting applications list.
- [x] **Insights** — articles CRUD.
- [x] **Team** — team members CRUD.
- [x] **Projects** — research projects CRUD (divisions/departments/services taxonomies).
- [x] **Organizations** — "worked with" organizations CRUD.
- [x] **Global Offices** — office locations CRUD.
- [x] **Enquiries** — contact-form submissions inbox.
- [x] **Subscribers** — newsletter subscriber list.
- [x] **Settings** — shared route, see §5.

### Instructor (`/instructor`)
- [x] Dashboard overview.
- [x] **Programs** — CRUD scoped to the instructor's own programs only
      (`assertOwnership()` — an instructor cannot read or edit another instructor's
      program even though both share the INSTRUCTOR role), same curriculum builder +
      AI-expand-block access as admin.
- [x] **Workshops** — CRUD, registrations view.
- [x] **Settings** — shared route, see §5.

### Student (`/student`)
- [x] **Dashboard overview** — continue-learning notification bar (most recently-touched
      active program, or most-recently-enrolled if no lesson progress yet; falls back
      gracefully for programs with no lesson-level curriculum data), 3 stat cards
      (programs/workshops/certificates), recent + upcoming workshops tables side by side,
      recent programs table, and a hand-built month calendar showing the student's own
      registered upcoming workshops.
- [x] **My Programs** (`/student/programs`) — card grid (thumbnail, kebab-menu actions:
      Continue / View certificate / Share / Favorite / Archive), progress bar, real
      per-student 1-5 star rating (`Enrollment.studentRating`, distinct from the
      admin-set `Course.rating`), filter chips (All/Favorites/Archived).
- [x] **Course player** (`/student/programs/[slug]`) — two-pane layout: the selected
      lesson's content (title, "Mark as complete"/quiz-status pill, description,
      content blocks, Previous/Next) in the main column, with a "Course content"
      navigator (collapsible chapters, per-chapter completion fraction, per-lesson
      status dot) in a right-hand column (stacks above the content on mobile). Auto-
      selects the first not-yet-done lesson in an unlocked chapter on load.
- [x] **Sequential chapter gating** — chapter *N* stays locked (collapsed, disabled,
      lock icon, "Complete the previous chapter to unlock") until every lesson in
      chapter *N-1* is done; lessons within a chapter can be done in any order. The
      first chapter is always open. **Enforced server-side, not just in the UI** — both
      `PATCH .../lessons/[lessonId]` and `PATCH .../quizzes/[blockId]` independently
      recompute unlock state from the DB (`isLessonUnlocked()`) before accepting a
      request that would advance progress; un-checking a lesson is exempt since it's
      reversible and doesn't skip ahead.
- [x] **Interactive quizzes** — quiz content-blocks are no longer static text: the
      student picks an answer and submits it; correctness is checked server-side
      against the admin-set `correctIndex` (never trust a client-side "I got it right"
      claim, and never send `correctIndex` to the student at all — `stripQuizAnswers()`
      strips it from the curriculum the GET route returns), with unlimited retries on a
      wrong answer. A lesson containing a quiz has no separate manual completion
      checkbox and the lessons-PATCH route rejects trying to force one complete
      manually — it can only auto-complete by answering its quiz correctly, which is
      what the chapter-gating above keys off of. `LessonProgress.passedQuizIds` (new
      field) tracks which quiz blocks a student has passed, alongside `completedIds`.
- [x] **Lesson progress tracking** (`LessonProgress`, `services/lesson-progress.service.ts`)
      — completing 100% of a program's lessons auto-flips the `Enrollment` to
      `COMPLETED` and auto-issues a `Certificate`.
- [x] **My Certificates** (`/student/certificates`) — card grid, links to the public
      verify page and PDF download.
- [x] **My Workshops** (`/student/workshops`) — registrations, matched by email (no
      `userId` FK on `WorkshopRegistration` — a pre-existing pattern, not changed).
- [x] **Settings** — shared route, see §5.

## 4. AI features (admin + instructor)

- [x] **AI Course Builder** — generates a full program draft (title, excerpt, tagline,
      overview, objectives, audience, highlights, curriculum with chapters+lessons, FAQs)
      from a topic/category/level/notes prompt. Saves as `DRAFT` (never auto-published —
      always opens the review modal first). Dual-provider: Claude Opus 5
      (`messages.parse` + `zodOutputFormat`) or GPT-4.1 mini (`responses.parse` +
      `zodTextFormat`), selectable per generation.
- [x] **Reference-link enrichment** — a second, best-effort web-search call
      (Claude's `web_search_20260209` tool / OpenAI's `web_search` Responses tool) maps
      real, verified resource links to specific lessons (max 2/lesson). Search failures
      never fail the overall draft.
- [x] **"Expand with AI" content-block action** — per-block, on-demand deep expansion
      (not part of the initial generation call, to keep that fast/cheap): a toolbar
      button on lesson `text` blocks and `assignment` instructions in
      `ContentBlockEditor` calls `POST /api/programs/ai-expand-block` with the
      course/chapter/lesson context, writes 200-400 word lesson bodies (well beyond the
      initial generator's 2-4 sentence cap) or expands existing short content — reviewed
      by the author before saving, same as the course builder itself.
      - `[ ]` Diagrams/images (Mermaid or a real image-gen API) — deliberately scoped out
        twice now; would be a new content-block type end-to-end, not a prompt change.
- [x] Both AI routes are rate-limited (20/hour and 40/hour per user respectively) since
      each call spends real money.

## 5. Cross-role shared features

- [x] **Settings** (`/settings`) — a single consolidated route (not three
      near-duplicate per-role pages) gated by `requireAuth()` (any authenticated role):
      profile (avatar upload, name/phone/bio/job title), contact information, change
      password, configuration (language/timezone/email opt-in), billing (placeholder —
      no payment methods stored yet), and a danger zone (sign out, disable account).
- [x] **Certificates** — issuance (auto on 100% course completion, or manual by admin),
      PDF generation (`@react-pdf/renderer`), public verification page + API, revoke
      action.

## 6. Payments

- [x] **Stripe** — Checkout Sessions for paid programs and paid workshops; webhook
      (`/api/webhooks/stripe`) verifies the signature, then confirms/cancels the
      registration or enrollment and records the `Payment`. Prices are always read
      server-side from the DB at checkout-session-creation time — never trusted from
      client input.

## 7. Email

- [x] SMTP via `nodemailer` — verification emails, password-reset emails, workshop
      registration confirmations (`lib/email.ts`).

## 8. File uploads

- [x] **UploadThing** (`lib/uploadthing.ts`) — three routers with server-side type/size
      enforcement (not just client-side hints): `imageUploader` (4MB, any signed-in
      user — avatars/thumbnails), `pdfUploader` (32MB, ADMIN/INSTRUCTOR only — lesson PDF
      blocks), `documentUploader` (8MB, PDF/Word, intentionally unauthenticated — public
      career applications).

## 9. Data model (Prisma / Supabase Postgres)

Driver-adapter pattern (`@prisma/adapter-pg`) throughout — no bare `new PrismaClient()`.
Schema changes applied via `prisma db push` (no shadow-DB migration workflow in this
repo). Core model groups:
- **Identity**: `User`, `Profile`, `Account` (OAuth identity links — repurposed from an
  unused NextAuth-starter scaffold; the `Session`/`VerificationToken` half of that
  scaffold was dropped as dead weight), `PasswordResetToken`.
- **Programs**: `Course` (+ `CourseStatus` draft/published), `Category`, `ProgramLevel`,
  `ProgramFormat`, `ProgramPricing`, `CourseTag`, `Enrollment`, `LessonProgress`,
  `Certificate`, `Payment`. (`Section`/`Lesson`/`LessonCompletion` — an earlier
  relational curriculum design — are dead/unused; the live design stores curriculum as
  structured JSON on `Course.curriculum` instead.)
- **Workshops**: `Workshop`, `WorkshopRegistration`.
- **Content**: `Insight`, `InsightCategory`, `Author`.
- **Careers**: `Career`, `CareerDepartment`, `CareerApplication`.
- **Team / Research / Orgs**: `TeamMember`, `Project` (+ `ProjectDivision`/
  `ProjectDepartment`/`ProjectService`), `Organization`, `GlobalOffice`.
- **Ops**: `ContactMessage`, `NewsletterSubscriber`.

## 10. Cross-cutting infrastructure

- [x] Rate limiting (`lib/rate-limit.ts`, in-memory fixed-window — per-instance on
      serverless, a documented/accepted trade-off) across every public write endpoint:
      contact, newsletter, forgot-password, resend-verification, registration (both
      onboarding steps), and both AI routes.
- [x] HTML sanitization (`lib/sanitize.ts`, `sanitize-html` — an allowlist-based
      sanitizer with no DOM/jsdom dependency, chosen after `isomorphic-dompurify`'s
      jsdom chain broke on Vercel with `ERR_REQUIRE_ESM`, see `SECURITY-REVIEW.md`) on
      every rich-text render path —
      9 call sites, all confirmed sanitized (see SECURITY-REVIEW.md).
- [x] Baseline HTTP security headers + `X-Powered-By` disabled (`next.config.ts`).
- [x] Skeleton loading states across all admin/instructor/student list and detail pages.
- [x] React Compiler lint rules (`react-hooks/purity`, `react-hooks/set-state-in-effect`)
      enforced and clean across the codebase.

## 11. SEO & search indexing

Shared helpers live in `lib/seo.ts` (canonical origin, `absoluteUrl()`,
`metaDescription()`, Organization schema) and `components/seo/JsonLd.tsx`
(escapes `<` so DB-authored content can't break out of the `<script>` tag).

- [x] **`metadataBase`** set from `NEXT_PUBLIC_APP_URL` in `app/layout.tsx` — without it
      Next.js resolves OG images and canonicals against `localhost`.
- [x] **Canonical origin fixed** — the root layout previously hardcoded
      `openGraph.url: "https://arpsinstitute.org"`, which is not the domain this site
      serves from. Everything now derives from `NEXT_PUBLIC_APP_URL`.
- [x] **`app/robots.ts`** — allows the public site, disallows `/api/`, the three
      dashboards, `/settings`, all auth routes, `/unauthorized`, `/verify/`, and both
      checkout-success pages; points to the sitemap.
- [x] **`app/sitemap.ts`** — 15 static public routes plus every published programme,
      insight, workshop, research project and career posting pulled from the database,
      each with `lastModified`. Revalidates hourly, so new content is picked up without
      a redeploy. A failing query for one content type degrades to an empty list for
      that type rather than blanking the whole sitemap.
- [x] **`app/opengraph-image.tsx`** — generated 1200×630 default social card, inherited
      by any page that doesn't set its own image (previously shared links had no preview
      image at all). System fonts only, so it can't fail on a webfont fetch.
- [x] **Per-page metadata** — `programs/[slug]` now emits description, canonical, OG and
      Twitter tags (it was title-only); `insights/[slug]` gained a server shell
      (`InsightDetailClient.tsx` holds the original UI) so every article has its own
      title/description/OG image instead of inheriting the homepage's verbatim, which
      read to search engines as dozens of duplicate pages.
- [x] **Structured data (JSON-LD)** — `EducationalOrganization` site-wide,
      `Course` on programme pages (provider, price, rating, instructor, course instance —
      eligible for Google course rich results), `Article` on insights (author, publish
      and modified dates, section).
- [x] **`noindex`** on the `(dashboard)` and `(auth)` route groups, `/unauthorized`, and
      `/verify/[token]` (certificate pages name a real individual).
- [ ] **Google Search Console verification + sitemap submission — PENDING.** Needs the
      site claimed under a Google account, then either the `google-site-verification`
      meta tag added to `app/layout.tsx` (`metadata.verification.google`) or the HTML
      file dropped in `public/`. Until this is done there's no crawl/index visibility,
      no way to submit the sitemap for prioritised crawling, and no manual
      "request indexing" for new programmes.

> **Deployment prerequisite:** `NEXT_PUBLIC_APP_URL` must be the real public origin in
> the production environment. Every canonical, sitemap entry and OG URL is built from
> it — if it's wrong, those all point at the wrong host.

---

## Known gaps / explicitly out of scope

- OAuth consent-screen round trip not yet tested against real provider credentials.
- No CSP or HSTS header yet — see `SECURITY-REVIEW.md` for why, and the recommended path
  to add them safely.
- Diagram/image generation for AI-built lesson content — scoped out twice, would be a
  new content-block type.
- `documentUploader` (public career applications) has no rate limit yet — low priority,
  bounded by UploadThing's own file caps.
- ~40 older API routes use their original inline `session.role !== "X"` check rather
  than the newer `lib/guard.ts` helpers — functionally identical, not a bug, just not
  de-duplicated.
- **Google Search Console not yet set up** (§11) — the only outstanding SEO item.
- Article *body* content on `/insights/[slug]` still renders client-side (the server
  shell supplies metadata and JSON-LD only). Googlebot does execute JavaScript, so these
  pages are indexable, but server-rendering the body would index faster and more
  reliably. Would mean moving the data fetch out of the client component.
- No per-page OG images for programmes/articles beyond their own cover image — pages
  without a cover fall back to the site-wide card rather than a generated per-title one.
