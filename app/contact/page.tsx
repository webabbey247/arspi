/* eslint-disable react/no-unescaped-entities */

import GeneralContactForm from "@/components/forms/GeneralContactForm";
import PageHero from "@/components/sections/PageHero";
import GlobalOfficesSection from "@/components/sections/GlobalOfficesSection";
import withLayout from "@/hooks/useLayout";

const ContactPage = () => {
  return (
    <>
      <PageHero
        tagline="Get in Touch"
        captionTextOne="We'd Love to "
        highlightText="Hear from You"
        description="Whether you're exploring our programmes, looking to partner with us, need support with a product, or want to discuss institutional consulting — our team is here and ready to help."
        pageType="contact"
        imageUrl="/images/customer-care-support.jpg"
      />

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
        <div className="py-16 w-full relative max-w-2xl ms-auto">
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

      {/* Global Offices — sourced from getGlobalOffices() */}
      <GlobalOfficesSection />
    </>
  );
};

export default withLayout(ContactPage);
