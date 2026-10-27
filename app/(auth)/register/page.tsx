"use client";

import * as React from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import StepIndicator from "@/components/ui/step-indicator";
import SocialLoginButtons from "@/components/forms/SocialLoginButtons";
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
    <div className="min-h-screen grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] bg-[#F5F6FB]">
      {/* ── Left panel — LMS programme-hero treatment ── */}
      <div className="bg-[#17172F] text-white hidden lg:flex flex-col p-12 relative overflow-hidden">
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
            Join ARPS Institute
          </span>

          <h2 className="mt-3 mb-5 text-[clamp(34px,3.6vw,50px)] leading-[1.04] tracking-[-0.045em] font-extrabold text-white max-w-md">
            Start your professional journey
          </h2>

          <p className="text-[17px] leading-[1.6] text-[#DEDDEB] max-w-md mb-8">
            Create your free account and get instant access to 40+ certificate
            programmes, live workshops, and a global community of practitioners.
          </p>

          <div className="flex flex-col gap-3 max-w-md">
            {[
              "Free to join — no payment required to create an account",
              "40+ certificate programmes across 6 discipline areas",
              "Free workshop access — register for upcoming live events",
              "Verified certificates with QR code and LinkedIn sharing",
              "Global cohort network — connect with learners in 120+ countries",
            ].map((b) => (
              <div key={b} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#6655DF] flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-[15px] leading-[1.55] font-bold text-white">
                  {b}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-white/20 pt-5">
          <div className="text-[12px] tracking-[0.12em] uppercase font-extrabold text-[#D6A84C] mb-3">
            Trusted by professionals from
          </div>
          <div className="flex gap-5 flex-wrap">
            {["UNDP", "CARE International", "World Bank", "FCDO", "USAID"].map(
              (org) => (
                <span
                  key={org}
                  className="text-[14px] font-bold text-[#D8D7E3]"
                >
                  {org}
                </span>
              ),
            )}
          </div>
        </div>

        <Link
          href="/"
          className="text-[14px] font-bold text-[#D8D4FF] hover:text-white transition-colors mt-5 w-fit"
        >
          ← Back to ARPS Institute
        </Link>
      </div>

      {/* ── Right panel — LMS auth card ── */}
      <div className="flex flex-col items-center justify-start px-4 sm:px-8 py-10 sm:py-12 overflow-y-auto">
        <Link href="/" className="lg:hidden flex items-center gap-3 no-underline mb-8">
          <span className="grid place-items-center w-[42px] h-[42px] rounded-[12px] bg-[linear-gradient(145deg,#2C2368,#6655DF)] text-white text-[15px] font-extrabold">
            AI
          </span>
          <b className="text-[19px] leading-[1.1] text-[#171C35]">ARPS Institute</b>
        </Link>
        <div className="w-full max-w-130 bg-white border border-[#DFE2ED] rounded-[16px] p-6 sm:p-9 lg:mt-6">
          {!done ? (
            <>
              {/* Step indicator */}
              <StepIndicator steps={steps} />

              {/* ── Step 1 ── */}
              {step === 1 && (
                <>
                  {/* <SocialLoginButtons />
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex-1 h-px bg-[#DFE2ED]" />
                    <span className="text-[11px] tracking-[0.12em] uppercase font-extrabold text-[#8A90A6]">
                      or sign up with email
                    </span>
                    <div className="flex-1 h-px bg-[#DFE2ED]" />
                  </div> */}
                  <StepOneRegisterForm
                    showPw={showPw}
                    setShowPw={setShowPw}
                    onComplete={({ userId: id }) => { setUserId(id); setStep(2); }}
                  />
                </>
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
            <p className="text-center text-[14px] text-[#69708A] mt-6">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-[#6655DF] hover:text-[#2C2368] transition-colors font-extrabold"
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
