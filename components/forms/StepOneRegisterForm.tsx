"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { ChevronRight, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRegister } from "@/hooks/useRegister";
import SocialLoginButtons from "./SocialLoginButtons";

const schema = yup.object({
  email: yup.string().email("Enter a valid email").required("Email is required"),
  password: yup
    .string()
    .min(8, "Must be at least 8 characters")
    .matches(/[A-Z]/, "Must contain an uppercase letter")
    .matches(/[0-9]/, "Must contain a number")
    .matches(/[^A-Za-z0-9]/, "Must contain a special character")
    .required("Password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords do not match")
    .required("Please confirm your password"),
});

type StepOneFields = yup.InferType<typeof schema>;

function pwStrength(p: string) {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
}

const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];
const strengthColors = ["", "#EF4444", "#F59E0B", "#3B82F6", "#10B981"];

const StepOneRegisterForm = ({
  showPw,
  setShowPw,
  onComplete,
}: {
  showPw: boolean;
  setShowPw: (show: boolean) => void;
  onComplete: (data: { userId: string }) => void;
}) => {
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwValue, setPwValue] = useState("");
  const [apiError, setApiError] = useState<string | null>(null);

  const { register: registerUser, isLoading } = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StepOneFields>({ resolver: yupResolver(schema), mode: "onTouched" });

  const { onChange: onPasswordChange, ...passwordReg } = register("password");

  const strength = pwStrength(pwValue);

  async function onSubmit(data: StepOneFields) {
    setApiError(null);
    const result = await registerUser({ email: data.email, password: data.password });
    if (!result.success) {
      setApiError(result.error);
      return;
    }
    onComplete({ userId: result.data.userId });
  }

  return (
    <div>
      <h1 className="font-heading text-[2rem] tracking-[-0.015em] leading-[1.2] font-bold text-ink mb-1.5 text-[#071639]">
        Create Account
      </h1>
      <p className="font-body text-[0.875rem] tracking-[0em] leading-[1.6] font-normal text-slate-600 mb-8">
        Start with your email and a secure password.
      </p>

      {/* Social buttons */}
      <SocialLoginButtons />

      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px bg-sapphire/20" />
        <span className="font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium text-slate-400">
          or sign in with email
        </span>
        <div className="flex-1 h-px bg-sapphire/20" />
      </div>

      <form className="flex flex-col gap-3.5" onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-1.5">
          <label className="font-body text-[0.75rem] tracking-[0.07em] capitalize font-medium text-slate-400">
            Email Address
          </label>
          <Input
            type="email"
            placeholder="your@email.com"
            {...register("email")}
            className="font-body text-[0.875rem] tracking-[0em] leading-[1.6] font-normal bg-sky-light border border-[#0474C4]/25 rounded-sm px-3 py-2 text-ink outline-none focus:border-[#0474C4] placeholder:text-slate-400 placeholder:font-light"
          />
          {errors.email && (
            <span className="font-body text-[0.6875rem] text-red-500">{errors.email.message}</span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-body text-[0.75rem] tracking-[0.07em] capitalize font-medium text-slate-400">
            Password
          </label>
          <div className="relative">
            <Input
              type={showPw ? "text" : "password"}
              placeholder="Create a strong password"
              {...passwordReg}
              onChange={(e) => { setPwValue(e.target.value); onPasswordChange(e); }}
              className="pr-11 font-body text-[0.875rem] tracking-[0em] leading-[1.6] font-normal bg-sky-light border border-[#0474C4]/25 rounded-sm px-3 py-2 text-ink outline-none focus:border-[#0474C4] placeholder:text-slate-400 placeholder:font-light"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-ink"
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {pwValue && (
            <div>
              <div className="flex gap-1 mb-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="flex-1 h-1 rounded-full transition-all"
                    style={{ background: i <= strength ? strengthColors[strength] : "rgba(200,169,110,0.15)" }}
                  />
                ))}
              </div>
              <span
                className="font-body text-[0.6875rem] tracking-[0em] font-medium"
                style={{ color: strengthColors[strength] }}
              >
                {strengthLabels[strength]}
              </span>
            </div>
          )}
          {errors.password && (
            <span className="font-body text-[0.6875rem] text-red-500">{errors.password.message}</span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-body text-[0.75rem] tracking-[0.07em] capitalize font-medium text-slate-400">
            Confirm Password
          </label>
          <div className="relative">
            <Input
              type={showConfirmPw ? "text" : "password"}
              placeholder="Repeat your password"
              {...register("confirmPassword")}
              className="pr-11 font-body text-[0.875rem] tracking-[0em] leading-[1.6] font-normal bg-sky-light border border-[#0474C4]/25 rounded-sm px-3 py-2 text-ink outline-none focus:border-[#0474C4] placeholder:text-slate-400 placeholder:font-light"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPw(!showConfirmPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-ink"
            >
              {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <span className="font-body text-[0.6875rem] text-red-500">{errors.confirmPassword.message}</span>
          )}
        </div>

        {apiError && (
          <p className="font-body text-[0.6875rem] text-red-500">{apiError}</p>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="bg-[#0474C4] min-w-40 h-12 text-white inline-flex border-none py-3.5 px-8 justify-center items-center font-body text-[0.82rem] font-medium tracking-widest uppercase cursor-pointer rounded transition-all duration-250 hover:bg-[#06457F] hover:border-[#06457F] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? "Creating account…" : <>Continue <ChevronRight className="h-4 w-4" /></>}
        </Button>

        <p className="text-center font-body text-[0.75rem] tracking-[0em] leading-normal font-normal text-slate-400">
          By creating an account you agree to our{" "}
          <Link href="#" className="text-sapphire">Terms</Link>,{" "}
          <Link href="#" className="text-sapphire">Privacy Policy</Link>, and{" "}
          <Link href="#" className="text-sapphire">Cookie Policy</Link>.
        </p>
      </form>
    </div>
  );
};

export default StepOneRegisterForm;
