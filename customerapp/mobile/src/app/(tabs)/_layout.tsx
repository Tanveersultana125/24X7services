import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Tabs, type BottomTabBarProps } from 'expo-router/js-tabs'
import { CalendarCheck, Headphones, Home, User, Wrench, type LucideIcon } from 'lucide-react-native'
import { cn } from '@/lib/cn'
import { Icon } from '@/components/ui/Icon'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'

/**
 * The five places a customer goes — the same five, in the same order, as the
 * web app's BottomNavigation. Everything else is pushed over them.
 */

const TABS: Record<string, { label: string; icon: LucideIcon }> = {
  home: { label: 'Home', icon: Home },
  services: { label: 'Services', icon: Wrench },
  bookings: { label: 'Bookings', icon: CalendarCheck },
  support: { label: 'Support', icon: Headphones },
  profile: { label: 'Profile', icon: User },
}

/** The tab bar's own height, above the safe area. */
export const TAB_BAR_HEIGHT = 72

function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()
  return (
    <View className="flex-row border-t border-border bg-bg" style={{ paddingBottom: insets.bottom }}>
      {state.routes.map((route, index) => {
        const tab = TABS[route.name]
        if (!tab) return null
        const active = state.index === index
        return (
          <Tappable
            key={route.key}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: active }}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true })
              if (!active && !event.defaultPrevented) navigation.navigate(route.name)
            }}
            className="h-[72px] flex-1 items-center justify-center gap-1 px-0.5"
          >
            <Icon
              as={tab.icon}
              className={cn('size-5', active ? 'text-brand' : 'text-muted')}
              // A heavier stroke is how the active tab reads at a glance.
              strokeWidth={active ? 2.4 : 1.8}
            />
            <Text className={cn('text-[11px] font-medium', active ? 'text-brand' : 'text-muted')}>
              {tab.label}
            </Text>
          </Tappable>
        )
      })}
    </View>
  )
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
      backBehavior="history"
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="services" />
      <Tabs.Screen name="bookings" />
      <Tabs.Screen name="support" />
      <Tabs.Screen name="profile" />
    </Tabs>
  )
}
