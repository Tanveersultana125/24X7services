import { View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { brand } from '@/config/brand'
import { Img } from '@/components/ui/Img'
import { Text } from '@/components/ui/Text'

/**
 * The top of the Services screen: a home, not a diagram.
 *
 * A full-bleed photograph of a lived-in room with the promise written across
 * the top of it, the way a magazine cover would set it. The wordmark sits
 * above the line so the page says whose it is without a logo. A dark wash at
 * the top keeps the white type readable whatever the light in the picture,
 * and a shorter one at the foot gives the search card that overlaps it
 * something calm to sit on.
 */
export function ServicesHero() {
  return (
    <View accessibilityLabel={`${brand.name} services`} className="-mx-4 h-[336px] overflow-hidden">
      <Img
        src="/photos/laundry-room.jpg"
        alt=""
        priority="high"
        contentPosition={{ left: '60%', top: '50%' }}
        className="absolute inset-0"
      />
      <LinearGradient
        colors={['rgba(23,21,15,0.75)', 'rgba(23,21,15,0.35)', 'rgba(23,21,15,0)']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '66%' }}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['rgba(23,21,15,0)', 'rgba(23,21,15,0.4)']}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '25%' }}
        pointerEvents="none"
      />

      <View className="px-5 pt-7">
        <Text className="text-xl font-extrabold tracking-tight text-white">{brand.wordmark}</Text>
        <Text accessibilityRole="header" className="mt-2 max-w-[272px] text-[28px] font-bold leading-[34px] text-white">
          {brand.tagline}
        </Text>
        <Text className="mt-2 max-w-[256px] text-sm text-white/85">
          Repair, service and installation. You approve the price first.
        </Text>
      </View>
    </View>
  )
}
