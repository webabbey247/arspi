
import { Check, ChevronRight } from "lucide-react";
import Link from "next/link";

const RegisterSummary = () => {
  return (
    <div className="flex flex-col items-center justify-center text-center h-full py-8">
      <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto mb-5">
        <Check className="h-8 w-8 text-emerald-600" />
      </div>
      <h2 className="font-heading text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-[#071639] mb-3">
        Account Created!
      </h2>
      <p className="font-body text-[0.9375rem] tracking-[0em] leading-[1.7] font-normal text-slate-600 max-w-xs mx-auto mb-8">
        Welcome to ARPS Institute. We&apos;ve sent a verification email — please
        confirm it to activate all features. You can start exploring now.
      </p>

       
      <div className="flex flex-col gap-4 items-center justify-center">
         <Link href="/programs"             className="bg-[#0474C4] min-w-40 h-12 text-white inline-flex border-none py-3.5 px-8 justify-center items-center font-body text-[0.82rem] font-medium tracking-widest uppercase cursor-pointer rounded-[32px] transition-all duration-250  hover:bg-[#06457F] hover:border-[#06457F]"
>
          Explore Programs <ChevronRight className="h-4 w-4" />
        </Link>
        <Link
          href="/"
          className="font-body text-[0.875rem] tracking-[0em] font-normal text-slate-400 hover:text-[#0474C4] transition-colors inline-flex items-center"
        >
          Go to homepage <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};

export default RegisterSummary;
