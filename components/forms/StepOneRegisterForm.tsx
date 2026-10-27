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
      <h1 className="text-[clamp(30px,4vw,38px)] tracking-[-0.035em] leading-[1.1] font-extrabold text-[#171C35] mb-2">
        Create Account
      </h1>
      <p className="text-[15px] leading-[1.55] text-[#69708A] mb-7">
        Start with your email and a secure password.
      </p>

      {/* Social buttons */}
      <SocialLoginButtons />

      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px bg-[#DFE2ED]" />
        <span className="text-[11px] tracking-[0.12em] uppercase font-extrabold text-[#8A90A6]">
          or sign in with email
        </span>
        <div className="flex-1 h-px bg-[#DFE2ED]" />
      </div>

      <form className="flex flex-col gap-3.5" onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-1.5">
          <label className="text-[14px] font-extrabold text-[#171C35]">
            Email Address
          </label>
          <Input
            type="email"
            placeholder="your@email.com"
            {...register("email")}
            className="text-[15px] leading-[1.5] bg-white border border-[#DFE2ED] rounded-[10px] px-[13px] py-[11px] text-[#171C35] outline-none transition-shadow focus:border-[#6655DF] focus:ring-3 focus:ring-[#6655DF]/15 placeholder:text-[#8A90A6]"
          />
          {errors.email && (
            <span className="text-[12px] font-bold text-red-600">{errors.email.message}</span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[14px] font-extrabold text-[#171C35]">
            Password
          </label>
          <div className="relative">
            <Input
              type={showPw ? "text" : "password"}
              placeholder="Create a strong password"
              {...passwordReg}
              onChange={(e) => { setPwValue(e.target.value); onPasswordChange(e); }}
              className="pr-11 text-[15px] leading-[1.5] bg-white border border-[#DFE2ED] rounded-[10px] px-[13px] py-[11px] text-[#171C35] outline-none transition-shadow focus:border-[#6655DF] focus:ring-3 focus:ring-[#6655DF]/15 placeholder:text-[#8A90A6]"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A90A6] hover:text-[#171C35]"
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
                    style={{ background: i <= strength ? strengthColors[strength] : "rgba(102,85,223,0.15)" }}
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
            <span className="text-[12px] font-bold text-red-600">{errors.password.message}</span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[14px] font-extrabold text-[#171C35]">
            Confirm Password
          </label>
          <div className="relative">
            <Input
              type={showConfirmPw ? "text" : "password"}
              placeholder="Repeat your password"
              {...register("confirmPassword")}
              className="pr-11 text-[15px] leading-[1.5] bg-white border border-[#DFE2ED] rounded-[10px] px-[13px] py-[11px] text-[#171C35] outline-none transition-shadow focus:border-[#6655DF] focus:ring-3 focus:ring-[#6655DF]/15 placeholder:text-[#8A90A6]"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPw(!showConfirmPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A90A6] hover:text-[#171C35]"
            >
              {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <span className="text-[12px] font-bold text-red-600">{errors.confirmPassword.message}</span>
          )}
        </div>

        {apiError && (
          <p className="text-[12px] font-bold text-red-600">{apiError}</p>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="bg-[#6655DF] min-w-40 h-12 text-white inline-flex gap-2 border border-[#6655DF] py-[11px] px-4 justify-center items-center text-[15px] font-extrabold cursor-pointer rounded-[10px] transition-colors hover:bg-[#2C2368] hover:border-[#2C2368] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? "Creating account…" : <>Continue <ChevronRight className="h-4 w-4" /></>}
        </Button>

        <p className="text-center text-[12px] text-[#8A90A6]">
          By creating an account you agree to our{" "}
          <Link href="#" className="text-[#6655DF]">Terms</Link>,{" "}
          <Link href="#" className="text-[#6655DF]">Privacy Policy</Link>, and{" "}
          <Link href="#" className="text-[#6655DF]">Cookie Policy</Link>.
        </p>
      </form>
    </div>
  );
};

export default StepOneRegisterForm;
