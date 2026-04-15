"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import ForgetPasswordForm from "@/components/forms/ForgetPasswordForm";
import LoginForm from "@/components/forms/LoginForm";
import withAuthLayout from "@/hooks/useAuthLayout";

const LoginPage = () => {
  const [showPw, setShowPw] = useState<boolean>(false);
  const [forgotOpen, setForgotOpen] = useState<boolean>(false);
  const [resetSent, setResetSent] = useState<boolean>(false);

  return (
    <Fragment>
      <div className="w-full max-w-100">
        <h1 className="font-heading text-[2rem] tracking-[-0.015em] leading-[1.2] font-bold text-ink mb-1.5 text-[#071639]">
          Sign In
        </h1>
        <p className="font-body text-[0.875rem] tracking-[0em] leading-[1.6] font-normal text-slate-600 mb-8">
          Access your ARPS Institute account to continue learning.
        </p>

        {/* Social buttons */}
        <div className="flex gap-2.5 mb-6">
          <button className="flex-1 flex items-center justify-center min-w-40 gap-2 py-2.5 border border-sapphire/25 rounded-sm bg-sky-light hover:bg-sky-light/80 hover:border-sapphire transition-all font-body text-[0.875rem] tracking-[0em] font-normal text-slate-600">
            <svg viewBox="0 0 24 24" className="w-4 h-4">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
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

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-sapphire/20" />
          <span className="font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium text-slate-400">
            or sign in with email
          </span>
          <div className="flex-1 h-px bg-sapphire/20" />
        </div>

        <LoginForm
          showPw={showPw}
          setShowPw={setShowPw}
          setForgotOpen={setForgotOpen}
        />

        <p className="text-center font-body text-[0.875rem] tracking-[0em] font-normal text-slate-600 mt-6">
          New to ARPS Institute?{" "}
          <Link
            href="/register"
            className="text-[#0474C4] hover:text-[#06457F] transition-colors font-medium"
          >
            Sign Up
          </Link>
        </p>
      </div>

      {/* ── Forgot password modal ── */}
      {forgotOpen && (
        <ForgetPasswordForm
          resetSent={resetSent}
          setForgotOpen={setForgotOpen}
          setResetSent={setResetSent}
        />
      )}
    </Fragment>
  );
};

export default withAuthLayout(LoginPage);
