import { View } from 'react-native'
import { MapPinned } from 'lucide-react-native'
import type { GeoPoint } from '@app/shared'
import { Icon } from '@/components/ui/Icon'
import { Text } from '@/components/ui/Text'
import { cn } from '@/lib/cn'

/**
 * Where the expert is, on a map.
 *
 * On the web this loads the Google Maps JavaScript API with a referrer-
 * restricted browser key, and without a key it degrades to the panel below.
 * The key has never been set (DECISION NEEDED on the web side), so the panel is
 * what every customer sees today — and it is what this port draws. A native map
 * needs a maps SDK and an Android/iOS-restricted key; until both are decided,
 * the panel is the honest version of this component.
 *
 * Without a map the screen still works. The ETA, the expert and the timeline
 * are the parts a customer actually acts on; the map is where those facts are
 * pleasant to look at. So the missing map is a panel that says what is
 * happening rather than an empty grey box or a broken screen.
 *
 * The props match the web so the screen ports line for line and a real map can
 * drop in behind them later.
 */

export interface TrackingMapProps {
  technician?: GeoPoint
  customer?: GeoPoint
  className?: string
}

export function TrackingMap({ className }: TrackingMapProps) {
  return (
    <View
      className={cn(
        'items-center justify-center gap-2 rounded-card border border-border bg-surface px-6 py-10',
        className
      )}
    >
      <Icon as={MapPinned} className="size-6 text-muted" />
      <Text className="text-center text-sm font-medium text-ink">Map unavailable</Text>
      <Text className="max-w-xs text-center text-xs leading-[19px] text-muted">
        The live position is below. Your expert calls before they arrive.
      </Text>
    </View>
  )
}
