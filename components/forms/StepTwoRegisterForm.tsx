"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { roleOptions } from "@/lib/data";
import { useProfile } from "@/hooks/useProfile";

const schema = yup.object({
  firstName: yup.string().min(2, "Must be at least 2 characters").required("First name is required"),
  lastName:  yup.string().min(2, "Must be at least 2 characters").required("Last name is required"),
});

type StepTwoFields = yup.InferType<typeof schema>;

const COUNTRIES = [
  "Ghana", "Nigeria", "Kenya", "Tanzania", "Senegal", "Uganda",
  "South Africa", "United Kingdom", "United States", "Canada",
  "Australia", "India", "Bangladesh", "Brazil", "Other",
];

const StepTwoRegisterForm = ({
  userId,
  setStep,
}: {
  userId: string;
  setStep: (step: 1 | 2 | 3) => void;
}) => {
  const [country,      setCountry]      = useState("");
  const [jobTitle,     setJobTitle]     = useState("");
  const [organisation, setOrganisation] = useState("");
  const [roleType,     setRoleType]     = useState("");
  const [apiError,     setApiError]     = useState<string | null>(null);

  const { saveProfile, isLoading } = useProfile();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StepTwoFields>({ resolver: yupResolver(schema), mode: "onTouched" });

  async function onSubmit(data: StepTwoFields) {
    setApiError(null);
    const result = await saveProfile({
      userId,
      firstName:    data.firstName,
      lastName:     data.lastName,
      country:      country      || undefined,
      jobTitle:     jobTitle     || undefined,
      organisation: organisation || undefined,
      roleType:     roleType     || undefined,
    });
    if (!result.success) {
      setApiError(result.error);
      return;
    }
    setStep(3);
  }

  return (
    <div>
      <h1 className="font-heading text-[2rem] tracking-[-0.015em] leading-[1.2] font-bold text-ink mb-1.5 text-[#071639]">
        Your Profile
      </h1>
      <p className="font-body text-[0.875rem] tracking-[0em] leading-[1.6] font-normal text-slate-600 mb-8">
        Help us personalise your learning experience.
      </p>

      <form className="flex flex-col gap-3.5" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="font-body text-[0.75rem] tracking-[0.07em] capitalize font-normal text-slate-400">
              First Name
            </label>
            <Input
              placeholder="e.g. Amara"
              {...register("firstName")}
              className="font-body text-[0.875rem] tracking-[0em] leading-[1.6] font-normal bg-sky-light border border-[#0474C4]/25 rounded-sm px-3 py-2 text-ink outline-none focus:border-[#0474C4] placeholder:text-slate-400 placeholder:font-light"
            />
            {errors.firstName && (
              <span className="font-body text-[0.6875rem] text-red-500">{errors.firstName.message}</span>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-body text-[0.75rem] tracking-[0.07em] capitalize font-normal text-slate-400">
              Last Name
            </label>
            <Input
              placeholder="e.g. Diallo"
              {...register("lastName")}
              className="font-body text-[0.875rem] tracking-[0em] leading-[1.6] font-normal bg-sky-light border border-[#0474C4]/25 rounded-sm px-3 py-2 text-ink outline-none focus:border-[#0474C4] placeholder:text-slate-400 placeholder:font-light"
            />
            {errors.lastName && (
              <span className="font-body text-[0.6875rem] text-red-500">{errors.lastName.message}</span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-body text-[0.75rem] tracking-[0.07em] capitalize font-normal text-slate-400">
            Country of Residence
          </label>
          <Select onValueChange={setCountry}>
            <SelectTrigger className="w-full font-body text-[0.875rem] tracking-[0em] leading-[1.6] font-normal bg-sky-light border border-[#0474C4]/25 rounded-sm px-3 py-2 text-ink outline-none focus:border-[#0474C4]">
              <SelectValue placeholder="Select your country..." />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-body text-[0.75rem] tracking-[0.07em] capitalize font-normal text-slate-400">
            Current Role / Job Title
          </label>
          <Input
            placeholder="e.g. M&E Officer, Researcher, Lecturer"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            className="font-body text-[0.875rem] tracking-[0em] leading-[1.6] font-normal bg-sky-light border border-[#0474C4]/25 rounded-sm px-3 py-2 text-ink outline-none focus:border-[#0474C4] placeholder:text-slate-400 placeholder:font-light"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-body text-[0.75rem] tracking-[0.07em] capitalize font-normal text-slate-400">
            Organisation / Institution
          </label>
          <Input
            placeholder="e.g. UN Women, University of Ghana"
            value={organisation}
            onChange={(e) => setOrganisation(e.target.value)}
            className="font-body text-[0.875rem] tracking-[0em] leading-[1.6] font-normal bg-sky-light border border-[#0474C4]/25 rounded-sm px-3 py-2 text-ink outline-none focus:border-[#0474C4] placeholder:text-slate-400 placeholder:font-light"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-body text-[0.75rem] tracking-[0.07em] capitalize font-normal text-slate-400">
            I am primarily a...
          </label>
          <Select onValueChange={setRoleType}>
            <SelectTrigger className="w-full font-body text-[0.875rem] tracking-[0em] leading-[1.6] font-normal bg-sky-light border border-[#0474C4]/25 rounded-sm px-3 py-2 text-ink outline-none focus:border-[#0474C4]">
              <SelectValue placeholder={roleOptions[0].label} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {roleOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {apiError && (
          <p className="font-body text-[0.6875rem] text-red-500">{apiError}</p>
        )}

        <div className="flex gap-2.5 justify-between pt-1">
          <Button
            type="button"
            variant="outline"
            className="bg-transparent min-w-40 h-12 text-[#0474C4] inline-flex border-[#0474C4] py-3.5 px-8 justify-center items-center font-body text-[0.82rem] font-medium tracking-widest uppercase cursor-pointer rounded-[32px] transition-all duration-250 hover:bg-[#06457F] hover:border-[#06457F] hover:text-white"
            onClick={() => setStep(1)}
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-[#0474C4] min-w-40 h-12 text-white inline-flex border-none py-3.5 px-8 justify-center items-center font-body text-[0.82rem] font-medium tracking-widest uppercase cursor-pointer rounded-[32px] transition-all duration-250 hover:bg-[#06457F] hover:border-[#06457F] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? "Saving…" : <>Continue <ChevronRight className="h-4 w-4" /></>}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default StepTwoRegisterForm;
