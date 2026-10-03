import Image from 'next/image'
import { BadgeCheck, Star } from 'lucide-react'
import { formatPaise } from '@/lib/format'
import { countNote } from '@/components/ServiceScore'
import { brand } from '@/config/brand'

/**
 * The top of the Services screen: what this place is, in one look.
 *
 * A brand-blue card with a technician at work, a line that says what we do,
 * and three facts taken from the catalog itself — how many appliances, the
 * lowest visit fee, the rating across every review. Nothing on it is typed in
 * by hand, so it cannot say something the catalog does not; while the catalog
 * is loading the facts are simply left off rather than guessed.
 */
export function ServicesHero({
  applianceCount,
  fromPaise,
  rating,
}: {
  applianceCount?: number
  fromPaise?: number
  rating?: { average: number; count: number }
}) {
  const facts = [
    applianceCount ? { value: String(applianceCount), label: 'appliances' } : null,
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
      className="relative mt-4 overflow-hidden rounded-card bg-brand-deep text-white"
    >
      {/* The technician sits on the right, faded into the blue so the words
          on the left always have a plain ground to sit on. */}
      <div className="absolute inset-y-0 right-0 w-[52%]" aria-hidden="true">
        <Image
          src="/photos/technician/ac-service.jpg"
          alt=""
          fill
          sizes="(min-width: 1024px) 400px, 48vw"
          className="object-cover object-top"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-r from-brand-deep via-brand-deep/50 to-transparent" />
      </div>

      <div className="relative w-[62%] px-5 pb-5 pt-5">
        <span className="inline-flex items-center gap-1 rounded-pill bg-white/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide">
          <BadgeCheck className="size-3.5" aria-hidden="true" />
          Verified technicians
        </span>
        <h2 className="mt-3 text-xl font-extrabold leading-tight">
          {brand.tagline}
        </h2>
        <p className="mt-1.5 text-sm text-white/80">
          Repair, service and installation. You approve the price before any
          work starts.
        </p>
      </div>

      {facts.length > 0 ? (
        <dl className="relative flex divide-x divide-white/15 border-t border-white/15 bg-night/20">
          {facts.map((fact) => (
            <div key={fact.label} className="flex-1 px-3 py-2.5 text-center">
              <dt className="sr-only">{fact.label}</dt>
              <dd className="flex items-center justify-center gap-1 text-base font-bold">
                {'star' in fact ? (
                  <Star className="size-3.5 fill-white" aria-hidden="true" />
                ) : null}
                {fact.value}
              </dd>
              <dd className="text-[11px] text-white/75">{fact.label}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  )
}
