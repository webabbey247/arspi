Task 1
- Create dummy programs using the titles below referencing Applied Research and Analytics
• Monitoring and Evaluation (M&E)
• Impact Evaluation and Programme Assessment
• Policy Research and Public Sector Analysis
• Institutional Research and Higher Education Analytics
• Market Research and Consumer Analytics
• Research Data Analytics and Visualisation
• Artificial Intelligence for Research and Innovation
• Research Ethics and Responsible Conduct
• Research Project Management
• Research Analysts
• Qualitative Research Methods
• Quantitative Research Methods
• Mixed Methods Research
• Academic Writing and Scholarly Publishing

Task 2
- Create dummy programs using the titles below referencing Leadership and Management Sciences
• Strategic Leadership and Organisational Transformation
• Project Management and Implementation
• Public Sector Leadership and Governance
• Nonprofit Leadership and Management
• Human Resource Management and Workforce Development
• Organisational Development and Change Management
• Governance and Social Transformation
• Executive Leadership and Decision-Making
• Corporate Governance and Compliance
• Innovation and Change Leadership

Task 3
- Create dummy programs using the titles below referencing Information Technology and Digital Innovation
• Data Analytics
• Business Intelligence and Data Visualisation
• Artificial Intelligence for Professionals
• Digital Transformation and Innovation Management
• IT Governance, Risk and Compliance
• Cybersecurity Leadership and Risk Management
• Cloud Computing and AI Solutions
• Agile Product Management
• Digital Strategy and Emerging Technologies
• Data Governance and Information Management


Task 4
- Create dummy programs using the titles below referencing Social Sciences and Public Policy
• Public Policy Analysis and Governance
• Community Development and Social Innovation
• Governance and Institutional Transformation
• Conflict Resolution, Mediation and Peacebuilding
• Sustainable Development and Policy Leadership
• Rural Development and Community Transformation
• Social Justice and Inclusive Development
• Public Leadership and Civic Engagement


Task 5
- Create dummy programs using the titles below referencing Participatory Action Research (PAR)
• Participatory Action Research (PAR)
• PAR for NGOs and Community-Based Organisations
• PAR for Educational Research and Practice
• PAR for Social Justice and Community Transformation
• PAR for Policy and Institutional Transformation
• PAR for Public Health and Rural Development
• Community-Based Participatory Research (CBPR)
• Decolonial Research Methodologies
• Transformative and Participatory Research Approaches

Task 6 — DONE
- referencing this chat cobnnversions: https://claude.ai/share/2454ad6b-8b34-4669-95b8-bfa6897f840e
  (link is a client-rendered claude.ai share page — not fetchable server-side; implemented directly
  from the existing programs CRUD/schema instead)
- I want to add a AI course builder to app/(dashboard)/administrator/programs/page.tsx
- where AI generates the course using our existing structure, save it it as draft for review.
- update the checklist implementationn

Task 11
The reason OpenAI and Anthropic endpoints feel underwhelming right out of the box is because raw LLM completion calls natively suffer from context-window fatigue. When you ask a single model call to create an entire detailed syllabus, write full lesson details, draft complex quizzes, and design diagrams all in a single JSON payload, the model aggressively compresses its output (often giving you light summaries or placeholder text) just to prevent hitting token length limits. [1] (https://www.reddit.com/r/ClaudeAI/comments/1fwumyv/anyone_else_finding_claude_better_at_reasoning/), [2] (https://www.quora.com/How-do-I-get-better-results-from-ChatGPT-and-Claude-without-spending-hours-rewriting-prompts)Furthermore, LLMs cannot output native images or dynamic vectors natively. They must be instructed to output code-based diagram structures. [1] (https://www.youtube.com/watch?v=iuJszJuiuSg)To fix this inside a Next.js & Prisma stack using external APIs, you have two choices: use a specialized e-learning platform endpoint that manages this multi-step pipeline for you, or handle the orchestration using a chained/sequential API strategy. [1] (https://www.quora.com/How-do-I-get-better-results-from-ChatGPT-and-Claude-without-spending-hours-rewriting-prompts)
If you want to stick with OpenAI or Anthropic because of pricing or customization, the industry standard design pattern is Sequential Prompting. Instead of demanding everything in one massive request, you use Next.js Route Handlers to loop and map through multiple API calls. [1] (https://www.quora.com/How-do-I-get-better-results-from-ChatGPT-and-Claude-without-spending-hours-rewriting-prompts)To solve the Diagram and Quiz constraints cleanly in JSON, you should use Mermaid.js for the visual elements. Mermaid is a markdown-like text layout language that models understand perfectly. Your Next.js frontend can easily render these Mermaid strings into responsive vector diagrams using an open-source React package like 
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: Request) {
  try {
    const { topic, userId } = await request.json();

    // STEP 1: Generate the high-level tree structure first (Fast & Cheap)
    const structureCompletion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: "json_object" },
      messages: [{ role: 'user', content: `Create a course outline JSON for ${topic}. Return an object with a 'modules' array containing objects with only 'id' and 'title'.` }]
    });

    const outline = JSON.parse(structureCompletion.choices[0].message.content!);

    // STEP 2: Concurrently expand each module for hyper-detailed content, quizzes, and diagrams
    const hydratedModules = await Promise.all(
      outline.modules.map(async (mod: { id: string; title: string }) => {
        const detailCompletion = await openai.chat.completions.create({
          model: 'gpt-4o', // Use a larger model for deep, exhaustive detail
          response_format: { type: "json_object" },
          messages: [
            {
              role: 'user',
              content: `You are an expert instructional designer. Expand the module: "${mod.title}" for a course on "${topic}". 
              
              Your response must be a strict JSON object containing:
              1. 'detailedContent': Minimum 500 words of thorough, exhaustive technical information. Do not summarize.
              2. 'diagram': A valid text-based Mermaid.js syntax flow representing this module's architecture.
              3. 'quizzes': An array of 3 challenging multiple-choice questions with 'question', 'options', and 'correctAnswer'.`
            }
          ]
        });

        const details = JSON.parse(detailCompletion.choices[0].message.content!);
        return { ...mod, ...details };
      })
    );

    // STEP 3: Save the deeply detailed payload to your Prisma JSON column
    const fullCourseTree = { courseTitle: topic, modules: hydratedModules };
    const savedCourse = await prisma.course.create({
      data: {
        title: topic,
        userId: userId,
        treeData: fullCourseTree
      }
    });

    return NextResponse.json({ success: true, courseId: savedCourse.id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


Implementation checklist:
- [x] Prisma: `CourseStatus` enum (DRAFT/PUBLISHED) + `Course.status` (default PUBLISHED — existing
      programs unaffected). Pushed to the Supabase DB.
- [x] `lib/anthropic.ts` + `lib/openai.ts` — lazy clients (same pattern as lib/stripe.ts). Requires
      `ANTHROPIC_API_KEY` and/or `OPENAI_API_KEY` in .env (placeholders added — console.anthropic.com/settings/keys,
      platform.openai.com/api-keys).
- [x] `POST /api/programs/ai-generate` (admin-only) — takes topic/category/level/notes/**provider**
      (`anthropic` | `openai`, default `anthropic`), returns a structured draft (title, excerpt,
      tagline, overview, objectives, audience, highlights, curriculum w/ chapters+lessons, FAQs) via
      structured outputs (same Zod schema, validated on both providers) — Claude Opus 5
      (`messages.parse` + `zodOutputFormat`) or GPT-4.1 mini (`responses.parse` + `zodTextFormat`).
- [x] `services/program.service.ts` + `/api/programs` routes — `status` field wired through
      create/update; public listing (`getProgramsForListing`) hard-filters to PUBLISHED only, so
      drafts never leak to the public site; `/programs/[slug]` 404s on drafts.
- [x] Administrator Programs page — "AI Course Builder" button opens a prompt modal (AI model toggle,
      topic, category, level, notes) → generates a draft → opens the existing multi-step Program
      modal prefilled for review (banner + "Save as Draft" button). Admin still uploads the cover
      image and can edit anything before saving. Draft programs show an amber "Draft" badge + inline
      "Publish" action in the table (desktop + mobile).
- [ ] Admin must add a real ANTHROPIC_API_KEY and/or OPENAI_API_KEY to .env before the builder will
      work end-to-end (each provider option only works once its own key is set).
- [x] Lesson "Embedded Content" was empty on generated drafts (`blocks: []` always) — fixed:
      generation now also produces a 2-4 sentence lesson body (saved as a text content block) and
      runs a second, best-effort web-search call (Claude's `web_search_20260209` tool / OpenAI's
      `web_search` Responses tool) that maps real, verified resource links to specific lessons
      (document blocks, max 2/lesson). Search failures never fail the draft — course generation
      still succeeds with text-only lessons if the search step errors. True image/diagram generation
      was explicitly scoped out (needs a separate image-gen provider, not requested).

Task 7 — Auth rearchitecture (session / rate limiting / guard) — DONE
- Referenced /Nuestack/lhp-checkers/src/server/session.ts, src/lib/session-cookie.ts,
  src/server/rate-limit.ts, src/server/guard.ts as the pattern to follow. That project is a BFF
  proxying an external upstream API (hence its access/refresh tokens being foreign, opaque tokens
  it just relays); this app has no upstream — it issues and verifies everything itself — so the
  3-cookie split was adapted rather than copied verbatim.
- [x] `lib/env.ts` (new) — resolves SESSION_SECRET, ACCESS_COOKIE_NAME/REFRESH_COOKIE_NAME/
      SESSION_COOKIE_NAME, LOGIN_MAX_ATTEMPTS/LOGIN_LOCKOUT_SECONDS once, cached.
- [x] `lib/session.ts` — rewritten around three cookies: **access** (signed JWT, 15 min — the
      credential every API guard re-verifies), **refresh** (signed JWT, 1d/30d by "remember me",
      rotates on every use), **session** (HMAC-signed via new `lib/session-cookie.ts`, mirrors the
      refresh lifetime, read-only rendering copy). `getSession()` verifies access then falls back to
      a read-only refresh+DB-lookup (safe in Server Components); `getSessionAndRefresh()` does the
      same but persists rotated cookies (Route Handlers/Server Actions only, since Next disallows
      cookie writes during a Server Component render). A disabled/deleted user or a role change now
      takes effect within one refresh cycle instead of surviving the old single JWT's up-to-30-day
      lifetime. `types/session.ts` gained a zod `sessionPayloadSchema` — every decoded token is
      shape-validated, not just signature-checked.
- [x] `lib/session-cookie.ts` (new) — HMAC-SHA256/Web Crypto sign+verify for the session cookie,
      ported from the reference almost verbatim.
- [x] `lib/guard.ts` (new) — `requireApiRole(role)` / `requireApiSession()`, matching the exact
      `{error:"Forbidden"} / 403` shape every route already used, so adopting it is a pure
      de-duplication with no behavior change. Applied to the 4 routes built this session
      (`programs/ai-generate`, `student/programs`, `student/programs/[slug]`, `.../lessons/[lessonId]`);
      the ~40 other admin/instructor/student routes still use their original inline check (unchanged,
      still correct) — a full sweep to the new guard is optional follow-up, not done here.
- [x] `lib/login-rate-limit.ts` (new) — lockout-style limiter keyed by email+IP (locks after
      LOGIN_MAX_ATTEMPTS genuine credential failures for LOGIN_LOCKOUT_SECONDS), replacing the
      login route's generic IP-window limiter. Verified live: 5 failed attempts allowed, 6th returns
      429 with `Retry-After: 900`.
- [x] Added rate limiting to `POST /api/programs/ai-generate` (20/hour per admin) — the one
      unguarded route that spends real money per call (Claude/GPT-4.1 mini + a second web-search
      call), so a retry loop or compromised session can't run up spend unbounded. The existing
      generic `lib/rate-limit.ts` (unchanged) still covers contact/newsletter/forgot-password/
      resend-verification as before.
- [x] Fixed a real bug surfaced while wiring this up: the login route was calling the (then-new)
      `createSession(payload, maxAge)` with seconds instead of the `rememberMe` boolean it now
      expects — caught by typecheck before it shipped.
- [x] Fixed `services/auth.service.ts`'s `LoginUserResult.user.role` typing (`string` → Prisma
      `Role`) — was silently widening the role to `string`, which is what surfaced the maxAge bug
      above once `createSession`'s stricter boolean param was in place.
- Verified live end-to-end: login sets all 3 cookies with correct names/Max-Age/HttpOnly, an
  authenticated request succeeds, logout clears all 3 with matching Path.
- [x] Fixed: `loginUser()` now rejects `status !== "ACTIVE"` — checked *after* the password is
      verified (not before), so an unauthenticated prober can't learn an account is disabled just
      from its email. Returns a distinct `"disabled"` reason; the login route turns that into a 403
      with a clear message and — since a correct password was proven — does NOT count it against the
      login lockout (same treatment as the existing unverified-email 403). Verified live against a
      disposable disabled test user (created, tested, deleted).
- Everyone currently logged in was signed out by this change (old `arspi-auth` cookie / secret
  scheme replaced entirely — confirmed OK, no backward-compat shim was requested or built).

Task 8 — Google + LinkedIn social login — DONE (plan approved via /plan mode first)
- Dead NextAuth-starter scaffolding found in the schema (`Account`/`Session`/`VerificationToken`,
  zero usages anywhere, no next-auth dependency) — decided to hand-roll OAuth and feed logins into
  the existing session system (Task 7) rather than adopt NextAuth, which would've meant re-verifying
  all 68 files that call getSession()/requireAuth()/requireRole(). Repurposed `Account`; dropped the
  other two (confirmed via a throwaway script: only `accounts` table remains, with all its columns).
- [x] `arctic@3.7.0` (new dep) — lightweight OAuth 2.0/OIDC client, confirmed via its published type
      defs (not guessed) that `Google` requires PKCE and `LinkedIn` doesn't, and that `decodeIdToken()`
      does no claim validation itself (this app zod-validates the decoded claims, including checking
      the `nonce` claim against what was generated at `/start`, before trusting anything).
- [x] `lib/oauth/providers.ts` (new) — per-provider config (`createAuthorizationURL`, `exchangeCode`,
      `getProfile`) so the two route handlers don't need to know which provider class they're calling.
      Lazily throws on missing `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`/`LINKEDIN_CLIENT_ID`/
      `LINKEDIN_CLIENT_SECRET` only when a provider is actually used (mirrors lib/anthropic.ts).
- [x] `lib/oauth/handshake.ts` (new) — short-lived (10 min), single-use state/nonce/PKCE-verifier
      cookies scoped to `/api/auth/oauth`, cleared on every callback regardless of outcome.
- [x] `services/oauth.service.ts` (new) — `findOrCreateOAuthUser()`: links an existing `Account`,
      auto-links by verified email to an existing password/other-provider account, or creates a new
      User (`emailVerified: true` immediately — the provider already proved it, skips this app's own
      verification-email flow — `hasProfile`/`hasInterests` false, same as a fresh password signup).
- [x] `app/api/auth/oauth/[provider]/start` + `.../callback` (new) — full handshake: state/nonce/PKCE
      generation, code exchange, id_token decode+validate, find-or-create, then calls the *same*
      `createSession()` a password login uses — zero changes needed to any of the 68 session-consuming
      files. Every failure mode (bad provider, denied consent, state mismatch, unconfigured
      credentials, unverified email, disabled account) redirects to `/login?error=...` — verified live
      that none of these produce a raw 500.
- [x] `components/forms/SocialLoginButtons.tsx` (new, extracted from the login page's previously
      decorative, non-functional buttons) — plain `<a href>` navigations (not fetch — must be a real
      top-level redirect), wired into both `login/page.tsx` and `register/page.tsx` (step 1 only).
      Login page also toast-errors on `?error=` (read via `window.location.search` in an effect, not
      `useSearchParams()`, to avoid a Suspense-boundary requirement this page didn't already have).
- [x] `.env.example` updated — also closed a pre-existing gap from Task 7 where `SESSION_SECRET`/
      cookie-name/lockout vars were never documented there, only in the live `.env`.
- Verified: schema push, typecheck, lint, and `next build` all clean; live smoke tests confirm every
  failure path redirects cleanly (invalid provider, unconfigured credentials, bad/missing state).
- **Not yet tested end-to-end**: the actual consent-screen round trip, since that needs real
  `GOOGLE_CLIENT_ID`/`SECRET` and `LINKEDIN_CLIENT_ID`/`SECRET` (placeholders added to `.env`, still
  empty) — the user must create OAuth apps in Google Cloud Console and the LinkedIn Developer Portal
  (enabling "Sign In with LinkedIn using OpenID Connect" specifically) and register the redirect URIs
  exactly as documented in `.env.example`.

Bugfix — post-login redirect loop to /login?callbackUrl=... — FIXED
- Root cause: `proxy.ts` (this Next.js version's renamed `middleware.ts` — missed during Task 7's
  auth rearchitecture and again during Task 8's research, since both searched for the old
  `middleware.ts` filename) still hard-coded the pre-Task-7 single `"arspi-auth"` cookie name.
  `createSession()` hasn't set that cookie since Task 7 — it sets `ACCESS_COOKIE_NAME`/
  `REFRESH_COOKIE_NAME`/`SESSION_COOKIE_NAME` (env-configured) instead — so `proxy.ts` always saw "no
  token" and redirected every protected-route request straight back to `/login?callbackUrl=...`, even
  immediately after a successful login.
- [x] Fixed: `proxy.ts` now reads the env-configured cookie names via `getAuthEnv()`, verifies the
  access token first, and falls back to verifying the refresh token (signature/expiry only, no DB —
  Edge-safe) before redirecting, so a request isn't bounced just because the 15-min access token
  expired between page loads. This is a fast pre-filter only — `requireRole()` in each layout remains
  the authoritative, DB-backed check.
- Verified live: no cookies → redirects to `/login?callbackUrl=...` (correct); full login → 200 on
  `/administrator` (loop gone); access cookie stripped but refresh+session present → still 200 (proxy
  correctly defers to the layout's real refresh instead of forcing re-login).

Task 9 — Certification pages (student "My Certificates" + admin management) — DONE
- Survey found: verify/download infrastructure was real and complete (`/verify/[token]`,
  `/api/certificates/verify/[token]`, `.../download`, PDF template) but both sidebar "Certificates"
  links (`/administrator/certificates`, `/student/certificates`) were dead — no page existed at either.
- [x] `services/certificate.service.ts` — added `getCertificatesByUser()` and `getAllCertificates()`.
- [x] `GET /api/student/certificates` (new) — the logged-in student's own certificates.
- [x] `GET /api/certificates` (new handler on the existing route) — every issued certificate, admin-only.
- [x] `app/(dashboard)/student/certificates/page.tsx` (new) — card grid, empty state links to
      `/student/programs`, each card links out to `/verify/[code]` (view) and the PDF download route.
- [x] `app/(dashboard)/administrator/certificates/page.tsx` (new) — searchable table/mobile-card list
      (skeleton loaders, pagination, matching every other admin list page this session), with a revoke
      action (confirm dialog → `DELETE /api/certificates/[id]`, already existed).
- **Found and fixed a real pre-existing bug**, not something introduced this session: `certInclude` in
  `certificate.service.ts` selected `instructorName` on `Course` — a field that doesn't exist on the
  current schema (Course only has an `instructor` relation). This meant `issueCertificate()` — and
  therefore the auto-issue-on-course-completion path built in Task "course completion" — has been
  throwing since before this conversation started, silently: `setLessonCompletion()` catches the
  certificate-issue result but a thrown Prisma error there would have surfaced as a 500 on the lesson
  PATCH, not a silent no-op. Also would have broken `/verify/[token]`, the verify API, and the PDF
  download the moment any of them hit a real certificate. Fixed by selecting the `instructor` relation
  properly and computing the display name the same way `recipientName` already was; added a shared
  `displayName()` export in the service to stop the computation being copy-pasted a fourth time.
- Verified live end-to-end against a real (then-cleaned-up) test certificate: admin issue → list API
  → admin page → public `/verify/[token]` page → verify API → PDF download (real PDF bytes returned)
  → revoke, all working. `facilitator`/`recipientName` now always populate (previously always blank).

Task 10 — Student dashboard overview — DONE
- `app/(dashboard)/student/page.tsx` was the same class of leftover-stub bug as the admin dashboard
  fixed earlier (hardcoded empty rows, wrong "My Courses" copy) — full rebuild per spec:
  1. Continue-learning notification bar (before the stat cards, as specified) — the ACTIVE, not-yet-
     completed programme most recently touched (a lesson marked complete via `LessonProgress.updatedAt`,
     falling back to most-recently-enrolled if no lesson has been touched yet), with a progress bar and
     a "Continue" link straight into the course player. Hidden entirely when nothing qualifies.
  2. Three analytics cards — Programs / Workshops / Certificates — same StatCard pattern as the admin
     dashboard, each linking to its full page.
  3. Recent Workshops + Upcoming Workshops as two tables side by side on one row (stacked on mobile).
  4. Recent Programs as its own table (title, level, progress bar, status, enrolled date), paired
     alongside a calendar widget in a 2/3 + 1/3 layout.
  5. A hand-built month-grid calendar (no new dependency — a full calendar library was unnecessary for
     a single month view) showing the student's own registered upcoming workshops as dots, with a short
     list of this month's events below it. Scoped as *personal* upcoming events (the student's own
     registrations), not a platform-wide events-discovery calendar — that's what the public workshops
     page is for.
- [x] `GET /api/student/dashboard` (new) — one aggregated call: stat counts, continue-learning prompt,
      recent programs, recent/upcoming workshops (via `WorkshopRegistration`, matched by email — that
      model has no `userId`, matching the existing `/api/student/workshops` pattern), and this month's
      registered workshops for the calendar. Reuses `collectLessonIds()` from the lesson-progress work.
- Verified live against a disposable test student (created, enrolled, one lesson marked complete,
  tested, deleted): dashboard API and page both render correctly empty (no data) and populated
  (continue-learning bar correctly appeared once a lesson was marked complete, at 1/8 progress).

Follow-up fixes — DONE
- [x] **Notification bar not showing.** Not a bug — by design it only fired for an ACTIVE enrollment
      with `totalLessons > 0`, and most of the seeded dummy programs (Tasks 1-5) have no lesson data
      (the `week`/`topics` shape, no `lessons` array), so most real accounts had nothing to show. Added
      a fallback in `GET /api/student/dashboard`: when no in-progress *lessoned* program exists, falls
      back to the most-recently-enrolled ACTIVE program regardless of lesson count. The bar itself now
      renders a plain "You're enrolled — pick up where you left off" line (no progress bar/lesson count)
      when `totalLessons === 0`. Verified live: a test student enrolled only in a lesson-less dummy
      program now correctly gets the bar.
- [x] **Sidebar "Dashboard" nav stayed active on every page.** Real bug in
      `components/layout/DashboardSidebar.tsx`: the active-link check was `pathname.startsWith(item.href)`,
      and every admin/instructor/student page's path starts with its own section root (`/administrator`,
      etc.) — the same string as the "Dashboard" entry's own href — so "Dashboard" matched everywhere.
      Fixed: a single-segment href (the section root) now requires an exact match; deeper hrefs (e.g.
      `/administrator/programs`) still prefix-match their own sub-pages, now with a `/`-boundary check.
      Verified live by diffing the rendered nav link's classes on `/student` vs `/student/programs` —
      Dashboard is active only on the former, Programs only on the latter.

Task 12 — Settings page consolidation — DONE
- [x] Merged the three near-duplicate `administrator/settings`, `instructor/settings`,
      `student/settings` pages (identical except one CSS class) into a single
      `app/(dashboard)/settings/` route (`layout.tsx` + `page.tsx`), gated by `requireAuth()`
      (any authenticated role) — settings was never actually role-restricted, just incidentally
      URL-nested per role. Updated all three sidebar "Settings" links to `/settings`, which also
      fixed the instructor/student links that previously pointed at a bare `/settings` with no
      page behind it. Deleted the 3 old page files + 2 old layout files. Verified live: all three
      roles land on `/settings` (200) with the correct role badge; old routes now 404.

Task 13 — Strict role isolation across dashboards — DONE
- Layout-level `requireRole()` already did exact-role matching (ADMIN can't render the instructor
  layout, etc.), but `proxy.ts`'s edge pre-filter (`ROLE_ROUTES`) was hierarchical — ADMIN was
  allowed into `/instructor` and `/student`, INSTRUCTOR into `/student`. Inconsistent with the
  authoritative check.
- [x] Tightened `ROLE_ROUTES` in `proxy.ts` to one role per prefix (ADMIN → `/administrator` only,
      INSTRUCTOR → `/instructor` only, USER → `/student` only). Verified live with 3 disposable
      test accounts (one per role): each gets 200 on only its own dashboard route and a clean 307
      redirect to `/unauthorized` on the other two.

Task 14 — Student "My Programs" cards — DONE
- Redesigned `student/programs` from a plain progress-bar card into a richer card matching a
  reference screenshot: kebab (⋮) menu (Continue / View certificate / Share / Favorite / Archive),
  progress bar with "{pct}% complete", and a real per-student star rating ("Your rating").
- [x] `Enrollment.studentRating` (Int?), `.favorited`/`.archived` (Boolean, default false) — new
      fields, pushed live. Distinct from the existing admin-set `Course.rating`.
- [x] `GET /api/student/programs` — now also returns `studentRating`/`favorited`/`archived` and
      each program's certificate verify-code (null if none issued yet).
- [x] `PATCH /api/student/programs/[slug]` (new) — updates rating (1-5 or null)/favorited/archived
      for the caller's own enrollment; 403 if not enrolled, 400 on an out-of-range rating.
- [x] Filter chips (All / Favorites / Archived) — archived programs are hidden from the default
      "All" view. Share copies the public `/programs/[slug]` link to the clipboard.
- Verified live against disposable enrollments (one active, one completed+certified): list shape,
  rate/favorite/archive PATCH calls, 400 on invalid rating, filter-state correctness — then cleaned
  up.

Task 15 — AI "Expand with AI" content-block action — DONE
- Follow-up to Task 11's critique: rather than rebuild the whole AI Course Builder around chained
  per-chapter generation (higher latency/cost across every generated course), added a targeted,
  on-demand action instead — the admin/instructor chooses which lessons actually need real depth,
  instead of paying for full expansion on every lesson of every generated course.
- [x] `lib/ai-text.ts` (new) — extracted `plainTextToHtml()` (paragraphs + "- "/"•" bullet lists →
      sanitized HTML) out of `ai-generate/route.ts` so both AI routes share one implementation.
- [x] `POST /api/programs/ai-expand-block` (new, ADMIN or INSTRUCTOR) — stateless: takes the
      course/chapter/lesson context plus a block's current content (or empty, to write from
      scratch) and an optional free-text instruction, returns expanded/rewritten HTML. Rate-limited
      (40/hour per user). Nothing is persisted server-side — the author reviews the result in the
      block editor before saving the course, same review-before-save pattern as the course builder.
- [x] `components/forms/ContentBlockEditor.tsx` — `MiniRTE` gained an "Expand with AI" / "Write with
      AI" toolbar button (shown only when the caller supplies course context via the new
      `aiContext` prop); wired into both the lesson `text` block and `assignment` instructions.
      Per-block loading/error state, so multiple blocks can be expanded independently.
- [x] Administrator + instructor Programs pages — `LessonsEditor` extracted a `LessonItem`
      subcomponent (per-lesson `useWatch` calls aren't legal inside `.map()` at the parent level)
      that watches its own lesson title/description plus the course/chapter title, and passes them
      as `aiContext` into `ContentBlockEditor`.
- Verified live against a real Anthropic and OpenAI call: write-from-scratch (produced a genuine
  200-400 word lesson body, well beyond the AI Course Builder's own 2-4 sentence cap), expand an
  existing short blurb, assignment-instructions framing (tightened after the first pass echoed the
  block's own title back as an opening line), and a 400 on a missing `courseTitle`. `tsc`/`eslint`/
  `next build` all clean.
- Diagrams/images (the other half of Task 11) intentionally not built here — scoped out again as a
  separate, larger addition (a new content-block type end-to-end, or a real image-gen API).