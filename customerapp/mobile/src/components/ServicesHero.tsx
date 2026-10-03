import { View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { BadgeCheck, Star } from 'lucide-react-native'
import { formatPaise } from '@/lib/format'
import { brand } from '@/config/brand'
import { countNote } from '@/components/ServiceScore'
import { Icon, useColor } from '@/components/ui/Icon'
import { Img } from '@/components/ui/Img'
import { Text } from '@/components/ui/Text'

/**
 * The top of the Services screen: what this place is, in one look.
 *
 * A brand-blue card with a technician at work, a line that says what we do,
 * and three facts taken from the catalog itself — how many appliances, the
 * lowest visit fee, the rating across every review. Nothing on it is typed in
 * by hand, so it cannot say something the catalog does not; while the catalog
 * is loading the facts are simply left off rather than guessed.
 */
export function ServicesHero({
  applianceCount,
  fromPaise,
  rating,
}: {
  applianceCount?: number
  fromPaise?: number
  rating?: { average: number; count: number }
}) {
  const deep = useColor('text-brand-deep')
  const facts = [
    applianceCount ? { value: String(applianceCount), label: 'appliances', star: false } : null,
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
      {/* The technician sits on the right, faded into the blue so the words
          on the left always have a plain ground to sit on. */}
      <View className="absolute inset-y-0 right-0 w-[46%]" pointerEvents="none">
        <Img
          src="/photos/technician/ac-service.jpg"
          alt=""
          contentPosition="top"
          className="absolute inset-0"
        />
        <LinearGradient
          colors={[deep, withAlpha(deep, 0.5), withAlpha(deep, 0)]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
        />
      </View>

      <View className="w-[68%] px-4 pb-4 pt-4">
        <View className="flex-row items-center gap-1 self-start rounded-pill bg-white/15 px-2 py-0.5">
          <Icon as={BadgeCheck} className="size-3 text-white" />
          <Text className="text-[10px] font-semibold uppercase tracking-[0.5px] text-white">
            Verified technicians
          </Text>
        </View>
        <Text accessibilityRole="header" className="mt-2.5 text-lg font-extrabold leading-[24px] text-white">
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

/** `#1e3a8a` at a given opacity, for the gradient's fading stops. */
function withAlpha(hex: string, alpha: number): string {
  const match = /^#([0-9a-f]{6})$/i.exec(hex)
  if (!match) return hex
  const value = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0')
  return `#${match[1]}${value}`
}
