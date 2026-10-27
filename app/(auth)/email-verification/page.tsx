"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import ResendEmailVerificationForm from "@/components/forms/ResendEmailVerificationForm";
import withAuthLayout from "@/hooks/useAuthLayout";
import { useSearchParams, useRouter } from "next/navigation";
import { useEmailVerification } from "@/hooks/useEmailVerification";
import { toast } from "sonner";

const EmailVerificationPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [resendMail, setResendMail] = useState<boolean>(false);
  const { verifyEmail, isLoading } = useEmailVerification();
  const hasVerifiedRef = useRef(false);

  useEffect(() => {
    if (!token || hasVerifiedRef.current) return;
    hasVerifiedRef.current = true;

    (async () => {
      const result = await verifyEmail(token);
      if (result.success) {
        setTimeout(() => router.push("/login"), 3000);
      } else {
        toast.error(result.error || "Verification failed. Please try again.");
      }
    })();
  }, [token, router, verifyEmail]);
  return (
    <>
      {token && isLoading ? (
        <div className="w-full max-w-100 flex flex-col items-center">
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full border-2 border-[#6655DF]/20 border-t-[#6655DF] animate-spin mx-auto mb-4" />
            <p className="text-[15px] text-[#69708A]">
              Verifying your email…
            </p>
          </div>
        </div>
      ) : (
        <Fragment>
          <div className="w-full max-w-100 flex flex-col items-center">
            <h1 className="text-[clamp(30px,4vw,38px)] tracking-[-0.035em] leading-[1.1] font-extrabold text-[#171C35] mb-2">
              Check your inbox
            </h1>
            <p className="text-[15px] leading-[1.55] text-[#69708A] mb-7 text-center">
              Click the link in the email to activate your account. If you
              don&apos;t see it, check your spam folder.
            </p>

            <p className="text-center text-[14px] text-[#69708A]">
              Didn&apos;t receive it?
              <Button
                onClick={() => setResendMail(true)}
                className="text-[#6655DF] hover:text-[#2C2368] transition-colors font-extrabold bg-transparent border-none hover:bg-transparent hover:border-none"
              >
                Resend
              </Button>
            </p>
          </div>

          {resendMail && (
            <ResendEmailVerificationForm
              resendMail={resendMail}
              setResendMail={setResendMail}
            />
          )}
        </Fragment>
      )}
    </>
  );
};

export default withAuthLayout(EmailVerificationPage);
