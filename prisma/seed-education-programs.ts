/**
 * Seeds 10 dummy programmes under the "Education and Learning Sciences" category.
 * Idempotent — re-running upserts by slug.
 *
 * Run:  npx tsx prisma/seed-education-programs.ts
 *
 * Prereqs (verified present in this DB):
 *   - A User with role=ADMIN
 *   - Category slug "education-and-learning-sciences"
 *   - ProgramLevel / ProgramFormat / ProgramPricing lookup rows
 */
import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient, CourseLevel } from "@prisma/client"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const db      = new PrismaClient({ adapter })

const CATEGORY_SLUG = "education-and-learning-sciences"
const PLACEHOLDER_THUMB       = "https://utfs.io/f/swQXhLUx8k7SylnOIEvuOyhuqXDQmi7AnwfBWz6xKvYEsGg1"
const PLACEHOLDER_FACILITATOR = "https://utfs.io/f/swQXhLUx8k7S7AEcAEWqCOz1DXfMYnwbRWd8vIogsANJTGiV"

type Module = { week: string; title: string; desc: string | null; topics: string[] }

type SampleProgram = {
  title:        string
  slug:         string
  tagline:      string
  excerpt:      string
  level:        CourseLevel
  pricing:      "free" | "paid"
  paymentType:  "one-time" | "subscription" | "monthly" | null
  price:        number
  featured:     boolean
  predefinedAnalytics: boolean

  programLevelSlug:   string
  programFormatSlug:  string
  programPricingSlug: string

  duration:    string | null
  format:      string | null
  startDate:   string | null
  endDate:     string | null
  cohortSize:  number | null

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
  curriculum:         Module[]
}

const SAMPLES: SampleProgram[] = [
  // 1 ─ Educational Leadership and Management
  {
    title: "Educational Leadership and Management",
    slug:  "educational-leadership-and-management",
    tagline: "Lead schools and education systems with confidence and evidence",
    excerpt: "An eight-week cohort programme for current and aspiring education leaders — covering instructional leadership, people management, finance, and whole-institution improvement.",
    level: "ADVANCED",
    pricing: "paid", paymentType: "one-time", price: 1200,
    featured: true, predefinedAnalytics: true,
    programLevelSlug: "advanced", programFormatSlug: "cohort-based", programPricingSlug: "paid",
    duration: "8 weeks", format: "Cohort Based", startDate: "14 April 2026", endDate: "8 June 2026", cohortSize: 35,
    rating: 4.9, reviewCount: 312, enrolledCount: 2100, countriesCount: 120,
    overview: "This certificate programme equips heads of school, department leads, and education administrators with the leadership and management capabilities to drive measurable improvement across their institutions.\n\nParticipants move from theory to practice through case studies, peer dialogue, and an applied improvement project rooted in their own context. The programme balances the human side of leadership — culture, motivation, and change — with the operational disciplines of budgeting, governance, and accountability.",
    targetAudience: [
      "School principals and deputy heads",
      "Department and faculty leads",
      "Education administrators and system officials",
      "Aspiring leaders preparing for headship",
      "MAT and district education managers",
      "Programme officers in education NGOs",
    ],
    learningObjectives: [
      "Apply instructional-leadership practices that raise teaching quality",
      "Lead change and build a positive institutional culture",
      "Manage budgets, resources, and staffing strategically",
      "Use data to set priorities and monitor improvement",
      "Navigate governance, accountability, and stakeholder relations",
      "Develop a costed whole-institution improvement plan",
    ],
    whatIsIncluded: [
      "8 live virtual sessions (recorded)",
      "40+ hours of self-paced content",
      "8 practical weekly assignments",
      "Capstone institutional improvement plan",
      "Downloadable leadership templates & tools",
      "Cohort discussion forums",
      "12 months platform access",
      "Verified digital certificate",
      "ARPS alumni network access",
    ],
    faqs: [
      { q: "Do I need to be in a leadership role already?", a: "No. The programme suits both current leaders and those preparing for their first leadership role. Aspiring leaders complete the same applied project using a context they know well." },
      { q: "How many hours per week should I expect to commit?", a: "Plan for approximately 6–8 hours per week, including a 90-minute live session, self-paced content, and a weekly applied assignment." },
      { q: "Are live sessions recorded?", a: "Yes. All live sessions are recorded and available in your dashboard within 24 hours so you can keep pace across time zones." },
      { q: "Is the certificate internationally recognised?", a: "The ARPS Institute certificate is recognised by education organisations and institutions across 120+ countries and includes a QR verification code." },
    ],
    facilitators: [
      { name: "Dr. Rachel Osei", title: "Director of Educational Leadership · ARPS Institute", bio: "Dr. Osei has led school-improvement and leadership-development programmes across Sub-Saharan Africa and the Middle East for over 16 years, advising ministries of education and large school networks.", imageUrl: PLACEHOLDER_FACILITATOR, credentials: "PhD Education Leadership — University of Ghana\nMEd School Management — IOE, UCL\n16+ Years Leadership Practice" },
    ],
    curriculum: [
      { week: "Week 1", title: "Foundations of Educational Leadership", desc: "Leadership models, the leader's role in learning, and self-as-leader.", topics: ["Leadership theories", "Instructional vs managerial leadership", "Leader self-assessment", "Vision & values"] },
      { week: "Week 2", title: "Building Culture and Leading People", desc: "Motivation, trust, and the everyday practices that shape institutional culture.", topics: ["Organisational culture", "Motivating staff", "Difficult conversations", "Distributed leadership"] },
      { week: "Week 3", title: "Instructional Leadership", desc: "Raising teaching quality through observation, feedback, and professional learning.", topics: ["Lesson observation", "Coaching teachers", "Professional learning communities", "Curriculum oversight"] },
      { week: "Week 4", title: "Strategic and Financial Management", desc: "Budgeting, resource allocation, and aligning spend to priorities.", topics: ["Budgeting basics", "Resource allocation", "Procurement", "Value for money"] },
      { week: "Week 5", title: "Data for Decision-Making", desc: "Using performance and operational data to set and track priorities.", topics: ["Performance data", "Setting targets", "Dashboards", "Avoiding data misuse"] },
      { week: "Week 6", title: "Governance and Accountability", desc: "Working with boards, regulators, and parents while staying accountable.", topics: ["Governance structures", "Regulatory compliance", "Stakeholder relations", "Risk management"] },
      { week: "Week 7", title: "Leading Change and Improvement", desc: "Designing and sequencing change that sticks.", topics: ["Change models", "Improvement cycles", "Managing resistance", "Sustaining gains"] },
      { week: "Week 8", title: "Capstone — Improvement Plan", desc: "Bringing it together into a costed, evidence-based improvement plan.", topics: ["Plan design", "Costing", "Monitoring framework", "Presentation"] },
    ],
  },

  // 2 ─ Curriculum Design and Instructional Innovation
  {
    title: "Curriculum Design and Instructional Innovation",
    slug:  "curriculum-design-and-instructional-innovation",
    tagline: "Design curricula and learning experiences that actually work",
    excerpt: "A six-week cohort on evidence-based curriculum design, backward planning, and instructional innovation for educators and learning designers.",
    level: "INTERMEDIATE",
    pricing: "paid", paymentType: "one-time", price: 850,
    featured: false, predefinedAnalytics: true,
    programLevelSlug: "intermediate", programFormatSlug: "cohort-based", programPricingSlug: "paid",
    duration: "6 weeks", format: "Cohort Based", startDate: "5 May 2026", endDate: "16 June 2026", cohortSize: 30,
    rating: 4.7, reviewCount: 168, enrolledCount: 940, countriesCount: 48,
    overview: "This programme takes educators and learning designers from curriculum intent to classroom-ready materials using backward design, cognitive science, and inclusive-design principles.\n\nEach week pairs a live workshop with an applied task built on your own subject or course, so you finish with a complete, coherent unit of work ready to teach.",
    targetAudience: [
      "Classroom teachers and lecturers",
      "Curriculum coordinators and subject leads",
      "Instructional and learning designers",
      "Course creators and trainers",
      "Education content developers",
      "Teacher educators",
    ],
    learningObjectives: [
      "Apply backward design to build coherent curricula",
      "Write measurable learning outcomes",
      "Sequence content using cognitive-science principles",
      "Design for inclusion and accessibility",
      "Integrate active and innovative instructional strategies",
      "Produce a complete, teachable unit of work",
    ],
    whatIsIncluded: [
      "6 live cohort workshops",
      "6 applied design assignments with peer review",
      "Capstone unit-of-work portfolio",
      "Curriculum-mapping templates",
      "12 months platform access",
      "Verified digital certificate",
    ],
    faqs: [
      { q: "What subject or level is this for?", a: "The principles apply across subjects and levels — from secondary through higher education and professional training. You apply them to your own context throughout." },
      { q: "How much time per week?", a: "Roughly 5–6 hours including the live session and your weekly design task." },
      { q: "Will I have something usable at the end?", a: "Yes. The capstone is a complete unit of work you can teach immediately." },
    ],
    facilitators: [
      { name: "Dr. Adaeze Nwosu", title: "Principal Curriculum Strategist · ARPS Institute", bio: "Adaeze has designed curricula for ministries, universities, and open-learning providers for over 15 years, with a focus on coherence and equity.", imageUrl: PLACEHOLDER_FACILITATOR, credentials: "PhD Curriculum Studies\nMEd Instructional Design\n15+ Years Practice" },
    ],
    curriculum: [
      { week: "Week 1", title: "Curriculum Intent and Backward Design", desc: "Starting from outcomes and working back to content.", topics: ["Backward design", "Curriculum intent", "Outcome statements"] },
      { week: "Week 2", title: "Learning Outcomes and Alignment", desc: "Writing outcomes and aligning assessment to them.", topics: ["Measurable outcomes", "Constructive alignment", "Bloom's taxonomy"] },
      { week: "Week 3", title: "Sequencing and Cognitive Load", desc: "Ordering content so it sticks.", topics: ["Cognitive load", "Spacing & retrieval", "Schema building"] },
      { week: "Week 4", title: "Inclusive and Accessible Design", desc: "Designing for the full range of learners.", topics: ["Universal Design for Learning", "Accessibility", "Differentiation"] },
      { week: "Week 5", title: "Instructional Innovation", desc: "Active, project-based, and blended strategies.", topics: ["Active learning", "Project-based learning", "Blended models"] },
      { week: "Week 6", title: "Capstone — Unit of Work", desc: "Assembling a complete, teachable unit.", topics: ["Unit assembly", "Materials", "Peer review"] },
    ],
  },

  // 3 ─ Higher Education Leadership and Administration
  {
    title: "Higher Education Leadership and Administration",
    slug:  "higher-education-leadership-and-administration",
    tagline: "Run universities and colleges with strategy and rigour",
    excerpt: "A ten-week live-online programme on governance, strategy, finance, and academic administration for university and college leaders.",
    level: "ADVANCED",
    pricing: "paid", paymentType: "one-time", price: 1500,
    featured: false, predefinedAnalytics: true,
    programLevelSlug: "advanced", programFormatSlug: "live-online", programPricingSlug: "paid",
    duration: "10 weeks", format: "Live Online", startDate: "20 April 2026", endDate: "29 June 2026", cohortSize: 28,
    rating: 4.8, reviewCount: 96, enrolledCount: 410, countriesCount: 34,
    overview: "Designed for deans, registrars, directors, and senior administrators, this programme builds the strategic and operational capabilities needed to lead higher-education institutions through funding pressure, regulation, and rising student expectations.\n\nTen weekly live seminars combine sector cases, peer dialogue, and a strategy project applied to your own institution.",
    targetAudience: [
      "Deans and associate deans",
      "Registrars and academic administrators",
      "Directors of professional services",
      "Heads of school and faculty",
      "Aspiring senior leaders in HE",
      "Higher-education policy officers",
    ],
    learningObjectives: [
      "Lead institutional strategy and planning",
      "Navigate HE governance and regulation",
      "Manage budgets, income diversification, and risk",
      "Lead academic quality and the student experience",
      "Drive partnerships, internationalisation, and growth",
      "Develop an institutional strategy brief",
    ],
    whatIsIncluded: [
      "10 live virtual seminars (recorded)",
      "Sector case-study readings each week",
      "Peer learning circles",
      "Capstone institutional strategy brief",
      "12 months platform access",
      "Verified digital certificate",
    ],
    faqs: [
      { q: "Is this only for universities?", a: "No. The content applies to universities, colleges, and polytechnics. Examples span public and private institutions." },
      { q: "Are the seminars recorded?", a: "Yes, recordings are posted within 24 hours for anyone who cannot attend live." },
      { q: "Can my institution sponsor several leaders?", a: "Yes — group rates and institutional invoicing are available for 3+ enrolments." },
    ],
    facilitators: [
      { name: "Prof. Daniel Mensah", title: "Senior Fellow, Higher Education · ARPS Institute", bio: "Daniel served as a pro vice-chancellor and has advised universities across three continents on strategy, quality, and governance.", imageUrl: PLACEHOLDER_FACILITATOR, credentials: "PhD Higher Education Policy\nFormer Pro Vice-Chancellor\n20+ Years in HE" },
    ],
    curriculum: [
      { week: "Week 1", title: "The Higher Education Landscape", desc: "Forces shaping the modern institution.", topics: ["Sector trends", "Funding models", "Massification"] },
      { week: "Week 2", title: "Governance and Regulation", desc: "Councils, senates, and regulatory frameworks.", topics: ["Governance structures", "Regulation", "Academic freedom"] },
      { week: "Week 3", title: "Strategy and Planning", desc: "Setting institutional direction.", topics: ["Strategic planning", "Mission & positioning", "KPIs"] },
      { week: "Week 4", title: "Financial Sustainability", desc: "Budgets, income diversification, and risk.", topics: ["HE finance", "Income diversification", "Risk management"] },
      { week: "Week 5", title: "Academic Quality and Standards", desc: "Assuring and enhancing quality.", topics: ["Quality assurance", "Accreditation", "Programme review"] },
      { week: "Week 6", title: "The Student Experience", desc: "Recruitment, retention, and success.", topics: ["Admissions", "Retention", "Student services"] },
      { week: "Week 7", title: "Research and Enterprise", desc: "Leading research and knowledge exchange.", topics: ["Research strategy", "Grants & impact", "Industry links"] },
      { week: "Week 8", title: "Partnerships and Internationalisation", desc: "Growth through collaboration.", topics: ["Partnerships", "Internationalisation", "Branch campuses"] },
      { week: "Week 9", title: "Digital and Operational Transformation", desc: "Modernising services and systems.", topics: ["Digital strategy", "Process improvement", "Estates"] },
      { week: "Week 10", title: "Capstone — Strategy Brief", desc: "An institutional strategy brief.", topics: ["Brief design", "Costing", "Presentation"] },
    ],
  },

  // 4 ─ Teaching Excellence in Higher Education
  {
    title: "Teaching Excellence in Higher Education",
    slug:  "teaching-excellence-in-higher-education",
    tagline: "Become the lecturer students remember and learn from",
    excerpt: "An eight-week hybrid programme on evidence-based university teaching — course design, active learning, assessment, and inclusive practice.",
    level: "INTERMEDIATE",
    pricing: "paid", paymentType: "one-time", price: 900,
    featured: false, predefinedAnalytics: true,
    programLevelSlug: "intermediate", programFormatSlug: "hybrid", programPricingSlug: "paid",
    duration: "8 weeks", format: "Hybrid", startDate: "27 April 2026", endDate: "22 June 2026", cohortSize: 32,
    rating: 4.8, reviewCount: 142, enrolledCount: 760, countriesCount: 29,
    overview: "This programme helps lecturers, tutors, and graduate teaching assistants teach with confidence and impact, grounded in the scholarship of teaching and learning.\n\nIt blends online seminars with practical micro-teaching, so you leave with refined teaching practices and a peer-reviewed teaching portfolio aligned to professional recognition frameworks.",
    targetAudience: [
      "University lecturers and tutors",
      "Graduate teaching assistants",
      "Early-career academics",
      "Clinical and professional educators",
      "Technical and laboratory instructors",
      "Academics seeking teaching recognition",
    ],
    learningObjectives: [
      "Design engaging, outcome-aligned courses",
      "Facilitate active and inclusive learning",
      "Give feedback that improves learning",
      "Design valid, fair assessments",
      "Use educational technology purposefully",
      "Build a teaching portfolio for recognition",
    ],
    whatIsIncluded: [
      "8 online seminars (recorded)",
      "Micro-teaching with peer feedback",
      "Assessment and rubric templates",
      "Capstone teaching portfolio",
      "12 months platform access",
      "Verified digital certificate",
    ],
    faqs: [
      { q: "Do I need teaching experience?", a: "Some teaching exposure helps, but new and aspiring teachers are welcome and supported." },
      { q: "What is the hybrid format?", a: "Most sessions are online, with optional in-person micro-teaching clinics; recordings and remote alternatives are provided." },
      { q: "Does this map to recognition frameworks?", a: "Yes. The portfolio is structured to support applications to common professional teaching-recognition frameworks." },
    ],
    facilitators: [
      { name: "Dr. Priya Raman", title: "Lead, Teaching & Learning · ARPS Institute", bio: "Priya is an award-winning educator who has supported thousands of academics to gain teaching recognition across the UK, Africa, and Asia.", imageUrl: PLACEHOLDER_FACILITATOR, credentials: "PhD Education\nPrincipal Fellow (Teaching)\n14+ Years Practice" },
    ],
    curriculum: [
      { week: "Week 1", title: "How Students Learn", desc: "The science behind effective teaching.", topics: ["Learning science", "Motivation", "Misconceptions"] },
      { week: "Week 2", title: "Designing the Course", desc: "Aligning outcomes, activities, and assessment.", topics: ["Constructive alignment", "Outcomes", "Course mapping"] },
      { week: "Week 3", title: "Active Learning", desc: "Moving beyond the lecture.", topics: ["Active strategies", "Large-class teaching", "Discussion"] },
      { week: "Week 4", title: "Inclusive Teaching", desc: "Reaching every learner.", topics: ["Inclusive practice", "Accessibility", "Belonging"] },
      { week: "Week 5", title: "Feedback and Assessment", desc: "Assessment that drives learning.", topics: ["Assessment design", "Rubrics", "Effective feedback"] },
      { week: "Week 6", title: "Technology for Teaching", desc: "Purposeful use of edtech.", topics: ["Blended learning", "VLE/LMS", "Media"] },
      { week: "Week 7", title: "Evaluating Your Teaching", desc: "Reflection and peer review.", topics: ["Peer observation", "Student feedback", "Reflection"] },
      { week: "Week 8", title: "Capstone — Teaching Portfolio", desc: "Assembling your portfolio.", topics: ["Portfolio", "Evidence", "Recognition"] },
    ],
  },

  // 5 ─ Online, Open and Distance Learning Management
  {
    title: "Online, Open and Distance Learning Management",
    slug:  "online-open-and-distance-learning-management",
    tagline: "Design and run distance programmes that learners complete",
    excerpt: "A seven-week self-paced programme on planning, designing, and managing high-quality online, open, and distance education at scale.",
    level: "INTERMEDIATE",
    pricing: "paid", paymentType: "one-time", price: 650,
    featured: false, predefinedAnalytics: true,
    programLevelSlug: "intermediate", programFormatSlug: "self-paced", programPricingSlug: "paid",
    duration: "7 weeks", format: "Self-Paced", startDate: null, endDate: null, cohortSize: null,
    rating: 4.6, reviewCount: 118, enrolledCount: 1380, countriesCount: 52,
    overview: "This self-paced programme prepares education professionals to plan, design, and manage online, open, and distance learning (ODL) provision that is engaging, equitable, and completion-focused.\n\nDraw on instructional-design models, learner-support strategies, and quality frameworks to build an ODL programme blueprint you can implement.",
    targetAudience: [
      "Online programme managers and coordinators",
      "Instructional designers in ODL",
      "Open-university and distance-education staff",
      "Training managers moving programmes online",
      "EdTech and LMS administrators",
      "Faculty new to online teaching",
    ],
    learningObjectives: [
      "Plan ODL provision aligned to learner needs",
      "Apply instructional-design models for online learning",
      "Build learner-support and retention strategies",
      "Select and manage platforms and media",
      "Assure quality in distance programmes",
      "Produce an ODL programme blueprint",
    ],
    whatIsIncluded: [
      "7 self-paced modules (≈ 30 hours)",
      "Design and planning templates",
      "Self-check quizzes",
      "Capstone ODL blueprint",
      "12 months platform access",
      "Verified digital certificate",
    ],
    faqs: [
      { q: "Is this self-paced?", a: "Yes. You can start any time and progress at your own pace within your access period." },
      { q: "Do I need a specific LMS?", a: "No. The principles are platform-agnostic, with examples from common LMS platforms." },
      { q: "How long do I have access?", a: "You retain platform access for 12 months from enrolment." },
    ],
    facilitators: [
      { name: "Dr. Samuel Boateng", title: "Lead, Open & Distance Learning · ARPS Institute", bio: "Samuel has built and run open-learning programmes serving hundreds of thousands of learners across Africa and South Asia.", imageUrl: PLACEHOLDER_FACILITATOR, credentials: "PhD Distance Education\nMSc Instructional Design\n18+ Years in ODL" },
    ],
    curriculum: [
      { week: "Module 1", title: "Foundations of ODL", desc: "Models and history of open and distance learning.", topics: ["ODL models", "Access & equity", "Learner profiles"] },
      { week: "Module 2", title: "Designing for Online Learning", desc: "Instructional design for distance contexts.", topics: ["ID models", "Course structure", "Media selection"] },
      { week: "Module 3", title: "Learner Support and Retention", desc: "Keeping distance learners engaged.", topics: ["Tutoring", "Retention", "Community"] },
      { week: "Module 4", title: "Platforms and Technology", desc: "Choosing and managing the tech stack.", topics: ["LMS selection", "Content tools", "Analytics"] },
      { week: "Module 5", title: "Assessment at a Distance", desc: "Valid, secure online assessment.", topics: ["Online assessment", "Integrity", "Feedback"] },
      { week: "Module 6", title: "Quality and Evaluation", desc: "Assuring quality in ODL.", topics: ["Quality frameworks", "Evaluation", "Continuous improvement"] },
      { week: "Module 7", title: "Capstone — ODL Blueprint", desc: "Your implementable programme blueprint.", topics: ["Blueprint", "Costing", "Rollout plan"] },
    ],
  },

  // 6 ─ Education Policy, Governance and Reform
  {
    title: "Education Policy, Governance and Reform",
    slug:  "education-policy-governance-and-reform",
    tagline: "Turn education evidence into policy that gets implemented",
    excerpt: "A nine-week live-online programme on education policy analysis, governance, and the politics of reform for officials and advisors.",
    level: "ADVANCED",
    pricing: "paid", paymentType: "one-time", price: 1350,
    featured: false, predefinedAnalytics: true,
    programLevelSlug: "advanced", programFormatSlug: "live-online", programPricingSlug: "paid",
    duration: "9 weeks", format: "Live Online", startDate: "11 May 2026", endDate: "13 July 2026", cohortSize: 26,
    rating: 4.7, reviewCount: 64, enrolledCount: 280, countriesCount: 22,
    overview: "This programme equips education officials, advisors, and researchers to design, analyse, and implement education policy and reform that survives political and fiscal pressure.\n\nNine weekly live seminars combine policy methods with the political economy of education systems, culminating in a policy brief on a reform you care about.",
    targetAudience: [
      "Ministry of education officials",
      "Education policy advisors",
      "Think-tank and research staff",
      "Development-partner education leads",
      "System and district administrators",
      "Education-focused civil-society leaders",
    ],
    learningObjectives: [
      "Diagnose education-system challenges with evidence",
      "Analyse policy options and trade-offs",
      "Understand the political economy of reform",
      "Design implementable, financed reforms",
      "Build coalitions and manage stakeholders",
      "Write a persuasive education policy brief",
    ],
    whatIsIncluded: [
      "9 live virtual seminars (recorded)",
      "Curated policy readings each week",
      "Peer learning circles",
      "Capstone education policy brief",
      "12 months platform access",
      "Verified digital certificate",
    ],
    faqs: [
      { q: "Do I need a policy background?", a: "No formal policy background is required, but familiarity with an education system — as an official, researcher, or practitioner — will help you get the most from it." },
      { q: "Are sessions under Chatham House rule?", a: "Yes. Seminars default to Chatham House rule to support candid discussion." },
      { q: "Can agencies sponsor teams?", a: "Yes — institutional invoicing and group rates are available for 3+ participants." },
    ],
    facilitators: [
      { name: "Dr. Ngozi Ifedi", title: "Director of Policy Research · ARPS Institute", bio: "Ngozi has led education-policy and evaluation studies for the World Bank, FCDO, and several ministries of education.", imageUrl: PLACEHOLDER_FACILITATOR, credentials: "PhD Education Policy\nMPA — Harvard Kennedy School\n17+ Years Practice" },
    ],
    curriculum: [
      { week: "Week 1", title: "Education Systems and Evidence", desc: "Diagnosing system performance.", topics: ["System diagnostics", "Education data", "Benchmarking"] },
      { week: "Week 2", title: "Policy Analysis Methods", desc: "Framing problems and options.", topics: ["Problem framing", "Option appraisal", "Cost-effectiveness"] },
      { week: "Week 3", title: "Governance of Education", desc: "Who decides and how.", topics: ["Governance", "Decentralisation", "Accountability"] },
      { week: "Week 4", title: "Financing Education", desc: "Budgets, equity, and efficiency.", topics: ["Education finance", "Equity", "Efficiency"] },
      { week: "Week 5", title: "Political Economy of Reform", desc: "Why reforms stall — and how to move them.", topics: ["Political economy", "Stakeholders", "Incentives"] },
      { week: "Week 6", title: "Designing Implementable Reform", desc: "From idea to delivery.", topics: ["Implementation", "Delivery units", "Sequencing"] },
      { week: "Week 7", title: "Coalitions and Communication", desc: "Building support and messaging.", topics: ["Coalitions", "Advocacy", "Media"] },
      { week: "Week 8", title: "Monitoring Reform", desc: "Tracking and adapting.", topics: ["Monitoring", "Adaptive management", "Learning"] },
      { week: "Week 9", title: "Capstone — Policy Brief", desc: "A persuasive, financed policy brief.", topics: ["Brief design", "Costing", "Defence"] },
    ],
  },

  // 7 ─ Artificial Intelligence in Education
  {
    title: "Artificial Intelligence in Education",
    slug:  "artificial-intelligence-in-education",
    tagline: "Use AI to enhance teaching, learning, and administration — responsibly",
    excerpt: "An eight-week cohort programme on applying AI across teaching, learning design, assessment, and education administration, with a focus on ethics and impact.",
    level: "INTERMEDIATE",
    pricing: "paid", paymentType: "one-time", price: 1100,
    featured: true, predefinedAnalytics: true,
    programLevelSlug: "all-levels", programFormatSlug: "cohort-based", programPricingSlug: "paid",
    duration: "8 weeks", format: "Cohort Based", startDate: "18 May 2026", endDate: "13 July 2026", cohortSize: 40,
    rating: 4.9, reviewCount: 287, enrolledCount: 1850, countriesCount: 61,
    overview: "This hands-on cohort helps educators and education leaders move from curiosity to confident, responsible use of AI across the learning lifecycle.\n\nEvery week pairs practical work — using AI for planning, materials, feedback, and analytics — with a clear-eyed look at ethics, bias, integrity, and policy. You finish with an AI-integration plan for your institution or classroom.",
    targetAudience: [
      "Teachers and lecturers",
      "Instructional and learning designers",
      "Education leaders and administrators",
      "EdTech coordinators",
      "Assessment and quality staff",
      "Anyone curious about AI in education",
    ],
    learningObjectives: [
      "Use AI tools for planning, materials, and feedback",
      "Design AI-resilient and AI-supported assessment",
      "Apply learning analytics responsibly",
      "Evaluate AI tools for bias and reliability",
      "Develop AI-use policy and academic-integrity guidance",
      "Build an AI-integration plan",
    ],
    whatIsIncluded: [
      "8 live cohort workshops",
      "Hands-on AI tool labs",
      "Prompt and policy templates",
      "Capstone AI-integration plan",
      "12 months platform access",
      "Verified digital certificate",
    ],
    faqs: [
      { q: "Do I need a technical background?", a: "No. The programme is designed for educators of all technical levels and uses tools you can access without coding." },
      { q: "Which AI tools are covered?", a: "We use current frontier tools from multiple vendors and keep the specifics up to date each cohort; the focus is on transferable practices." },
      { q: "Does it address academic integrity?", a: "Yes — a full module covers integrity, detection limits, and designing assessment for an AI world." },
    ],
    facilitators: [
      { name: "Ifeoma Eze", title: "Lead, AI in Education · ARPS Institute", bio: "Ifeoma helps schools and universities adopt AI responsibly, having designed AI-integration programmes across four continents.", imageUrl: PLACEHOLDER_FACILITATOR, credentials: "MSc Artificial Intelligence\nPGCE\n10+ Years in EdTech" },
    ],
    curriculum: [
      { week: "Week 1", title: "AI in Education — The Landscape", desc: "What AI can and cannot do for learning.", topics: ["AI basics", "Capabilities & limits", "Use cases"] },
      { week: "Week 2", title: "AI for Planning and Materials", desc: "Speeding up design without losing quality.", topics: ["Lesson planning", "Materials", "Prompting"] },
      { week: "Week 3", title: "AI for Feedback and Tutoring", desc: "Supporting learners at scale.", topics: ["Automated feedback", "AI tutors", "Personalisation"] },
      { week: "Week 4", title: "Assessment in the Age of AI", desc: "Designing for integrity and learning.", topics: ["AI-resilient assessment", "Integrity", "Detection limits"] },
      { week: "Week 5", title: "Learning Analytics", desc: "Using data to support students.", topics: ["Analytics", "Early warning", "Privacy"] },
      { week: "Week 6", title: "Ethics, Bias and Safety", desc: "Responsible adoption.", topics: ["Bias", "Data protection", "Safeguarding"] },
      { week: "Week 7", title: "Policy and Change", desc: "Bringing your institution along.", topics: ["AI policy", "Staff development", "Change"] },
      { week: "Week 8", title: "Capstone — Integration Plan", desc: "Your responsible AI-integration plan.", topics: ["Plan design", "Risks", "Roadmap"] },
    ],
  },

  // 8 ─ Assessment, Evaluation and Quality Assurance
  {
    title: "Assessment, Evaluation and Quality Assurance",
    slug:  "assessment-evaluation-and-quality-assurance",
    tagline: "Build assessment and quality systems people trust",
    excerpt: "A six-week cohort on designing valid assessments, evaluating programmes, and running quality-assurance systems in education.",
    level: "INTERMEDIATE",
    pricing: "paid", paymentType: "one-time", price: 800,
    featured: false, predefinedAnalytics: true,
    programLevelSlug: "intermediate", programFormatSlug: "cohort-based", programPricingSlug: "paid",
    duration: "6 weeks", format: "Cohort Based", startDate: "1 June 2026", endDate: "13 July 2026", cohortSize: 30,
    rating: 4.7, reviewCount: 109, enrolledCount: 620, countriesCount: 27,
    overview: "This programme builds the technical and practical skills to design fair assessments, evaluate education programmes, and operate quality-assurance systems that stand up to scrutiny.\n\nParticipants apply assessment theory, evaluation methods, and QA frameworks to their own institution, finishing with a quality-assurance plan.",
    targetAudience: [
      "Assessment and examinations officers",
      "Quality-assurance and accreditation staff",
      "Programme leaders and coordinators",
      "Education evaluators",
      "Curriculum and standards officers",
      "Institutional research staff",
    ],
    learningObjectives: [
      "Design valid, reliable, fair assessments",
      "Apply standard-setting and moderation",
      "Plan and conduct programme evaluations",
      "Operate quality-assurance frameworks",
      "Use evidence for continuous improvement",
      "Produce a quality-assurance plan",
    ],
    whatIsIncluded: [
      "6 live cohort workshops",
      "Assessment and QA templates",
      "Worked evaluation examples",
      "Capstone quality-assurance plan",
      "12 months platform access",
      "Verified digital certificate",
    ],
    faqs: [
      { q: "Is this for schools or higher education?", a: "Both. The principles of assessment, evaluation, and QA apply across sectors, with examples from each." },
      { q: "Do I need statistics?", a: "Basic numeracy helps; we cover the essential concepts in accessible terms." },
      { q: "What is the capstone?", a: "A quality-assurance plan for a programme or institution you work with." },
    ],
    facilitators: [
      { name: "Dr. Laila Hassan", title: "Lead, Assessment & Quality · ARPS Institute", bio: "Laila has designed national assessments and led institutional quality systems and accreditation reviews for over 15 years.", imageUrl: PLACEHOLDER_FACILITATOR, credentials: "PhD Educational Measurement\nMSc Statistics\n15+ Years Practice" },
    ],
    curriculum: [
      { week: "Week 1", title: "Principles of Assessment", desc: "Validity, reliability, and fairness.", topics: ["Validity", "Reliability", "Fairness"] },
      { week: "Week 2", title: "Designing Assessments", desc: "Building good tasks and rubrics.", topics: ["Task design", "Rubrics", "Item writing"] },
      { week: "Week 3", title: "Standard-Setting and Moderation", desc: "Consistent, defensible judgements.", topics: ["Standard-setting", "Moderation", "Grading"] },
      { week: "Week 4", title: "Programme Evaluation", desc: "Evaluating courses and programmes.", topics: ["Evaluation design", "Methods", "Reporting"] },
      { week: "Week 5", title: "Quality Assurance Systems", desc: "Frameworks and accreditation.", topics: ["QA frameworks", "Accreditation", "Audits"] },
      { week: "Week 6", title: "Capstone — QA Plan", desc: "A quality-assurance plan.", topics: ["Plan design", "Indicators", "Review cycle"] },
    ],
  },

  // 9 ─ Student Success and Academic Support Services
  {
    title: "Student Success and Academic Support Services",
    slug:  "student-success-and-academic-support-services",
    tagline: "Help more students arrive, stay, and thrive",
    excerpt: "A five-week self-paced course on building student-success and academic-support services that improve retention, wellbeing, and outcomes.",
    level: "BEGINNER",
    pricing: "free", paymentType: null, price: 0,
    featured: false, predefinedAnalytics: false,
    programLevelSlug: "beginner", programFormatSlug: "self-paced", programPricingSlug: "free",
    duration: "5 weeks", format: "Self-Paced", startDate: null, endDate: null, cohortSize: null,
    overview: "This free, self-paced course introduces the principles and practices of student success — from onboarding and advising to academic support, wellbeing, and early-alert systems.\n\nIt is ideal for staff who support students and want practical, evidence-based ways to improve retention and outcomes, especially for first-generation and at-risk learners.",
    targetAudience: [
      "Student-services and advising staff",
      "Academic-support and tutoring teams",
      "Wellbeing and counselling staff",
      "Programme administrators",
      "New student-success practitioners",
      "Faculty who support student progress",
    ],
    learningObjectives: [
      "Map the student journey and risk points",
      "Design effective onboarding and advising",
      "Build academic-support and tutoring services",
      "Use early-alert and analytics ethically",
      "Support wellbeing and belonging",
      "Draft a student-success initiative plan",
    ],
    whatIsIncluded: [
      "5 self-paced modules (≈ 12 hours)",
      "Service-design templates",
      "Self-check quizzes",
      "Free completion certificate",
      "Lifetime access",
    ],
    faqs: [
      { q: "Is this really free?", a: "Yes. The course is fully funded under our open-knowledge initiative." },
      { q: "Will I get a certificate?", a: "A free completion certificate is issued after the final module quiz." },
      { q: "Do I need prior experience?", a: "No. The course is designed for those new to student-success work as well as those formalising existing practice." },
    ],
    facilitators: [
      { name: "Grace Adeyemi", title: "Lead, Student Success · ARPS Institute", bio: "Grace has built advising and retention programmes that improved completion rates across several institutions in Africa and Europe.", imageUrl: PLACEHOLDER_FACILITATOR, credentials: "MEd Student Affairs\n12+ Years Practice" },
    ],
    curriculum: [
      { week: "Module 1", title: "Understanding Student Success", desc: "What success means and why students leave.", topics: ["Retention", "Student journey", "Equity gaps"] },
      { week: "Module 2", title: "Onboarding and Advising", desc: "Strong starts and ongoing guidance.", topics: ["Onboarding", "Advising models", "Goal-setting"] },
      { week: "Module 3", title: "Academic Support", desc: "Tutoring, skills, and supplemental instruction.", topics: ["Tutoring", "Study skills", "Peer support"] },
      { week: "Module 4", title: "Early Alert and Analytics", desc: "Spotting and supporting at-risk students.", topics: ["Early alert", "Analytics", "Ethics"] },
      { week: "Module 5", title: "Wellbeing, Belonging and Capstone", desc: "Supporting the whole student.", topics: ["Wellbeing", "Belonging", "Initiative plan"] },
    ],
  },

  // 10 ─ Instructional Technology and Digital Pedagogy
  {
    title: "Instructional Technology and Digital Pedagogy",
    slug:  "instructional-technology-and-digital-pedagogy",
    tagline: "Teach with technology in ways that deepen learning",
    excerpt: "A six-week cohort on choosing and using educational technology with sound digital-pedagogy principles, from blended design to multimedia and analytics.",
    level: "BEGINNER",
    pricing: "paid", paymentType: "one-time", price: 700,
    featured: false, predefinedAnalytics: true,
    programLevelSlug: "beginner", programFormatSlug: "cohort-based", programPricingSlug: "paid",
    duration: "6 weeks", format: "Cohort Based", startDate: "8 June 2026", endDate: "20 July 2026", cohortSize: 30,
    rating: 4.6, reviewCount: 134, enrolledCount: 880, countriesCount: 33,
    overview: "This programme helps educators choose and use technology purposefully — putting pedagogy first and tools second.\n\nThrough hands-on tasks you design blended experiences, create effective multimedia, and use simple analytics to improve learning, finishing with a redesigned digitally-enhanced unit.",
    targetAudience: [
      "Teachers and lecturers new to edtech",
      "Trainers moving to blended delivery",
      "Learning designers and technologists",
      "Education content creators",
      "Teaching assistants",
      "Anyone wanting purposeful tech use",
    ],
    learningObjectives: [
      "Select technology using a pedagogy-first approach",
      "Design effective blended learning",
      "Create clear instructional multimedia",
      "Foster online interaction and collaboration",
      "Use simple analytics to improve teaching",
      "Redesign a digitally-enhanced unit",
    ],
    whatIsIncluded: [
      "6 live cohort workshops",
      "Hands-on tool labs",
      "Multimedia and design templates",
      "Capstone digitally-enhanced unit",
      "12 months platform access",
      "Verified digital certificate",
    ],
    faqs: [
      { q: "Do I need to be tech-savvy?", a: "No. The programme starts from first principles and focuses on transferable skills, not specific products." },
      { q: "What tools will I use?", a: "A mix of free and common tools for multimedia, collaboration, and assessment; the emphasis is on choosing tools wisely." },
      { q: "What will I produce?", a: "A redesigned, digitally-enhanced unit of teaching you can use right away." },
    ],
    facilitators: [
      { name: "Daniel Okafor", title: "Lead, Digital Pedagogy · ARPS Institute", bio: "Daniel supports educators worldwide to adopt technology that genuinely improves learning, with a background in both teaching and learning design.", imageUrl: PLACEHOLDER_FACILITATOR, credentials: "MSc Learning Technologies\nPGCE\n11+ Years Practice" },
    ],
    curriculum: [
      { week: "Week 1", title: "Pedagogy First", desc: "Frameworks for choosing technology.", topics: ["SAMR & TPACK", "Tool selection", "Learning goals"] },
      { week: "Week 2", title: "Designing Blended Learning", desc: "Blending online and in-person well.", topics: ["Blended models", "Flipped learning", "Pacing"] },
      { week: "Week 3", title: "Creating Multimedia", desc: "Clear, effective learning media.", topics: ["Video", "Multimedia principles", "Accessibility"] },
      { week: "Week 4", title: "Interaction and Collaboration", desc: "Engagement in digital spaces.", topics: ["Online discussion", "Collaboration tools", "Community"] },
      { week: "Week 5", title: "Assessment and Analytics", desc: "Digital assessment and simple analytics.", topics: ["Digital assessment", "Analytics", "Feedback"] },
      { week: "Week 6", title: "Capstone — Enhanced Unit", desc: "A redesigned, tech-enhanced unit.", topics: ["Redesign", "Build", "Peer review"] },
    ],
  },
]

async function main() {
  const admin = await db.user.findFirst({ where: { role: "ADMIN" } })
  if (!admin) throw new Error("No ADMIN user found — create one before seeding programmes.")

  const category = await db.category.findUnique({ where: { slug: CATEGORY_SLUG } })
  if (!category) throw new Error(`Category "${CATEGORY_SLUG}" not found — create it before seeding.`)

  const [levels, formats, pricingRows] = await Promise.all([
    db.programLevel.findMany({ select: { id: true, slug: true } }),
    db.programFormat.findMany({ select: { id: true, slug: true } }),
    db.programPricing.findMany({ select: { id: true, slug: true } }),
  ])
  const bySlug = (rows: { id: string; slug: string }[]) =>
    Object.fromEntries(rows.map(r => [r.slug, r.id]))
  const lvlId = bySlug(levels)
  const fmtId = bySlug(formats)
  const prcId = bySlug(pricingRows)

  for (const s of SAMPLES) {
    const data = {
      title:        s.title,
      slug:         s.slug,
      excerpt:      s.excerpt,
      thumbnail:    PLACEHOLDER_THUMB,
      tagline:      s.tagline,
      level:        s.level,
      pricing:      s.pricing,
      paymentType:  s.paymentType,
      price:        s.price,
      featured:     s.featured,
      predefinedAnalytics: s.predefinedAnalytics,
      instructorId: admin.id,
      categoryId:   category.id,
      programLevelId:   lvlId[s.programLevelSlug]   ?? null,
      programFormatId:  fmtId[s.programFormatSlug]  ?? null,
      programPricingId: prcId[s.programPricingSlug] ?? null,
      duration:    s.duration,
      format:      s.format,
      startDate:   s.startDate,
      endDate:     s.endDate,
      cohortSize:  s.cohortSize,
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
    console.log(`✓ ${s.slug.padEnd(52)} → ${result.id}`)
  }

  console.log(`\nSeeded ${SAMPLES.length} programmes under "${category.name}".`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
