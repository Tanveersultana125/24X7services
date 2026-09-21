'use client'

import { useSyncExternalStore } from 'react'
import Image from 'next/image'
import type { CatalogService } from '@app/shared'
import { formatPaise } from '@/lib/format'
import { CardButton } from '@/components/ui/Card'
import { durationNote } from '@/components/ServiceRail'
import { cn } from '@/lib/cn'

/**
 * A service on the appliance page: what it looks like, what it is, what the
 * visit costs, and how long it takes.
 *
 * Laid out the way the marketplaces lay this one out, because it is the screen
 * a customer compares two services on and the comparison has a shape: a wide
 * picture, the name large enough to read at a glance, the money and the time
 * on one line under it, then the detail below a rule for anyone still
 * deciding. It used to be a bordered box with the name at body size and the
 * picture shrunk into the corner beside a button, which read as a row in a
 * list rather than as a thing you choose.
 *
 * A service that has been seeded a clip shows it in place of the picture.
 * Muted, looping and inline, because that is the only shape a browser will
 * play unasked — and not played at all for a customer who has asked their
 * system for less motion, who gets the still instead. Most services will never
 * have one; the card is written to look right either way and the clip is never
 * the thing carrying the meaning.
 *
 * The "Book" pill is drawn as a button but is not one. The whole card is the
 * control, and a real button inside it would be a second target nested in the
 * first: two things to tab to, one of which a screen reader cannot describe
 * without repeating the other. Drawn this way, the affordance is where a
 * customer expects it and there is still only one thing to press — including
 * the pill itself, which is inside the thing it appears to be.
 */

export interface ServiceCardProps {
  service: CatalogService
  /**
   * The appliance illustration. There is no photograph per service — a picture
   * of "repair" would be a stock image of a spanner — so all the services for
   * one appliance carry that appliance's drawing, and it is also the poster a
   * clip shows before its first frame decodes.
   */
  image?: string
  onSelect: (service: CatalogService) => void
  selected?: boolean
  className?: string
}

export function ServiceCard({
  service,
  image,
  onSelect,
  selected = false,
  className,
}: ServiceCardProps) {
  const duration = durationNote(service.durationMinutes)
  const reducedMotion = usePrefersReducedMotion()

  return (
    <CardButton
      onClick={() => onSelect(service)}
      selected={selected}
      ariaLabel={`Book ${service.name}, visit fee ${formatPaise(service.visitFee)}`}
      // Not a box. The page puts a rule between services, which is enough of a
      // boundary once each one is this tall — a border as well would be two
      // lines doing one job.
      className={cn(
        'w-full rounded-none border-0 bg-transparent p-0 text-left',
        'hover:border-transparent',
        selected && 'ring-0',
        className
      )}
    >
      {service.video && !reducedMotion ? (
        <video
          // The drawing stands in before a frame has decoded, and stands in
          // for good on a connection that never gets one.
          poster={image}
          src={service.video}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          className="aspect-video w-full rounded-card bg-surface object-cover"
        />
      ) : image ? (
        <span className="relative block aspect-video w-full overflow-hidden rounded-card bg-surface">
          <Image
            src={image}
            alt=""
            fill
            sizes="(min-width: 640px) 512px, 100vw"
            className="object-contain p-6"
          />
        </span>
      ) : null}

      <div className="mt-4 flex items-start gap-4">
        <h3 className="min-w-0 flex-1 text-xl font-bold leading-snug text-ink">
          {service.name}
        </h3>
        <span
          className={cn(
            'inline-flex h-11 shrink-0 items-center justify-center rounded-card px-6',
            'text-sm font-bold transition-colors duration-[var(--duration-fast)]',
            'border border-brand text-brand',
            'group-hover:bg-brand group-hover:text-bg'
          )}
          aria-hidden="true"
        >
          Book
        </span>
      </div>

      {/* The two numbers a customer weighs, on one line, in the order they
          weigh them. The fee is the only figure being committed to here, which
          is why it is stated flat and not as a range. */}
      <p className="mt-1.5 text-sm text-ink">
        <span className="font-bold">{formatPaise(service.visitFee)}</span>{' '}
        <span className="text-muted">visit fee</span>
        {duration ? (
          <>
            <span className="text-border"> · </span>
            <span className="text-muted">{duration}</span>
          </>
        ) : null}
        {service.warrantyDays ? (
          <>
            <span className="text-border"> · </span>
            <span className="text-muted">
              {service.warrantyDays}-day warranty
            </span>
          </>
        ) : null}
      </p>

      <ul className="mt-3 flex flex-col gap-1.5 border-t border-dashed border-border pt-3">
        <Point>{service.description}</Point>
        <Point>
          {service.startingPrice > service.visitFee
            ? `Repairs usually start at ${formatPaise(service.startingPrice)}, quoted on site and begun only after you approve.`
            : 'Any repair beyond this is quoted on site and starts only after you approve it.'}
        </Point>
      </ul>
    </CardButton>
  )
}

/** One line of what the service covers. */
function Point({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span
        aria-hidden="true"
        className="mt-[0.45rem] size-1 shrink-0 rounded-full bg-muted"
      />
      <span className="text-sm leading-relaxed text-muted">{children}</span>
    </li>
  )
}

/**
 * Whether the customer has asked their system for less movement.
 *
 * An external store rather than state in an effect, the same shape auth and
 * location use here: the media query already lives outside React and already
 * pushes changes, so subscribing to it is the whole job. It is also a setting
 * someone can change while the app is open, and the server snapshot has to be
 * a definite value — false, so the prerender matches the common case and only
 * a customer who asked for less motion sees anything swap.
 */
const MOTION_QUERY = '(prefers-reduced-motion: reduce)'

function subscribeReducedMotion(onChange: () => void): () => void {
  const query = window.matchMedia(MOTION_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(MOTION_QUERY).matches,
    () => false
  )
}
