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
      <h1 className="font-heading text-[2rem] tracking-[-0.015em] leading-[1.2] font-bold text-ink mb-1.5 text-[#071639]">
        Learning Interests
      </h1>
      <p className="font-body text-[0.875rem] tracking-[0em] leading-[1.6] font-normal text-slate-600 mb-8">
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
                ? "bg-[#0474C4]/10 text-[#0474C4] border-[#0474C4]/25"
                : "bg-transparent border-[#0474C4]/25 hover:border-[#0474C4] text-slate-400",
            )}
          >
            {label}
          </span>
        ))}
      </div>

      <div className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-1.5">
          <label className="font-body text-[0.75rem] tracking-[0.07em] capitalize font-normal text-slate-400">
            How did you hear about us?
          </label>
          <Select onValueChange={setReferralSource}>
            <SelectTrigger className="w-full font-body text-[0.875rem] tracking-[0em] leading-[1.6] font-normal bg-transparent border border-[#0474C4]/25 rounded-sm px-3 py-2 text-ink outline-none focus:border-[#0474C4]">
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
            className="accent-sapphire mt-0.5 shrink-0"
          />
          <span className="font-body text-[0.8125rem] tracking-[0em] leading-[1.6] font-normal text-slate-400">
            Send me updates about new programmes, free workshops, and research resources.
          </span>
        </label>

        {apiError && (
          <p className="font-body text-[0.6875rem] text-red-500">{apiError}</p>
        )}

        <div className="flex gap-2.5 pt-1">
          <Button
            type="button"
            variant="outline"
            className="bg-transparent min-w-40 h-12 text-[#0474C4] inline-flex border-[#0474C4] py-3.5 px-8 justify-center items-center font-body text-[0.82rem] font-medium tracking-widest uppercase cursor-pointer rounded-[32px] transition-all duration-250 hover:bg-[#06457F] hover:border-[#06457F] hover:text-white"
            onClick={() => setStep(2)}
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
          <Button
            type="button"
            disabled={isLoading}
            className="bg-[#0474C4] min-w-40 h-12 text-white inline-flex border-none py-3.5 px-8 justify-center items-center font-body text-[0.82rem] font-medium tracking-widest uppercase cursor-pointer rounded-[32px] transition-all duration-250 hover:bg-[#06457F] hover:border-[#06457F] disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={onSubmit}
          >
            {isLoading ? "Saving…" : <>Create Account <CheckCircle className="h-4 w-4" /></>}
          </Button>
        </div>

        <p className="text-center font-body text-[0.75rem] tracking-[0em] leading-normal font-normal text-slate-400">
          Your data is handled in accordance with our{" "}
          <Link href="#" className="text-sapphire">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
};

export default StepThreeRegisterForm;
