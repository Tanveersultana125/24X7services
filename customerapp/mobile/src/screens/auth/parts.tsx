import { useState } from 'react'
import { View } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { router, type Href } from 'expo-router'
import { Eye, EyeOff } from 'lucide-react-native'

import { Button } from '@/components/ui/Button'
import { Input, type InputProps } from '@/components/ui/Field'
import { Icon } from '@/components/ui/Icon'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'
import type { AuthUser } from '@/lib/authStore'
import { hasName } from '@/lib/data/auth'
import { locationStore } from '@/lib/location'
import { useTokenColors } from '@/lib/useTokenColors'

/**
 * The pieces the sign-in screens share: the Google button, the "or" rule, the
 * password field, the terms line, and where to go once someone is in.
 */

/** Google's "G", in Google's colours (fixed tokens in global.css). */
function GoogleMark() {
  const [blue, red, yellow, green] = useTokenColors(['google-blue', 'google-red', 'google-yellow', 'google-green'] as const)
  return (
    <Svg width={20} height={20} viewBox="0 0 48 48" accessibilityElementsHidden importantForAccessibility="no">
      <Path fill={yellow} d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z" />
      <Path fill={red} d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <Path fill={green} d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <Path fill={blue} d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.2-.1-2.4-.4-3.5z" />
    </Svg>
  )
}

export function GoogleButton({ onPress, loading }: { onPress: () => void; loading: boolean }) {
  return (
    <Button variant="secondary" fullWidth size="lg" onPress={onPress} loading={loading} iconLeft={<GoogleMark />}>
      Continue with Google
    </Button>
  )
}

/** The rule between the Google button and the email form. */
export function OrDivider({ label = 'or use your email' }: { label?: string }) {
  return (
    <View className="my-6 flex-row items-center gap-3" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View className="h-px flex-1 bg-border" />
      <Text className="text-xs font-medium uppercase tracking-[0.7px] text-muted">{label}</Text>
      <View className="h-px flex-1 bg-border" />
    </View>
  )
}

/** A password field with a show/hide switch beside its label, not hidden inside the box. */
export function PasswordInput(props: Omit<InputProps, 'secureTextEntry'>) {
  const [shown, setShown] = useState(false)
  return (
    <View>
      <Input
        {...props}
        secureTextEntry={!shown}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Tappable
        onPress={() => setShown((value) => !value)}
        accessibilityLabel={shown ? 'Hide password' : 'Show password'}
        className="absolute -top-3 right-0 min-h-11 flex-row items-center gap-1 px-1"
      >
        <Icon as={shown ? EyeOff : Eye} className="size-4 text-brand" />
        <Text className="text-sm font-medium text-brand">{shown ? 'Hide' : 'Show'}</Text>
      </Tappable>
    </View>
  )
}

/** The line under every sign-in form. */
export function TermsNote() {
  return (
    <Text className="mt-6 text-center text-xs leading-[18px] text-muted">
      By continuing you agree to our{' '}
      <Text accessibilityRole="link" onPress={() => router.push('/legal/terms')} className="text-xs font-semibold text-brand">
        Terms
      </Text>{' '}
      and{' '}
      <Text accessibilityRole="link" onPress={() => router.push('/legal/privacy')} className="text-xs font-semibold text-brand">
        Privacy Policy
      </Text>
      .
    </Text>
  )
}

/**
 * Where someone goes once they are signed in: the profile step if we do not
 * have their name yet, the location step if the device has no area saved,
 * and otherwise wherever they were headed.
 */
export function continueAfterSignIn(user: AuthUser, next: Href): void {
  if (!hasName(user)) {
    router.replace(`/login/name?next=${encodeURIComponent(String(next))}` as Href)
  } else if (!locationStore.getSnapshot().value) {
    router.replace('/location')
  } else {
    router.replace(next)
  }
}
