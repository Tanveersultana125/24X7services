import { Linking, View } from 'react-native'
import { Headphones, MessageCircle, Phone } from 'lucide-react-native'
import { Card } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'
import { cn } from '@/lib/cn'

/**
 * The "we are here" block on Home and at the foot of a booking.
 *
 * The phone number comes from `config/business.supportPhone` rather than being
 * written into the markup, so changing it is a config edit and not a release.
 */

export interface SupportCardProps {
  supportPhone: string
  className?: string
}

export function SupportCard({ supportPhone, className }: SupportCardProps) {
  return (
    <Card className={cn('overflow-hidden bg-surface', className)}>
      <View className="flex-row items-start gap-3 p-4">
        <View className="size-10 shrink-0 items-center justify-center rounded-full bg-ink">
          <Icon as={Headphones} className="size-5 text-bg" />
        </View>
        <View className="min-w-0 flex-1">
          <Text accessibilityRole="header" className="text-base font-semibold text-ink">
            Help, any hour of the day
          </Text>
          <Text className="mt-0.5 text-sm text-muted">
            Something not right with a booking? Talk to us.
          </Text>
        </View>
      </View>

      <View className="flex-row gap-2 border-t border-border p-3">
        <Tappable
          accessibilityRole="link"
          onPress={() => void Linking.openURL(`tel:${supportPhone}`)}
          className="min-h-11 flex-1 flex-row items-center justify-center gap-2 rounded-pill bg-ink"
        >
          <Icon as={Phone} className="size-4 text-bg" />
          <Text className="text-sm font-semibold text-bg">Call</Text>
        </Tappable>
        <Tappable
          href="/support"
          className="min-h-11 flex-1 flex-row items-center justify-center gap-2 rounded-pill border border-ink bg-bg"
        >
          <Icon as={MessageCircle} className="size-4 text-ink" />
          <Text className="text-sm font-semibold text-ink">Chat</Text>
        </Tappable>
      </View>
    </Card>
  )
}
