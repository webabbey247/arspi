import Link from "next/link";
import SubscriptionForm from "../forms/SubscriptionForm";
import { footerLinks } from "@/lib/data";

export function Footer() {
  return (
    <footer className="bg-[#06457f] border-t border-[#5379AE]/15 w-full flex flex-col items-center` justify-center">
      <div className="px-8 md:px-16 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.8fr_1fr_1fr_1.6fr] gap-10 lg:gap-16 border-b border-white/5">
        <div className="flex flex-col justify-start items-start w-full gap-5">
          <h4 className="font-heading text-[1.375rem] tracking-[-0.005em] leading-[1.3] font-medium text-white/90">
            Advancing <em className="italic">Professional Expertise,</em>
            <br />
            Research &amp; Leadership.
          </h4>

          <p className="font-body text-[1rem] tracking-[-0.005em] leading-[1.7] font-normal max-w-sm text-white/60">
            Global professional certification programs, research training,
            software solutions, and institutional consulting for scholars and
            practitioners worldwide.
          </p>
        </div>

        {/* Link columns */}
        {Object.entries(footerLinks).map(([title, links]) => (
          <div key={title}>
            <p className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium mb-4 text-white">
              {title}
            </p>
            <ul className="flex flex-col gap-2.5">
              {links.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="font-body text-[0.875rem] tracking-[0em] leading-[1.6] font-normal transition-colors text-white/60 hover:text-white"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Newsletter */}
        <div>
          <p className="font-body text-[1rem] tracking-[-0.005em] leading-[1.7] font-normal mb-4 text-[#D4E4F6]">
            Stay informed — get new programmes &amp; research insights.
          </p>

          <SubscriptionForm />

          <p
            className="font-body text-[0.75rem] tracking-[0em] leading-normal font-normal text-white/60 "
          >
            No spam. Unsubscribe at any time.
          </p>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="px-8 md:px-16 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-wrap">
        <ul className="flex gap-6 flex-wrap">
          {[
            "Privacy Policy",
            "Terms & Conditions",
            "Refund Policy",
            "Cookie Policy",
          ].map((item) => (
            <li key={item}>
              <Link
                href="#"
                className="font-body text-[0.75rem] tracking-[0.07em] leading-normal font-normal transition-colors text-white/60 hover:text-white"
              >
                {item}
              </Link>
            </li>
          ))}
        </ul>

        <p className="font-body text-[0.75rem] tracking-[0.07em] leading-normal font-normal text-white/60">
          &copy; 2026 ARPS Institute. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}
