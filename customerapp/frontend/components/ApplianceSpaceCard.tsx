import Image from 'next/image'
import Link from 'next/link'
import type { Route } from 'next'
import { Star } from 'lucide-react'
import type { CatalogAppliance } from '@app/shared'

/**
 * An appliance as a tall photograph with its name across the foot — the card
 * on the Services rail. The picture does the selling and the words sit on a
 * dark wash at the bottom, so the white type reads on any photo.
 *
 * The photo is the appliance's hero shot (a technician at work on it) and
 * falls back to the product tile, contained on a plate, for an appliance
 * nobody has photographed yet.
 */
export function ApplianceSpaceCard({
  appliance,
  serviceCount,
  from,
  rating,
  priority = false,
}: {
  appliance: Pick<CatalogAppliance, 'id' | 'name' | 'image' | 'heroImage'>
  serviceCount: number
  /** The lowest visit fee, already formatted. */
  from?: string
  rating?: number
  priority?: boolean
}) {
  const photo = appliance.heroImage
  return (
    <Link
      // The trailing slash: the static export serves the folder's index.html.
      href={`/services/appliance/?a=${appliance.id}` as Route}
      className="group relative block aspect-[3/4] overflow-hidden rounded-card bg-plate"
    >
      <Image
        src={photo ?? appliance.image}
        alt=""
        fill
        priority={priority}
        sizes="(min-width: 1024px) 220px, 46vw"
        className={
          photo
            ? 'object-cover transition-transform duration-[var(--duration-slow)] group-hover:scale-[1.03]'
            : 'object-contain p-6 mix-blend-multiply'
        }
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-night/85 via-night/40 to-transparent"
      />
      <div className="absolute inset-x-0 bottom-0 p-3.5">
        <p className="text-lg font-bold leading-tight text-white">
          {appliance.name}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-white/85">
          {rating !== undefined ? (
            <>
              <Star className="size-3 fill-white text-white" aria-hidden="true" />
              <span className="font-semibold text-white">{rating.toFixed(1)}</span>
              <span aria-hidden="true">·</span>
            </>
          ) : null}
          <span>
            {serviceCount} {serviceCount === 1 ? 'service' : 'services'}
            {from ? ` · from ${from}` : ''}
          </span>
        </p>
      </div>
    </Link>
  )
}
