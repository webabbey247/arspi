import type { Metadata } from "next";
import withLayout from "@/hooks/useLayout";
import Link from "next/link";
export const metadata: Metadata = { title: "About Us" };

const AboutPage = () => {
  return (
    <>
{/* ============ HERO SECTION ============ */}
<section className="bg-[#060D14] px-8 md:px-16 lg:px-20 pt-16 md:pt-24 pb-12 md:pb-20 relative overflow-hidden w-full">
        <div className="absolute inset-0 bg-grid-ink pointer-events-none" />
        <div className="absolute -top-24 right-0 w-125 h-125 rounded-full bg-[#0474C4]/8 blur-[100px] pointer-events-none" />

        <div className="relative z-2 flex flex-col gap-6 max-w-175">
  <p className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-blue-300 flex items-center gap-3 before:content-[''] before:block before:w-8 before:h-px before:bg-blue-300 before:shrink-0">
      Who We Are
    </p>

    <h1 className="font-heading text-[2.25rem] md:text-[3rem] tracking-[-0.015em] md:tracking-[-0.02em] leading-[1.2] md:leading-[1.1] font-bold text-white">
      A Global Hub for  <em className="italic text-[#0474C4]">Professional Learning </em> &amp; Research Innovation
    </h1>

            <p className="font-body text-[1.125rem] tracking-[-0.01em] leading-[1.65] font-light text-[#EBF3FC] max-w-lg">
      The Institute for Advanced Research and Professional Studies (ARPS
      Institute) is a global online institute dedicated to advancing
      professional education, research capacity, leadership development,
      and digital innovation across multiple disciplines.
    </p>

  </div>
</section>

{/* ============ ABOUT SECTION ============ */}
<section className="px-8 md:px-16 lg:px-20 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-start bg-white">
  <div>
    <p className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#0474C4] mb-4">
      About the Institute
    </p>

    <h2 className="font-heading text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-[#071639] mb-5">
      Built to Empower Scholars &amp; Professionals Worldwide
    </h2>

   <div className="flex flex-col gap-4">
    <p className="font-body text-[1rem] tracking-[-0.005em] leading-[1.7] font-normal text-slate-600">
      ARPS Institute was established to bridge the gap between professional
      ambition and world-class learning. We bring together professional
      certification programs, research training, institutional consulting,
      academic publishing support, and technology-driven knowledge solutions
      under one integrated global platform.
    </p>
    <p className="font-body text-[1rem] tracking-[-0.005em] leading-[1.7] font-normal text-slate-600">
      Operating entirely online, we make advanced professional development
      accessible to scholars, practitioners, and organisations regardless of
      where they are in the world. Our digital-first model removes the
      financial and geographical barriers that have traditionally limited
      access to high-quality learning.
    </p>
    <p className="font-body text-[1rem] tracking-[-0.005em] leading-[1.7] font-normal text-slate-600">
      At the core of everything we do is a belief that professional growth
      and research excellence should not be privileges of geography or
      circumstance. We connect global knowledge networks and support the
      professionals shaping education, policy, governance, and development
      worldwide.
    </p>
   </div>
  </div>

    <div className="flex flex-col gap-4">
          <p className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#0474C4]">
           Strategic Advantages
          </p>

          <h2 className="font-heading text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-[#071639]">
          Why ARPS Institute
          </h2>

          <div className="mt-8 flex flex-col gap-px bg-slate-200 border border-slate-200 ">
            {[
              "Growing global demand for professional certification programs",
              "Rising interest in research methodology training worldwide",
              "Expanding need for monitoring, evaluation, and policy research services",
              "Rapid growth of online professional education platforms",
              "Growing demand for digital management and analytics platforms",
              "Increasing recognition of participatory and community-engaged research",
            ].map((item) => (
              <div
                key={item}
                className="bg-white py-[1.2rem] px-6 flex items-center gap-3.5 transition-colors duration-200"
              >
                <span className="w-2 h-2 rounded-full bg-[#0474C4] shrink-0" />
                <span className="font-body text-[0.875rem] tracking-[0em] leading-[1.6] font-normal text-slate-600">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>
</section>

{/* ============ VISION & MISSION SECTION ============ */}
<section className="px-8 md:px-16 lg:px-20 py-16 md:py-24 bg-[#06457F] grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">

  {/* Vision */}
  <div className="p-10 border border-[#0474C4]/25 rounded-sm bg-white">
    <span className="font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium text-[#0474C4] mb-5 block">
      Our Vision
    </span>

    <h2 className="font-heading text-[1.375rem] tracking-[-0.005em] leading-[1.3] font-medium text-[#071639] mb-4">
      A Globally Recognised Centre for Professional Learning &amp; Applied Research
    </h2>

    <p className="font-body text-[0.9375rem] tracking-[0em] leading-[1.7] font-normal text-slate-600">
      To become a globally recognised institute for professional learning,
      applied research, leadership development, and digital innovation —
      providing accessible and high-quality training for scholars and
      professionals worldwide.
    </p>
  </div>

  {/* Mission */}
  <div className="p-10 border border-[#0474C4]/25 rounded-sm bg-white">
    <span className="font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium text-[#0474C4] mb-5 block">
      Our Mission
    </span>

    <h2 className="font-heading text-[1.375rem] tracking-[-0.005em] leading-[1.3] font-medium text-[#071639] mb-4">
      Promoting Excellence in Education &amp; Research Capacity
    </h2>

    <p className="font-body text-[0.9375rem] tracking-[0em] leading-[1.7] font-normal text-slate-600">
Promotes excellence in professional education and research capacity development through accessible online certification, consulting, and evaluation services.</p>
  
  </div>

</section>

<section className="py-16 md:py-24 px-8 md:px-16 lg:px-20 bg-white w-full">
  <div className="mb-14">
    <p className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#0474C4] mb-4">
      Our Focus Areas
    </p>
    <h2 className="font-heading text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-[#071639] mb-5">
    Disciplines We Cover
    </h2>
    <p className="font-body text-[1rem] tracking-[-0.005em] leading-[1.7] font-normal text-slate-600 max-w-145">
      ARPS Institute focuses on professional, research, and leadership development fields — providing accessible and high-quality training across key disciplines worldwide. We do not provide clinical or medical training.
    </p>
  </div>

  {[
    {
      num: "01",
      title: "Research Methods & Academic Writing",
      desc: "Provides advanced research training programs for scholars, researchers, and professionals seeking to strengthen their research design, analytical skills, and scholarly communication. Covers qualitative, quantitative, and mixed methods approaches, as well as academic publishing and grant writing.",
      tags: ["Qualitative Methods", "Quantitative Methods", "Mixed Methods", "Academic Writing", "Grant Writing", "R Programming", "AI for Research", "Systematic Reviews"],
    },
    {
      num: "02",
      title: "Professional Certificate Academy",
      desc: "Short-term professional certification programs (1–4 months) combining theoretical knowledge with applied learning. Programs span Education, Applied Research Methods, Management Sciences, Information Technology, and Social Sciences & Public Policy.",
      tags: ["Educational Leadership", "M&E Certification", "Data Analytics", "Project Management", "Public Policy", "AI Applications", "Cybersecurity", "Digital Transformation"],
    },
    {
      num: "03",
      title: "Participatory Action Research (PAR)",
      desc: "A specialised division focused on Participatory Action Research — emphasising community collaboration, empowerment, and social transformation. Highly relevant for education, governance, development programs, and public policy research. Positions ARPS as a global hub for community-engaged research methodologies.",
      tags: ["PAR Certification", "PAR for NGOs", "Social Justice", "Community Development", "Policy Transformation", "Health & Rural Dev."],
    },
    {
      num: "04",
      title: "Academic Consulting & Research Services",
      desc: "Provides consulting and institutional research services for organisations seeking evidence-based solutions. Serves universities, NGOs, school districts, government institutions, and philanthropic foundations with program evaluation, impact assessment, policy research, and strategic planning.",
      tags: ["Program Evaluation", "Impact Assessment", "Policy Research", "M&E Services", "Strategic Planning", "Data Analysis"],
    },
    {
      num: "05",
      title: "Publishing Support Unit",
      desc: "Supports scholars in producing high-quality research outputs and academic publications. Covers journal establishment and editorial management, research and funding proposal development, and editorial training for peer reviewers and scholars. Serves graduate researchers, academics, independent scholars, and research institutes.",
      tags: ["Journal Services", "Manuscript Preparation", "Proposal Development", "Thesis Support", "Editorial Training", "Peer Review Training"],
    },
    {
      num: "06",
      title: "Technology & Management Software Development",
      desc: "Designs and commercialises specialised management and research software solutions for institutions, researchers, and organisations. Offerings include Research Management Software, Monitoring & Evaluation Systems, Education Management Systems, and Organisational Management Software — delivered via licensing, SaaS, and custom development.",
      tags: ["Research Management Systems", "M&E Dashboards", "Learning Analytics", "Grant Tracking", "SaaS Solutions", "Custom Development"],
    },
     {
      num: "07",
      title: "Governance, Policy & Institutional Reform",
      desc: "Supports scholars in producing high-quality research outputs and academic publications. Covers journal establishment and editorial management, research and funding proposal development, and editorial training for peer reviewers and scholars. Serves graduate researchers, academics, independent scholars, and research institutes.",
      tags: ["Journal Services", "Manuscript Preparation", "Proposal Development", "Thesis Support", "Editorial Training", "Peer Review Training"],
    },
    {
      num: "08",
      title: "Artificial Intelligence & Digital Transformation",
      desc: "Designs and commercialises specialised management and research software solutions for institutions, researchers, and organisations. Offerings include Research Management Software, Monitoring & Evaluation Systems, Education Management Systems, and Organisational Management Software — delivered via licensing, SaaS, and custom development.",
      tags: ["Research Management Systems", "M&E Dashboards", "Learning Analytics", "Grant Tracking", "SaaS Solutions", "Custom Development"],
      last: true,
    },
  ].map(({ num, title, desc, tags, last }) => (
    <div
      key={num}
      className={`grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-8 lg:gap-16 items-start py-12 border-t ${last ? "" : ""} border-[#0474C4]/25`}
    >
      <div>
        <div className="font-heading text-[3rem] tracking-[-0.02em] leading-[1.1] font-bold text-[#0474C4]/50 mb-2">
          {num}
        </div>
        <div className="font-heading text-[1.125rem] tracking-[-0.005em] leading-[1.3] font-medium text-[#071639]">
          {title}
        </div>
      </div>

      <div>
        <p className="font-body text-[0.9375rem] tracking-[0em] leading-[1.7] font-normal text-slate-600 mb-6">
          {desc}
        </p>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
                      className="font-body text-[0.6875rem] tracking-[0.05em] font-medium text-[#0474C4] py-1 px-3 rounded-full bg-[#0474C4]/10 transition-all duration-200"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  ))}
</section>

      <section className="py-16 md:py-28 w-full px-8 md:px-16 lg:px-20 text-center bg-[#181C2C] relative overflow-hidden">
        <div className="relative max-w-140 mx-auto">
          <div className=" flex flex-col gap-5 mb-12">
            <p className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#0474C4]">
            Join ARPS Institute
            </p>

            <h2 className="font-heading text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-white">
            Begin Your Professional Learning Journey Today
            </h2>

            <p className="font-body text-[1.125rem] tracking-[-0.01em] leading-[1.65] font-light text-slate-300 max-w-lg mx-auto">
             Join thousands of professionals and scholars advancing their expertise with ARPS Institute — from anywhere in the world.

            </p>
          </div>

          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/programs"
              className="font-body text-[0.875rem] tracking-[0.02em] font-medium bg-[#0474C4] text-[#EBF3FC] border-[#0474C4] py-3.5 px-5 h-12 rounded-[32px] min-w-40  transition-colors duration-200 hover:bg-[#06457F] hover:border-[#06457F]"
            >
              Explore Programs{" "}
            </Link>

            <Link
              href="/contact"
              className="font-body text-[0.875rem] tracking-[0.02em] font-medium bg-transparent text-[#EBF3FC] border border-[#EBF3FC] py-3.5 px-5 h-12 rounded-[32px] min-w-40  transition-colors duration-200 hover:bg-[#06457F] hover:border-[#06457F]"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
 
    </>
  );
}

export default withLayout(AboutPage);