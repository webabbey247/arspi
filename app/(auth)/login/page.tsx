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
        <h1 className="text-[clamp(30px,4vw,38px)] tracking-[-0.035em] leading-[1.1] font-extrabold text-[#171C35] mb-2">
          Sign In
        </h1>
        <p className="text-[15px] leading-[1.55] text-[#69708A] mb-7">
          Access your ARPS Institute account to continue learning.
        </p>

        <SocialLoginButtons />

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-[#DFE2ED]" />
          <span className="text-[11px] tracking-[0.12em] uppercase font-extrabold text-[#8A90A6]">
            or sign in with email
          </span>
          <div className="flex-1 h-px bg-[#DFE2ED]" />
        </div>

        <LoginForm
          showPw={showPw}
          setShowPw={setShowPw}
          setForgotOpen={setForgotOpen}
        />

        <p className="text-center text-[14px] text-[#69708A] mt-6">
          New to ARPS Institute?{" "}
          <Link
            href="/register"
            className="text-[#6655DF] hover:text-[#2C2368] transition-colors font-extrabold"
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
