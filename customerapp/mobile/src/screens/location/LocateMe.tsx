import { useState } from 'react'
import { Linking, Platform, View } from 'react-native'
import * as ExpoLocation from 'expo-location'
import { Crosshair, Home, MapPin } from 'lucide-react-native'

import { Card } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { Skeleton } from '@/components/ui/Skeleton'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'
import { useAuth } from '@/lib/auth'
import { useAddresses } from '@/lib/data/account'
import { cn } from '@/lib/cn'

/**
 * The two quickest ways to a pincode: where the phone is now, and the
 * addresses the customer has already saved. Both hand a pincode to the
 * location screen's check, so the answer is the same as typing it.
 */

type Problem = 'denied' | 'unavailable' | null

/**
 * "Use current location". The phone's own geocoder turns the fix into a
 * pincode (Android's Geocoder, iOS's CLGeocoder), so no API key ships in the
 * app. On the web there is no such geocoder, so the button is not offered.
 */
export function CurrentLocationButton({ onPincode }: { onPincode: (pincode: string) => void }) {
  const [locating, setLocating] = useState(false)
  const [problem, setProblem] = useState<Problem>(null)

  if (Platform.OS === 'web') return null

  async function locate(): Promise<void> {
    setProblem(null)
    setLocating(true)
    try {
      const permission = await ExpoLocation.requestForegroundPermissionsAsync()
      if (permission.status !== 'granted') {
        setProblem('denied')
        return
      }
      const position = await ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.Balanced })
      const [place] = await ExpoLocation.reverseGeocodeAsync(position.coords)
      const pincode = place?.postalCode?.replace(/\D/g, '')
      if (pincode && pincode.length === 6) onPincode(pincode)
      else setProblem('unavailable')
    } catch {
      setProblem('unavailable')
    } finally {
      setLocating(false)
    }
  }

  return (
    <View className="mt-5">
      <Tappable
        onPress={() => void locate()}
        disabled={locating}
        accessibilityLabel="Use my current location"
        className="min-h-14 flex-row items-center gap-3 rounded-card border border-brand bg-brand-soft px-4 active:opacity-80"
      >
        <Icon as={Crosshair} className="size-5 text-brand" />
        <View className="min-w-0 flex-1">
          <Text className="text-base font-semibold text-brand">{locating ? 'Finding you…' : 'Use current location'}</Text>
          <Text className="text-xs text-muted">Using GPS</Text>
        </View>
      </Tappable>
      {problem === 'denied' ? (
        <View className="mt-2 flex-row flex-wrap items-center gap-x-1">
          <Text className="text-xs text-muted">Location permission is off.</Text>
          <Text accessibilityRole="link" onPress={() => void Linking.openSettings()} className="text-xs font-semibold text-brand">
            Turn it on in Settings
          </Text>
          <Text className="text-xs text-muted">or enter a pincode below.</Text>
        </View>
      ) : problem === 'unavailable' ? (
        <Text className="mt-2 text-xs text-muted">We could not work out your pincode here. Enter it below instead.</Text>
      ) : null}
    </View>
  )
}

/** Saved addresses, for someone signed in who has any. Tapping one checks its pincode. */
export function SavedAddresses({ onPincode }: { onPincode: (pincode: string) => void }) {
  const { user } = useAuth()
  const addresses = useAddresses()
  if (!user) return null
  if (addresses.status === 'loading') return <Skeleton className="mt-6 h-28" />
  if (addresses.status === 'error' || !addresses.data?.length) return null

  return (
    <View className="mt-6">
      <Text accessibilityRole="header" className="mb-2 text-sm font-semibold text-muted">
        Saved addresses
      </Text>
      <Card className="overflow-hidden">
        {addresses.data.map((address, index) => (
          <Tappable
            key={address.id}
            onPress={() => onPincode(address.pincode)}
            className={cn(
              'w-full flex-row items-center gap-3 px-4 py-3 active:bg-surface active:opacity-100',
              index < addresses.data!.length - 1 && 'border-b border-border'
            )}
          >
            <Icon as={address.label === 'home' ? Home : MapPin} className="size-4 text-muted" />
            <View className="min-w-0 flex-1">
              <Text className="text-base font-medium capitalize text-ink">{address.label}</Text>
              <Text numberOfLines={1} className="text-xs text-muted">
                {[address.line1, address.line2, address.pincode].filter(Boolean).join(', ')}
              </Text>
            </View>
          </Tappable>
        ))}
      </Card>
    </View>
  )
}
