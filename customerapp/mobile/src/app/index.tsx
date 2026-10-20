import { View } from 'react-native'
import { Redirect, type Href } from 'expo-router'
import { brand } from '@/config/brand'
import { useAuth } from '@/lib/auth'
import { hasName } from '@/lib/data/auth'
import { useOnboarded } from '@/lib/onboarding'
import { useLocation } from '@/lib/useLocation'
import { Text } from '@/components/ui/Text'

/**
 * The splash, and the one place that decides where the app opens: the
 * introduction on a first launch, then log in, then the name if we do not
 * have it, then the location if none is saved, and Home once all of that is
 * done.
 */
export default function SplashScreen() {
  const { location, ready: locationReady } = useLocation()
  const { user, ready: authReady } = useAuth()
  const { onboarded } = useOnboarded()

  function firstScreen(): Href {
    if (!onboarded) return '/onboarding'
    if (!user) return '/login'
    if (!hasName(user)) return '/login/name'
    if (!location) return '/location'
    return '/home'
  }

  if (locationReady && authReady) return <Redirect href={firstScreen()} />

  return (
    <View className="flex-1 items-center justify-center gap-3 bg-bg px-6">
      <Text className="text-3xl font-extrabold tracking-tight">{brand.wordmark}</Text>
      <Text className="text-sm text-muted">{brand.tagline}</Text>
    </View>
  )
}
