
import { Check, ChevronRight } from "lucide-react";
import Link from "next/link";

const RegisterSummary = () => {
  return (
    <div className="flex flex-col items-center justify-center text-center h-full py-8">
      <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto mb-5">
        <Check className="h-8 w-8 text-emerald-600" />
      </div>
      <h2 className="text-[clamp(28px,3.4vw,36px)] tracking-[-0.035em] leading-[1.1] font-extrabold text-[#171C35] mb-3">
        Account Created!
      </h2>
      <p className="text-[15px] leading-[1.6] text-[#69708A] max-w-xs mx-auto mb-8">
        Welcome to ARPS Institute. We&apos;ve sent a verification email — please
        confirm it to activate all features. You can start exploring now.
      </p>

       
      <div className="flex flex-col gap-4 items-center justify-center">
         <Link href="/programs"             className="bg-[#6655DF] min-w-40 h-12 text-white inline-flex border border-[#6655DF] py-[11px] px-4 justify-center items-center text-[15px] font-extrabold cursor-pointer rounded-[10px] transition-colors hover:bg-[#2C2368] hover:border-[#2C2368]"
>
          Explore Programs <ChevronRight className="h-4 w-4" />
        </Link>
        <Link
          href="/"
          className="text-[14px] font-bold text-[#69708A] hover:text-[#6655DF] transition-colors inline-flex items-center"
        >
          Go to homepage <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};

export default RegisterSummary;
