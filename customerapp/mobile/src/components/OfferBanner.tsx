import { View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { cn } from '@/lib/cn'
import { useColor } from '@/components/ui/Icon'
import { Img } from '@/components/ui/Img'
import { Text } from '@/components/ui/Text'

/**
 * The card that opens a group on an appliance page — "Annual plan", "Service"
 * — the way the marketplaces open theirs: a tab of a badge at the top left,
 * the headline and a line or two under it, and a photograph of the work on
 * the right.
 *
 * Two columns rather than words over a full-bleed photograph, for the reason
 * `ApplianceHero` gives: no crop can put a face under the headline. `plate`
 * and `night` because the photograph is a light room in either theme.
 *
 * Not a link. The row under it is the thing to press; this says why to.
 */
export function OfferBanner({
  badge,
  title,
  body,
  photo,
  className,
}: {
  badge?: string
  title: string
  /** Lines under the headline — a price, a note. Strings are set in the body style. */
  body?: React.ReactNode
  photo: string
  className?: string
}) {
  const plate = useColor('text-plate')

  return (
    <View className={cn('relative min-h-44 flex-row overflow-hidden rounded-card bg-plate', className)}>
      <View className="absolute inset-y-0 right-0 w-[46%]">
        <Img src={photo} alt="" contentPosition={{ left: '60%', top: '50%' }} className="absolute inset-0" />
        <LinearGradient
          pointerEvents="none"
          colors={[plate, clear(plate)]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '25%' }}
        />
      </View>

      <View className="relative w-[58%] min-w-0 px-5 pb-5">
        {badge ? (
          <View className="self-start rounded-b-md bg-success px-3 py-1.5">
            <Text className="text-xs font-semibold text-white">{badge}</Text>
          </View>
        ) : null}
        <Text className={cn('text-2xl font-bold leading-tight text-night', badge ? 'mt-4' : 'mt-5')}>{title}</Text>
        {body ? (
          <View className="mt-2">
            {typeof body === 'string' ? (
              <Text className="text-sm leading-relaxed text-night/70">{body}</Text>
            ) : (
              body
            )}
          </View>
        ) : null}
      </View>
    </View>
  )
}

/**
 * The same colour at zero alpha, so the fade runs plate → clear without
 * passing through grey (a plain 'transparent' is clear black).
 */
function clear(color: string): string {
  return /^#[0-9a-f]{6}$/i.test(color) ? `${color}00` : 'transparent'
}
