"use client"

import * as React from "react"
import Image from "next/image"

type Organization = {
  id:          string
  name:        string
  logo:        string
  url:         string | null
  description: string | null
}

type OrganizationsStripProps = {
  /** Heading shown above the logo grid. Defaults to "Our Solutions". */
  heading?: string
}

export default function OrganizationsStrip({ heading = "Our Solutions" }: OrganizationsStripProps) {
  const [orgs, setOrgs]   = React.useState<Organization[]>([])
  const [loaded, setLoaded] = React.useState(false)

  React.useEffect(() => {
    fetch("/api/organizations/public")
      .then(r => r.ok ? r.json() : { organizations: [] })
      .then(data => setOrgs(data?.organizations ?? []))
      .catch(() => setOrgs([]))
      .finally(() => setLoaded(true))
  }, [])

  if (loaded && orgs.length === 0) return null

  return (
    <section className="bg-white py-16 md:py-20 px-8 md:px-16">
      <div className="max-w-6xl mx-auto">
        <p className="text-center font-body text-[0.75rem] tracking-widest uppercase font-medium text-[#637AA3] mb-10">
          {heading}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-12 gap-y-10 items-center justify-items-center">
          {orgs.map(org => {
            const inner = (
              <div className="relative w-32 h-12 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                <Image
                  src={org.logo}
                  alt={org.name}
                  fill
                  className="object-contain"
                  sizes="160px"
                />
              </div>
            )
            return org.url
              ? <a key={org.id} href={org.url} target="_blank" rel="noreferrer" aria-label={org.name}>{inner}</a>
              : <div key={org.id} aria-label={org.name}>{inner}</div>
          })}
        </div>
      </div>
    </section>
  )
}
