import Image from 'next/image'
import { ShieldCheck, Star, Wrench, type LucideIcon } from 'lucide-react'
import { BrandDisclaimer } from '@/components/BrandCard'

/**
 * Who comes to the door, and what they can open up.
 *
 * Two closing sections for the Services page: the technician as a person
 * (a cut-out photo beside three plain facts), then every brand they work on.
 * The facts are only ones the business already stands behind elsewhere in the
 * app — verification, brand training, and the rating the customer leaves.
 */

const FACTS: { icon: LucideIcon; label: string }[] = [
  { icon: ShieldCheck, label: 'Background verified' },
  { icon: Wrench, label: 'Trained across all major brands' },
  { icon: Star, label: 'Rated by customers after every job' },
]

/** The photo is cut out, so it stands on the card in either theme. */
const TECHNICIAN_PHOTO = '/photos/technician/top-technician.webp'

export function TopTechnicians() {
  return (
    <div className="relative flex min-h-56 overflow-hidden rounded-card border border-border bg-bg">
      <ul className="relative z-10 flex w-[60%] flex-col justify-center gap-4 py-5 pl-4">
        {FACTS.map((fact) => (
          <li key={fact.label} className="flex items-start gap-3">
            <fact.icon
              className="mt-0.5 size-5 shrink-0 text-ink"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <span className="text-[15px] leading-snug text-ink">
              {fact.label}
            </span>
          </li>
        ))}
      </ul>
      <div className="absolute inset-y-0 right-0 w-[44%] pt-3">
        <span className="relative block h-full w-full">
          <Image
            src={TECHNICIAN_PHOTO}
            alt="A 24X7 technician"
            fill
            sizes="200px"
            className="object-contain object-bottom"
          />
        </span>
      </div>
    </div>
  )
}

/**
 * Every brand a technician works on — wider than the catalog's own brand list,
 * which only names the brands a booking can be tagged with.
 */
const ALL_BRANDS: { name: string; logo: string }[] = [
  { name: 'Samsung', logo: '/brands/samsung.svg' },
  { name: 'LG', logo: '/brands/lg.svg' },
  { name: 'Whirlpool', logo: '/brands/whirlpool.svg' },
  { name: 'Haier', logo: '/brands/haier.svg' },
  { name: 'Bosch', logo: '/brands/bosch.svg' },
  { name: 'Electrolux', logo: '/brands/electrolux.svg' },
  { name: 'Panasonic', logo: '/brands/panasonic.svg' },
  { name: 'Godrej', logo: '/brands/godrej.svg' },
  { name: 'Voltas', logo: '/brands/voltas.svg' },
  { name: 'Blue Star', logo: '/brands/bluestar.png' },
  { name: 'IFB', logo: '/brands/ifb.png' },
]

export function AllBrandsGrid() {
  return (
    <>
      <ul className="grid grid-cols-3 gap-2.5 lg:grid-cols-6">
        {ALL_BRANDS.map((brand) => (
          <li
            key={brand.name}
            className="flex h-16 items-center justify-center rounded-card bg-logo px-4 ring-1 ring-border"
          >
            <span className="relative block h-7 w-full">
              <Image
                src={brand.logo}
                alt={brand.name}
                fill
                sizes="120px"
                className="object-contain"
              />
            </span>
          </li>
        ))}
        <li className="flex h-16 items-center justify-center rounded-card bg-logo px-4 ring-1 ring-border">
          <span className="text-[15px] font-semibold text-night">&amp; more</span>
        </li>
      </ul>
      <BrandDisclaimer className="mt-3" />
    </>
  )
}
