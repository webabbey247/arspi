"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { CheckCircle, ChevronLeft } from "lucide-react";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { visibilityOptions } from "@/lib/data";
import { useInterests } from "@/hooks/useInterests";

const StepThreeRegisterForm = ({
  userId,
  interests,
  toggleInterest,
  selected,
  setDone,
  setStep,
}: {
  userId: string;
  interests: { id: string; label: string }[];
  toggleInterest: (id: string) => void;
  selected: string[];
  setDone: (done: boolean) => void;
  setStep: (step: 1 | 2 | 3) => void;
}) => {
  const [referralSource, setReferralSource] = useState("");
  const [emailOptIn,     setEmailOptIn]     = useState(true);
  const [apiError,       setApiError]       = useState<string | null>(null);

  const { saveInterests, isLoading } = useInterests();

  async function onSubmit() {
    setApiError(null);
    const result = await saveInterests({
      userId,
      interests: selected,
      referralSource: referralSource || undefined,
      emailOptIn,
    });
    if (!result.success) {
      setApiError(result.error);
      return;
    }
    setDone(true);
  }

  return (
    <div>
      <h1 className="text-[clamp(30px,4vw,38px)] tracking-[-0.035em] leading-[1.1] font-extrabold text-[#171C35] mb-2">
        Learning Interests
      </h1>
      <p className="text-[15px] leading-[1.55] text-[#69708A] mb-7">
        Select the areas you&apos;d like to explore — we&apos;ll personalise your dashboard.
      </p>

      <div className="grid grid-cols-2 gap-2.5 mb-5">
        {interests.map(({ id, label }) => (
          <span
            key={id}
            onClick={() => toggleInterest(id)}
            className={cn(
              "px-3 py-2.5 rounded-sm border font-body text-[0.875rem] tracking-[0em] font-normal transition-all text-left cursor-pointer",
              selected.includes(id)
                ? "bg-[#6655DF]/10 text-[#6655DF] border-[#6655DF]/25"
                : "bg-transparent border-[#6655DF]/25 hover:border-[#6655DF] text-[#69708A]",
            )}
          >
            {label}
          </span>
        ))}
      </div>

      <div className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-1.5">
          <label className="text-[14px] font-extrabold text-[#171C35]">
            How did you hear about us?
          </label>
          <Select onValueChange={setReferralSource}>
            <SelectTrigger className="w-full text-[15px] leading-[1.5] bg-white border border-[#DFE2ED] rounded-[10px] px-[13px] py-[11px] text-[#171C35] outline-none transition-shadow focus:border-[#6655DF] focus:ring-3 focus:ring-[#6655DF]/15">
              <SelectValue placeholder={visibilityOptions[0].label} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {visibilityOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={emailOptIn}
            onChange={(e) => setEmailOptIn(e.target.checked)}
            className="accent-[#6655DF] mt-0.5 shrink-0"
          />
          <span className="text-[13px] leading-[1.6] text-[#69708A]">
            Send me updates about new programmes, free workshops, and research resources.
          </span>
        </label>

        {apiError && (
          <p className="text-[12px] font-bold text-red-600">{apiError}</p>
        )}

        <div className="flex gap-2.5 pt-1">
          <Button
            type="button"
            variant="outline"
            className="bg-white min-w-40 h-12 text-[#171C35] inline-flex gap-2 border border-[#DFE2ED] py-[11px] px-4 justify-center items-center text-[15px] font-extrabold cursor-pointer rounded-[10px] transition-colors hover:bg-[#F5F6FB]"
            onClick={() => setStep(2)}
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
          <Button
            type="button"
            disabled={isLoading}
            className="bg-[#6655DF] min-w-40 h-12 text-white inline-flex gap-2 border border-[#6655DF] py-[11px] px-4 justify-center items-center text-[15px] font-extrabold cursor-pointer rounded-[10px] transition-colors hover:bg-[#2C2368] hover:border-[#2C2368] disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={onSubmit}
          >
            {isLoading ? "Saving…" : <>Create Account <CheckCircle className="h-4 w-4" /></>}
          </Button>
        </div>

        <p className="text-center text-[12px] text-[#8A90A6]">
          Your data is handled in accordance with our{" "}
          <Link href="#" className="text-[#6655DF]">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
};

export default StepThreeRegisterForm;
