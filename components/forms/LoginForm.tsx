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
        <label className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-slate-400">
          Email Address
        </label>
        <Input
          type="email"
          placeholder="your@email.com"
          autoComplete="email"
          {...register("email")}
          className="font-body text-[0.875rem] tracking-[0em] leading-[1.6] font-normal bg-sky-light border border-[#0474C4]/25 rounded-sm px-3 py-2 text-ink outline-none focus:border-[#0474C4] placeholder:text-slate-400 placeholder:font-light"
        />
        {errors.email && (
          <span className="font-body text-[0.6875rem] text-red-500">{errors.email.message}</span>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-slate-400">
          Password
        </label>
        <div className="relative">
          <Input
            type={showPw ? "text" : "password"}
            placeholder="Enter your password"
            autoComplete="current-password"
            {...register("password")}
            className="pr-11 font-body text-[0.875rem] tracking-[0em] leading-[1.6] font-normal bg-sky-light border border-[#0474C4]/25 rounded-sm px-3 py-2 text-ink outline-none focus:border-[#0474C4] placeholder:text-slate-400 placeholder:font-light"
          />
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-ink transition-colors"
          >
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <span className="font-body text-[0.6875rem] text-red-500">{errors.password.message}</span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 font-body text-[0.875rem] tracking-[0em] font-normal text-slate-500 cursor-pointer">
          <input
            type="checkbox"
            className="accent-sapphire"
            {...register("rememberMe")}
          />{" "}
          Remember me
        </label>
        <Button
          type="button"
          onClick={() => setForgotOpen(true)}
          className="font-body text-[0.875rem] bg-transparent tracking-[0em] font-normal text-[#0474C4] hover:text-[#06457F] transition-colors"
        >
          Forgot password?
        </Button>
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="bg-[#0474C4] min-w-40 h-12 text-white inline-flex border-none py-3.5 px-8 justify-center items-center font-body text-[0.82rem] font-medium tracking-widest uppercase cursor-pointer rounded-[32px] transition-all duration-250 hover:bg-[#06457F] hover:border-[#06457F] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isLoading ? "Signing in…" : <>Sign In <ChevronRight className="h-4 w-4" /></>}
      </Button>

      <p className="text-center font-body text-[0.75rem] tracking-[0em] leading-normal font-normal text-slate-400">
        By signing in you agree to our{" "}
        <Link href="#" className="text-[#0474C4] hover:text-[#06457F]">Terms</Link>{" "}
        and{" "}
        <Link href="#" className="text-[#0474C4] hover:text-[#06457F]">Privacy Policy</Link>.
      </p>
    </form>
  );
};

export default LoginForm;
