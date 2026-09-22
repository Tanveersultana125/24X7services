'use client'

import { useEffect, useRef, useSyncExternalStore } from 'react'
import Image from 'next/image'
import { Star } from 'lucide-react'
import type { CatalogService } from '@app/shared'
import { formatPaise } from '@/lib/format'
import { CardButton } from '@/components/ui/Card'
import { durationNote } from '@/components/ServiceRail'
import { cn } from '@/lib/cn'

/**
 * A service on the appliance page: what it looks like, what it is, what people
 * scored it, what the visit costs, and how long it takes.
 *
 * Laid out the way the marketplaces lay this one out, because it is the screen
 * a customer compares two services on and the comparison has a shape: a wide
 * clip, the name large enough to read at a glance, the score under it, the
 * money and the time on the line below, then the detail under a rule for
 * anyone still deciding, and the way in at the foot. It used to be a bordered
 * box with the name at body size and the picture shrunk into the corner beside
 * a button, which read as a row in a list rather than as a thing you choose.
 *
 * Every card plays its own clip, and each one starts only once it is on
 * screen and stops again when it leaves — so a page of six is at most the two
 * or three a phone is actually showing, not six decoders and six downloads
 * opened at once for cards nobody scrolled to. A customer who has asked their
 * system for less motion gets the still instead, and the clip is never the
 * thing carrying the meaning either way.
 *
 * The still, when one is shown, is a frame *of that service's own clip*, not
 * the appliance drawing. The drawing is shared by every service on the
 * appliance, so putting it on six cards turns a list of services into a list
 * of the same thing. The drawing stays as the last fallback, for a service
 * nobody has drawn a clip for.
 *
 * "View details" sits at the foot, where the marketplaces put it, and it is
 * the only affordance on the card — the pill that used to sit beside the title
 * opened the same page, and two controls for one action is one of them
 * lying about being a choice.
 *
 * It is drawn as a link but is not one. The whole card is the control, and a
 * real link inside it would be a second target nested in the first: two things
 * to tab to, one of which a screen reader cannot describe without repeating
 * the other. Drawn this way, the affordance is where a customer expects it and
 * there is still only one thing to press.
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
  /**
   * Whether this card may play its clip at all. On by default; a screen that
   * wants a page of stills — a dense list, a print view — turns it off. It is
   * not a licence to play immediately: playback still waits for the card to be
   * on screen. See the note above.
   */
  motion?: boolean
  onSelect: (service: CatalogService) => void
  selected?: boolean
  className?: string
}

export function ServiceCard({
  service,
  image,
  motion = true,
  onSelect,
  selected = false,
  className,
}: ServiceCardProps) {
  const duration = durationNote(service.durationMinutes)
  const reducedMotion = usePrefersReducedMotion()
  const plays = motion && Boolean(service.video) && !reducedMotion
  const video = useVisiblePlayback(service.video, reducedMotion)

  // The still, in the order it is worth having: this service's own frame, then
  // the appliance drawing, then nothing.
  const still = service.poster ?? image

  // Both or neither. A score with no count behind it is a number a reader
  // cannot weigh, so a half-filled catalog row draws no score at all.
  const scored =
    service.rating !== undefined && service.reviewCount !== undefined

  return (
    <CardButton
      onClick={() => onSelect(service)}
      selected={selected}
      ariaLabel={[
        service.name,
        scored
          ? `rated ${service.rating?.toFixed(1)} from ${service.reviewCount} reviews`
          : null,
        `visit fee ${formatPaise(service.visitFee)}`,
        'See what it covers.',
      ]
        .filter(Boolean)
        .join(', ')}
      // Not a box. The page puts a rule between services, which is enough of a
      // boundary once each one is this tall — a border as well would be two
      // lines doing one job.
      className={cn(
        'group w-full rounded-none border-0 bg-transparent p-0 text-left',
        'hover:border-transparent',
        selected && 'ring-0',
        className
      )}
    >
      {plays ? (
        <video
          ref={video}
          // Its own still stands in before a frame has decoded, and stands in
          // for good on a connection that never gets one.
          poster={still}
          src={service.video}
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          className="aspect-video w-full rounded-card bg-surface object-cover"
        />
      ) : still ? (
        <span className="relative block aspect-video w-full overflow-hidden rounded-card bg-surface">
          <Image
            src={still}
            alt=""
            fill
            sizes="(min-width: 640px) 512px, 100vw"
            // A frame of the clip fills the card the way the clip does. The
            // appliance drawing is a drawing on a background and needs the
            // room around it, so it is contained and padded instead.
            className={service.poster ? 'object-cover' : 'object-contain p-6'}
          />
        </span>
      ) : null}

      <h3 className="mt-4 text-xl font-bold leading-snug text-ink">
        {service.name}
      </h3>

      {/* What other people made of it, before what it costs — which is the
          order somebody weighs the two in. */}
      {scored ? (
        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted">
          <Star className="size-3.5 fill-ink text-ink" aria-hidden="true" />
          <span className="font-bold text-ink">
            {service.rating?.toFixed(1)}
          </span>
          <span>({countNote(service.reviewCount ?? 0)} reviews)</span>
        </p>
      ) : null}

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

      <span
        aria-hidden="true"
        className={cn(
          'mt-3 inline-flex items-center text-sm font-bold text-brand',
          'transition-colors duration-[var(--duration-fast)]',
          'group-hover:text-brand-deep'
        )}
      >
        View details
      </span>
    </CardButton>
  )
}

/**
 * A review count at a glance rather than to the unit.
 *
 * Nobody reads "2140" as anything other than "a lot", and the four digits ask
 * them to. Under a thousand the exact figure is short enough to be read, so it
 * stays: rounding 240 to "0.2K" would be less information in more characters.
 */
function countNote(count: number): string {
  if (count < 1000) return String(count)
  const thousands = count / 1000
  // 12.4K is noise at that size; 12K says the same thing. One decimal only
  // while it is still telling the reader something.
  const rounded = thousands < 10 ? thousands.toFixed(1) : String(Math.round(thousands))
  return `${rounded.replace(/\.0$/, '')}K`
}

/**
 * Play a card's clip while it is on screen, and pause it the rest of the time.
 *
 * `autoplay` would be one attribute instead of this hook, and it starts the
 * download and the decoder whether or not the card has ever been on screen.
 * With every card on the page playing, that is the difference between two or
 * three clips running and all six — and a clip fetched for a card nobody
 * scrolled to is a download the customer did not ask for.
 *
 * The margin starts a clip a screen-height early, so one that is scrolled to
 * is already moving rather than starting from its first frame on arrival.
 *
 * `play()` returns a promise that rejects when the browser declines — a tab in
 * the background, a battery-saver policy. That is the browser doing its job,
 * not an error to report, so the rejection is swallowed and the poster stays.
 */
function useVisiblePlayback(
  src: string | undefined,
  reducedMotion: boolean
): React.RefObject<HTMLVideoElement | null> {
  const ref = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries[entries.length - 1]?.isIntersecting
        if (visible === undefined) return
        if (visible) void el.play().catch(() => {})
        else el.pause()
      },
      { rootMargin: '100% 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [src, reducedMotion])

  return ref
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
