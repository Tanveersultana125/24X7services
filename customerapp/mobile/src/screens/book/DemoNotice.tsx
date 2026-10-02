import { View } from 'react-native'
import { Info } from 'lucide-react-native'
import { cn } from '@/lib/cn'
import { Icon } from '@/components/ui/Icon'
import { Text } from '@/components/ui/Text'

/**
 * Whether an error is the demo build saying "switched off" rather than
 * something going wrong. That one is shown as a calm note, not a red field
 * error, because nothing the customer typed was wrong.
 */
export function isDemoOff(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code: unknown }).code === 'demo/off'
}

export function DemoNotice({ message, className }: { message: string; className?: string }) {
  return (
    <View
      accessibilityRole="alert"
      className={cn('flex-row items-start gap-3 rounded-card border border-brand/30 bg-brand-soft px-4 py-3', className)}
    >
      <Icon as={Info} className="mt-0.5 size-4 text-brand" />
      <Text className="flex-1 text-sm leading-[22px] text-ink">{message}</Text>
    </View>
  )
}
