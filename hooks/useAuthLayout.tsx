"use client";


import { ComponentType } from "react";
import Link from "next/link";

const withAuthLayout = <P extends object>(WrappedComponent: ComponentType<P>) => {
  const LayoutComponent = (props: P) => (
    <div className="min-h-screen grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] bg-[#F5F6FB]">
      {/* ── Left panel — LMS programme-hero treatment ── */}
      <div className="bg-[#17172F] text-white hidden lg:flex flex-col relative overflow-hidden">
        <div className="flex flex-col flex-1 p-12">
          <Link href="/" className="flex items-center gap-3 no-underline w-fit">
            <span className="grid place-items-center w-[42px] h-[42px] rounded-[12px] bg-[linear-gradient(145deg,#2C2368,#6655DF)] text-white text-[15px] font-extrabold shrink-0">
              AI
            </span>
            <b className="text-[19px] leading-[1.1] text-white">
              ARPS Institute
              <small className="block text-[10px] tracking-[0.12em] text-[#D6A84C] mt-1 uppercase">
                Learning management system
              </small>
            </b>
          </Link>

          <div className="flex-1 flex flex-col justify-center py-12">
            <span className="text-[13px] tracking-[0.14em] uppercase font-black text-[#D6A84C]">
              Welcome back
            </span>

            <h2 className="mt-3 mb-5 text-[clamp(34px,3.6vw,50px)] leading-[1.04] tracking-[-0.045em] font-extrabold text-white max-w-md">
              Continue your learning journey
            </h2>

            <p className="text-[17px] leading-[1.6] text-[#DEDDEB] max-w-md mb-10">
              Sign in to access your programmes, track your progress, connect with
              your cohort, and download your certificates.
            </p>

            {/* Testimonial */}
            <div className="bg-white/5 border border-white/15 rounded-[16px] p-5 max-w-md">
              <p className="text-[15px] leading-[1.6] italic text-[#DEDDEB] mb-4">
                &ldquo;The ARPS M&amp;E programme transformed how I approach
                monitoring in my NGO. The certificate opened doors I hadn&apos;t
                expected.&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[10px] bg-[#6655DF] grid place-items-center text-[12px] font-extrabold text-white">
                  AD
                </div>
                <div>
                  <b className="block text-[14px] text-white">Amara Diallo</b>
                  <small className="block text-[12px] text-[#D8D7E3]">
                    M&amp;E Manager · CARE International, Dakar
                  </small>
                </div>
              </div>
            </div>
          </div>

          <Link
            href="/"
            className="text-[14px] font-bold text-[#D8D4FF] hover:text-white transition-colors w-fit"
          >
            ← Back to ARPS Institute
          </Link>
        </div>

        {/* Fact strip */}
        <div className="grid grid-cols-3 bg-[#6757DB] px-12 py-5">
          {[
            ["40+", "Certificate programmes"],
            ["2,100+", "Active learners"],
            ["120+", "Countries"],
          ].map(([val, lbl], i) => (
            <div key={lbl} className={i < 2 ? "border-r border-white/20 px-4 first:pl-0" : "pl-4"}>
              <span className="flex flex-col text-[13px] text-[#DEDAFF]">
                {lbl}
                <strong className="mt-0.5 text-[17px] text-white">{val}</strong>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel — LMS auth card ── */}
      <div className="flex flex-col items-center justify-center px-4 sm:px-8 py-10 sm:py-12">
        <Link href="/" className="lg:hidden flex items-center gap-3 no-underline mb-8">
          <span className="grid place-items-center w-[42px] h-[42px] rounded-[12px] bg-[linear-gradient(145deg,#2C2368,#6655DF)] text-white text-[15px] font-extrabold">
            AI
          </span>
          <b className="text-[19px] leading-[1.1] text-[#171C35]">ARPS Institute</b>
        </Link>
        <div className="w-full max-w-130 bg-white border border-[#DFE2ED] rounded-[16px] p-6 sm:p-9 flex flex-col items-center">
          <WrappedComponent {...props} />
        </div>
      </div>
    </div>
  );

  return LayoutComponent;
};

export default withAuthLayout;
