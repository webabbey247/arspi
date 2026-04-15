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
      <div className="flex gap-2.5 mb-6">
        <button className="flex-1 flex items-center justify-center min-w-40 gap-2 py-2.5 border border-sapphire/25 rounded-sm bg-sky-light hover:bg-sky-light/80 hover:border-sapphire transition-all font-body text-[0.875rem] tracking-[0em] font-normal text-slate-600">
          <svg viewBox="0 0 24 24" className="w-4 h-4">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>
        <button className="flex items-center justify-center min-w-50 gap-2 px-4 py-2.5 border border-sapphire/25 rounded-sm bg-sky-light hover:bg-sky-light/80 hover:border-sapphire transition-all font-body text-[0.875rem] tracking-[0em] font-normal text-slate-600">
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#0077B5">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
          LinkedIn
        </button>
      </div>

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
          className="bg-[#0474C4] min-w-40 h-12 text-white inline-flex border-none py-3.5 px-8 justify-center items-center font-body text-[0.82rem] font-medium tracking-widest uppercase cursor-pointer rounded-[32px] transition-all duration-250 hover:bg-[#06457F] hover:border-[#06457F] disabled:opacity-60 disabled:cursor-not-allowed"
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
