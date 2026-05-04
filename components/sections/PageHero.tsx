import Image from "next/image"

type PageHeroProps = {
  /** Small uppercase kicker shown above the headline. e.g. "Get in Touch" */
  tagline:        string
  /** Headline text rendered before the highlighted phrase. */
  captionTextOne: string
  /** Phrase to italicise/highlight inside the headline. */
  highlightText:  string
  /** Optional headline text rendered after the highlighted phrase. */
  captionTextTwo?: string
  /** Supporting paragraph beneath the headline. */
  description:    string
  /** Used as the image alt text and for screen-reader context. e.g. "Contact" */
  pageType:       string
  /** Path to the right-side hero image. */
  imageUrl:       string
}

export default function PageHero({
  tagline,
  captionTextOne,
  highlightText,
  captionTextTwo = "",
  description,
  pageType,
  imageUrl,
}: PageHeroProps) {
  return (
    <section className="bg-[#071639] relative w-full py-24 grid lg:grid-cols-2 gap-16 items-center">
      <div className="absolute inset-0 bg-grid-ink pointer-events-none" />
      <div className="absolute -top-24 right-0 w-125 h-125 rounded-full bg-[#0474C4]/8 blur-[100px] pointer-events-none" />

      {/* Left — copy */}
      <div className={`relative z-10 gap-4 flex flex-col justify-start items-start mx-auto ${pageType === "programs" || pageType === "research" ||  pageType === "solutions" ? "max-w-200": "max-w-lg"}`}>
        <p className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#EBF3FC] inline-flex items-center gap-2">
          <span className="block w-8 h-px bg-[#EBF3FC]" />
          {tagline}
        </p>

        <h1 className="font-heading text-[2.25rem] md:text-[3rem] tracking-[-0.015em] md:tracking-[-0.02em] leading-[1.2] md:leading-[1.1] font-bold text-white max-w-lg">
          {captionTextOne}
          <em className="italic text-[#0474C4]">{highlightText}</em>
          {" "}{captionTextTwo}
        </h1>

        <p className="font-body text-[1.125rem] tracking-[-0.01em] leading-[1.65] font-light text-[#EBF3FC] max-w-lg">
          {description}
        </p>
        {pageType === "solutions" && (
          <div className="flex gap-3.5 mt-8 flex-wrap">
      <a href="#resolverite" className="flex items-center gap-2.5 border border-[rgba(200,169,110,0.2)] rounded-[40px] px-5 py-2.5 no-underline transition-all duration-250 bg-[rgba(247,243,237,0.04)] hover:border-[#C8A96E] hover:bg-[rgba(200,169,110,0.08)]">
        <span className="w-2 h-2 rounded-full shrink-0 bg-[#2563EB]" />
        <div>
          <span className="font-heading text-[0.95rem] text-[#EBF3FC] font-normal">ResolveRite</span>
          <div className="text-[0.68rem] text-[#EBF3FC] tracking-[0.08em] uppercase">Dispute &amp; Case Management</div>
        </div>
      </a>
      <a href="#mentortrack" className="flex items-center gap-2.5 border border-[rgba(200,169,110,0.2)] rounded-[40px] px-5 py-2.5 no-underline transition-all duration-250 bg-[rgba(247,243,237,0.04)] hover:border-[#C8A96E] hover:bg-[rgba(200,169,110,0.08)]">
        <span className="w-2 h-2 rounded-full shrink-0 bg-[#0D9488]" />
        <div>
          <span className="font-heading text-[0.95rem] text-[#EBF3FC] font-normal">MentorTrack</span>
          <div className="text-[0.68rem] text-[#EBF3FC] tracking-[0.08em] uppercase">Mentorship &amp; Learning Platform</div>
        </div>
      </a>
    </div>
        )}

        {pageType === "research" && (
<div className="flex gap-8 flex-wrap mt-8 border-t border-[#0474C4]/15">
            {[
              { value: "500+", label: "Researchers Trained" },
              { value: "30+", label: "Training Modules" },
              { value: "92%", label: "Completion Rate" },
              { value: "120+", label: "Countries Reached" },
            ].map((s) => (
              <div key={s.label} className="flex flex-col gap-2">
                <span className="font-heading text-[1.75rem] tracking-[-0.01em] leading-[1.1] font-semibold text-[#0474C4] block">
                  {s.value}
                </span>
                <span className="font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium text-[#EBF3FC]">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        )}
        {pageType === "programs" && (
<div className="flex gap-8 flex-wrap mt-8 border-t border-[#0474C4]/15">
            {[
              { value: "40+",  label: "Certificate Programs" },
              { value: "1–4",  label: "Months Duration" },
              { value: "100%", label: "Online & Flexible" },
              { value: "120+", label: "Countries Served" },
            ].map((s) => (
              <div key={s.label} className="flex flex-col gap-2">
                <span className="font-heading text-[1.75rem] tracking-[-0.01em] leading-[1.1] font-semibold text-[#0474C4] block">
                  {s.value}
                </span>
                <span className="font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium text-[#EBF3FC]">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right — image that fades into the background colour, full-bleed */}
      <div className="relative z-10 hidden lg:block w-full self-stretch lg:-my-24">
        <Image
          src={imageUrl}
          alt={`${pageType} page hero`}
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-r from-[#071639] via-[#071639]/55 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-linear-to-t from-[#071639]/80 via-transparent to-transparent pointer-events-none" />
      </div>
    </section>
  )
}
