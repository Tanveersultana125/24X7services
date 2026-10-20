import { useEffect, useMemo, useRef } from 'react'
import { View } from 'react-native'
import MapView, { Marker, Polyline, type LatLng } from 'react-native-maps'
import { MapPinned } from 'lucide-react-native'

import { Icon } from '@/components/ui/Icon'
import { Text } from '@/components/ui/Text'
import { cn } from '@/lib/cn'
import { useTokenColors } from '@/lib/useTokenColors'

/**
 * The professional and the customer's home on one map, with a line between
 * them, framed so both are always in view. Every new position re-frames it,
 * so the map follows the professional in without the customer pinching.
 *
 * Native only: react-native-maps has no web build, so LiveMap.web.tsx stands
 * in for it there. Pin colours come from the theme tokens, not literals.
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

/** Room around the two pins, so neither sits on the edge of the frame. */
const EDGE = { top: 64, right: 64, bottom: 64, left: 64 }

function toLatLng(point: Geo | null): LatLng | null {
  return point ? { latitude: point.lat, longitude: point.lng } : null
}

export function LiveMap({ professional, home, className }: LiveMapProps) {
  const map = useRef<MapView>(null)
  const [brand, success, line] = useTokenColors(['brand', 'success', 'muted'])
  // Keyed on the numbers, not the objects: a poll hands over new objects for
  // the same place, and the map should only move when the place does.
  const pro = useMemo(() => toLatLng(professional), [professional?.lat, professional?.lng]) // eslint-disable-line react-hooks/exhaustive-deps
  const house = useMemo(() => toLatLng(home), [home?.lat, home?.lng]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (pro && house) map.current?.fitToCoordinates([pro, house], { edgePadding: EDGE, animated: true })
  }, [pro, house])

  const centre = pro ?? house
  if (!centre) return <NoMap className={className} />

  return (
    <View className={cn('overflow-hidden bg-plate', className)}>
      <MapView
        ref={map}
        style={{ flex: 1 }}
        initialRegion={{ ...centre, latitudeDelta: 0.06, longitudeDelta: 0.06 }}
        onMapReady={() => {
          if (pro && house) map.current?.fitToCoordinates([pro, house], { edgePadding: EDGE, animated: false })
        }}
        toolbarEnabled={false}
        showsPointsOfInterests={false}
        accessibilityLabel="Map showing your professional and your home"
      >
        {pro && house ? (
          <Polyline coordinates={[pro, house]} strokeColor={line} strokeWidth={3} lineDashPattern={[8, 6]} />
        ) : null}
        {house ? <Marker coordinate={house} title="Your home" pinColor={success} /> : null}
        {pro ? <Marker coordinate={pro} title="Your professional" pinColor={brand} /> : null}
      </MapView>
    </View>
  )
}

/** Nothing to place yet: say so instead of showing an empty grey map. */
export function NoMap({ className }: { className?: string }) {
  return (
    <View className={cn('items-center justify-center gap-2 bg-surface px-6', className)}>
      <Icon as={MapPinned} className="size-6 text-muted" />
      <Text className="text-center text-sm font-medium text-ink">Map not available yet</Text>
      <Text className="max-w-xs text-center text-xs text-muted">The live position shows here once your professional sets off.</Text>
    </View>
  )
}
