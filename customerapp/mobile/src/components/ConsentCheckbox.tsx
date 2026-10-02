import { View } from 'react-native'
import { router } from 'expo-router'
import { Check } from 'lucide-react-native'
import { Icon } from '@/components/ui/Icon'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'
import { cn } from '@/lib/cn'

/**
 * The Terms and Privacy tick on the login screen. Required — sign-in is blocked
 * until it is checked, and the version accepted is stamped onto the user
 * document so a later change to the terms is a re-consent rather than a silent
 * substitution.
 *
 * The drawn box sits in a 44px hit area announced as a checkbox; the two links
 * in the sentence beside it open the documents without ticking anything.
 */

export interface ConsentCheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  error?: string
  className?: string
}

export function ConsentCheckbox({ checked, onChange, error, className }: ConsentCheckboxProps) {
  return (
    <View className={cn('gap-1.5', className)}>
      <View className="flex-row items-start">
        <Tappable
          accessibilityRole="checkbox"
          accessibilityState={{ checked }}
          accessibilityLabel="I agree to the Terms of Service and Privacy Policy"
          accessibilityHint={error}
          onPress={() => onChange(!checked)}
          className="-ml-2.5 size-11 shrink-0 items-center justify-center active:opacity-100"
        >
          <View
            className={cn(
              'size-5 items-center justify-center rounded border-2',
              checked ? 'border-brand bg-brand' : error ? 'border-error bg-bg' : 'border-muted bg-bg'
            )}
          >
            {checked ? <Icon as={Check} className="size-3.5 text-white" strokeWidth={3} /> : null}
          </View>
        </Tappable>

        <Text className="min-w-0 flex-1 pl-1 pt-2.5 text-sm leading-[22px] text-muted">
          I agree to the{' '}
          <Text
            accessibilityRole="link"
            onPress={() => router.push('/legal/terms')}
            className="text-sm font-medium leading-[22px] text-brand underline"
          >
            Terms of Service
          </Text>{' '}
          and{' '}
          <Text
            accessibilityRole="link"
            onPress={() => router.push('/legal/privacy')}
            className="text-sm font-medium leading-[22px] text-brand underline"
          >
            Privacy Policy
          </Text>
          .
        </Text>
      </View>

      {error ? (
        <Text accessibilityRole="alert" className="pl-10 text-xs text-error">
          {error}
        </Text>
      ) : null}
    </View>
  )
}
