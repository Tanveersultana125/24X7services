import Image from 'next/image'
import { cn } from '@/lib/cn'

/**
 * The card that opens a group on an appliance page — "Annual plan", "Service"
 * — the way the marketplaces open theirs: a tab of a badge at the top left,
 * the headline and a line or two under it, and a photograph of the work on
 * the right.
 *
 * Two columns rather than words over a full-bleed photograph, for the reason
 * `ApplianceHero` gives: no crop can put a face under the headline. `plate`
 * and `night` because the photograph is a light room in either theme.
 *
 * Not a link. The row under it is the thing to press; this says why to.
 */
export function OfferBanner({
  badge,
  title,
  body,
  photo,
  className,
}: {
  badge?: string
  title: string
  /** Lines under the headline — a price, a note. */
  body?: React.ReactNode
  photo: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'relative flex min-h-44 overflow-hidden rounded-card bg-plate',
        className
      )}
    >
      <div className="absolute inset-y-0 right-0 w-[46%]">
        <Image
          src={photo}
          alt=""
          fill
          sizes="(min-width: 1024px) 300px, 46vw"
          className="object-cover object-[60%_center]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-1/4 bg-linear-to-r from-plate to-transparent"
        />
      </div>

      <div className="relative flex w-[58%] min-w-0 flex-col px-5 pb-5">
        {badge ? (
          <span className="w-fit rounded-b-md bg-success px-3 py-1.5 text-xs font-semibold text-white">
            {badge}
          </span>
        ) : null}
        <p
          className={cn(
            'text-2xl font-bold leading-tight text-night',
            badge ? 'mt-4' : 'mt-5'
          )}
        >
          {title}
        </p>
        {body ? (
          <div className="mt-2 text-sm leading-relaxed text-night/70">
            {body}
          </div>
        ) : null}
      </div>
    </div>
  )
}
