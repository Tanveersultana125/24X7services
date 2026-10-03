import { View } from 'react-native'
import { BadgeCheck, Star } from 'lucide-react-native'
import { formatPaise } from '@/lib/format'
import { brand } from '@/config/brand'
import { countNote } from '@/components/ServiceScore'
import { Icon } from '@/components/ui/Icon'
import { Text } from '@/components/ui/Text'

/**
 * The top of the Services screen: what this place is, in one look.
 *
 * A brand-blue card with a line that says what we do, and three facts taken
 * from the catalog itself — how many appliances, the lowest visit fee, the
 * rating across every review. Nothing on it is typed in by hand, so it cannot
 * say something the catalog does not; while the catalog is loading the facts
 * are simply left off rather than guessed.
 */
export function ServicesHero({
  appliances = [],
  fromPaise,
  rating,
}: {
  /** In catalog order; each one's `image` is its product shot. */
  appliances?: readonly { id: string; name: string; image: string }[]
  fromPaise?: number
  rating?: { average: number; count: number }
}) {
  const facts = [
    appliances.length > 0 ? { value: String(appliances.length), label: 'appliances', star: false } : null,
    fromPaise !== undefined ? { value: formatPaise(fromPaise), label: 'visit from', star: false } : null,
    rating
      ? { value: rating.average.toFixed(1), label: `${countNote(rating.count)} reviews`, star: true }
      : null,
  ].filter((fact) => fact !== null)

  return (
    <View
      accessibilityLabel="24X7 services"
      className="mt-5 overflow-hidden rounded-card bg-brand-deep shadow-raised"
    >
      {/* Two soft rings in the corner, so the blue is not a flat slab. */}
      <View pointerEvents="none" className="absolute -right-10 -top-12 size-44 rounded-full bg-white/[0.06]" />
      <View pointerEvents="none" className="absolute -right-4 top-10 size-24 rounded-full bg-white/[0.05]" />

      <View className="px-4 pb-4 pt-4">
        <View className="flex-row items-center gap-1 self-start rounded-pill bg-white/15 px-2 py-0.5">
          <Icon as={BadgeCheck} className="size-3 text-white" />
          <Text className="text-[10px] font-semibold uppercase tracking-[0.5px] text-white">
            Verified technicians
          </Text>
        </View>
        <Text accessibilityRole="header" className="mt-2.5 max-w-[240px] text-lg font-extrabold leading-[24px] text-white">
          {brand.tagline}
        </Text>
        <Text className="mt-1 text-xs leading-[18px] text-white/80">
          You approve the price before any work starts.
        </Text>

      </View>

      {facts.length > 0 ? (
        <View className="flex-row border-t border-white/15 bg-night/20">
          {facts.map((fact, index) => (
            <View
              key={fact.label}
              accessible
              accessibilityLabel={`${fact.value} ${fact.label}`}
              className={`flex-1 items-center px-2 py-2 ${index > 0 ? 'border-l border-white/15' : ''}`}
            >
              <View className="flex-row items-center gap-1">
                {fact.star ? <Icon as={Star} className="size-3 text-white" fill="#ffffff" /> : null}
                <Text className="text-sm font-bold text-white">{fact.value}</Text>
              </View>
              <Text className="text-[10px] text-white/75">{fact.label}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  )
}
