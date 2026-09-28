'use client'

import Link from 'next/link'
import type { Route } from 'next'
import type { ApplianceId, ServiceKey } from '@app/shared'
import { formatPaise } from '@/lib/format'
import { ServiceClip } from '@/components/ServiceClip'
import { ServiceScore, scoreLabel } from '@/components/ServiceScore'
import { cn } from '@/lib/cn'
import {
  addToCart,
  countForService,
  inCart,
  removeFromCart,
  useCart,
} from '@/lib/cart'
import { useRailScroll } from '@/lib/useRailScroll'
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * A sideways row of bookable things: what people book most, and then one row
 * per appliance.
 *
 * A rail rather than a grid because these rows are browsable, not a decision —
 * a customer who already knows they want an AC service taps it from here, and
 * everyone else keeps scrolling down past it. A grid of four services per
 * appliance would push the fifth appliance two screens down.
 *
 * Each card carries two separate targets, side by side rather than nested: the
 * picture and the name open the appliance, where the full description and the
 * warranty live, and the button puts it in the cart. Nesting the second inside
 * the first is the usual way this is built and it leaves a screen reader with
 * one control that does two things.
 *
 * The score sits under the name, so a rail says the same three things the
 * card on the appliance page says — what it looks like, what people made of
 * it, what it costs.
 *
 * The picture is a photograph, not a frame of the service's clip. A clip is
 * drawn at card width with a line of its own along the foot; at the 160px a
 * rail card gets, that line is a smudge and the whole thing reads as a blue
 * rectangle. The photograph is the only picture that still says "washing
 * machine" at this size. The clips keep the appliance page, where they are
 * full width and where what they say can be read.
 *
 * Nothing here moves, for the same reason: a card cannot show a photograph
 * and play an illustrated clip over it without the picture changing under
 * the reader a second after they look at it.
 */

export interface ServiceRailItem {
  id: string
  name: string
  /** The appliance photo. These rails are never about a specific unit. */
  image?: string
  /**
   * A photograph of the appliance. Falls back to `image`, which on an
   * appliance without one is a drawing on a plate and so is contained rather
   * than cropped.
   */
  photo?: string
  /** Out of five, and how many said so. Both or neither — see `ServiceScore`. */
  rating?: number
  reviewCount?: number
  /** Where the name and the picture go — the appliance page. */
  href: Route
  /** "About 1 hr", or whatever else is worth knowing before a slot is picked. */
  note?: string
  /** What the number underneath is: "Visit fee", "From". */
  priceLabel: string
  /** Paise. Formatted here so no caller has to remember to. */
  price: number
  /** What "Add" puts in the cart. */
  applianceId: ApplianceId
  serviceKey: ServiceKey
  /**
   * How many options the service has — the problems a repair is booked for.
   * With any, "Add" says so underneath and opens them (`onOptions`) instead
   * of adding the service outright.
   */
  options?: number
  onOptions?: () => void
}

export function ServiceRail({
  items,
  className,
}: {
  items: readonly ServiceRailItem[]
  className?: string
}) {
  const { ref, canPrev, canNext, page, railProps } =
    useRailScroll<HTMLUListElement>(items.length)

  if (items.length === 0) return null

  return (
    <div className="relative">
      <ul
        ref={ref}
        {...railProps}
        className={cn(
          'no-scrollbar -mx-4 -my-1 flex snap-x gap-3 overflow-x-auto scroll-px-4 px-4 py-1 lg:mx-0 lg:px-0',
          className
        )}
      >
        {items.map((item) => (
          <li key={item.id} className="flex w-40 shrink-0 snap-start flex-col">
            <Link
              href={item.href}
              className="group block"
              aria-label={[item.name, scoreLabel(item.rating, item.reviewCount)]
                .filter(Boolean)
                .join(', ')}
            >
              <ServiceClip
                still={item.photo ?? item.image}
                cover={Boolean(item.photo)}
                motion={false}
                sizes="160px"
                containClassName="p-5"
                // A photograph is cropped square, which is the shape the rail
                // was laid out on. A drawing keeps that square too, with the
                // room around it it was drawn with.
                className="aspect-square rounded-card transition-colors duration-[var(--duration-fast)] group-hover:bg-border"
              />
              <span className="mt-2.5 block line-clamp-2 text-sm font-semibold leading-snug text-ink">
                {item.name}
              </span>
            </Link>

            <ServiceScore
              rating={item.rating}
              reviewCount={item.reviewCount}
              variant="compact"
              className="mt-1"
            />

            {item.note ? (
              <p className="mt-1 text-xs text-muted">{item.note}</p>
            ) : null}

            {/* Pushed to the bottom so the prices line up across cards whose
                names ran to one line and cards whose names ran to two. */}
            <div className="mt-auto flex items-end justify-between gap-2 pt-2">
              <span className="min-w-0">
                <span className="block text-[11px] leading-none text-muted">
                  {item.priceLabel}
                </span>
                <span className="mt-1 block text-sm font-bold text-ink">
                  {formatPaise(item.price)}
                </span>
              </span>
              <AddButton item={item} />
            </div>
          </li>
        ))}
      </ul>

      {/* Arrows for a mouse only: a finger already swipes, and an arrow
          sitting on a phone's card covers the photograph for nothing. Centred
          on the 160px picture, not the card, so they never land on a price. */}
      <RailArrow direction={-1} visible={canPrev} onClick={() => page(-1)} />
      <RailArrow direction={1} visible={canNext} onClick={() => page(1)} />
    </div>
  )
}

function RailArrow({
  direction,
  visible,
  onClick,
}: {
  direction: 1 | -1
  visible: boolean
  onClick: () => void
}) {
  if (!visible) return null
  const Icon = direction === 1 ? ChevronRight : ChevronLeft
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === 1 ? 'Show more' : 'Show previous'}
      className={cn(
        'absolute top-[3.75rem] z-10 hidden size-10 items-center justify-center rounded-full border border-border bg-bg text-ink shadow-md transition-colors duration-[var(--duration-fast)] hover:bg-brand-soft pointer-fine:flex',
        direction === 1 ? '-right-2 lg:-right-5' : '-left-2 lg:-left-5'
      )}
    >
      <Icon className="size-5" aria-hidden="true" />
    </button>
  )
}

/**
 * "Add", and once added, "Added" — tapped again, it takes the service back
 * out. A service with options says how many under the label, the way the
 * marketplaces do, and opens them instead: which problem a repair is for is
 * part of what is being added. The count and the way to the cart are
 * CartBar's, under the page.
 */
function AddButton({ item }: { item: ServiceRailItem }) {
  const cart = useCart()
  const entry = { applianceId: item.applianceId, serviceKey: item.serviceKey }
  const withOptions = Boolean(item.options && item.onOptions)
  const added = withOptions
    ? countForService(cart, entry) > 0
    : inCart(cart, entry)

  function press(): void {
    if (withOptions) item.onOptions?.()
    else if (added) removeFromCart(entry)
    else addToCart(entry)
  }

  return (
    <button
      type="button"
      onClick={press}
      aria-pressed={withOptions ? undefined : added}
      aria-haspopup={withOptions ? 'dialog' : undefined}
      aria-label={
        withOptions
          ? `Add ${item.name}, ${item.options} options`
          : added
            ? `Remove ${item.name} from cart`
            : `Add ${item.name} to cart`
      }
      className={cn(
        'relative inline-flex h-11 w-[5.5rem] shrink-0 items-center justify-center gap-1 rounded-card border text-sm font-semibold transition-colors duration-[var(--duration-fast)]',
        added
          ? 'border-brand bg-brand-soft text-brand'
          : 'border-border bg-bg text-brand hover:border-brand'
      )}
    >
      {added ? (
        <>
          <Check className="size-4" aria-hidden="true" />
          Added
        </>
      ) : (
        'Add'
      )}
      {withOptions ? (
        // Sits across the bottom edge, on the page colour, so it reads as a
        // caption of the button rather than a second line crammed inside it.
        <span
          aria-hidden="true"
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-bg px-1 text-[11px] font-normal leading-none text-muted"
        >
          {item.options} options
        </span>
      ) : null}
    </button>
  )
}

/** "About 1 hr 30 mins" — the line under a rail card's name. */
export function durationNote(minutes: number | undefined): string | undefined {
  if (minutes === undefined || minutes <= 0) return undefined
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `About ${rest} mins`
  const hourPart = `${hours} hr${hours > 1 ? 's' : ''}`
  return rest === 0 ? `About ${hourPart}` : `About ${hourPart} ${rest} mins`
}
