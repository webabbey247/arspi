"use client";

import { Fragment, useEffect, useState } from "react";
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

  const handleEmailVerification = async () => {
    if (!token) return;
    const result = await verifyEmail(token);
    if (result.success) {
      setTimeout(() => router.push("/login"), 3000);
    } else {
      toast.error(result.error || "Verification failed. Please try again.");
    }
  };

  useEffect(() => {
    if (!token) return;
    handleEmailVerification();
  });
  return (
    <>
      {token && isLoading ? (
        <div className="w-full max-w-100 flex flex-col items-center">
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full border-2 border-[#0474C4]/20 border-t-[#0474C4] animate-spin mx-auto mb-4" />
            <p className="font-body text-[0.875rem] text-slate-500">
              Verifying your email…
            </p>
          </div>
        </div>
      ) : (
        <Fragment>
          <div className="w-full max-w-100 flex flex-col items-center">
            <h1 className="font-heading text-[2rem] tracking-[-0.015em] leading-[1.2] font-bold text-ink mb-1.5 text-[#071639]">
              Check your inbox
            </h1>
            <p className="font-body text-[0.875rem] tracking-[0em] leading-[1.6] font-normal text-slate-600 mb-8 text-center">
              Click the link in the email to activate your account. If you
              don&apos;t see it, check your spam folder.
            </p>

            <p className="text-center font-body text-[0.875rem] tracking-[0em] font-normal text-slate-600">
              Didn&apos;t receive it?
              <Button
                onClick={() => setResendMail(true)}
                className="text-[#0474C4] hover:text-[#06457F] transition-colors font-medium bg-transparent border-none hover:bg-transparent hover:border-none"
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
