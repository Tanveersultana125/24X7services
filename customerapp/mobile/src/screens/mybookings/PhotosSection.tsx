import { useState } from 'react'
import { Modal, Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { X } from 'lucide-react-native'
import type { Booking } from '@app/shared/catalog-v2'

import { Icon } from '@/components/ui/Icon'
import { Img } from '@/components/ui/Img'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'

/**
 * The job's photos: what the professional saw when they arrived, and what
 * they left. Tap one to see it full screen. Takes the place of the job OTP
 * the app used to show; the photos are the record of the visit.
 */
export function PhotosSection({ booking }: { booking: Booking }) {
  const [open, setOpen] = useState<string | null>(null)
  const insets = useSafeAreaInsets()
  const groups = [
    { title: 'Before', photos: booking.photos.before },
    { title: 'After', photos: booking.photos.after },
  ].filter((g) => g.photos.length > 0)

  if (groups.length === 0) {
    return (
      <Text className="text-sm text-muted">
        Your professional adds photos of the work before they start and when they finish. They will show here.
      </Text>
    )
  }

  return (
    <View className="gap-4">
      {groups.map((group) => (
        <View key={group.title}>
          <Text className="mb-2 text-sm font-semibold text-muted">{group.title}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3">
            {group.photos.map((photo) => (
              <Tappable key={photo} onPress={() => setOpen(photo)} accessibilityLabel={`${group.title} photo, open full screen`}>
                <View className="size-28 overflow-hidden rounded-card bg-plate">
                  <Img src={photo} alt="" className="size-full" />
                </View>
              </Tappable>
            ))}
          </ScrollView>
        </View>
      ))}

      <Modal visible={open !== null} transparent animationType="fade" onRequestClose={() => setOpen(null)}>
        <Pressable className="flex-1 items-center justify-center bg-night/95" onPress={() => setOpen(null)} accessibilityLabel="Close photo">
          {open ? <Img src={open} alt="Job photo" className="aspect-square w-full" contentFit="contain" /> : null}
          <View className="absolute right-3" style={{ top: insets.top + 8 }}>
            <Tappable
              onPress={() => setOpen(null)}
              accessibilityLabel="Close"
              className="size-11 items-center justify-center rounded-full bg-night/70"
            >
              <Icon as={X} className="size-5 text-white" />
            </Tappable>
          </View>
        </Pressable>
      </Modal>
    </View>
  )
}
