import { useState } from 'react'
import { View } from 'react-native'
import Constants from 'expo-constants'
import { router, type Href } from 'expo-router'
import {
  Bell,
  BadgeCheck,
  ChevronRight,
  ClipboardList,
  FileText,
  Gift,
  Headset,
  Info,
  LogOut,
  MapPin,
  ShieldCheck,
  Star,
  TicketPercent,
  Trash2,
  UserRound,
  WalletMinimal,
  type LucideIcon,
} from 'lucide-react-native'
import { formatPaise } from '@app/shared'

import { SignInPrompt } from '@/components/ProfileShell'
import { Header, Screen } from '@/components/Screen'
import { useToast } from '@/components/Toast'
import { Icon } from '@/components/ui/Icon'
import { ConfirmModal } from '@/components/ui/Overlay'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'
import { brand } from '@/config/brand'
import { signOut, useAuth } from '@/lib/auth'
import { useContactPhone, usePlus, useWallet } from '@/lib/data/profile'
import { cn } from '@/lib/cn'

/**
 * The Account tab, laid out the way UC lays it out: who you are at the top
 * with Edit, three shortcuts (bookings, wallet, Plus), then one list of
 * everything else, ending with Log out and Delete account set apart at the
 * bottom so neither is tapped on the way to something else.
 */

interface Row {
  href: Href
  label: string
  icon: LucideIcon
  detail?: string
}

const ROWS: Row[] = [
  { href: '/profile/addresses', label: 'Saved addresses', icon: MapPin },
  { href: '/profile/coupons', label: 'Coupons and offers', icon: TicketPercent },
  { href: '/profile/refer', label: 'Refer and earn', icon: Gift, detail: 'Get ₹250 for every friend' },
  { href: '/profile/reviews', label: 'My reviews', icon: Star },
  { href: '/profile/warranties', label: 'Warranties', icon: ShieldCheck },
  { href: '/profile/notification-settings', label: 'Notification settings', icon: Bell },
  { href: '/support', label: 'Help and support', icon: Headset },
  { href: '/profile/about', label: `About ${brand.name}`, icon: Info },
]

const LEGAL: Row[] = [
  { href: '/legal/terms', label: 'Terms of use', icon: FileText },
  { href: '/legal/privacy', label: 'Privacy policy', icon: FileText },
  { href: '/legal/cancellation', label: 'Cancellation policy', icon: FileText },
]

const VERSION = Constants.expoConfig?.version

export function AccountScreen() {
  const { user, ready } = useAuth()
  return (
    <Screen tab header={<Header title="Account" />}>
      {!ready ? null : user ? (
        <SignedIn name={user.displayName ?? 'Customer'} email={user.email} />
      ) : (
        <View className="pt-4">
          <SignInPrompt
            icon={UserRound}
            title="Your account"
            description="Log in to see your bookings, addresses, wallet and Plus."
          />
          <Menu rows={LEGAL} className="mt-8" />
        </View>
      )}
      {VERSION ? <Text className="mt-8 text-center text-xs text-muted">{`${brand.name} · version ${VERSION}`}</Text> : null}
    </Screen>
  )
}

function SignedIn({ name, email }: { name: string; email: string | null }) {
  const phone = useContactPhone()
  const wallet = useWallet()
  const plus = usePlus()
  const toast = useToast()
  const [leaving, setLeaving] = useState(false)
  const [confirm, setConfirm] = useState(false)

  async function logOut(): Promise<void> {
    setLeaving(true)
    try {
      await signOut()
      setConfirm(false)
      router.replace('/login')
    } catch {
      toast.show('We could not log you out. Please try again.', { tone: 'error' })
    } finally {
      setLeaving(false)
    }
  }

  return (
    <View className="pt-4">
      <View className="flex-row items-center gap-4">
        <View className="size-16 items-center justify-center rounded-full bg-brand-soft">
          <Text className="text-2xl font-bold text-brand">{name.slice(0, 1).toUpperCase()}</Text>
        </View>
        <View className="min-w-0 flex-1">
          <Text numberOfLines={1} className="text-xl font-bold text-ink">
            {name}
          </Text>
          {email ? <Text numberOfLines={1} className="text-sm text-muted">{email}</Text> : null}
          {phone.data ? <Text className="text-sm text-muted">{`+91 ${phone.data}`}</Text> : null}
        </View>
        <Tappable href="/profile/personal" accessibilityLabel="Edit profile" className="min-h-11 justify-center px-2">
          <Text className="text-sm font-semibold text-brand">Edit</Text>
        </Tappable>
      </View>

      <View className="mt-6 flex-row gap-3">
        <Tile href="/bookings" icon={ClipboardList} label="Bookings" caption="My" />
        <Tile href="/profile/wallet" icon={WalletMinimal} label={wallet.data ? formatPaise(wallet.data.balance) : 'Wallet'} caption="Wallet" />
        <Tile href="/profile/membership" icon={BadgeCheck} label={plus.data?.membership ? 'Member' : 'Plus'} caption={plus.data?.membership ? 'Plus' : 'Join'} />
      </View>

      <Menu rows={ROWS} className="mt-6" />
      <Menu rows={LEGAL} className="mt-6" />

      <View className="mt-6 overflow-hidden rounded-card border border-border">
        <Tappable onPress={() => setConfirm(true)} className="min-h-14 flex-row items-center gap-3 border-b border-border px-4 active:bg-surface active:opacity-100">
          <Icon as={LogOut} className="size-5 text-ink" />
          <Text className="flex-1 text-base text-ink">Log out</Text>
        </Tappable>
        <Tappable href="/profile/delete-account" className="min-h-14 flex-row items-center gap-3 px-4 active:bg-surface active:opacity-100">
          <Icon as={Trash2} className="size-5 text-error" />
          <Text className="flex-1 text-base text-error">Delete account</Text>
        </Tappable>
      </View>

      <ConfirmModal
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={() => void logOut()}
        loading={leaving}
        title={`Log out of ${brand.name}?`}
        description={email ? `You are logged in as ${email}. Your bookings stay saved to this account.` : 'Your bookings stay saved to your account.'}
        confirmLabel="Log out"
        cancelLabel="Stay logged in"
      />
    </View>
  )
}

function Tile({ href, icon, label, caption }: { href: Href; icon: LucideIcon; label: string; caption?: string }) {
  return (
    <Tappable href={href} className="min-h-24 flex-1 justify-between rounded-card border border-border p-3 active:bg-surface active:opacity-100">
      <Icon as={icon} className="size-5 text-brand" />
      <View>
        {caption ? <Text className="text-xs text-muted">{caption}</Text> : null}
        <Text numberOfLines={1} className="text-sm font-semibold text-ink">
          {label}
        </Text>
      </View>
    </Tappable>
  )
}

function Menu({ rows, className }: { rows: Row[]; className?: string }) {
  return (
    <View className={cn('overflow-hidden rounded-card border border-border', className)}>
      {rows.map((row, index) => (
        <Tappable
          key={row.label}
          href={row.href}
          className={cn('min-h-14 flex-row items-center gap-3 px-4 py-3 active:bg-surface active:opacity-100', index < rows.length - 1 && 'border-b border-border')}
        >
          <Icon as={row.icon} className="size-5 text-muted" />
          <View className="min-w-0 flex-1">
            <Text className="text-base text-ink">{row.label}</Text>
            {row.detail ? <Text className="text-xs text-muted">{row.detail}</Text> : null}
          </View>
          <Icon as={ChevronRight} className="size-4 text-muted" />
        </Tappable>
      ))}
    </View>
  )
}
