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
      <h1 className="text-[clamp(30px,4vw,38px)] tracking-[-0.035em] leading-[1.1] font-extrabold text-[#171C35] mb-2">
        Your Profile
      </h1>
      <p className="text-[15px] leading-[1.55] text-[#69708A] mb-7">
        Help us personalise your learning experience.
      </p>

      <form className="flex flex-col gap-3.5" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-extrabold text-[#171C35]">
              First Name
            </label>
            <Input
              placeholder="e.g. Amara"
              {...register("firstName")}
              className="text-[15px] leading-[1.5] bg-white border border-[#DFE2ED] rounded-[10px] px-[13px] py-[11px] text-[#171C35] outline-none transition-shadow focus:border-[#6655DF] focus:ring-3 focus:ring-[#6655DF]/15 placeholder:text-[#8A90A6]"
            />
            {errors.firstName && (
              <span className="text-[12px] font-bold text-red-600">{errors.firstName.message}</span>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-extrabold text-[#171C35]">
              Last Name
            </label>
            <Input
              placeholder="e.g. Diallo"
              {...register("lastName")}
              className="text-[15px] leading-[1.5] bg-white border border-[#DFE2ED] rounded-[10px] px-[13px] py-[11px] text-[#171C35] outline-none transition-shadow focus:border-[#6655DF] focus:ring-3 focus:ring-[#6655DF]/15 placeholder:text-[#8A90A6]"
            />
            {errors.lastName && (
              <span className="text-[12px] font-bold text-red-600">{errors.lastName.message}</span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[14px] font-extrabold text-[#171C35]">
            Country of Residence
          </label>
          <Select onValueChange={setCountry}>
            <SelectTrigger className="w-full text-[15px] leading-[1.5] bg-white border border-[#DFE2ED] rounded-[10px] px-[13px] py-[11px] text-[#171C35] outline-none transition-shadow focus:border-[#6655DF] focus:ring-3 focus:ring-[#6655DF]/15">
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
          <label className="text-[14px] font-extrabold text-[#171C35]">
            Current Role / Job Title
          </label>
          <Input
            placeholder="e.g. M&E Officer, Researcher, Lecturer"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            className="text-[15px] leading-[1.5] bg-white border border-[#DFE2ED] rounded-[10px] px-[13px] py-[11px] text-[#171C35] outline-none transition-shadow focus:border-[#6655DF] focus:ring-3 focus:ring-[#6655DF]/15 placeholder:text-[#8A90A6]"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[14px] font-extrabold text-[#171C35]">
            Organisation / Institution
          </label>
          <Input
            placeholder="e.g. UN Women, University of Ghana"
            value={organisation}
            onChange={(e) => setOrganisation(e.target.value)}
            className="text-[15px] leading-[1.5] bg-white border border-[#DFE2ED] rounded-[10px] px-[13px] py-[11px] text-[#171C35] outline-none transition-shadow focus:border-[#6655DF] focus:ring-3 focus:ring-[#6655DF]/15 placeholder:text-[#8A90A6]"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[14px] font-extrabold text-[#171C35]">
            I am primarily a...
          </label>
          <Select onValueChange={setRoleType}>
            <SelectTrigger className="w-full text-[15px] leading-[1.5] bg-white border border-[#DFE2ED] rounded-[10px] px-[13px] py-[11px] text-[#171C35] outline-none transition-shadow focus:border-[#6655DF] focus:ring-3 focus:ring-[#6655DF]/15">
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
          <p className="text-[12px] font-bold text-red-600">{apiError}</p>
        )}

        <div className="flex gap-2.5 justify-between pt-1">
          <Button
            type="button"
            variant="outline"
            className="bg-white min-w-40 h-12 text-[#171C35] inline-flex gap-2 border border-[#DFE2ED] py-[11px] px-4 justify-center items-center text-[15px] font-extrabold cursor-pointer rounded-[10px] transition-colors hover:bg-[#F5F6FB]"
            onClick={() => setStep(1)}
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-[#6655DF] min-w-40 h-12 text-white inline-flex gap-2 border border-[#6655DF] py-[11px] px-4 justify-center items-center text-[15px] font-extrabold cursor-pointer rounded-[10px] transition-colors hover:bg-[#2C2368] hover:border-[#2C2368] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? "Saving…" : <>Continue <ChevronRight className="h-4 w-4" /></>}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default StepTwoRegisterForm;
