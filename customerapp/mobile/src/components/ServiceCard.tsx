import { View } from 'react-native'
import type { CatalogService } from '@app/shared'
import { formatPaise } from '@/lib/format'
import { ServiceClip } from '@/components/ServiceClip'
import { ServiceScore, scoreLabel } from '@/components/ServiceScore'
import { AddButton, durationNote } from '@/components/ServiceRail'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'
import { cn } from '@/lib/cn'

/**
 * A service on the appliance page: what it looks like, what it is, what people
 * scored it, what the visit costs, and how long it takes.
 *
 * Laid out the way the marketplaces lay this one out, because it is the screen
 * a customer compares two services on and the comparison has a shape: a wide
 * clip, the name large enough to read at a glance, the score under it, the
 * money and the time on the line below, then the detail under a rule for
 * anyone still deciding, and the way in at the foot.
 *
 * A photograph wins over a clip, wherever there is one. The clips are drawn
 * and they say something a photograph cannot — what the service involves,
 * written along the foot — but they are drawings, and a screen selling real
 * work to somebody deciding whether to let a stranger into their kitchen is
 * better off showing the thing itself.
 *
 * The clip machinery stays for a service that has no photograph: one card in
 * such a list moves, and it is the first one. Failing both, the appliance
 * drawing — last, because every service on the appliance shares it.
 *
 * Two things to press, as on the Home rails: "Add", beside the name and the
 * price, puts the service in the cart (or, for a repair, opens its problems
 * first); anywhere else on the card opens the service. "View details" at the
 * foot labels the second target rather than being a third.
 *
 * The card is not a button with Add inside it — a screen reader cannot say
 * where one ends. It is a plain box with the open button stretched across it
 * underneath, and Add stacked above that.
 */

export interface ServiceCardProps {
  service: CatalogService
  /** The appliance's own picture, as the last fallback. */
  image?: string
  /**
   * Whether this card is the one allowed to play its clip. Off by default,
   * and ignored entirely once the service has a photograph.
   */
  motion?: boolean
  onSelect: (service: CatalogService) => void
  /** How many problems a repair is booked for; with any, Add opens them. */
  options?: number
  onOptions?: () => void
  selected?: boolean
  className?: string
}

export function ServiceCard({
  service,
  image,
  motion = false,
  onSelect,
  options,
  onOptions,
  selected = false,
  className,
}: ServiceCardProps) {
  const duration = durationNote(service.durationMinutes)

  // Not a box. The page puts a rule between services, which is enough of a
  // boundary once each one is this tall.
  return (
    <View className={cn('relative w-full', className)}>
      <Tappable
        onPress={() => onSelect(service)}
        accessibilityState={{ selected }}
        accessibilityLabel={[
          service.name,
          scoreLabel(service.rating, service.reviewCount),
          `visit fee ${formatPaise(service.visitFee)}`,
          'See what it covers.',
        ]
          .filter(Boolean)
          .join(', ')}
        className="absolute inset-0 z-10 rounded-card"
      />

      <View pointerEvents="none">
        <ServiceClip
          video={service.photo ? undefined : service.video}
          still={service.photo ?? service.poster ?? image}
          cover={Boolean(service.photo ?? service.poster)}
          motion={motion}
          containClassName="p-6"
          className="aspect-video w-full rounded-card"
        />
      </View>

      <View pointerEvents="box-none" className="z-20 mt-4 flex-row items-start gap-3">
        <View pointerEvents="none" className="min-w-0 flex-1">
          <Text className="text-xl font-bold leading-snug text-ink">{service.name}</Text>
          {/* What other people made of it, before what it costs — which is
              the order somebody weighs the two in. */}
          <ServiceScore rating={service.rating} reviewCount={service.reviewCount} className="mt-1.5" />
        </View>

        {/* Above the stretched button, so a tap here adds rather than opens.
            The bottom padding is room for the "6 options" caption. */}
        <View className="shrink-0 pb-2.5">
          <AddButton
            item={{
              name: service.name,
              applianceId: service.applianceId,
              serviceKey: service.serviceKey,
              options,
              onOptions,
            }}
          />
        </View>
      </View>

      <View pointerEvents="none">
        {/* The two numbers a customer weighs, on one line, in the order they
            weigh them. */}
        <Text className="mt-1.5 text-sm text-ink">
          <Text className="text-sm font-bold text-ink">{formatPaise(service.visitFee)}</Text>{' '}
          <Text className="text-sm text-muted">visit fee</Text>
          {duration ? (
            <>
              <Text className="text-sm text-border"> · </Text>
              <Text className="text-sm text-muted">{duration}</Text>
            </>
          ) : null}
          {service.warrantyDays ? (
            <>
              <Text className="text-sm text-border"> · </Text>
              <Text className="text-sm text-muted">{service.warrantyDays}-day warranty</Text>
            </>
          ) : null}
        </Text>

        <View className="mt-3 gap-1.5 border-t border-dashed border-border pt-3">
          <Point>{service.description}</Point>
          <Point>
            {service.startingPrice > service.visitFee
              ? `Repairs usually start at ${formatPaise(service.startingPrice)}, quoted on site and begun only after you approve.`
              : 'Any repair beyond this is quoted on site and starts only after you approve it.'}
          </Point>
        </View>

        <Text aria-hidden className="mt-3 text-sm font-bold text-brand">
          View details
        </Text>
      </View>
    </View>
  )
}

/** One line of what the service covers. */
function Point({ children }: { children: string }) {
  return (
    <View className="flex-row items-start gap-2">
      <View aria-hidden className="mt-[9px] size-1 shrink-0 rounded-full bg-muted" />
      <Text className="flex-1 text-sm leading-relaxed text-muted">{children}</Text>
    </View>
  )
}
