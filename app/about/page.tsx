import type { Metadata } from "next";
import withLayout from "@/hooks/useLayout";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import PageHero from "@/components/sections/PageHero";

export const metadata: Metadata = { title: "About Us" };

const AboutPage = () => {
  return (
    <>
    {/* grid grid-cols-1 md:grid-cols-2 */}
{/* ============ HERO SECTION ============ */}

      <PageHero
        tagline="Who We Are"
        captionTextOne="A Global Hub for "
        highlightText="Professional Learning"
        captionTextTwo="&amp; Research Innovation"
        description="The Institute for Advanced Research and Professional Studies (ARPS
      Institute) is a global online institute dedicated to advancing
      professional education, research capacity, leadership development,
      and digital innovation across multiple disciplines."
        pageType="about"
        imageUrl="/images/about-arps.webp"
      />

{/* <section className="bg-[#060D14] grid grid-cols-1 md:grid-cols-2 px-8 md:px-16 lg:px-20 pb-12 md:pb-20  relative overflow-hidden w-full">
        <div className="absolute inset-0 bg-grid-ink pointer-events-none" />
        <div className="absolute -top-30 -right-30 w-150 h-150 rounded-full bg-[#0474C4]/8 blur-[100px] pointer-events-none" />

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

   <div className="relative hidden md:flex items-stretch min-h-full w-full">
            <div className="flex-1 relative overflow-hidden min-h-125">
              <Image
                src="/images/hero-banner.webp"
                alt="Professionals collaborating"
                height={900}
                width={400}
                loading="eager"
                className="w-full object-cover opacity-[0.65] filter-[grayscale(15%)] block"
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to right, #060D14 0%, transparent 40%), linear-gradient(to top, #060D14 0%, transparent 40%)",
                }}
              ></div>
            </div>
          </div>
</section> */}

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

 <section className="font-body bg-[#F9F9FB] py-16 px-6 md:px-12 lg:px-20 w-full">
        <div className="mb-14">
    <p className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#0474C4] mb-4">
    Leadership
    </p>
    <h2 className="font-heading text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-[#071639] mb-5">
    Life at ARPS Institute
    </h2>
    <p className="font-body text-[1rem] tracking-[-0.005em] leading-[1.7] font-normal text-slate-600 max-w-145">
      ARPS Institute focuses on professional, research, and leadership development fields — providing accessible and high-quality training across key disciplines worldwide. We do not provide clinical or medical training.
    </p>
  </div>
      <div className="max-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left: CEO Photo + Name */}
        <div className="flex flex-col">
          <div className="relative w-full aspect-3/4 max-w-2xl h-100 overflow-hidden">
            <Image
              src="/images/about-arps.webp"
              alt="Joaquin Duato"
              width={672}
              height={400}
              className="object-cover object-top grayscale-10 rounded"
              priority
            />
          </div>
          <div className="mt-5">
            <h2 className="font-heading text-2xl font-semibold text-[#1a1a1a] tracking-tight leading-snug">
             Professor Bunmi Omodan
            </h2>
            <p className="text-base text-[#444] mt-1 font-light tracking-wide">
              Chairman and Chief Executive Officer
            </p>
          </div>
        </div>

        {/* Right: Executive Committee + Board of Directors */}
        <div className="flex flex-col gap-4 self-start lg:pl-8">
          {/* Executive Committee */}
          <div className="bg-white p-12">
            <h3 className="font-heading text-3xl font-light text-[#1a1a1a] tracking-tight leading-tight mb-5">
              Executive <br /> Committee
            </h3>
            <a
              href="#"
              className="inline-flex items-center gap-2 text-[#0474C4] text-sm font-semibold uppercase tracking-widest hover:gap-4 transition-all duration-200 group"
            >
              Read more
              <ChevronRight className="text-lg leading-none group-hover:translate-x-1 transition-transform duration-200" />
            </a>
          </div>

          {/* Board of Directors */}
          <div className="bg-white p-12">
            <h3 className="font-heading text-3xl font-light text-[#1a1a1a] tracking-tight leading-tight mb-5">
              Board of Directors
            </h3>
            <a
              href="#"
              className="inline-flex items-center gap-2 text-[#0474C4] text-sm font-semibold uppercase tracking-widest hover:gap-4 transition-all duration-200 group"
            >
              Read more
              <ChevronRight className="text-lg leading-none group-hover:translate-x-1 transition-transform duration-200" />
            </a>
          </div>
        </div>
      </div>
    </section>


      <section className="py-16 md:py-28 w-full px-8 md:px-16 lg:px-0 text-center bg-[#181C2C] relative overflow-hidden">
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