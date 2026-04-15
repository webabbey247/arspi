"use client";


import { ComponentType } from "react";
import Link from "next/link";
import Image from "next/image";

const withAuthLayout = <P extends object>(WrappedComponent: ComponentType<P>) => {
  const LayoutComponent = (props: P) => (
        <div className="min-h-screen grid lg:grid-cols-2">
      {/* ── Left panel ── */}
      <div className="bg-[#06457F] hidden lg:flex flex-col p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-ink pointer-events-none" />
        <div className="absolute -top-24 -left-24 w-112.5 h-112.5 rounded-full bg-[#06457F]/8 blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-90 h-90 rounded-full bg-[#06457F]/6 blur-[100px] pointer-events-none" />

        <Link
          href="/"
          className="relative z-10 flex items-center gap-3 no-underline mb-auto"
        >
          <Image
            src="/images/arps-institute-logo.webp"
            alt="ARPS Institute Logo"
            width={198}
            height={39}
            className="h-9.75 w-49.5"
            priority
          />
        </Link>

        <div className="relative z-10 flex-1 flex flex-col justify-center py-12">
          <p className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-slate-300 flex items-center gap-3 mb-5">
            <span className="block w-6 h-px bg-slate-300" />
            Welcome Back
          </p>

          <h2 className="font-heading text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-white mb-4">
            Continue Your
            <br />
            <em className="italic text-sky">Learning Journey</em>
          </h2>

          <p className="font-body text-[0.9375rem] tracking-[0em] leading-[1.7] font-normal text-slate-300 mb-10 max-w-xs">
            Sign in to access your programmes, track your progress, connect with
            your cohort, and download your certificates.
          </p>

          <div className="flex gap-8 flex-wrap pt-8 border-t border-white/20">
            {[
              ["40+", "Certificate Programmes"],
              ["2,100+", "Active Learners"],
              ["120+", "Countries"],
            ].map(([val, lbl]) => (
              <div key={lbl}>
                <div className="font-heading text-[1.375rem] tracking-[-0.005em] leading-[1.1] font-semibold text-white mb-1">
                  {val}
                </div>
                <div className="font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium text-slate-300">
                  {lbl}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial */}
        <div className="relative z-10 bg-white/4 border border-white/20 rounded-xl p-5">
          <p className="font-heading text-[0.875rem] tracking-[0em] leading-[1.6] font-normal italic text-slate-300 mb-4">
            &ldquo;The ARPS M&amp;E programme transformed how I approach
            monitoring in my NGO. The certificate opened doors I hadn&apos;t
            expected.&rdquo;
          </p>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-transparent border border-slate-300 flex items-center justify-center font-body text-[0.6875rem] font-medium text-white">
              AD
            </div>
            <div>
              <div className="font-body text-[0.8125rem] tracking-[0em] leading-normal font-medium text-slate-300">
                Amara Diallo
              </div>
              <div className="font-body text-[0.6875rem] tracking-[0em] leading-normal font-normal text-slate-300">
                M&amp;E Manager · CARE International, Dakar
              </div>
            </div>
          </div>
        </div>

        <Link
          href="/"
          className="relative z-10 flex items-center gap-1.5 font-body text-[0.75rem] tracking-[0em] font-normal text-slate-300 hover:text-sky transition-colors mt-6"
        >
          ← Back to ARPS Institute
        </Link>
      </div>

      {/* ── Right panel ── */}
      <div className="flex flex-col items-center justify-center px-8 py-12 bg-sky-pale relative">
       
       <WrappedComponent {...props} />
     </div>
    </div>
  );

  return LayoutComponent;
};

export default withAuthLayout;
