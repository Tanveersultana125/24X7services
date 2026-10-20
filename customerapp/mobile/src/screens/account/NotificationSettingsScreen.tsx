import { View } from 'react-native'
import { BellRing, CalendarClock, ChevronRight, Inbox, MessageCircle, Tag, TriangleAlert } from 'lucide-react-native'

import { ProfileShell, SignInPrompt } from '@/components/ProfileShell'
import { Icon } from '@/components/ui/Icon'
import { SwitchRow } from '@/components/ui/Switch'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'
import { useNotificationPrefs, type NotificationPrefs } from '@/lib/data/profile'

/**
 * What we may tell the customer, and where. Four switches, each with the one
 * line that says what it actually sends, so nobody has to guess what turning
 * one off costs them.
 *
 * The settings live on the device and change the moment a switch moves; there
 * is no Save button to forget, no request to fail, and so no error to show.
 * The shell's skeleton covers the moment before we know who is signed in.
 */

type Key = keyof NotificationPrefs

const ROWS: { key: Key; icon: typeof BellRing; label: string; description: string }[] = [
  {
    key: 'bookingUpdates',
    icon: BellRing,
    label: 'Booking updates',
    description: 'Confirmed, professional on the way, work done. Recommended for every booking.',
  },
  {
    key: 'reminders',
    icon: CalendarClock,
    label: 'Reminders before a visit',
    description: 'A nudge the evening before and an hour before your professional arrives.',
  },
  {
    key: 'offers',
    icon: Tag,
    label: 'Offers and discounts',
    description: 'Seasonal deals and coupons. A few a month at most.',
  },
  {
    key: 'whatsapp',
    icon: MessageCircle,
    label: 'WhatsApp messages',
    description: 'Get booking updates and invoices on WhatsApp as well as in the app.',
  },
]

export function NotificationSettingsScreen() {
  return (
    <ProfileShell
      title="Notification settings"
      signedOut={
        <SignInPrompt
          icon={BellRing}
          title="Your notifications"
          description="Choose what we tell you about your bookings, and where. Log in to set it."
        />
      }
    >
      {() => <Settings />}
    </ProfileShell>
  )
}

function Settings() {
  const [prefs, setPrefs] = useNotificationPrefs()

  return (
    <View className="pt-4">
      <View className="rounded-card border border-border px-4">
        {ROWS.map((row, index) => (
          <View key={row.key} className={index < ROWS.length - 1 ? 'border-b border-border' : undefined}>
            <SwitchRow
              icon={row.icon}
              label={row.label}
              description={row.description}
              checked={prefs[row.key]}
              onChange={(next) => setPrefs({ [row.key]: next })}
            />
            {row.key === 'bookingUpdates' && !prefs.bookingUpdates ? (
              <View accessibilityLiveRegion="polite" className="mb-4 flex-row items-start gap-2 rounded-card bg-warning-soft p-3">
                <Icon as={TriangleAlert} className="mt-0.5 size-4 text-warning" />
                <Text className="flex-1 text-xs leading-[18px] text-ink">
                  You will not hear when a professional is assigned or on the way. Calls from them still come through.
                </Text>
              </View>
            ) : null}
          </View>
        ))}
      </View>

      <Text className="mt-3 px-1 text-xs text-muted">
        Payment receipts and security alerts are always sent; they are not marketing.
      </Text>

      <Tappable
        href="/profile/notifications"
        className="mt-6 min-h-14 flex-row items-center gap-3 rounded-card border border-border px-4 active:bg-surface active:opacity-100"
      >
        <Icon as={Inbox} className="size-5 text-ink" />
        <View className="min-w-0 flex-1 py-3">
          <Text className="text-base font-medium text-ink">Notification inbox</Text>
          <Text className="mt-0.5 text-sm text-muted">Everything we have sent you</Text>
        </View>
        <Icon as={ChevronRight} className="size-5 text-muted" />
      </Tappable>
    </View>
  )
}
