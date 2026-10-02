import { View } from 'react-native'
import type { Href } from 'expo-router'
import { ChevronRight } from 'lucide-react-native'
import type { CatalogAppliance } from '@app/shared'
import { CardLink } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { Text } from '@/components/ui/Text'
import { ServiceClip } from '@/components/ServiceClip'
import { ServiceScore, scoreLabel } from '@/components/ServiceScore'
import { cn } from '@/lib/cn'

/**
 * A tile in the Our Services grid. Tapping it opens that appliance.
 *
 * The picture is a frame of the appliance's clip, cropped to fill, because a
 * frame of a clip is a photograph and has no margins to preserve. It only
 * moves if the grid says so, and a grid says so for one tile — five tiles all
 * playing is a page that twitches rather than a catalogue. The illustration,
 * when that is what a tile falls back to, is contained rather than cropped:
 * these are drawings with their own margins, and covering a 4:3 box with a
 * squarer drawing takes a slice off the top and bottom, which is how the
 * geyser lost its base and the microwave lost its feet.
 *
 * The chevron is not decoration either. A grid of drawings with a caption under
 * each reads as a picture list, and customers were treating it as one; the
 * chevron and the pressed state are what say the tile goes somewhere.
 */

export interface ApplianceCardProps {
  appliance: CatalogAppliance
  /** The cheapest visit fee for it, already formatted — "₹299". */
  from?: string
  /**
   * How many services sit under it.
   *
   * Across today's catalogue every appliance's cheapest visit is the same
   * ₹299, so a column of tiles all reading "Visit from ₹299" is true and reads
   * as a bug. The count is the number that actually differs between them.
   */
  serviceCount?: number
  /**
   * The clip that stands for the whole appliance, a frame of it, and what
   * people scored its services — all from `summaryByAppliance`, because an
   * appliance carries none of these itself.
   */
  video?: string
  poster?: string
  rating?: number
  reviewCount?: number
  /** Let this tile play its clip. Off by default; the grid turns it on for one tile. */
  motion?: boolean
  /**
   * Lay the tile out sideways and let it take the full width of a phone.
   *
   * An odd number of appliances leaves the last one alone in a two-column row
   * with a hole beside it, which reads as a layout that broke rather than a
   * catalog that ended. Given to the odd tile, this turns that hole into the
   * end of the list.
   */
  wide?: boolean
  /** Fetch this image straight away — for the tiles on screen before any scrolling. */
  priority?: boolean
  className?: string
}

export function ApplianceCard({
  appliance,
  from,
  serviceCount,
  video,
  poster,
  rating,
  reviewCount,
  motion = false,
  wide = false,
  priority = false,
  className,
}: ApplianceCardProps) {
  return (
    <CardLink
      href={`/services/appliance?a=${appliance.id}` as Href}
      ariaLabel={[`${appliance.name} services`, scoreLabel(rating, reviewCount)].filter(Boolean).join(', ')}
      className={cn('overflow-hidden', wide ? 'flex-row' : 'flex-col', className)}
    >
      <ServiceClip
        video={video}
        still={poster ?? appliance.image}
        cover={Boolean(poster)}
        motion={motion}
        priority={priority}
        containClassName="p-4"
        // A clip is 16:9 and carries a line of its own along the bottom, so
        // the box takes the clip's shape rather than cropping a caption in
        // half. The drawing keeps the 4:3 the grid was laid out on.
        className={cn(
          'shrink-0',
          poster
            ? wide
              ? 'aspect-video w-40'
              : 'aspect-video w-full'
            : wide
              ? 'aspect-square w-28'
              : 'aspect-[4/3] w-full'
        )}
      />

      <View className="min-w-0 flex-1 flex-row items-center gap-2 p-3">
        <View className="min-w-0 flex-1">
          <Text numberOfLines={1} className="text-sm font-semibold leading-snug text-ink">
            {appliance.name}
          </Text>
          <ServiceScore rating={rating} reviewCount={reviewCount} variant="compact" className="mt-0.5" />
          {serviceCount || from ? (
            // Two lines, not one: at half a phone's width "from ₹299" was
            // the part cut off, and it is the price.
            <Text numberOfLines={2} className="mt-0.5 text-xs text-muted">
              {serviceCount ? `${serviceCount} ${serviceCount === 1 ? 'service' : 'services'}` : null}
              {serviceCount && from ? ' · ' : null}
              {from ? (
                <>
                  {'from '}
                  <Text className="text-xs font-semibold text-ink">{from}</Text>
                </>
              ) : null}
            </Text>
          ) : null}
        </View>
        <Icon as={ChevronRight} className="size-4 text-muted" />
      </View>
    </CardLink>
  )
}
