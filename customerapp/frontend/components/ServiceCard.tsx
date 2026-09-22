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
 * One card in a list moves, and it is the first one. Everything moving reads
 * the same as nothing moving — a screen of clips gives the eye nowhere to
 * rest and no card comes out ahead — and it is also six decoders on a cheap
 * phone and six downloads on a metered connection. So the list hands `motion`
 * to its first card and to nothing else, and the clip that does play waits
 * until it is on screen. A customer who has asked their system for less
 * motion gets the still like everyone below them, and the clip is never the
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
   * Whether this card is the one allowed to play its clip. Off by default: a
   * list that wants movement asks for it, once, on its first card. It is not
   * a licence to play immediately either — playback still waits for the card
   * to be on screen. See the note above.
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
      {/* The still, in the order it is worth having: this service's own
          frame, then the appliance drawing, then nothing. A frame fills the
          box the way the clip does; the drawing needs the room around it. */}
      <ServiceClip
        video={service.video}
        still={service.poster ?? image}
        cover={Boolean(service.poster)}
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
