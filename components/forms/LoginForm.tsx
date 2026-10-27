"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { ChevronRight, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useLogin } from "@/hooks/useLogin";
import { useRouter } from "next/navigation"

const schema = yup.object({
  email:      yup.string().email("Enter a valid email").required("Email is required"),
  password:   yup.string().required("Password is required"),
  rememberMe: yup.boolean().default(false),
});

type LoginFields = yup.InferType<typeof schema>;

const LoginForm = ({
  showPw,
  setShowPw,
  setForgotOpen,
}: {
  showPw: boolean;
  setShowPw: (show: boolean) => void;
  setForgotOpen: (open: boolean) => void;
}) => {
  const { login, isLoading } = useLogin();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFields>({ resolver: yupResolver(schema), mode: "onTouched" });

  async function onSubmit(data: LoginFields) {
    const result = await login({
      email:      data.email,
      password:   data.password,
      rememberMe: data.rememberMe ?? false,
    });
    if (!result.success) {
      if ("requiresVerification" in result) {
        toast.info("Verification email sent", {
          description: "Check your inbox and click the link to verify your account.",
        });
        //redirect to verification page with email as query param
        router.push(`/email-verification?redirectUrl=authenticate&email=${encodeURIComponent(data.email)}`);
      } else {
        toast.error(result.error || "Login failed. Please try again.");
        console.error("[login]", result.error);
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-[14px] font-extrabold text-[#171C35]">
          Email Address
        </label>
        <Input
          type="email"
          placeholder="your@email.com"
          autoComplete="email"
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
            placeholder="Enter your password"
            autoComplete="current-password"
            {...register("password")}
            className="pr-11 text-[15px] leading-[1.5] bg-white border border-[#DFE2ED] rounded-[10px] px-[13px] py-[11px] text-[#171C35] outline-none transition-shadow focus:border-[#6655DF] focus:ring-3 focus:ring-[#6655DF]/15 placeholder:text-[#8A90A6]"
          />
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A90A6] hover:text-[#171C35] transition-colors"
          >
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <span className="text-[12px] font-bold text-red-600">{errors.password.message}</span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-[14px] text-[#69708A] cursor-pointer">
          <input
            type="checkbox"
            className="accent-[#6655DF]"
            {...register("rememberMe")}
          />{" "}
          Remember me
        </label>
        <Button
          type="button"
          onClick={() => setForgotOpen(true)}
          className="font-body text-[0.875rem] bg-transparent tracking-[0em] font-normal text-[#6655DF] hover:text-[#2C2368] transition-colors"
        >
          Forgot password?
        </Button>
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="bg-[#6655DF] min-w-40 h-12 text-white inline-flex gap-2 border border-[#6655DF] py-[11px] px-4 justify-center items-center text-[15px] font-extrabold cursor-pointer rounded-[10px] transition-colors hover:bg-[#2C2368] hover:border-[#2C2368] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isLoading ? "Signing in…" : <>Sign In <ChevronRight className="h-4 w-4" /></>}
      </Button>

      <p className="text-center text-[12px] text-[#8A90A6]">
        By signing in you agree to our{" "}
        <Link href="#" className="text-[#6655DF] hover:text-[#2C2368]">Terms</Link>{" "}
        and{" "}
        <Link href="#" className="text-[#6655DF] hover:text-[#2C2368]">Privacy Policy</Link>.
      </p>
    </form>
  );
};

export default LoginForm;
