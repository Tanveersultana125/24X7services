import Image from 'next/image'
import { BadgeCheck, Star } from 'lucide-react'
import { formatPaise } from '@/lib/format'
import { countNote } from '@/components/ServiceScore'
import { brand } from '@/config/brand'

/**
 * The top of the Services screen: what this place is, in one look.
 *
 * A brand-blue card with a line that says what we do, the appliances we
 * service as a row of product tiles, and three facts taken from the catalog
 * itself — how many appliances, the lowest visit fee, the rating across every
 * review. Nothing on it is typed in by hand, so it cannot say something the
 * catalog does not; while the catalog is loading the tiles and the facts are
 * simply left off rather than guessed.
 */
export function ServicesHero({
  appliances = [],
  fromPaise,
  rating,
}: {
  /** In catalog order. */
  appliances?: readonly { id: string; name: string }[]
  fromPaise?: number
  rating?: { average: number; count: number }
}) {
  const facts = [
    appliances.length > 0 ? { value: String(appliances.length), label: 'appliances' } : null,
    fromPaise !== undefined ? { value: formatPaise(fromPaise), label: 'visit from' } : null,
    rating
      ? {
          value: rating.average.toFixed(1),
          label: `${countNote(rating.count)} reviews`,
          star: true,
        }
      : null,
  ].filter((fact) => fact !== null)

  return (
    <section
      aria-label="24X7 services"
      className="relative mt-5 overflow-hidden rounded-card bg-brand-deep text-white shadow-raised"
    >
      {/* Two soft rings in the corner, so the blue is not a flat slab. */}
      <span
        aria-hidden="true"
        className="absolute -right-10 -top-12 size-44 rounded-full bg-white/[0.06]"
      />
      <span
        aria-hidden="true"
        className="absolute -right-4 top-10 size-24 rounded-full bg-white/[0.05]"
      />

      <div className="relative px-4 pb-4 pt-4">
        <span className="inline-flex items-center gap-1 rounded-pill bg-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
          <BadgeCheck className="size-3" aria-hidden="true" />
          Verified technicians
        </span>
        <h2 className="mt-2.5 max-w-[15rem] text-lg font-extrabold leading-snug">
          {brand.tagline}
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-white/80">
          You approve the price before any work starts.
        </p>

        {appliances.length > 0 ? (
          <ul aria-label="Appliances we service" className="mt-3.5 flex gap-2">
            {appliances.map((appliance) => (
              <li
                key={appliance.id}
                title={appliance.name}
                className="relative size-11 shrink-0 overflow-hidden rounded-xl bg-white shadow-raised"
              >
                <Image
                  src={applianceIcon(appliance.id)}
                  alt={appliance.name}
                  fill
                  sizes="44px"
                  className="object-contain p-0.5"
                />
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {facts.length > 0 ? (
        <dl className="relative flex divide-x divide-white/15 border-t border-white/15 bg-night/20">
          {facts.map((fact) => (
            <div key={fact.label} className="flex-1 px-2 py-2 text-center">
              <dt className="sr-only">{fact.label}</dt>
              <dd className="flex items-center justify-center gap-1 text-sm font-bold">
                {'star' in fact ? (
                  <Star className="size-3 fill-white" aria-hidden="true" />
                ) : null}
                {fact.value}
              </dd>
              <dd className="text-[10px] text-white/75">{fact.label}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  )
}

/**
 * The drawn icon for an appliance (`public/appliances/<id>.svg`), not its
 * product photo: on a row of small tiles the photos, each shot on its own
 * background, read as five different things; the icons read as one set.
 */
function applianceIcon(id: string): string {
  return `/appliances/${id}.svg`
}
