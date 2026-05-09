import { getGlobalOffices, type OfficeRegion } from "@/services/global-office.service"

const REGION_LABELS: Record<OfficeRegion, string> = {
  AFRICA:      "Africa",
  AMERICAS:    "Americas",
  ASIA:        "Asia",
  EUROPE:      "Europe",
  OCEANIA:     "Oceania",
  MIDDLE_EAST: "Middle East",
}

export default async function GlobalOfficesSection() {
  const offices = await getGlobalOffices({ activeOnly: true })

  return (
    <section className="px-4 sm:px-6 md:px-10 lg:px-16 py-10 md:py-14 lg:py-16 bg-[#EDF2FB] w-full">
      <div className="max-w-350 flex flex-col gap-5 mx-auto">
        <p className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#637AA3]">
          Our Presence
        </p>
        <h2 className="font-heading text-[1.5rem] sm:text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-[#0474C4]">
          Global Offices &amp; Operations
        </h2>

        {offices.length === 0 ? (
          <p className="font-body text-[0.875rem] text-[#637AA3] italic">
            Office locations coming soon.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {offices.map(o => {
              const addrLines = [o.addressLine1, o.addressLine2, [o.postalCode, o.city, o.country].filter(Boolean).join(", ")]
                .filter(Boolean)
                .join("\n")

              return (
                <div key={o.id} className="border bg-white/90 border-[#0474C4]/25 rounded p-5 sm:p-6">
                  <div className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#637AA3] mb-2">
                    {REGION_LABELS[o.region]}
                  </div>

                  <div className="font-heading text-[1.25rem] sm:text-[1.375rem] tracking-[-0.005em] leading-[1.3] font-medium text-[#0474C4] mb-3">
                    {o.city}, {o.country}
                  </div>

                  <div className="font-body text-[0.875rem] tracking-[0em] leading-[1.6] font-normal text-black whitespace-pre-line mb-2">
                    {addrLines}
                  </div>

                  {o.phone && (
                    <div className="font-body text-[0.75rem] tracking-[0em] leading-normal font-normal text-[#637AA3]">
                      {o.phone}
                    </div>
                  )}
                  {o.email && (
                    <a href={`mailto:${o.email}`} className="font-body text-[0.75rem] tracking-[0em] leading-normal font-normal text-[#0474C4] hover:underline block mt-1 break-all">
                      {o.email}
                    </a>
                  )}
                  {o.mapUrl && (
                    <a href={o.mapUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 mt-3 font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium text-[#0474C4] hover:text-[#06457F]">
                      View on map
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg>
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
