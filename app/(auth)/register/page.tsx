"use client";

import * as React from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import StepIndicator from "@/components/ui/step-indicator";
import StepOneRegisterForm from "@/components/forms/StepOneRegisterForm";
import StepTwoRegisterForm from "@/components/forms/StepTwoRegisterForm";
import StepThreeRegisterForm from "@/components/forms/StepThreeRegisterForm";
import RegisterSummary from "@/components/sections/register/RegisterSummary";
import { interests } from "@/lib/data";

type Step = 1 | 2 | 3;

export default function RegisterPage() {
  const searchParams = useSearchParams();

  const resumeStep = searchParams.get("step");
  const resumeUid  = searchParams.get("uid");

  const initialStep: Step =
    resumeUid && resumeStep === "3" ? 3 :
    resumeUid && resumeStep === "2" ? 2 : 1;

  const [step, setStep] = React.useState<Step>(initialStep);
  const [showPw, setShowPw] = React.useState(false);
  const [selected, setSelected] = React.useState<string[]>([]);
  const [done, setDone] = React.useState(false);
  const [userId, setUserId] = React.useState<string | null>(resumeUid ?? null);

  function toggleInterest(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  }

  const steps: { label: string; status: "active" | "done" | "pending" }[] = [
    {
      label: "Account",
      status: step > 1 ? "done" : step === 1 ? "active" : "pending",
    },
    {
      label: "Profile",
      status: step > 2 ? "done" : step === 2 ? "active" : "pending",
    },
    {
      label: "Interests",
      status: step === 3 ? "active" : step > 3 ? "done" : "pending",
    },
  ];

  return (
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
            Join ARPS Institute
          </p>

          <h2 className="font-heading text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-white mb-4">
            Start Your
            <br />
            <em className="italic text-sky">Professional Journey</em>
          </h2>

          <p className="font-body text-[0.9375rem] tracking-[0em] leading-[1.7] font-normal text-slate-300 mb-8 max-w-xs">
            Create your free account and get instant access to 40+ certificate
            programmes, live workshops, and a global community of practitioners.
          </p>

          <div className="flex flex-col gap-3">
            {[
              "Free to join — no payment required to create an account",
              "40+ certificate programmes across 6 discipline areas",
              "Free workshop access — register for upcoming live events",
              "Verified certificates with QR code and LinkedIn sharing",
              "Global cohort network — connect with learners in 120+ countries",
            ].map((b) => (
              <div key={b} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-transparent border border-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3 text-white" />
                </div>
                <span className="font-body text-[0.875rem] tracking-[0em] leading-[1.6] font-normal text-slate-300">
                  {b}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 border-t border-white/20 pt-5">
          <div className="font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium text-slate-300 mb-3">
            Trusted by professionals from
          </div>
          <div className="flex gap-5 flex-wrap">
            {["UNDP", "CARE International", "World Bank", "FCDO", "USAID"].map(
              (org) => (
                <span
                  key={org}
                  className="font-body text-[0.75rem] tracking-[0em] font-normal text-slate-300"
                >
                  {org}
                </span>
              ),
            )}
          </div>
        </div>

        <Link
          href="/"
          className="relative z-10 font-body text-[0.75rem] tracking-[0em] font-normal text-slate-300 hover:text-sky transition-colors mt-5"
        >
          ← Back to ARPS Institute
        </Link>
      </div>

      {/* ── Right panel ── */}
      <div className="flex flex-col items-center justify-start px-8 py-12 bg-sky-pale overflow-y-auto relative">
        <div className="w-full max-w-105 mt-8">
          {!done ? (
            <>
              {/* Step indicator */}
              <StepIndicator steps={steps} />

              {/* ── Step 1 ── */}
              {step === 1 && (
                <StepOneRegisterForm
                  showPw={showPw}
                  setShowPw={setShowPw}
                  onComplete={({ userId: id }) => { setUserId(id); setStep(2); }}
                />
              )}

              {/* ── Step 2 ── */}
              {step === 2 && userId && (
                <StepTwoRegisterForm userId={userId} setStep={setStep} />
              )}

              {/* ── Step 3 ── */}
              {step === 3 && userId && (
                <StepThreeRegisterForm
                  userId={userId}
                  interests={interests}
                  toggleInterest={toggleInterest}
                  selected={selected}
                  setDone={setDone}
                  setStep={setStep}
                />
              )}
            </>
          ) : (
            /* ── Success ── */
            <RegisterSummary />
          )}

          {!done && (
            <p className="text-center font-body text-[0.875rem] tracking-[0em] font-normal text-slate-600 mt-6">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-[#0474C4] hover:text-[#06457F] transition-colors font-medium"
              >
                Sign in instead
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
