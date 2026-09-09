# Security Review — ARPS Institute Platform

Date: 2026-09-09
Scope: full repository (`arspi-vercel`) — auth/session architecture, RBAC, API routes,
third-party integrations (Stripe, UploadThing, AI providers, OAuth), dependency
vulnerabilities, and HTTP security headers. Conducted by direct code audit (grep/read
across the codebase) plus `npm audit` and live verification against disposable test
accounts — not an automated scanner report.

## Summary

| Severity | Found | Fixed this session | Documented for follow-up |
|---|---|---|---|
| Critical | 1 | 1 | 0 |
| High | 2 | 2 | 1 |
| Medium | 3 | 0 | 3 |
| Low / informational | — | — | confirmed clean, see below |

The one critical finding (outdated Next.js with two unauthenticated RCEs) has been
fixed, verified, and is live in the working tree. Two more issues were fixed alongside
it. The rest are documented with enough detail to act on later — none are actively
exploited-in-the-wild-style emergencies, but they're worth scheduling.

---

## Fixed this session

### 1. [CRITICAL] Outdated Next.js (16.2.1) — 2 unauthenticated RCEs + high-severity middleware bypass/SSRF bugs

`npm audit` flagged `next@16.2.1` against two **critical, unauthenticated remote code
execution** advisories, both fixed in 16.3.3:
- [GHSA-p293-qw3h-jr36](https://github.com/advisories/GHSA-p293-qw3h-jr36) — RCE on
  Windows-hosted servers (CVSS 9.0, path traversal).
- [GHSA-2xp9-vwfh-vxw4](https://github.com/advisories/GHSA-2xp9-vwfh-vxw4) — RCE in the
  Image Optimization API when processing AVIF files.

The second one is directly relevant here: this app renders 36 files' worth of
**user-uploaded images** (avatars, program/workshop thumbnails via UploadThing) through
`next/image`, which routes through the built-in Image Optimization API by default —
nothing in this codebase sets `unoptimized`. That makes this a realistically reachable
attack surface, not a theoretical one.

Also fixed in the same range (`>=16.0.0 <16.2.11`): a cluster of **high-severity
middleware/proxy-bypass bugs** (segment-prefetch routes, dynamic route parameter
injection, Turbopack single-locale bypass) and an **SSRF in `rewrites()`**. These matter
specifically to this app because `proxy.ts` is the RBAC pre-filter built and hardened
this session (strict one-role-per-route-prefix). Worth noting: this app's layered
design — `proxy.ts` is documented as "a fast, cheap pre-filter, not the sole security
boundary," with every dashboard layout independently re-checking via the DB-backed
`requireRole()` — meant these specific proxy-bypass classes were **not** a full
authorization bypass even before the patch, since a bypassed proxy still hits an
authoritative check one layer in. The RCEs had no such mitigation, which is why they're
rated critical here regardless.

**Fix applied**: bumped `next` and `eslint-config-next` to `16.3.4` (same major version,
non-breaking per npm's own semver classification). Verified:
- `npx tsc --noEmit`, `npm run lint`, `npm run build` all clean.
- Live smoke test: unauthenticated → redirects to `/login`; admin login → 200 on
  `/administrator`; role isolation still enforced (admin → `/student` still redirects to
  `/unauthorized`); `/settings` (the shared route) still 200.
- `npm audit`'s critical count dropped from 1 to 0 (30 → 28 total advisories, all now
  moderate/high/low — see "Documented for follow-up" below).

### 2. [HIGH] Unrated resource-creation endpoints during registration

`POST /api/basic-information` (account creation, step 1 of onboarding) and
`POST /api/learning-interests` (step 2 — this is what actually **triggers the
verification email send**, via `sendVerificationEmail()`) had no rate limiting at all,
unlike every comparable endpoint in the app (`forgot-password`, `resend-verification`,
`contact`, `newsletter/subscribe` are all rate-limited). Concretely:
- An attacker could script account creation in an unbounded loop.
- The learning-interests step could be replayed to spam SMTP sends. `userId` is taken
  from the request body with no session check — this is by design (the user isn't
  authenticated yet mid-onboarding) but combined with zero rate limiting it meant no
  cooldown at all, unlike `resend-verification`'s existing 5/hour cap for the equivalent
  authenticated-adjacent action. (Real-world risk is tempered by `userId` being an
  unguessable Prisma `cuid`, not a sequential ID — but "unguessable ID" shouldn't be the
  only control on an email-sending code path.)

**Fix applied**: added `enforceRateLimit` (10/hour per IP, matching this app's existing
`lib/rate-limit.ts` pattern) to both routes. Verified live: 10 rapid registration POSTs
succeed, the 11th returns `429`.

### 3. [HIGH] No baseline HTTP security headers

`next.config.ts` set no response headers at all, and Next's default `X-Powered-By:
Next.js` header was left on (a minor but free fingerprinting signal for attackers
targeting known Next.js CVEs — directly relevant given finding #1 above).

**Fix applied** (`next.config.ts`):
- `poweredByHeader: false`
- `X-Content-Type-Options: nosniff` — stops MIME-sniffing-based attacks.
- `X-Frame-Options: SAMEORIGIN` — clickjacking protection.
- `Referrer-Policy: strict-origin-when-cross-origin` — Next's own recommended default.
- `Permissions-Policy: camera=(), microphone=(), geolocation=()` — this app uses none of
  these; explicitly denying them removes an unnecessary attack surface delegated to
  embedded third-party content.

Verified live via `curl -D -` against the running dev server — all four headers present,
`X-Powered-By` absent.

**Deliberately not added** (documented instead, see below): Content-Security-Policy and
Strict-Transport-Security.

---

## Documented for follow-up (not fixed this session)

### 4. [MEDIUM] Remaining `npm audit` findings in runtime-relevant packages

After the Next.js bump, `npm audit --omit=dev` reports 28 advisories (0 critical, 14
high, 9 moderate, 3 low — mostly transitive `prisma`/build-tool dependencies like `hono`,
`ip-address`, `js-yaml`, `brace-expansion`, which are dev-time-only and never ship in the
`next build` output). Two are worth calling out specifically because they're in packages
this app actually uses at runtime to render user-controlled content:
- **`@tiptap/core` (high)** — a `mergeAttributes()` prototype-pollution-adjacent bug and
  a ReDoS in Markdown attribute parsing. Tiptap is this app's rich-text editor
  (`components/forms/ContentBlockEditor.tsx`, `RichTextEditor`), used only in
  authenticated admin/instructor screens. **Mitigating factor**: every place this app
  renders Tiptap-produced HTML back out (`dangerouslySetInnerHTML`) already passes it
  through `sanitizeHtml()` (DOMPurify) first — confirmed across all 9 render sites, see
  finding #8 below — so exploitation would require the *editor itself* misbehaving
  client-side, not a stored-XSS path through the render layer.
- **`dompurify` (moderate, via `isomorphic-dompurify`)** — several IN_PLACE-mode
  sanitization-bypass advisories in versions ≤3.4.12. This one matters more directly
  since `sanitizeHtml()` is this app's actual XSS defense line for every rich-text field
  in the product (program/workshop/insight/career descriptions, lesson content, etc.).

**Recommendation**: run `npm audit fix` (non-breaking fixes only) in a follow-up pass,
confirm `isomorphic-dompurify`/`@tiptap/*` land on patched versions, then re-run the full
`tsc`/`lint`/`build` + a manual pass through the rich-text editor and a few public pages
that render stored HTML. Not done here because it touches the editor and every public
content page — wider blast radius than this session's scope, and deserves its own
verification pass rather than being bundled into a security-review commit.

### 5. [MEDIUM] No Content-Security-Policy

Deliberately not added. A CSP needs explicit allowlisting against everything this app
actually embeds or loads: Stripe Checkout redirects, the UploadThing CDN
(`utfs.io`/`*.ufs.sh`), YouTube/Vimeo video blocks, Google Fonts, and outbound links to
Google Forms/Typeform/SurveyMonkey survey blocks. A CSP built without testing every one
of those surfaces is more likely to silently break a real feature than to meaningfully
raise the bar over the headers already added — that's a bad trade for a header that
`X-Frame-Options` and `sanitizeHtml()` already substantially cover today. **Recommended
next step**: build the CSP as its own task with a page-by-page checklist (start in
`Content-Security-Policy-Report-Only` mode to catch violations without breaking
anything, then promote once clean).

### 6. [MEDIUM] No Strict-Transport-Security header

Not added at the app layer. HSTS is normally better owned by whatever sits in front of
the Node process (the cPanel/Apache or Nginx reverse proxy referenced in
`.env.example`, or a CDN) — and a wrong `max-age` is effectively unrecoverable for
affected visitors once cached by their browser, so it shouldn't be added speculatively
without confirming HTTPS is enforced everywhere in the actual deployment topology first.
**Recommended next step**: confirm with whoever manages the production host that HTTPS
is enforced end-to-end, then add HSTS at that layer (or here, once confirmed).

### 7. [LOW] Unauthenticated career-application file upload has no rate limit

`documentUploader` in `lib/uploadthing.ts` (résumé/cover-letter uploads on the public
careers page) is intentionally unauthenticated — the code's own comment already flags
this: *"Abuse is bounded by the 8 MB cap and file-type whitelist; consider IP
rate-limiting in proxy.ts."* Still true. Low priority since UploadThing's own per-file
caps bound the damage, but worth adding `enforceRateLimit` alongside the endpoint that
actually creates the `CareerApplication` record if abuse is ever observed.

---

## Confirmed clean (no action needed)

- **XSS / sanitization**: every one of the 9 `dangerouslySetInnerHTML` call sites in the
  codebase passes through `sanitizeHtml()` (DOMPurify) immediately before rendering —
  defense-in-depth even if stored data were ever malformed.
- **SQL injection**: zero uses of `$queryRaw`/`$executeRaw` anywhere — all data access
  goes through Prisma's parameterized query builder.
- **Payments**: the Stripe webhook (`/api/webhooks/stripe`) verifies the
  `stripe-signature` header via `stripe.webhooks.constructEvent()` before processing any
  event. Checkout prices (`workshop.fee`, `program.price`) are always read from the DB
  server-side, never trusted from client-submitted request bodies — no price-tampering
  path.
- **Session/cookies**: all three session cookies are `httpOnly`, `secure` in production,
  `sameSite: "lax"` (which also meaningfully mitigates CSRF for state-changing
  POST/PATCH/DELETE routes, since Lax cookies aren't sent on cross-site non-GET
  requests — confirmed no state-changing `GET` handlers exist that would sidestep this).
  Access tokens expire in 15 minutes; refresh tokens rotate on every use.
- **Passwords**: `bcrypt.hash(..., 12)` at every hashing call site (registration,
  password reset, admin-initiated reset, profile self-service change) — consistent cost
  factor, no weaker path found. Password complexity (8+ chars, uppercase, number) is
  enforced server-side via Zod, not just client-side Yup — a client-side-only check
  would be trivially bypassable via direct API calls.
- **OAuth**: state + nonce + PKCE (Google) with short-lived (10 min), single-use,
  narrowly-scoped handshake cookies; nonce is validated against the decoded id_token
  before trusting any claim.
- **RBAC**: role checks are exact-match everywhere audited — no hierarchy leakage (an
  ADMIN cannot reach `/instructor` or `/student`, confirmed live this session in a
  separate task). Instructor program routes additionally check **resource ownership**
  (`assertOwnership()` in `/api/instructor/programs/[id]`), so one instructor cannot
  read or edit another instructor's program even though both hold the same role.
- **Mass assignment**: the self-service profile-update schema
  (`/api/account/profile` PATCH) has no path to `role` or `status`; registration
  hardcodes `role: "USER"` server-side regardless of request body content — no
  privilege-escalation-via-registration path.
- **User enumeration**: `forgot-password` returns the same
  `"If an account exists, a reset link has been sent."` message regardless of whether
  the email exists. (Registration's 409 "email already exists" *does* confirm an
  account's existence — a deliberate, common, and low-severity UX tradeoff for a
  register flow, not something to "fix.")
- **File uploads**: type and size limits (`imageUploader` 4MB, `pdfUploader` 32MB,
  `documentUploader` 8MB + explicit MIME allowlist) are enforced by UploadThing's
  `FileRouter` config server-side, not just in client-side `<input accept>` hints —
  client-side checks alone would be bypassable.
- **Secrets**: `.env` is correctly gitignored; only `.env.example` (placeholders only,
  no real values) is tracked in git. No leaked credentials found in the current tree.

## Also fixed while auditing (code health, not a vulnerability)

- **`eslint.config.mjs`** never ignored `lib/generated/prisma/` (Prisma 7's checked-in
  generated client output), so `npm run lint` was reporting 600+ errors from
  auto-generated, unreadable minified code — which in practice meant nobody could see
  real lint output for actual app code. Added it to `globalIgnores`. This surfaced one
  genuine pre-existing lint **error** in real app code
  (`components/layout/DashboardShell.tsx` — `setState` called synchronously inside a
  `useEffect` to reset the mobile sidebar on route change), fixed by moving the reset to
  the React-recommended "adjust state during render" pattern instead of an effect.
  `npm run lint` is now 0 errors / 27 pre-existing warnings (unused imports scattered
  across older files, unrelated to security — not touched, out of scope for this
  review).

## What this review did not cover

- No penetration testing / active exploitation attempts — this was a code-level audit.
- No review of the hosting/infra layer itself (cPanel/reverse-proxy config, DNS, TLS
  cert management) — flagged where relevant (HSTS) but out of this repo's control.
- No load/DoS testing of the in-memory rate limiter (`lib/rate-limit.ts`'s own docs
  already note it's per-instance on serverless, not a hard global ceiling — a known,
  accepted trade-off, not re-litigated here).
- Third-party service configuration (Stripe dashboard webhook settings, UploadThing
  project settings, Google/LinkedIn OAuth app configuration) — reviewed only the code
  that talks to them, not their dashboards.
