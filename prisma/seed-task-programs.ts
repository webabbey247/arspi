/**
 * Seeds dummy programmes for 5 categories (task.md Tasks 1–5).
 * Content is generated from per-category profiles + per-title specifics.
 * Idempotent — re-running upserts by slug.
 *
 * Run:  npx tsx prisma/seed-task-programs.ts
 */
import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient, CourseLevel } from "@prisma/client"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const db      = new PrismaClient({ adapter })

const PLACEHOLDER_THUMB       = "https://utfs.io/f/swQXhLUx8k7SylnOIEvuOyhuqXDQmi7AnwfBWz6xKvYEsGg1"
const PLACEHOLDER_FACILITATOR = "https://utfs.io/f/swQXhLUx8k7S7AEcAEWqCOz1DXfMYnwbRWd8vIogsANJTGiV"

// ── Cycling option pools (deterministic variety by index) ──────────────────────

const LEVELS = [
  { enum: "INTERMEDIATE" as CourseLevel, slug: "intermediate" },
  { enum: "ADVANCED"     as CourseLevel, slug: "advanced" },
  { enum: "BEGINNER"     as CourseLevel, slug: "beginner" },
  { enum: "INTERMEDIATE" as CourseLevel, slug: "all-levels" },
]

const FORMATS = [
  { label: "Cohort Based", slug: "cohort-based", cohort: true,  scheduled: true },
  { label: "Live Online",  slug: "live-online",  cohort: false, scheduled: true },
  { label: "Self-Paced",   slug: "self-paced",   cohort: false, scheduled: false },
  { label: "Hybrid",       slug: "hybrid",       cohort: false, scheduled: true },
]

const DURATIONS  = ["6 weeks", "8 weeks", "10 weeks", "7 weeks", "9 weeks", "5 weeks", "12 weeks"]
const PRICES     = [650, 750, 800, 900, 1100, 1200, 1350, 1500]
const STARTDATES = ["14 April 2026", "5 May 2026", "20 April 2026", "27 April 2026", "11 May 2026", "18 May 2026", "1 June 2026", "8 June 2026", "15 June 2026"]

// ── Category profiles ──────────────────────────────────────────────────────────

type Profile = {
  categorySlug: string
  theme:        string            // short phrase used in generated copy
  audience:     string[]
  included:     string[]
  faqs:         { q: string; a: string }[]
  facilitator:  { name: string; title: string; bio: string; credentials: string }
}

const PROFILES: Record<string, Profile> = {
  "applied-research-and-analytics": {
    categorySlug: "applied-research-and-analytics",
    theme: "applied research and analytics",
    audience: [
      "Researchers and research analysts",
      "M&E officers and data specialists",
      "Graduate students and academics",
      "Programme and policy analysts",
      "Consultants and evaluators",
      "Data-driven professionals across sectors",
    ],
    included: [
      "Live virtual sessions (recorded)",
      "Self-paced video content",
      "Practical weekly assignments",
      "Capstone applied research project",
      "Downloadable templates & datasets",
      "Cohort discussion forums",
      "12 months platform access",
      "Verified digital certificate",
    ],
    faqs: [
      { q: "Do I need a statistics background?", a: "Basic numeracy helps, but the programme introduces the methods you need step by step with applied examples." },
      { q: "How many hours per week should I expect?", a: "Plan for roughly 6–8 hours per week, including the live session, self-paced content, and a weekly applied task." },
      { q: "Are sessions recorded?", a: "Yes. All live sessions are recorded and posted within 24 hours so you can keep pace across time zones." },
      { q: "Is the certificate recognised internationally?", a: "Yes — the ARPS Institute certificate includes a QR verification code and is recognised across 120+ countries." },
    ],
    facilitator: { name: "Dr. Rachel Osei", title: "Director, Applied Research Methods · ARPS Institute", bio: "Dr. Osei is a research methodologist with over 15 years of experience designing studies and evaluation systems for international development, government, and academic institutions across four continents.", credentials: "PhD Research Methods — University of Ghana\nMSc International Development — LSE\n15+ Years Research Practice" },
  },

  "leadership-and-management-sciences": {
    categorySlug: "leadership-and-management-sciences",
    theme: "leadership and management",
    audience: [
      "Senior managers and team leaders",
      "Directors and executives",
      "Public-sector and NGO leaders",
      "Project and programme managers",
      "HR and organisational-development staff",
      "Aspiring leaders preparing for the next role",
    ],
    included: [
      "Live virtual leadership sessions (recorded)",
      "Case-study readings each week",
      "Peer learning circles",
      "Capstone leadership project",
      "Leadership tools & templates",
      "Cohort discussion forums",
      "12 months platform access",
      "Verified digital certificate",
    ],
    faqs: [
      { q: "Do I need to be in a leadership role already?", a: "No. The programme suits both current leaders and those preparing for their first leadership role, using a context you know well." },
      { q: "How much time per week?", a: "Approximately 6–8 hours per week, including the live session and a weekly applied assignment." },
      { q: "Are sessions confidential?", a: "Peer discussions default to Chatham House rule so participants can speak candidly." },
      { q: "Can my organisation sponsor several people?", a: "Yes — group rates and institutional invoicing are available for 3+ enrolments." },
    ],
    facilitator: { name: "Hon. Tunde Akinwale", title: "Senior Fellow, Leadership · ARPS Institute", bio: "Tunde has led organisational-transformation and reform programmes in the public and nonprofit sectors for two decades, coaching senior leaders across Africa and beyond.", credentials: "MPA — Harvard Kennedy School\nFormer Permanent Secretary\n20+ Years Leadership Practice" },
  },

  "information-technology-and-digital-innovation": {
    categorySlug: "information-technology-and-digital-innovation",
    theme: "technology and digital innovation",
    audience: [
      "IT and data professionals",
      "Digital transformation leads",
      "Analysts and product managers",
      "Technology decision-makers",
      "Consultants and solution architects",
      "Professionals upskilling in digital",
    ],
    included: [
      "Live virtual sessions (recorded)",
      "Hands-on tool labs",
      "Practical weekly assignments",
      "Capstone implementation project",
      "Templates, datasets & checklists",
      "Cohort discussion forums",
      "12 months platform access",
      "Verified digital certificate",
    ],
    faqs: [
      { q: "Do I need to write code?", a: "No coding is required for most tracks; where tools or scripting appear, they are introduced gently and remain optional." },
      { q: "Which tools and platforms are covered?", a: "We use current, widely adopted tools and keep the specifics up to date each cohort; the focus is on transferable skills." },
      { q: "How much time per week?", a: "Plan for around 6–8 hours per week, including the live session and a hands-on assignment." },
      { q: "Is the certificate recognised?", a: "Yes — the ARPS Institute certificate is QR-verified and recognised internationally." },
    ],
    facilitator: { name: "Ifeoma Eze", title: "Lead, Digital Innovation · ARPS Institute", bio: "Ifeoma has delivered data, AI, and digital-transformation initiatives for enterprises and public institutions across four continents.", credentials: "MSc Computer Science\nCloud & AI Certified\n12+ Years in Technology" },
  },

  "social-sciences-and-public-policy": {
    categorySlug: "social-sciences-and-public-policy",
    theme: "social science and public policy",
    audience: [
      "Policy advisors and analysts",
      "Public servants and officials",
      "NGO and civil-society leaders",
      "Researchers and think-tank staff",
      "Community development practitioners",
      "Graduate students in policy and social science",
    ],
    included: [
      "Live virtual seminars (recorded)",
      "Curated policy readings each week",
      "Peer learning circles",
      "Capstone policy or field project",
      "Frameworks & briefing templates",
      "Cohort discussion forums",
      "12 months platform access",
      "Verified digital certificate",
    ],
    faqs: [
      { q: "Do I need a policy background?", a: "No formal background is required, though familiarity with a policy or community context helps you apply the material." },
      { q: "How much time per week?", a: "Approximately 6–8 hours per week, including the live seminar and a weekly assignment." },
      { q: "Are seminars under Chatham House rule?", a: "Yes — seminars default to Chatham House rule to support candid discussion." },
      { q: "Can agencies sponsor teams?", a: "Yes — institutional invoicing and group rates are available for 3+ participants." },
    ],
    facilitator: { name: "Dr. Ngozi Ifedi", title: "Director of Policy Research · ARPS Institute", bio: "Ngozi has led policy and evaluation studies for the World Bank, FCDO, and several governments, with a focus on governance, equity, and social transformation.", credentials: "PhD Public Policy\nMPA — Harvard Kennedy School\n17+ Years Practice" },
  },

  "participatory-action-research-par": {
    categorySlug: "participatory-action-research-par",
    theme: "participatory action research",
    audience: [
      "Field researchers and PhD candidates",
      "Practitioner-researchers in NGOs",
      "Community organisers and facilitators",
      "Public-health and development workers",
      "Educators and social-justice advocates",
      "Anyone co-producing knowledge with communities",
    ],
    included: [
      "Live facilitated sessions (recorded)",
      "Field exercises and co-design labs",
      "Toolkit of PAR instruments & consent templates",
      "Capstone participatory project plan",
      "Ethics and reflexivity resources",
      "Cohort discussion forums",
      "12 months platform access",
      "Verified digital certificate",
    ],
    faqs: [
      { q: "Do I need prior research experience?", a: "Some exposure to research or community work helps, but the programme builds PAR skills from first principles." },
      { q: "How much time per week?", a: "Plan for roughly 6–8 hours per week, including the live session and applied fieldwork tasks." },
      { q: "Is fieldwork required?", a: "Applied tasks are grounded in your own context or community; we provide guidance and ethical templates throughout." },
      { q: "Is the certificate recognised?", a: "Yes — the ARPS Institute certificate is QR-verified and recognised internationally." },
    ],
    facilitator: { name: "Dr. Kemi Olatunji", title: "Lead, Participatory Action Research · ARPS Institute", bio: "Kemi has co-led PAR and community-based research initiatives across West Africa for two decades, with a focus on health systems and social justice.", credentials: "PhD Community Research\nMSc Public Health\n20+ Years PAR Practice" },
  },
}

// ── Title lists (task.md Tasks 1–5) ────────────────────────────────────────────

const TASKS: { categorySlug: string; titles: string[] }[] = [
  {
    categorySlug: "applied-research-and-analytics",
    titles: [
      "Monitoring and Evaluation (M&E)",
      "Impact Evaluation and Programme Assessment",
      "Policy Research and Public Sector Analysis",
      "Institutional Research and Higher Education Analytics",
      "Market Research and Consumer Analytics",
      "Research Data Analytics and Visualisation",
      "Artificial Intelligence for Research and Innovation",
      "Research Ethics and Responsible Conduct",
      "Research Project Management",
      "Research Analysts",
      "Qualitative Research Methods",
      "Quantitative Research Methods",
      "Mixed Methods Research",
      "Academic Writing and Scholarly Publishing",
    ],
  },
  {
    categorySlug: "leadership-and-management-sciences",
    titles: [
      "Strategic Leadership and Organisational Transformation",
      "Project Management and Implementation",
      "Public Sector Leadership and Governance",
      "Nonprofit Leadership and Management",
      "Human Resource Management and Workforce Development",
      "Organisational Development and Change Management",
      "Governance and Social Transformation",
      "Executive Leadership and Decision-Making",
      "Corporate Governance and Compliance",
      "Innovation and Change Leadership",
    ],
  },
  {
    categorySlug: "information-technology-and-digital-innovation",
    titles: [
      "Data Analytics",
      "Business Intelligence and Data Visualisation",
      "Artificial Intelligence for Professionals",
      "Digital Transformation and Innovation Management",
      "IT Governance, Risk and Compliance",
      "Cybersecurity Leadership and Risk Management",
      "Cloud Computing and AI Solutions",
      "Agile Product Management",
      "Digital Strategy and Emerging Technologies",
      "Data Governance and Information Management",
    ],
  },
  {
    categorySlug: "social-sciences-and-public-policy",
    titles: [
      "Public Policy Analysis and Governance",
      "Community Development and Social Innovation",
      "Governance and Institutional Transformation",
      "Conflict Resolution, Mediation and Peacebuilding",
      "Sustainable Development and Policy Leadership",
      "Rural Development and Community Transformation",
      "Social Justice and Inclusive Development",
      "Public Leadership and Civic Engagement",
    ],
  },
  {
    categorySlug: "participatory-action-research-par",
    titles: [
      "Participatory Action Research (PAR)",
      "PAR for NGOs and Community-Based Organisations",
      "PAR for Educational Research and Practice",
      "PAR for Social Justice and Community Transformation",
      "PAR for Policy and Institutional Transformation",
      "PAR for Public Health and Rural Development",
      "Community-Based Participatory Research (CBPR)",
      "Decolonial Research Methodologies",
      "Transformative and Participatory Research Approaches",
    ],
  },
]

// ── Generators ─────────────────────────────────────────────────────────────────

function slugify(title: string): string {
  return title
    .replace(/\s*\([^)]*\)/g, "")  // drop parentheticals e.g. (M&E), (PAR)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/** Title without any parenthetical, for use mid-sentence. */
function shortTitle(title: string): string {
  return title.replace(/\s*\([^)]*\)/g, "").trim()
}

function buildObjectives(title: string, theme: string): string[] {
  const t = shortTitle(title)
  return [
    `Build a solid foundation in ${t}`,
    `Apply core ${theme} frameworks to real problems`,
    `Use the key methods and tools of ${t} with confidence`,
    `Analyse and interpret evidence to support decisions`,
    `Communicate findings and recommendations to diverse stakeholders`,
    `Plan and deliver a complete ${t} project end to end`,
  ]
}

function buildCurriculum(title: string, theme: string) {
  const t = shortTitle(title)
  return [
    { week: "Module 1", title: `Foundations of ${t}`, desc: `Core concepts, terminology, and the role of ${t} in practice.`, topics: ["Key concepts", "Terminology", "Standards & ethics", "The practice landscape"] },
    { week: "Module 2", title: "Frameworks and Approaches", desc: `The leading frameworks and approaches that structure ${theme} work.`, topics: ["Core frameworks", "Design choices", "Planning", "Best practice"] },
    { week: "Module 3", title: "Methods and Tools", desc: `Hands-on methods and tools used by ${t} practitioners.`, topics: ["Methods", "Tools & software", "Data & evidence", "Quality assurance"] },
    { week: "Module 4", title: "Applied Practice", desc: `Applying ${t} to real cases drawn from your own context.`, topics: ["Case studies", "Applied exercises", "Stakeholders", "Common pitfalls"] },
    { week: "Module 5", title: "Advanced Topics and Cases", desc: `Advanced considerations, emerging trends, and complex scenarios in ${theme}.`, topics: ["Advanced topics", "Emerging trends", "Complex cases", "Risk & ethics"] },
    { week: "Module 6", title: `Capstone — ${t} Project`, desc: `Bringing it all together into a complete, reviewed ${t} project.`, topics: ["Project design", "Implementation", "Reporting", "Presentation"] },
  ]
}

function buildOverview(title: string, theme: string): string {
  const t = shortTitle(title)
  return `This professional certificate programme gives participants a thorough, practical grounding in ${t}. It is designed for professionals who want to strengthen their capabilities in ${theme} and apply them immediately in their work.\n\nThe programme is highly applied — each module pairs expert-led content with hands-on assignments grounded in your own context, culminating in a capstone project that demonstrates your mastery of ${t}.`
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  const admin = await db.user.findFirst({ where: { role: "ADMIN" } })
  if (!admin) throw new Error("No ADMIN user found — create one before seeding programmes.")

  const [categories, levels, formats, pricingRows] = await Promise.all([
    db.category.findMany({ select: { id: true, slug: true } }),
    db.programLevel.findMany({ select: { id: true, slug: true } }),
    db.programFormat.findMany({ select: { id: true, slug: true } }),
    db.programPricing.findMany({ select: { id: true, slug: true } }),
  ])
  const bySlug = (rows: { id: string; slug: string }[]) =>
    Object.fromEntries(rows.map(r => [r.slug, r.id]))
  const catId = bySlug(categories)
  const lvlId = bySlug(levels)
  const fmtId = bySlug(formats)
  const prcId = bySlug(pricingRows)

  const seenSlugs = new Set<string>()
  let idx = 0
  let count = 0

  for (const task of TASKS) {
    const profile = PROFILES[task.categorySlug]
    if (!profile) throw new Error(`No profile for category ${task.categorySlug}`)
    if (!catId[task.categorySlug]) throw new Error(`Category "${task.categorySlug}" not found in DB.`)

    for (const title of task.titles) {
      let slug = slugify(title)
      // guard against rare collisions (e.g. "Participatory Action Research" appears as title + acronym)
      while (seenSlugs.has(slug)) slug = `${slug}-2`
      seenSlugs.add(slug)

      const lvl    = LEVELS[idx % LEVELS.length]
      const fmt    = FORMATS[idx % FORMATS.length]
      const isFree = idx % 6 === 5
      const price  = isFree ? 0 : PRICES[idx % PRICES.length]
      const duration = DURATIONS[idx % DURATIONS.length]
      const predefinedAnalytics = !isFree
      const t = shortTitle(title)

      const data = {
        title,
        slug,
        excerpt: `A practical professional programme in ${t} — build the skills, methods, and confidence to apply ${profile.theme} in your work.`,
        thumbnail: PLACEHOLDER_THUMB,
        tagline: `Master ${t} and apply it with confidence`,
        level: lvl.enum,
        pricing: (isFree ? "free" : "paid") as string,
        paymentType: isFree ? null : "one-time",
        price,
        featured: idx % 7 === 0,
        predefinedAnalytics,
        instructorId: admin.id,
        categoryId: catId[task.categorySlug],
        programLevelId:   lvlId[lvl.slug] ?? null,
        programFormatId:  fmtId[fmt.slug] ?? null,
        programPricingId: prcId[isFree ? "free" : "paid"] ?? null,
        duration,
        format: fmt.label,
        startDate: fmt.scheduled ? STARTDATES[idx % STARTDATES.length] : null,
        endDate: null as string | null,
        cohortSize: fmt.cohort ? 30 + (idx % 4) * 5 : null,
        rating:         predefinedAnalytics ? Number((4.5 + (idx % 5) * 0.1).toFixed(1)) : null,
        reviewCount:    predefinedAnalytics ? 60 + idx * 13 : null,
        enrolledCount:  predefinedAnalytics ? 300 + idx * 47 : null,
        countriesCount: predefinedAnalytics ? 15 + (idx % 40) : null,
        overview: buildOverview(title, profile.theme),
        targetAudience:     profile.audience               as never,
        learningObjectives: buildObjectives(title, profile.theme) as never,
        whatIsIncluded:     profile.included               as never,
        faqs:               profile.faqs                   as never,
        facilitators:       [{ ...profile.facilitator, imageUrl: PLACEHOLDER_FACILITATOR }] as never,
        curriculum:         buildCurriculum(title, profile.theme) as never,
      }

      const result = await db.course.upsert({
        where:  { slug },
        create: data,
        update: data,
      })
      console.log(`✓ [${task.categorySlug.slice(0, 18).padEnd(18)}] ${slug.padEnd(50)} → ${result.id}`)
      idx++
      count++
    }
  }

  console.log(`\nSeeded ${count} programmes across ${TASKS.length} categories.`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
