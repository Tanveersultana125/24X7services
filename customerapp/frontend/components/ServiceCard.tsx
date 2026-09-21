'use client'

import { useSyncExternalStore } from 'react'
import Image from 'next/image'
import type { CatalogService } from '@app/shared'
import { formatPaise } from '@/lib/format'
import { CardButton } from '@/components/ui/Card'
import { durationNote } from '@/components/ServiceRail'
import { cn } from '@/lib/cn'

/**
 * A service on the appliance page: what it is, what the visit costs, how long
 * it takes, and a button that starts the booking.
 *
 * A service that has been seeded a clip shows it across the top of the card.
 * Muted, looping and inline, because that is the only shape a browser will
 * play unasked — and not played at all for a customer who has asked their
 * system for less motion, who gets the appliance drawing as a still instead.
 * Most services will never have one; the card is written to look right either
 * way and the clip is never the thing carrying the meaning.
 *
 * The price is stated as a fact rather than a range, because the visit fee is
 * the only number the customer is committing to at this point — anything
 * beyond it needs their approval first, and the card says so in as many words.
 *
 * The "Book" pill is drawn as a button but is not one. The whole card is the
 * control, and a real button inside it would be a second target nested in the
 * first: two things to tab to, one of which a screen reader cannot describe
 * without repeating the other. Drawn this way, the affordance is where a
 * customer expects it and there is still only one thing to press.
 */

export interface ServiceCardProps {
  service: CatalogService
  /**
   * The appliance illustration. There is no photograph per service — a picture
   * of "repair" would be a stock image of a spanner — so all the services for
   * one appliance carry that appliance's drawing, the way the tile did.
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
      className={cn('group overflow-hidden', className)}
    >
      {service.video ? (
        <video
          // The drawing stands in before a frame has decoded, and stands in
          // for good on a connection that never gets one.
          poster={image}
          src={reducedMotion ? undefined : service.video}
          autoPlay={!reducedMotion}
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          className="aspect-video w-full bg-surface object-cover"
        />
      ) : null}

      <div className="flex gap-4 p-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-ink">{service.name}</h3>

          {/* Price, then the two facts a customer weighs it against. */}
          <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xs text-muted">
            <span className="text-base font-bold text-ink">
              {formatPaise(service.visitFee)}
            </span>
            <span>visit fee</span>
            {duration ? (
              <>
                <Dot />
                <span>{duration}</span>
              </>
            ) : null}
            {service.warrantyDays ? (
              <>
                <Dot />
                <span>{service.warrantyDays}-day warranty</span>
              </>
            ) : null}
          </p>

          <p className="mt-2 text-sm leading-relaxed text-muted">
            {service.description}
          </p>

          <p className="mt-2 text-xs leading-relaxed text-muted">
            {service.startingPrice > service.visitFee
              ? `Repairs usually start at ${formatPaise(service.startingPrice)}, quoted on site and begun only after you approve.`
              : 'Any repair beyond this is quoted on site and starts only after you approve it.'}
          </p>
        </div>

        <div className="flex w-20 shrink-0 flex-col gap-2 sm:w-24">
          {image ? (
            <span className="relative block aspect-square overflow-hidden rounded-card bg-surface">
              <Image
                src={image}
                alt=""
                fill
                sizes="96px"
                className="object-contain p-2"
              />
            </span>
          ) : null}
          <span
            className={cn(
              'inline-flex h-9 items-center justify-center rounded-pill px-3',
              'text-sm font-semibold transition-colors duration-[var(--duration-fast)]',
              'border border-brand text-brand',
              'group-hover:bg-brand group-hover:text-bg'
            )}
            aria-hidden="true"
          >
            Book
          </span>
        </div>
      </div>
    </CardButton>
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

/** The separator between two facts on one line. */
function Dot() {
  return (
    <span aria-hidden="true" className="text-border">
      ·
    </span>
  )
}
