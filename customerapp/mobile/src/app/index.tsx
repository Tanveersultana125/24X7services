import { View } from 'react-native'
import { Redirect } from 'expo-router'
import { brand } from '@/config/brand'
import { useLocation } from '@/lib/useLocation'
import { Text } from '@/components/ui/Text'

/**
 * The splash: straight to Home when we know where the customer is, to the
 * location step when we do not.
 */
export default function SplashScreen() {
  const { location, ready } = useLocation()

  if (ready) return <Redirect href={location ? '/home' : '/location'} />

  return (
    <View className="flex-1 items-center justify-center gap-3 bg-bg px-6">
      <Text className="text-3xl font-extrabold tracking-tight">{brand.wordmark}</Text>
      <Text className="text-sm text-muted">{brand.tagline}</Text>
    </View>
  )
}
