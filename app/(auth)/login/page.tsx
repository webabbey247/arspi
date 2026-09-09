"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ForgetPasswordForm from "@/components/forms/ForgetPasswordForm";
import LoginForm from "@/components/forms/LoginForm";
import SocialLoginButtons from "@/components/forms/SocialLoginButtons";
import withAuthLayout from "@/hooks/useAuthLayout";

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  oauth_denied:            "Sign-in was cancelled.",
  oauth_failed:            "Something went wrong signing you in. Please try again.",
  oauth_email_unverified:  "That account's email isn't verified with the provider. Please use email sign-in instead.",
  oauth_account_disabled:  "This account has been disabled. Contact an administrator for help.",
};

const LoginPage = () => {
  const [showPw, setShowPw] = useState<boolean>(false);
  const [forgotOpen, setForgotOpen] = useState<boolean>(false);
  const [resetSent, setResetSent] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    const error = new URLSearchParams(window.location.search).get("error");
    if (!error) return;
    toast.error(OAUTH_ERROR_MESSAGES[error] ?? "Something went wrong signing you in. Please try again.");
    router.replace("/login");
    // Read once on mount only — this is a one-shot redirect-result check, not
    // something that should re-fire on navigation state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Fragment>
      <div className="w-full max-w-100">
        <h1 className="font-heading text-[2rem] tracking-[-0.015em] leading-[1.2] font-bold text-ink mb-1.5 text-[#071639]">
          Sign In
        </h1>
        <p className="font-body text-[0.875rem] tracking-[0em] leading-[1.6] font-normal text-slate-600 mb-8">
          Access your ARPS Institute account to continue learning.
        </p>

        <SocialLoginButtons />

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
