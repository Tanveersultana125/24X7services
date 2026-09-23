'use client'

import type { CatalogService } from '@app/shared'
import { formatPaise } from '@/lib/format'
import { CardButton } from '@/components/ui/Card'
import { ServiceClip } from '@/components/ServiceClip'
import { ServiceScore, scoreLabel } from '@/components/ServiceScore'
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
 * A photograph wins over a clip, wherever there is one. The clips are drawn
 * and they say something a photograph cannot — what the service involves,
 * written along the foot — but they are drawings, and a screen selling real
 * work to somebody deciding whether to let a stranger into their kitchen is
 * better off showing the thing itself.
 *
 * The clip machinery stays for a service that has no photograph: one card in
 * such a list moves, and it is the first one. Everything moving reads the
 * same as nothing moving, and it is also six decoders on a cheap phone, so
 * the list hands `motion` to its first card and to nothing else. A customer
 * who has asked their system for less motion gets a still either way.
 *
 * Failing both, the appliance drawing. It is shared by every service on the
 * appliance, so a list falling all the way back to it is a list of the same
 * picture — which is why it is last and not first.
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
   * The appliance's own picture, as the last fallback. Every service on one
   * appliance shares it, so it is what a list looks like when nothing better
   * has been seeded.
   */
  image?: string
  /**
   * Whether this card is the one allowed to play its clip. Off by default,
   * and ignored entirely once the service has a photograph — see the note
   * above. Even when it applies, playback waits for the card to be on screen.
   */
  motion?: boolean
  onSelect: (service: CatalogService) => void
  selected?: boolean
  className?: string
}

export function ServiceCard({
  service,
  image,
  motion = false,
  onSelect,
  selected = false,
  className,
}: ServiceCardProps) {
  const duration = durationNote(service.durationMinutes)

  return (
    <CardButton
      onClick={() => onSelect(service)}
      selected={selected}
      ariaLabel={[
        service.name,
        scoreLabel(service.rating, service.reviewCount),
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
      {/* In the order each is worth having: the photograph, then a frame of
          this service's own clip, then the appliance's picture. The first two
          fill the box; the third may be a drawing on a plate, which needs the
          room around it. The clip is offered only when no photograph has
          taken its place. */}
      <ServiceClip
        video={service.photo ? undefined : service.video}
        still={service.photo ?? service.poster ?? image}
        cover={Boolean(service.photo ?? service.poster)}
        motion={motion}
        sizes="(min-width: 640px) 512px, 100vw"
        containClassName="p-6"
        className="aspect-video w-full rounded-card"
      />

      <h3 className="mt-4 text-xl font-bold leading-snug text-ink">
        {service.name}
      </h3>

      {/* What other people made of it, before what it costs — which is the
          order somebody weighs the two in. */}
      <ServiceScore
        rating={service.rating}
        reviewCount={service.reviewCount}
        className="mt-1.5"
      />

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
