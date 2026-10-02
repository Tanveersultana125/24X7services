import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { router, type Href } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import { brand } from '@/config/brand'
import { cn } from '@/lib/cn'
import { Icon, useColor } from '@/components/ui/Icon'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'

/**
 * The frame the three sign-in steps sit in: number, code, name.
 *
 * It gives them the front door's brand block and drops the form onto a sheet
 * that laps over it. The question is in the coloured block rather than on the
 * sheet. Someone handing over their phone number is deciding whether to trust
 * an app, and the two things they check first — whose app is this, what is it
 * asking for — arrive in the same glance.
 *
 * A step counter would be dishonest here: the name step only happens for
 * somebody we have never met, so "2 of 3" would be a lie to half the people
 * who read it.
 */
export function AuthShell({
  title,
  subtitle,
  showBack = true,
  backFallback = '/home',
  children,
}: {
  title: string
  /** One line under it, on the brand block. */
  subtitle?: React.ReactNode
  showBack?: boolean
  backFallback?: Href
  children: React.ReactNode
}) {
  const insets = useSafeAreaInsets()
  const deep = useColor('text-brand-deep')
  const blue = useColor('text-brand')

  function goBack(): void {
    // Someone who opened the app on this route has nothing behind them.
    if (router.canGoBack()) router.back()
    else router.push(backFallback)
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-brand-deep"
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="grow"
        keyboardShouldPersistTaps="handled"
        // The sheet is the page colour all the way down; overscroll past the
        // top shows the brand block's own colour.
        bounces={false}
        overScrollMode="never"
      >
        <LinearGradient colors={[deep, blue]} style={{ paddingTop: insets.top }}>
          <View className="px-4">
            <View className="min-h-14 flex-row items-center justify-between gap-3">
              {showBack ? (
                <Tappable
                  onPress={goBack}
                  accessibilityLabel="Go back"
                  className="-ml-2 size-11 items-center justify-center rounded-full active:bg-white/10 active:opacity-100"
                >
                  <Icon as={ArrowLeft} className="size-5 text-white" />
                </Tappable>
              ) : (
                <View className="size-11" />
              )}
              <Text className="text-lg font-extrabold tracking-tight text-white">{brand.wordmark}</Text>
            </View>

            <Text accessibilityRole="header" className="mt-3 text-2xl font-bold text-white">
              {title}
            </Text>
            {/* A fragment subtitle (the code screen's "Sent to +91 …") nests
                its own <Text> runs inside this one. */}
            {subtitle ? (
              <Text className="mt-2 text-sm leading-[22px] text-white/75">{subtitle}</Text>
            ) : null}
          </View>
          {/* The sheet laps over this, so the block needs height under the
              text for it to lap onto. */}
          <View className="h-8" />
        </LinearGradient>

        <View
          className="-mt-5 flex-1 rounded-t-[28px] bg-bg px-4 pt-7"
          style={{ paddingBottom: 48 + insets.bottom }}
        >
          {children}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

/**
 * A note that only exists because the emulators are running. Marked as a
 * developer aid rather than dressed as product copy.
 */
export function DevNote({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <View className={cn('rounded-card border border-dashed border-border px-3 py-2.5', className)}>
      <Text className="text-xs text-muted">
        <Text className="text-xs font-semibold uppercase tracking-[0.7px] text-ink">Dev </Text>
        {children}
      </Text>
    </View>
  )
}
