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

      <section className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] max-w-360 mx-auto w-full px-4 sm:px-6 md:px-8 lg:px-8 gap-y-6 md:gap-y-4 lg:gap-x-10">
        <div className="pt-8 pb-2 md:pt-12 md:pb-4 lg:py-16 flex flex-col justify-start gap-4 w-full max-w-none md:max-w-xl lg:max-w-md">
          <h2 className="font-heading text-[1.375rem] sm:text-[1.5rem] md:text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-[#0474C4]">
            Get in touch
          </h2>

          <div className="flex flex-col gap-2">
            <p className="font-body text-[0.9375rem] sm:text-[1rem] tracking-[-0.005em] leading-[1.7] font-normal text-[#262b40]">
              Got a question about artful counselling that isn't in our FAQ? Or
              have a specific question? Simply complete this form .
            </p>
          </div>

          <div className="flex flex-col justify-start items-start w-full gap-3 md:gap-4 mt-2 md:mt-4">
            <h4 className="font-heading text-[1.125rem] sm:text-[1.25rem] md:text-[1.375rem] tracking-[-0.005em] leading-[1.3] font-semibold text-ink text-[#0474C4]">
              Contact details
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 sm:gap-6 lg:gap-4 w-full">
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#637AA3]">
                  Email
                </span>
                <span className="font-body text-[0.9375rem] sm:text-[1rem] tracking-[-0.005em] leading-[1.7] font-normal text-[#262b40] break-all">
                  press-media@arpsinstitute.org
                </span>
              </div>

              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#637AA3]">
                  Phone
                </span>
                <span className="font-body text-[0.9375rem] sm:text-[1rem] tracking-[-0.005em] leading-[1.7] font-normal text-[#262b40]">
                  8:00 AM – 4:00 PM UTC
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="pb-10 md:pb-12 md:pt-4 lg:py-16 w-full relative lg:max-w-2xl lg:ms-auto">
          <div className="bg-[#F9F9FB] rounded flex flex-col justify-start gap-5 sm:gap-6 md:gap-8 items-start p-4 sm:p-6 md:p-8 lg:p-10 w-full relative z-10">
            <div className="block space-y-3 sm:space-y-4">
              <h2 className="font-heading text-[1.375rem] sm:text-[1.5rem] md:text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-[#0474C4]">
                How Can We Help?
              </h2>

              <p className="font-body text-[0.9375rem] sm:text-[1rem] tracking-[-0.005em] leading-[1.7] font-normal text-[#262b40]">
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
