import { useSegments } from 'expo-router'
import { Screen, type ScreenProps } from '@/components/Screen'

export { Section } from '@/components/Screen'

/**
 * The frame every tab screen sits in: a header and a content column.
 *
 * The native counterpart of the web AppShell, as a thin wrapper over Screen so
 * a web screen ports line for line. The web's bottom nav is the tab bar here,
 * which only exists on the five tab screens — so whether this screen takes the
 * tab bar's inset is read from the route rather than from `bottomNav`. Cart
 * and Care use AppShell on the web with the nav showing, but on a phone they
 * are pushed over the tabs and own the bottom inset themselves.
 */

export interface AppShellProps {
  /** The header — a Header, or Home's location and search block. */
  mobileHeader?: React.ReactNode
  /** Kept for parity with the web; the tab bar is the (tabs) layout's. */
  bottomNav?: boolean
  /** Forces the tab-screen inset either way. Read from the route when left out. */
  tab?: boolean
  /** A bar pinned under the scroll (a StickyCTA, a CartBar). */
  footer?: React.ReactNode
  scroll?: boolean
  onRefresh?: () => void
  refreshing?: boolean
  scrollProps?: ScreenProps['scrollProps']
  /** Classes on the content column, as on the web's <main>. */
  className?: string
  children: React.ReactNode
}

export function AppShell({
  mobileHeader,
  tab,
  footer,
  scroll,
  onRefresh,
  refreshing,
  scrollProps,
  className,
  children,
}: AppShellProps) {
  const segments = useSegments()
  const onTab = tab ?? segments[0] === '(tabs)'

  return (
    <Screen
      tab={onTab}
      header={mobileHeader}
      footer={footer}
      {...(scroll === undefined ? {} : { scroll })}
      {...(onRefresh ? { onRefresh } : {})}
      {...(refreshing === undefined ? {} : { refreshing })}
      {...(scrollProps ? { scrollProps } : {})}
      {...(className ? { contentClassName: className } : {})}
    >
      {children}
    </Screen>
  )
}
