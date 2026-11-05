"use client"

import { SearchableSelect } from "@/components/ui/SearchableSelect"
import { COUNTRIES, flagOf, countryForDialCode } from "@/lib/countries"

/**
 * Country dialling-code picker, searchable by country name, ISO code or dial
 * code.
 *
 * Options are keyed by country rather than by code, because several countries
 * share one (+1 covers the US, Canada and most of the Caribbean) and a list
 * keyed by code would hide all but the first. The form still receives only
 * the dial code, which is all a phone number needs.
 *
 * Ported from the resolve-rite console's PhoneCodeSelect. The one behavioural
 * change: the country list is static here rather than fetched from a
 * third-party API, so the picker works offline and cannot be reduced to seven
 * countries by someone else's outage.
 */
export function PhoneCodeSelect({
  value,
  onChange,
  disabled,
  defaultIso = "NG",
}: {
  /** Selected dialling code, e.g. "+234". */
  value: string
  onChange: (dialCode: string) => void
  disabled?: boolean
  /** Which country to show when the code maps to several. */
  defaultIso?: string
}) {
  const iso2 = countryForDialCode(value, defaultIso)

  return (
    <div className="h-full shrink-0">
      <SearchableSelect
        className="h-full"
        label="Country dialling code"
        searchPlaceholder="Search country or code"
        disabled={disabled}
        value={iso2}
        onChange={nextIso => {
          const dialCode = COUNTRIES.find(c => c.iso2 === nextIso)?.dialCode
          if (dialCode) onChange(dialCode)
        }}
        options={COUNTRIES.map(country => ({
          value:    country.iso2,
          label:    country.name,
          leading:  flagOf(country.iso2),
          trailing: country.dialCode,
          keywords: country.iso2,
        }))}
        renderValue={() => (
          <span className="whitespace-nowrap text-[14px] font-medium text-[#171C35]">
            {flagOf(iso2)} {value}
          </span>
        )}
        triggerClassName="flex h-full items-center gap-1 rounded-l-[10px] border border-r-0 border-[#DFE2ED] bg-[#FAFAFF] px-3 text-[14px] text-[#171C35] outline-none transition-colors hover:bg-[#F0EFFA] focus-visible:bg-[#F0EFFA] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      />
    </div>
  )
}

export default PhoneCodeSelect
