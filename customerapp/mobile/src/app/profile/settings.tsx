import { useCallback, useState } from 'react'
import { View } from 'react-native'
import { router, type Href } from 'expo-router'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { Bell, BellRing, ChevronRight, Download, Lock, ShieldAlert, type LucideIcon } from 'lucide-react-native'
import { COL, DEFAULT_NOTIFICATION_PREFS, userProfileSchema, type NotificationPrefs } from '@app/shared'

import { ProfileShell, useSignInHref } from '@/components/ProfileShell'
import { SwitchRow } from '@/components/ui/Switch'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Field'
import { Icon } from '@/components/ui/Icon'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'
import { ConfirmModal } from '@/components/Modal'
import { Skeleton, SkeletonGroup } from '@/components/SkeletonLoader'
import { useToast } from '@/components/Toast'
import { callFn, friendlyError } from '@/lib/callables'
import { signOut } from '@/lib/auth'
import { db } from '@/lib/firebase'
import { collectMyData, downloadJson } from '@/lib/exportData'
import { enablePushNotifications, PUSH_IS_CONFIGURED } from '@/lib/push'
import { useAsync } from '@/lib/useAsync'
import { cn } from '@/lib/cn'

/**
 * What we may send, what we hold, and the way out.
 *
 * Two switches, not five. Every settings screen in this category lists SMS,
 * email, WhatsApp and voice calls; this app sends on none of them, and a
 * switch for a channel nobody sends on is a promise the customer will act on
 * and then wonder why nothing changed.
 *
 * The messages about a booking in progress have no switch at all, and the
 * screen says so rather than leaving the gap to be noticed.
 *
 * Downloading everything we hold is a button, not a request form: it is built
 * on the device out of reads the customer is already allowed to make. Closing
 * the account is under it, in the danger tone, behind a typed confirmation —
 * but it is here and plainly labelled.
 *
 * Signed out it draws itself rather than swapping for a sign-in prompt: the
 * switches, what cannot be turned off, and the three legal documents are what
 * the screen is *about*, and the documents are readable by anyone. So the
 * structure stands, the controls that need an account are inert and say why,
 * and the links that never needed one keep working.
 *
 * There is no theme switch: the app follows the phone's light or dark mode.
 */

const LEGAL: ReadonlyArray<{ href: Href; label: string }> = [
  { href: '/legal/terms', label: 'Terms of Service' },
  { href: '/legal/privacy', label: 'Privacy Policy' },
  { href: '/legal/cancellation', label: 'Cancellation and refunds' },
]

export default function SettingsScreen() {
  return (
    <ProfileShell title="Settings" signedOut={<Settings uid={null} />}>
      {(user) => <Settings uid={user.uid} />}
    </ProfileShell>
  )
}

function Settings({ uid }: { uid: string | null }) {
  const toast = useToast()
  const signIn = useSignInHref()
  const [closing, setClosing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [exporting, setExporting] = useState(false)

  async function close(): Promise<void> {
    // The dialog says the button does nothing until this is typed, so it does
    // nothing until this is typed.
    if (confirmation !== 'DELETE') return

    setDeleting(true)
    try {
      await callFn('deleteAccount', { confirm: 'DELETE' })
      await signOut()
      toast.show('Your account has been closed.')
      router.replace('/home')
    } catch (error) {
      toast.show(friendlyError(error), { tone: 'error' })
    } finally {
      setDeleting(false)
      setClosing(false)
    }
  }

  async function exportData(): Promise<void> {
    if (exporting || !uid) return
    setExporting(true)
    try {
      const data = await collectMyData(uid)
      const stamp = new Date().toISOString().slice(0, 10)
      downloadJson(data, `24x7-my-data-${stamp}.json`)
      toast.show('Your data has been downloaded.', { tone: 'success' })
    } catch {
      toast.show('We could not put that file together. Please try again.', { tone: 'error' })
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      <Notifications uid={uid} />

      <Band />

      <View>
        <Text accessibilityRole="header" className="text-lg font-bold text-ink">
          Privacy & data
        </Text>
        <View className="mt-2 border-y border-border">
          <AccountRow
            icon={Download}
            label={exporting ? 'Putting your file together…' : 'Download your data'}
            detail="Everything we hold about you, as one file"
            signIn={uid ? null : signIn}
            disabled={exporting}
            onClick={() => void exportData()}
          />
          <View className="h-px bg-border" />
          <AccountRow
            icon={ShieldAlert}
            label="Close your account"
            detail="Removes your profile, addresses and saved appliances"
            danger
            signIn={uid ? null : signIn}
            onClick={() => setClosing(true)}
          />
        </View>

        <Text className="mt-3 text-xs leading-[20px] text-muted">
          Invoices we have already issued you are kept — the law requires it — with your name taken off them. Any
          booking that is still open has to be cancelled or finished before an account can close.
        </Text>
      </View>

      <Band />

      <View className="pb-6">
        <Text accessibilityRole="header" className="text-lg font-bold text-ink">
          The legal bits
        </Text>
        <View className="mt-2 border-y border-border">
          {LEGAL.map((item, index) => (
            <Tappable
              key={item.label}
              href={item.href}
              className={cn(
                'flex-row items-center gap-4 py-4 active:bg-surface active:opacity-100',
                index > 0 && 'border-t border-border'
              )}
            >
              <Text className="flex-1 text-base font-medium text-ink">{item.label}</Text>
              <Icon as={ChevronRight} className="size-5 shrink-0 text-muted" />
            </Tappable>
          ))}
        </View>
      </View>

      <ConfirmModal
        open={closing}
        onClose={() => {
          setClosing(false)
          setConfirmation('')
        }}
        onConfirm={() => void close()}
        loading={deleting}
        destructive
        title="Close your account?"
        description="This cannot be undone. Any booking that is still open has to be cancelled or finished first."
        confirmLabel="Close my account"
        cancelLabel="Keep my account"
      >
        {/* Typed rather than tapped: a destructive button one thumb-width from
            a dismiss button is a button that gets pressed by accident. */}
        <Input
          label="Type DELETE to confirm"
          value={confirmation}
          onChangeText={(text) => setConfirmation(text.toUpperCase())}
          placeholder="DELETE"
          autoComplete="off"
          autoCorrect={false}
          autoCapitalize="characters"
        />
        {confirmation !== 'DELETE' ? (
          <Text className="mt-2 text-xs text-muted">The button below does nothing until this says DELETE.</Text>
        ) : null}
      </ConfirmModal>
    </>
  )
}

// ---------------------------------------------------------------------------

/**
 * What we may send, and on which channel.
 *
 * Turning push on is two things, not one: a preference we store, and a
 * permission only the phone can grant. The switch asks for the permission
 * first and only stores the preference if it is given — storing "on" against a
 * phone that is blocking notifications would be a setting that reads as on and
 * sends nothing.
 */
function Notifications({ uid }: { uid: string | null }) {
  const toast = useToast()
  const signIn = useSignInHref()
  const load = useCallback(async (): Promise<NotificationPrefs> => {
    if (!uid) return DEFAULT_NOTIFICATION_PREFS
    const snap = await getDoc(doc(db(), COL.users, uid))
    const parsed = userProfileSchema.safeParse(snap.data())
    return (parsed.success ? parsed.data.notifications : undefined) ?? DEFAULT_NOTIFICATION_PREFS
  }, [uid])

  const prefs = useAsync(load)
  const [local, setLocal] = useState<NotificationPrefs | null>(null)
  const [saving, setSaving] = useState<keyof NotificationPrefs | null>(null)

  const current = local ?? prefs.data ?? DEFAULT_NOTIFICATION_PREFS

  async function set(key: keyof NotificationPrefs, next: boolean): Promise<void> {
    if (saving || !uid) return
    const before = current
    setLocal({ ...current, [key]: next })
    setSaving(key)

    try {
      if (key === 'push' && next) {
        const outcome = await enablePushNotifications()
        if (outcome.kind === 'enabled') {
          await callFn('registerFcmToken', { token: outcome.token })
        } else {
          setLocal(before)
          toast.show(
            outcome.kind === 'denied'
              ? 'Your phone is blocking notifications from this app. Turn them on in its settings.'
              : outcome.reason,
            { tone: 'warning' }
          )
          return
        }
      }

      await savePrefs(uid, { ...current, [key]: next })
    } catch {
      setLocal(before)
      toast.show('We could not save that. Please try again.', { tone: 'error' })
    } finally {
      setSaving(null)
    }
  }

  if (prefs.status === 'loading') {
    return (
      <SkeletonGroup label="Loading settings" className="mt-6 gap-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </SkeletonGroup>
    )
  }

  return (
    <View className="mt-6">
      <Text accessibilityRole="header" className="text-lg font-bold text-ink">
        Notifications
      </Text>

      <View className="mt-1 border-y border-border">
        <SwitchRow
          icon={BellRing}
          label="Push notifications"
          description={
            PUSH_IS_CONFIGURED
              ? 'On this device, when a booking moves'
              : 'Needs the push key this build was made without'
          }
          checked={Boolean(uid) && current.push && PUSH_IS_CONFIGURED}
          onChange={(next) => void set('push', next)}
          busy={saving === 'push'}
          disabled={!PUSH_IS_CONFIGURED}
          {...(uid ? {} : { href: signIn })}
        />
        <View className="h-px bg-border" />
        <SwitchRow
          icon={Bell}
          label="In-app notifications"
          description="The list under Profile, Notifications"
          checked={Boolean(uid) && current.inApp}
          onChange={(next) => void set('inApp', next)}
          busy={saving === 'inApp'}
          {...(uid ? {} : { href: signIn })}
        />
      </View>

      {!uid ? (
        <Text className="mt-3 text-sm text-muted">
          Both belong to an account — pressing either one signs you in first, and brings you back here.
        </Text>
      ) : null}

      {/* The gap, named. Leaving it to be noticed is how a customer decides
          the switches above are not the whole story. */}
      <Card className="mt-3 bg-surface p-4">
        <View className="flex-row items-center gap-2">
          <Icon as={Lock} className="size-4 shrink-0 text-muted" />
          <Text className="flex-1 text-sm font-semibold text-ink">Messages about a booking cannot be turned off</Text>
        </View>
        <Text className="mt-1 text-sm leading-[22px] text-muted">
          When a technician is assigned, when they set off, and when a quote needs your answer. Those are the service
          itself — switching them off would mean somebody arriving at your door unannounced. We send nothing else: no
          offers, no reminders to book again.
        </Text>
      </Card>
    </View>
  )
}

/**
 * A row under Privacy & data.
 *
 * A button when there is an account to act on, a link to the sign-in when
 * there is not — same row, same words either way, so the screen does not
 * change shape under somebody who signs in from it.
 */
function AccountRow({
  icon,
  label,
  detail,
  danger = false,
  disabled = false,
  signIn,
  onClick,
}: {
  icon: LucideIcon
  label: string
  detail: string
  danger?: boolean
  disabled?: boolean
  /** Set when nobody is signed in: where the row goes instead. */
  signIn: Href | null
  onClick: () => void
}) {
  return (
    <Tappable
      {...(signIn ? { href: signIn } : { onPress: onClick, disabled })}
      className={cn(
        'w-full flex-row items-center gap-4 py-4 active:bg-surface active:opacity-100',
        disabled && 'opacity-60'
      )}
    >
      <Icon as={icon} className={cn('size-5 shrink-0', danger ? 'text-error' : 'text-ink')} />
      <View className="min-w-0 flex-1">
        <Text className={cn('text-base font-medium', danger ? 'text-error' : 'text-ink')}>{label}</Text>
        <Text className="mt-0.5 text-xs text-muted">{detail}</Text>
      </View>
      <Icon as={ChevronRight} className="size-5 shrink-0 text-muted" />
    </Tappable>
  )
}

/**
 * The write, kept outside the component — `Date.now` in a render is a bug
 * waiting for a re-render, even when it only ever runs from a tap.
 */
async function savePrefs(uid: string, prefs: NotificationPrefs): Promise<void> {
  await setDoc(doc(db(), COL.users, uid), { notifications: prefs, updatedAt: Date.now() }, { merge: true })
}

function Band() {
  return <View aria-hidden className="-mx-4 my-6 h-2 bg-surface" />
}
