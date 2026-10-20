import { useRef, useState } from 'react'
import { FlatList, useWindowDimensions, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'

import { Button } from '@/components/ui/Button'
import { Img } from '@/components/ui/Img'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'
import { brand } from '@/config/brand'
import { cn } from '@/lib/cn'
import { useOnboarded } from '@/lib/onboarding'

/**
 * Three slides on the first launch, then never again: what the app does, who
 * turns up, and what it costs. Swipe or tap Next; Skip is always there,
 * because nobody installs an app to read about it.
 */

const SLIDES = [
  {
    key: 'services',
    image: '/photos/laundry-room.jpg',
    title: 'Home services, at your door',
    body: 'Appliance repair, cleaning and salon at home. Booked in under a minute.',
  },
  {
    key: 'pros',
    image: '/photos/ac-technician.jpg',
    title: 'Verified professionals',
    body: 'Background-checked, trained, and rated by customers like you after every job.',
  },
  {
    key: 'price',
    image: '/photos/technician/ac-service.jpg',
    title: 'Upfront prices, no surprises',
    body: 'See the price before you book. Nothing extra is done without your OK.',
  },
] as const

export function OnboardingScreen() {
  const { width, height } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const { finish } = useOnboarded()
  const list = useRef<FlatList<(typeof SLIDES)[number]>>(null)
  const [index, setIndex] = useState(0)
  const last = index === SLIDES.length - 1

  function done(): void {
    finish()
    router.replace('/login')
  }

  function onScroll(event: NativeSyntheticEvent<NativeScrollEvent>): void {
    setIndex(Math.round(event.nativeEvent.contentOffset.x / width))
  }

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 16 }}>
      <View className="min-h-14 flex-row items-center justify-between px-4">
        <Text className="text-lg font-extrabold tracking-tight text-ink">{brand.wordmark}</Text>
        {last ? null : (
          <Tappable onPress={done} accessibilityLabel="Skip the introduction" className="min-h-11 justify-center px-2">
            <Text className="text-sm font-semibold text-muted">Skip</Text>
          </Tappable>
        )}
      </View>

      <FlatList
        ref={list}
        data={SLIDES}
        keyExtractor={(slide) => slide.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        className="flex-1"
        renderItem={({ item }) => (
          <View style={{ width }} className="px-6">
            {/* A share of the screen rather than a fixed height, so a small
                phone keeps room for the words and a tall one is not all picture. */}
            <View className="overflow-hidden rounded-[28px] bg-plate" style={{ height: Math.round(height * 0.42) }}>
              <Img src={item.image} alt="" className="size-full" />
            </View>
            <Text accessibilityRole="header" className="mt-8 text-3xl font-bold text-ink">
              {item.title}
            </Text>
            <Text className="mt-3 text-base leading-[24px] text-muted">{item.body}</Text>
          </View>
        )}
      />

      <View className="px-6">
        <View className="mb-6 flex-row justify-center gap-2" accessibilityLabel={`Slide ${index + 1} of ${SLIDES.length}`}>
          {SLIDES.map((slide, i) => (
            <View key={slide.key} className={cn('h-2 rounded-full', i === index ? 'w-6 bg-brand' : 'w-2 bg-border')} />
          ))}
        </View>
        <Button
          fullWidth
          size="lg"
          onPress={() => {
            if (last) return done()
            // Set here as well: a programmatic scroll does not always end in a
            // momentum event, and the dots would lag a slide behind.
            setIndex(index + 1)
            list.current?.scrollToIndex({ index: index + 1, animated: true })
          }}
        >
          {last ? 'Get started' : 'Next'}
        </Button>
      </View>
    </View>
  )
}
