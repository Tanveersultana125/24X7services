import { View } from 'react-native'
import { House, MapPinned, Wrench } from 'lucide-react-native'

import { Icon } from '@/components/ui/Icon'
import { Text } from '@/components/ui/Text'
import { cn } from '@/lib/cn'

/**
 * LiveMap on the web. react-native-maps has no web build, and the browser map
 * key is still undecided (see components/TrackingMap), so the web draws the
 * same honest panel TrackingMap does: no fake tiles, just the two ends of the
 * trip and how far apart they are. The props match the native map, so the
 * screen does not know which one it got.
 */

export interface Geo {
  lat: number
  lng: number
}

export interface LiveMapProps {
  professional: Geo | null
  home: Geo | null
  className?: string
}

/** Straight-line distance in km (haversine): close enough for "2.4 km away". */
function distanceKm(a: Geo, b: Geo): number {
  const rad = (deg: number) => (deg * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(h))
}

export function LiveMap({ professional, home, className }: LiveMapProps) {
  if (!professional || !home) return <NoMap className={className} />
  const km = distanceKm(professional, home)

  return (
    <View
      accessible
      accessibilityLabel={`Your professional is about ${km.toFixed(1)} kilometres from your home`}
      className={cn('items-center justify-center gap-5 bg-surface px-6', className)}
    >
      <View className="w-full max-w-xs flex-row items-center">
        <Pin icon={Wrench} label="Professional" tone="bg-brand" />
        <View className="mx-2 h-0.5 flex-1 border-t-2 border-dashed border-muted" />
        <Pin icon={House} label="Your home" tone="bg-success" />
      </View>
      <Text className="text-center text-sm font-medium text-ink">{`About ${km.toFixed(1)} km away`}</Text>
      <Text className="max-w-xs text-center text-xs text-muted">The map opens in the app. Your professional calls before they arrive.</Text>
    </View>
  )
}

function Pin({ icon, label, tone }: { icon: typeof House; label: string; tone: string }) {
  return (
    <View className="items-center gap-1.5">
      <View className={cn('size-11 items-center justify-center rounded-full', tone)}>
        <Icon as={icon} className="size-5 text-white" />
      </View>
      <Text className="text-xs text-muted">{label}</Text>
    </View>
  )
}

export function NoMap({ className }: { className?: string }) {
  return (
    <View className={cn('items-center justify-center gap-2 bg-surface px-6', className)}>
      <Icon as={MapPinned} className="size-6 text-muted" />
      <Text className="text-center text-sm font-medium text-ink">Map not available yet</Text>
      <Text className="max-w-xs text-center text-xs text-muted">The live position shows here once your professional sets off.</Text>
    </View>
  )
}
