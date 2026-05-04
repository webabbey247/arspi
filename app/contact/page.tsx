/* eslint-disable react/no-unescaped-entities */
"use client";

import Image from "next/image";
import GeneralContactForm from "@/components/forms/GeneralContactForm";
import withLayout from "@/hooks/useLayout";

const ContactPage = () => {
  return (
    <>
   {/* <section className="bg-[#071639] relative w-full px-8 md:px-16 py-24 grid lg:grid-cols-2 gap-16 items-center">
        <div className="absolute inset-0 bg-grid-ink pointer-events-none" />
        <div className="absolute -top-24 right-0 w-125 h-125 rounded-full bg-[#0474C4]/8 blur-[100px] pointer-events-none" />
  <div className="relative z-10 gap-4 flex flex-col justify-start items-start">
    <p className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#EBF3FC] inline-flex items-center gap-2">
      <span className="block w-8 h-px bg-[#EBF3FC]" />
      Get in Touch
    </p>

    <h1 className="font-heading text-[2.25rem] md:text-[3rem] tracking-[-0.015em] md:tracking-[-0.02em] leading-[1.2] md:leading-[1.1] font-bold text-white max-w-lg">
      We&apos;d Love to <em className="italic text-[#0474C4]">Hear from You</em>
    </h1>

    <p className="font-body text-[1.125rem] tracking-[-0.01em] leading-[1.65] font-light text-[#EBF3FC] max-w-lg">
      Whether you&apos;re exploring our programmes, looking to partner
      with us, need support with a product, or want to discuss
      institutional consulting — our team is here and ready to help.
    </p>

  </div>
</section> */}

   <section className="bg-[#071639] relative w-full py-24 grid lg:grid-cols-2 gap-16 items-center">
        <div className="absolute inset-0 bg-grid-ink pointer-events-none" />
        <div className="absolute -top-24 right-0 w-125 h-125 rounded-full bg-[#0474C4]/8 blur-[100px] pointer-events-none" />
  <div className="relative z-10 gap-4 flex flex-col justify-start items-start max-w-lg mx-auto">
    <p className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#EBF3FC] inline-flex items-center gap-2">
      <span className="block w-8 h-px bg-[#EBF3FC]" />
      Get in Touch
    </p>

    <h1 className="font-heading text-[2.25rem] md:text-[3rem] tracking-[-0.015em] md:tracking-[-0.02em] leading-[1.2] md:leading-[1.1] font-bold text-white max-w-lg">
      We&apos;d Love to <em className="italic text-[#0474C4]">Hear from You</em>
    </h1>

    <p className="font-body text-[1.125rem] tracking-[-0.01em] leading-[1.65] font-light text-[#EBF3FC] max-w-lg">
      Whether you&apos;re exploring our programmes, looking to partner
      with us, need support with a product, or want to discuss
      institutional consulting — our team is here and ready to help.
    </p>

  </div>

  {/* Right — image that fades into the background colour, full-bleed against section edges */}
  <div className="relative z-10 hidden lg:block w-full self-stretch lg:-my-24">
    <Image
      src="/images/about-arps.webp"
      alt="ARPS team at work"
      fill
      sizes="(min-width: 1024px) 50vw, 100vw"
      className="object-cover"
      priority
    />
    {/* Left + bottom fade into #071639 */}
    <div className="absolute inset-0 bg-linear-to-r from-[#071639] via-[#071639]/55 to-transparent pointer-events-none" />
    <div className="absolute inset-0 bg-linear-to-t from-[#071639]/80 via-transparent to-transparent pointer-events-none" />
  </div>
</section>

      <section className="grid-cols-1 lg:grid-cols-[1fr_2fr] max-w-360 mx-auto w-full flex justify-between">
        <div className="px-8 py-16 flex flex-col justify-start gap-4 w-full max-w-md">
          <h2 className="font-heading text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-[#0474C4]">
            Get in touch
          </h2>

          <div className="flex flex-col gap-2">
            <p className="font-body text-[1rem] tracking-[-0.005em] leading-[1.7] font-normal text-[#262b40]">
              Got a question about artful counselling that isn't in our FAQ? Or
              have a specific question? Simply complete this form .
            </p>

            {/* <p className="font-body text-[1rem] tracking-[-0.005em] leading-[1.7] font-normal text-[#262b40]">
              Simply complete this form or email our Brisbane studio.
            </p>

            <p className="font-body text-[1rem] tracking-[-0.005em] leading-[1.7] font-normal text-[#262b40]">
              We can't wait to talk to you about how we can help your child grow
              their emotional wellbeing.
            </p> */}
          </div>

          <div className="flex flex-col justify-start items-start w-full gap-4 mt-4">
            <h4 className="font-heading text-[1.375rem] tracking-[-0.005em] leading-[1.3] font-semibold text-ink text-[#0474C4]">
              Contact details
            </h4>

            <div className="grid grid-cols-1 gap-4">
              <div className="flex flex-col gap-0.5">
                <span className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#637AA3]">
                  Email
                </span>
                <span className="font-body text-[1rem] tracking-[-0.005em] leading-[1.7] font-normal text-[#262b40]">
                  press-media@arpsinstitute.org
                </span>
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#637AA3]">
                  Phone
                </span>
                <span className="font-body text-[1rem] tracking-[-0.005em] leading-[1.7] font-normal text-[#262b40]">
                  8:00 AM – 4:00 PM UTC
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="py-16 w-full relative max-w-2xl me-auto">
          <div className="bg-[#F9F9FB] rounded flex flex-col justify-start gap-8 items-start p-10 w-full relative z-10">
           <div className="block space-y-4">
             <h2 className="font-heading text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-[#0474C4]">
              How Can We Help?
            </h2>

            <p className="font-body text-[1rem] tracking-[-0.005em] leading-[1.7] font-normal text-[#262b40]">
              Use the tabs below to route your message to the right team. We
              typically respond within 24–48 hours.
            </p>
           </div>

            <GeneralContactForm />
          </div>
        </div>
      </section>

      {/* Offices */}
      <section className="px-8 md:px-16 py-16 bg-[#EDF2FB] w-full">
        <div className="max-w-350 flex flex-col gap-5 mx-auto">
         <p className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#637AA3]">
  Our Presence
</p>
          <h2 className="font-heading text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-[#0474C4]">
  Global Offices &amp; Operations
</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                region: "Africa · Headquarters",
                city: "Accra, Ghana",
                addr: "West Airport Residential Area\nAccra, Greater Accra Region, Ghana",
                phone: "+233 (0) 30 000 0000",
              },
              {
                region: "Europe · Regional",
                city: "London, United Kingdom",
                addr: "Canary Wharf, Level 18\nLondon E14 5AB, United Kingdom",
                phone: "+44 (0) 20 0000 0000",
              },
              {
                region: "North America · Regional",
                city: "Washington D.C., USA",
                addr: "1200 18th Street NW, Suite 700\nWashington, D.C. 20036, USA",
                phone: "+1 (202) 000 0000",
              },
            ].map((o) => (
              <div
  key={o.city}
  className="border bg-white/90 border-[#0474C4]/25 rounded p-6"
>
  <div className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#637AA3] mb-2">
    {o.region}
  </div>

  <div className="font-heading text-[1.375rem] tracking-[-0.005em] leading-[1.3] font-medium text-[#0474C4] mb-3">
    {o.city}
  </div>

  <div className="font-body text-[0.875rem] tracking-[0em] leading-[1.6] font-normal text-black whitespace-pre-line mb-2">
    {o.addr}
  </div>

  <div className="font-body text-[0.75rem] tracking-[0em] leading-normal font-normal text-white/30">
    {o.phone}
  </div>
</div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default withLayout(ContactPage);
