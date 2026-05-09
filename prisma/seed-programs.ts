/**
 * Seeds 6 sample programmes (one per category) using the same shape as
 * docs/programs-template.md. Idempotent — re-running upserts by slug.
 *
 * Run:  npx tsx prisma/seed-programs.ts
 *
 * Prereqs (already present in this DB):
 *   - At least one User with role=ADMIN
 *   - Categories listed in `CATEGORY_SLUGS` below
 *   - ProgramLevel / ProgramFormat / ProgramPricing lookup rows seeded
 */
import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient, CourseLevel } from "@prisma/client"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const db      = new PrismaClient({ adapter })

const PLACEHOLDER_THUMB      = "https://utfs.io/f/swQXhLUx8k7SylnOIEvuOyhuqXDQmi7AnwfBWz6xKvYEsGg1"
const PLACEHOLDER_FACILITATOR = "https://utfs.io/f/swQXhLUx8k7S7AEcAEWqCOz1DXfMYnwbRWd8vIogsANJTGiV"

type SampleProgram = {
  title:        string
  slug:         string
  tagline:      string
  excerpt:      string
  thumbnail:    string
  level:        CourseLevel
  pricing:      "free" | "paid"
  paymentType:  "one-time" | "subscription" | "monthly" | null
  price:        number
  featured:     boolean
  predefinedAnalytics: boolean

  categorySlug:    string  // resolved → categoryId
  programLevelSlug:   string
  programFormatSlug:  string
  programPricingSlug: string

  // Programme details (kept in DB even if Step 1 form hides them)
  duration?:       string | null
  format?:         string | null
  startDate?:      string | null
  endDate?:        string | null
  cohortSize?:     number | null

  // Analytics-gated (only set when predefinedAnalytics === true)
  rating?:         number | null
  reviewCount?:    number | null
  enrolledCount?:  number | null
  countriesCount?: number | null

  overview:           string
  targetAudience:     string[]
  learningObjectives: string[]
  whatIsIncluded:     string[]
  faqs:               { q: string; a: string }[]
  facilitators:       { name: string; title: string; bio: string; imageUrl: string | null; credentials: string | null }[]
  curriculum:         { title: string; desc: string | null; lessons: { title: string; description: string | null; blocks: unknown[] }[] }[]
}

const SAMPLES: SampleProgram[] = [
  // 1 ─ Cohort Based · Intermediate · Paid (one-time)
  {
    title: "Curriculum Design for Adult Learners",
    slug:  "curriculum-design-for-adult-learners",
    tagline: "Build syllabi adult professionals actually finish",
    excerpt: "A six-week cohort on designing andragogy-aligned curricula for working professionals — from learning objectives to assessment.",
    thumbnail: PLACEHOLDER_THUMB,
    level: "INTERMEDIATE",
    pricing: "paid",
    paymentType: "one-time",
    price: 750,
    featured: false,
    predefinedAnalytics: true,
    categorySlug:       "education-and-learning-sciences",
    programLevelSlug:   "intermediate",
    programFormatSlug:  "cohort-based",
    programPricingSlug: "paid",
    duration: "6",
    format:   "Cohort Based",
    startDate: "2026-07-06",
    endDate:   "2026-08-17",
    cohortSize: 30,
    rating: 4.6, reviewCount: 87, enrolledCount: 412, countriesCount: 22,
    overview: "<p>This six-week cohort programme equips trainers, faculty, and learning designers with the practical skills to build curricula that respect adult learners' time, prior experience, and goals. Each week pairs a live workshop with an applied assignment grounded in your own teaching context.</p>",
    targetAudience: [
      "Corporate trainers and L&D specialists",
      "University and college faculty",
      "Independent course creators",
      "Curriculum officers in NGOs and government agencies",
    ],
    learningObjectives: [
      "Apply andragogy principles to curriculum design decisions",
      "Translate competencies into measurable learning objectives",
      "Sequence content for retention and transfer",
      "Design formative and summative assessments aligned to objectives",
      "Draft a complete six-week course plan ready for delivery",
    ],
    whatIsIncluded: [
      "6 live cohort workshops (90 min each)",
      "6 applied weekly assignments with peer review",
      "Capstone course-design portfolio",
      "12 months access to recordings and templates",
      "Verified digital certificate",
    ],
    faqs: [
      { q: "Do I need prior teaching experience?", a: "No. The programme assumes you have some exposure to delivering training or instruction, but does not require formal teaching credentials." },
      { q: "How much time per week should I plan for?", a: "Approximately 5–6 hours per week, including the live session and the weekly assignment." },
      { q: "Are sessions recorded?", a: "Yes. All live sessions are recorded and posted within 24 hours so participants in any time zone can keep up." },
    ],
    facilitators: [
      { name: "Dr. Adaeze Nwosu", title: "Principal Curriculum Strategist · ARPS Institute", bio: "<p>Adaeze has designed adult-learning programmes for ministries of education, multinational employers, and African open universities for over 15 years.</p>", imageUrl: PLACEHOLDER_FACILITATOR, credentials: null },
    ],
    curriculum: [
      { title: "Week 1 — Andragogy and the Adult Learner", desc: "<p>Foundational principles, learner motivation, and the contracts that make adult learning work.</p>", lessons: [{ title: "What makes adult learners different", description: null, blocks: [] }] },
      { title: "Week 2 — From Competencies to Objectives", desc: "<p>Translating role expectations into observable, measurable learning objectives.</p>", lessons: [] },
      { title: "Week 3 — Sequencing for Retention", desc: null, lessons: [] },
      { title: "Week 4 — Assessment Design", desc: null, lessons: [] },
      { title: "Week 5 — Engagement and Pacing", desc: null, lessons: [] },
      { title: "Week 6 — Capstone Course Plan", desc: null, lessons: [] },
    ],
  },

  // 2 ─ Self-Paced · Beginner · Free (no analytics)
  {
    title: "Data Storytelling for Researchers",
    slug:  "data-storytelling-for-researchers",
    tagline: "Turn findings into briefs decision-makers act on",
    excerpt: "A short self-paced course on writing, charting, and presenting research findings for non-technical audiences.",
    thumbnail: PLACEHOLDER_THUMB,
    level: "BEGINNER",
    pricing: "free",
    paymentType: null,
    price: 0,
    featured: true,
    predefinedAnalytics: false,
    categorySlug:       "applied-research-and-analytics",
    programLevelSlug:   "beginner",
    programFormatSlug:  "self-paced",
    programPricingSlug: "free",
    duration: "8 hours",
    format:   "Self-Paced",
    overview: "<p>This free, self-paced course teaches researchers, analysts, and graduate students how to package quantitative and qualitative findings into briefs, slide decks, and one-pagers that policy and programme audiences will read and act on.</p>",
    targetAudience: [
      "Early-career researchers and analysts",
      "Graduate students writing dissertations and policy briefs",
      "M&E officers reporting to non-technical stakeholders",
    ],
    learningObjectives: [
      "Identify the audience-specific 'so what' of a research finding",
      "Choose chart types that match the analytical question",
      "Structure a one-page brief that leads with the decision",
      "Avoid the most common visual-encoding mistakes",
    ],
    whatIsIncluded: [
      "5 short video modules (≈ 8 hours total)",
      "Downloadable brief and chart templates",
      "Self-check quizzes",
      "Lifetime access",
    ],
    faqs: [
      { q: "Is this really free?", a: "Yes. The course is fully funded under our open-knowledge initiative." },
      { q: "Will I get a certificate?", a: "A free completion certificate is issued after the final quiz." },
    ],
    facilitators: [
      { name: "Sade Bamidele", title: "Senior Research Communications Lead", bio: "<p>Sade has trained over 2,000 researchers across Africa in evidence communication.</p>", imageUrl: PLACEHOLDER_FACILITATOR, credentials: null },
    ],
    curriculum: [
      { title: "Module 1 — Audience and the 'so what'", desc: null, lessons: [] },
      { title: "Module 2 — Choosing the right chart", desc: null, lessons: [] },
      { title: "Module 3 — Writing the brief", desc: null, lessons: [] },
      { title: "Module 4 — Slides that don't drown the message", desc: null, lessons: [] },
      { title: "Module 5 — Reviewing your own work", desc: null, lessons: [] },
    ],
  },

  // 3 ─ Live Online · Advanced · Paid (subscription)
  {
    title: "Strategic Leadership in the Public Sector",
    slug:  "strategic-leadership-in-the-public-sector",
    tagline: "Lead reform programmes that survive political cycles",
    excerpt: "A 12-week live-online seminar series for senior public-sector leaders driving reform under fiscal and political constraints.",
    thumbnail: PLACEHOLDER_THUMB,
    level: "ADVANCED",
    pricing: "paid",
    paymentType: "subscription",
    price: 1800,
    featured: false,
    predefinedAnalytics: true,
    categorySlug:       "leadership-and-management-sciences",
    programLevelSlug:   "advanced",
    programFormatSlug:  "live-online",
    programPricingSlug: "paid",
    duration: "1.5",
    format:   "Live Online",
    startDate: "2026-08-03",
    endDate:   "2026-10-26",
    rating: 4.8, reviewCount: 56, enrolledCount: 188, countriesCount: 18,
    overview: "<p>Twelve weekly 90-minute live seminars combine peer dialogue, case-based learning, and expert practitioners to help senior public-sector leaders design reform programmes that endure beyond any one administration.</p>",
    targetAudience: [
      "Director-level public servants",
      "Chiefs of staff and policy advisors",
      "Heads of reform delivery units",
    ],
    learningObjectives: [
      "Diagnose the political economy of a reform initiative",
      "Build delivery-unit operating rhythms that hold under pressure",
      "Design coalitions that survive ministerial transitions",
      "Communicate evidence to media and parliament without losing nuance",
    ],
    whatIsIncluded: [
      "12 live 90-minute seminars",
      "Curated case-study readings each week",
      "Peer learning circles of 6–8 leaders",
      "Two 1:1 coaching sessions",
      "Confidential cohort directory",
    ],
    faqs: [
      { q: "Is this Chatham House?", a: "Yes. All sessions operate under Chatham House rule by default." },
      { q: "Can my agency sponsor a seat?", a: "Yes — institutional invoices and group rates are available for 3+ enrolments." },
    ],
    facilitators: [
      { name: "Hon. Tunde Akinwale", title: "Former Permanent Secretary · Reform Delivery Unit", bio: "<p>Tunde led three multi-year reform programmes spanning public finance, civil-service modernisation, and digital identity.</p>", imageUrl: PLACEHOLDER_FACILITATOR, credentials: null },
      { name: "Dr. Marcia Pereira", title: "Senior Fellow · ARPS Institute", bio: "<p>Marcia advises governments across Africa and Latin America on delivery-unit design and political-economy diagnostics.</p>", imageUrl: PLACEHOLDER_FACILITATOR, credentials: null },
    ],
    curriculum: [
      { title: "Module 1 — Political Economy of Reform", desc: null, lessons: [] },
      { title: "Module 2 — Delivery Operating Rhythms", desc: null, lessons: [] },
      { title: "Module 3 — Coalitions Across Administrations", desc: null, lessons: [] },
      { title: "Module 4 — Communicating Evidence", desc: null, lessons: [] },
    ],
  },

  // 4 ─ Cohort Based · All Levels · Paid (one-time) · Featured
  {
    title: "AI for Knowledge Workers",
    slug:  "ai-for-knowledge-workers",
    tagline: "Move from prompting to building reliable AI workflows",
    excerpt: "An eight-week cohort programme that takes professionals from one-off prompts to dependable, evaluated AI workflows for their actual jobs.",
    thumbnail: PLACEHOLDER_THUMB,
    level: "INTERMEDIATE",
    pricing: "paid",
    paymentType: "one-time",
    price: 950,
    featured: true,
    predefinedAnalytics: true,
    categorySlug:       "it-and-digital-innovation",
    programLevelSlug:   "all-levels",
    programFormatSlug:  "cohort-based",
    programPricingSlug: "paid",
    duration: "8",
    format:   "Cohort Based",
    startDate: "2026-09-07",
    endDate:   "2026-11-02",
    cohortSize: 40,
    rating: 4.7, reviewCount: 211, enrolledCount: 932, countriesCount: 31,
    overview: "<p>An eight-week, hands-on cohort that takes professionals beyond ad-hoc prompting into building, evaluating, and deploying AI workflows that are repeatable and trustworthy. Bring your real work — every assignment is grounded in your own use cases.</p>",
    targetAudience: [
      "Analysts, consultants, and operations leads",
      "Researchers automating literature and synthesis work",
      "Communications, HR, and ops teams",
      "Founders and product builders without an ML background",
    ],
    learningObjectives: [
      "Frame a task so AI tools can solve it reliably",
      "Build multi-step workflows with reusable prompt components",
      "Evaluate AI output systematically rather than vibes-only",
      "Decide when to use a model vs. write the script yourself",
    ],
    whatIsIncluded: [
      "8 weekly live cohort workshops",
      "8 applied workplace assignments",
      "Workflow templates and evaluation rubrics",
      "Capstone: a deployed AI workflow for your team",
      "Verified digital certificate",
    ],
    faqs: [
      { q: "Do I need to write code?", a: "No. Most workflows are built in tools you already use; coding is optional and supported but not required." },
      { q: "Which models are covered?", a: "We use frontier models from multiple vendors; specifics are kept current each cohort." },
      { q: "What if my org restricts AI tool usage?", a: "We share patterns for both restricted and open environments and help you build a sandbox approach if needed." },
    ],
    facilitators: [
      { name: "Ifeoma Eze", title: "AI Workflows Lead · ARPS Institute", bio: "<p>Ifeoma has shipped AI workflows for legal, HR, and research teams across four continents.</p>", imageUrl: PLACEHOLDER_FACILITATOR, credentials: null },
    ],
    curriculum: [
      { title: "Week 1 — From prompts to tasks", desc: null, lessons: [] },
      { title: "Week 2 — Workflow primitives", desc: null, lessons: [] },
      { title: "Week 3 — Evaluation in practice", desc: null, lessons: [] },
      { title: "Week 4 — Reliability and edge cases", desc: null, lessons: [] },
      { title: "Week 5 — Tools, agents, and orchestration", desc: null, lessons: [] },
      { title: "Week 6 — Cost and latency tradeoffs", desc: null, lessons: [] },
      { title: "Week 7 — Deploying to your team", desc: null, lessons: [] },
      { title: "Week 8 — Capstone and review", desc: null, lessons: [] },
    ],
  },

  // 5 ─ Hybrid · Advanced · Paid (one-time)
  {
    title: "Evidence-Based Policy Analysis",
    slug:  "evidence-based-policy-analysis",
    tagline: "Pair analytical rigour with the politics of policy",
    excerpt: "A hybrid programme combining online seminars and a four-day in-person residency on the methods and politics of evidence in policy.",
    thumbnail: PLACEHOLDER_THUMB,
    level: "ADVANCED",
    pricing: "paid",
    paymentType: "one-time",
    price: 2200,
    featured: false,
    predefinedAnalytics: false,
    categorySlug:       "social-sciences-and-public-policy",
    programLevelSlug:   "advanced",
    programFormatSlug:  "hybrid",
    programPricingSlug: "paid",
    duration: "10",
    format:   "Hybrid",
    startDate: "2026-10-05",
    endDate:   "2026-12-14",
    overview: "<p>Eight weeks of online seminars on quantitative and qualitative policy analysis, capped by a four-day in-person residency for case work and ministerial-style briefings.</p>",
    targetAudience: [
      "Policy advisors and analysts",
      "Think-tank researchers",
      "Civil servants in central agencies",
    ],
    learningObjectives: [
      "Match analytical methods to policy questions",
      "Read, critique, and synthesise mixed evidence",
      "Write a policy memo that survives a hostile review",
      "Brief decision-makers under time pressure",
    ],
    whatIsIncluded: [
      "8 weekly online seminars (recorded)",
      "4-day in-person residency (Lagos)",
      "Curated reading list and replication notebooks",
      "Capstone policy memo with expert feedback",
    ],
    faqs: [
      { q: "Is travel included?", a: "Tuition covers programme content. Travel and accommodation for the residency are arranged separately; a partner hotel rate is offered." },
      { q: "Do I need a stats background?", a: "Quantitative literacy is helpful. We provide a pre-programme refresher for those who want to brush up." },
    ],
    facilitators: [
      { name: "Dr. Ngozi Ifedi", title: "Director of Research · ARPS Institute", bio: "<p>Ngozi has led evaluation and policy studies for the World Bank, FCDO, and the African Development Bank.</p>", imageUrl: PLACEHOLDER_FACILITATOR, credentials: null },
    ],
    curriculum: [
      { title: "Module 1 — Framing the policy question", desc: null, lessons: [] },
      { title: "Module 2 — Evidence types and trade-offs", desc: null, lessons: [] },
      { title: "Module 3 — Memo craft", desc: null, lessons: [] },
      { title: "Residency — In-person briefings", desc: null, lessons: [] },
    ],
  },

  // 6 ─ In Person · Intermediate · Free
  {
    title: "Participatory Action Research Methods",
    slug:  "participatory-action-research-methods",
    tagline: "Co-produce knowledge with the communities you study",
    excerpt: "A week-long in-person workshop on Participatory Action Research methods, co-design, and ethical co-authorship with community partners.",
    thumbnail: PLACEHOLDER_THUMB,
    level: "INTERMEDIATE",
    pricing: "free",
    paymentType: null,
    price: 0,
    featured: false,
    predefinedAnalytics: true,
    categorySlug:       "participatory-action-research-par",
    programLevelSlug:   "intermediate",
    programFormatSlug:  "in-person",
    programPricingSlug: "free",
    duration: "1",
    format:   "In Person",
    startDate: "2026-11-09",
    endDate:   "2026-11-14",
    rating: 4.9, reviewCount: 41, enrolledCount: 96, countriesCount: 9,
    overview: "<p>A residential workshop on Participatory Action Research (PAR): how to co-design research questions with communities, share authorship and ownership, and produce findings that move communities toward the change they identified.</p>",
    targetAudience: [
      "Field researchers and PhD candidates",
      "Practitioner-researchers in development NGOs",
      "Community organisers entering academic-research partnerships",
    ],
    learningObjectives: [
      "Co-design a research question with community partners",
      "Apply PAR methods to data collection and analysis",
      "Negotiate authorship and ownership of findings",
      "Plan ethical exit and feedback loops",
    ],
    whatIsIncluded: [
      "5 days of facilitated in-person sessions",
      "Field exercises with partner communities",
      "Toolkit of PAR instruments and consent templates",
      "Travel stipend for accepted scholarship participants",
    ],
    faqs: [
      { q: "Is the programme really free?", a: "Yes. Tuition is fully funded; selected scholarship recipients also receive a travel stipend." },
      { q: "How are participants selected?", a: "By application — we look for current PAR work or a clear plan to apply the methods within 6 months." },
    ],
    facilitators: [
      { name: "Dr. Kemi Olatunji", title: "PAR Lead · ARPS Institute", bio: "<p>Kemi has co-led PAR initiatives across West Africa for two decades, with a focus on health-systems research.</p>", imageUrl: PLACEHOLDER_FACILITATOR, credentials: null },
    ],
    curriculum: [
      { title: "Day 1 — Foundations and Ethics", desc: null, lessons: [] },
      { title: "Day 2 — Co-Designing the Question", desc: null, lessons: [] },
      { title: "Day 3 — Field Methods", desc: null, lessons: [] },
      { title: "Day 4 — Analysis with Partners", desc: null, lessons: [] },
      { title: "Day 5 — Authorship and Exit", desc: null, lessons: [] },
    ],
  },
]

async function main() {
  const admin = await db.user.findFirst({ where: { role: "ADMIN" } })
  if (!admin) throw new Error("No ADMIN user found — create one before seeding programmes.")

  // Build slug→id maps once
  const [categories, levels, formats, pricingRows] = await Promise.all([
    db.category.findMany({ select: { id: true, slug: true } }),
    db.programLevel.findMany({ select: { id: true, slug: true } }),
    db.programFormat.findMany({ select: { id: true, slug: true } }),
    db.programPricing.findMany({ select: { id: true, slug: true } }),
  ])
  const bySlug = (rows: { id: string; slug: string }[]) =>
    Object.fromEntries(rows.map(r => [r.slug, r.id]))
  const catId   = bySlug(categories)
  const lvlId   = bySlug(levels)
  const fmtId   = bySlug(formats)
  const prcId   = bySlug(pricingRows)

  for (const s of SAMPLES) {
    const data = {
      title:        s.title,
      slug:         s.slug,
      excerpt:      s.excerpt,
      thumbnail:    s.thumbnail,
      tagline:      s.tagline,
      level:        s.level,
      pricing:      s.pricing,
      paymentType:  s.paymentType,
      price:        s.price,
      featured:     s.featured,
      predefinedAnalytics: s.predefinedAnalytics,
      instructorId: admin.id,
      categoryId:   catId[s.categorySlug]    ?? null,
      programLevelId:   lvlId[s.programLevelSlug]   ?? null,
      programFormatId:  fmtId[s.programFormatSlug]  ?? null,
      programPricingId: prcId[s.programPricingSlug] ?? null,
      duration:    s.duration   ?? null,
      format:      s.format     ?? null,
      startDate:   s.startDate  ?? null,
      endDate:     s.endDate    ?? null,
      cohortSize:  s.cohortSize ?? null,
      rating:         s.predefinedAnalytics ? (s.rating         ?? null) : null,
      reviewCount:    s.predefinedAnalytics ? (s.reviewCount    ?? null) : null,
      enrolledCount:  s.predefinedAnalytics ? (s.enrolledCount  ?? null) : null,
      countriesCount: s.predefinedAnalytics ? (s.countriesCount ?? null) : null,
      overview:           s.overview,
      targetAudience:     s.targetAudience     as never,
      learningObjectives: s.learningObjectives as never,
      whatIsIncluded:     s.whatIsIncluded     as never,
      faqs:               s.faqs               as never,
      facilitators:       s.facilitators       as never,
      curriculum:         s.curriculum         as never,
    }

    const result = await db.course.upsert({
      where:  { slug: s.slug },
      create: data,
      update: data,
    })
    console.log(`✓ ${s.slug.padEnd(50)} → ${result.id}`)
  }
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
