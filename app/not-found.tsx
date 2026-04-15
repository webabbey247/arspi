/* eslint-disable react/no-unescaped-entities */
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronRight, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f6eee8] flex items-center justify-center relative w-full overflow-visible">
  <div className="relative z-10 flex flex-col justify-center items-center max-w-240 gap-6">

    {/* Label — DM Sans, 12px, uppercase, +0.07em */}
    <p className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium flex items-center justify-center gap-3 ">
      <span className="block w-6 h-px bg-sapphire" />
        404 Error
      <span className="block w-6 h-px bg-sapphire" />
    </p>

    {/* Display heading — Playfair Display, 48px, -0.02em, lh 1.1 */}
    <h4 className="font-heading text-[3rem] leading-[1.1] tracking-[-0.02em] font-bold text-center uppercase max-w-120">
      Uh-oh. So you might not feel lost…
    </h4>

    {/* Lead body — DM Sans, 18px, -0.01em, lh 1.65 */}
    <p className="font-body text-[1.125rem] tracking-[-0.01em] leading-[1.65] font-light max-w-88 text-center text-[#262b40]">
      ...we just don't know where you are.
      But, don't worry. It's all gonna be OK.
    </p>

    <div className="flex gap-4 justify-center flex-wrap">
      <Button asChild className="h-13 rounded-[32px] py-2.5 px-7.5 text-white bg-[#0249BD] hover:bg-[#06457f] text-[0.875rem] tracking-[0.02em] font-medium">
        <Link href="/">
          Let&apos;s get you back home
          <ChevronRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>

    {/* Small body — DM Sans, 14px, 0em tracking, lh 1.6 */}
    <p className="font-body text-[0.875rem] tracking-[0em] leading-[1.6] font-normal max-w-94 text-center text-[#262b40]">
      Or, if you wanna just hang here for a second and enjoy the peace and quiet. That's OK with us too.
    </p>

  </div>
</div>
  );
}
