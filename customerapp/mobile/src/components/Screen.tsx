import { RefreshControl, ScrollView, View, type ScrollViewProps } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, type Href } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import { cn } from '@/lib/cn'
import { Icon, useColor } from '@/components/ui/Icon'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'

/* ---------------------------------------------------------------------------
   The frame every screen sits in — the native counterpart of the web app's
   AppShell / BookingShell / ProfileShell, Header and StickyCTA.

   <Screen header={<Header title="…" showBack />} footer={<StickyCTA>…}>
     <Section title="…">…</Section>
   </Screen>

   The header owns the top safe area. The footer sits under the scroll view
   (not over it), so nothing needs a spacer to stay reachable. Tab screens get
   the bottom inset from the tab bar; pushed screens get it from the footer, or
   from the scroll padding when there is no footer.
   --------------------------------------------------------------------------- */

export interface ScreenProps {
  header?: React.ReactNode
  footer?: React.ReactNode
  /** False for a screen that lays out its own scrolling (a FlatList, a map). */
  scroll?: boolean
  /** True on the five tab screens, whose bottom inset the tab bar already takes. */
  tab?: boolean
  /** Pull to refresh. */
  onRefresh?: () => void
  refreshing?: boolean
  /** Classes on the scroll content. Defaults to the page column's padding. */
  contentClassName?: string
  className?: string
  scrollProps?: Omit<ScrollViewProps, 'children'>
  children: React.ReactNode
}

export function Screen({
  header,
  footer,
  scroll = true,
  tab = false,
  onRefresh,
  refreshing = false,
  contentClassName,
  className,
  scrollProps,
  children,
}: ScreenProps) {
  const insets = useSafeAreaInsets()
  const spinner = useColor('text-brand')
  const bottom = tab || footer ? 0 : insets.bottom

  return (
    <View className={cn('flex-1 bg-bg', className)}>
      {header ?? <View style={{ height: insets.top }} />}
      {scroll ? (
        <ScrollView
          className="flex-1"
          contentContainerClassName={cn('px-4 pb-10', contentClassName)}
          contentContainerStyle={{ paddingBottom: 40 + bottom }}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={spinner} colors={[spinner]} />
            ) : undefined
          }
          {...scrollProps}
        >
          {children}
        </ScrollView>
      ) : (
        <View className="flex-1" style={{ paddingBottom: bottom }}>
          {children}
        </View>
      )}
      {footer}
    </View>
  )
}

export interface HeaderProps {
  title?: string
  /** Shown under the title — a booking reference, a step counter. */
  subtitle?: string
  showBack?: boolean
  /** Used when there is nothing to go back to (opened from a link). */
  backFallback?: Href
  /** Replaces going back, for the end of a flow you must not walk back into. */
  onBack?: () => void
  right?: React.ReactNode
  transparent?: boolean
  className?: string
}

/** The screen header: back, a title, and whatever the screen needs on the right. */
export function Header({
  title,
  subtitle,
  showBack = false,
  backFallback = '/home',
  onBack,
  right,
  transparent = false,
  className,
}: HeaderProps) {
  const insets = useSafeAreaInsets()

  function goBack(): void {
    if (onBack) return onBack()
    if (router.canGoBack()) router.back()
    else router.replace(backFallback)
  }

  return (
    <View
      className={cn(transparent ? 'bg-transparent' : 'border-b border-border bg-bg', className)}
      style={{ paddingTop: insets.top }}
    >
      <View className="min-h-14 flex-row items-center gap-2 px-2">
        {showBack ? (
          <Tappable
            onPress={goBack}
            accessibilityLabel="Go back"
            className="size-11 items-center justify-center rounded-full active:bg-surface"
          >
            <Icon as={ArrowLeft} className="size-5 text-ink" />
          </Tappable>
        ) : (
          <View className="w-2" />
        )}
        <View className="min-w-0 flex-1">
          {title ? (
            <Text accessibilityRole="header" numberOfLines={1} className="text-lg font-semibold text-ink">
              {title}
            </Text>
          ) : null}
          {subtitle ? (
            <Text numberOfLines={1} className="text-xs text-muted">
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right ? <View className="flex-row items-center gap-1">{right}</View> : null}
      </View>
    </View>
  )
}

/** The icon button shape the header's right slot expects. */
export function HeaderAction({
  href,
  onPress,
  label,
  badge = false,
  children,
}: {
  href?: Href
  onPress?: () => void
  label: string
  badge?: boolean
  children: React.ReactNode
}) {
  return (
    <Tappable
      {...(href ? { href } : {})}
      onPress={onPress}
      accessibilityLabel={label}
      className="relative size-11 items-center justify-center rounded-full active:bg-surface"
    >
      {children}
      {badge ? <View className="absolute right-2 top-2 size-2 rounded-full bg-error" /> : null}
    </Tappable>
  )
}

/** A titled block. Every screen is a stack of these. */
export function Section({
  title,
  subtitle,
  action,
  className,
  children,
}: {
  title?: string
  subtitle?: string
  /** A "See all" link, aligned with the heading. */
  action?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <View className={cn('mt-8', className)}>
      {title ? (
        <View className="mb-3 flex-row items-end justify-between gap-3">
          <View className="min-w-0 flex-1">
            <Text accessibilityRole="header" className="text-xl font-bold text-ink">
              {title}
            </Text>
            {subtitle ? <Text className="mt-0.5 text-sm text-muted">{subtitle}</Text> : null}
          </View>
          {action}
        </View>
      ) : null}
      {children}
    </View>
  )
}

/**
 * The bar pinned to the foot of a screen: the one action, and optionally a
 * detail (a price, a count) beside it. Pass it as Screen's `footer`.
 */
export function StickyCTA({
  detail,
  children,
  tab = false,
  className,
}: {
  detail?: React.ReactNode
  children: React.ReactNode
  /** True on a tab screen, where the tab bar already took the bottom inset. */
  tab?: boolean
  className?: string
}) {
  const insets = useSafeAreaInsets()
  return (
    <View
      className={cn('border-t border-border bg-bg px-4 pt-3', className)}
      style={{ paddingBottom: 12 + (tab ? 0 : insets.bottom) }}
    >
      <View className="flex-row items-center gap-3">
        {detail ? <View className="min-w-0 flex-1">{detail}</View> : null}
        <View className={detail ? 'shrink-0' : 'w-full'}>{children}</View>
      </View>
    </View>
  )
}
