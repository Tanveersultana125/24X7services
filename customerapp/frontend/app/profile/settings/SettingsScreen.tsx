'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Route } from 'next'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import {
  Bell,
  BellRing,
  ChevronRight,
  Download,
  Lock,
  Settings as SettingsIcon,
  ShieldAlert,
} from 'lucide-react'
import {
  COL,
  DEFAULT_NOTIFICATION_PREFS,
  userProfileSchema,
  type NotificationPrefs,
} from '@app/shared'

import { ProfileShell, SignInPrompt } from '@/components/ProfileShell'
import { SwitchRow } from '@/components/ui/Switch'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Field'
import { ConfirmModal } from '@/components/Modal'
import { Skeleton, SkeletonGroup } from '@/components/SkeletonLoader'
import { useToast } from '@/components/Toast'
import { callFn, friendlyError } from '@/lib/callables'
import { signOut } from '@/lib/auth'
import { db } from '@/lib/firebase'
import { collectMyData, downloadJson } from '@/lib/exportData'
import { enablePushNotifications, PUSH_IS_CONFIGURED } from '@/lib/push'
import { useAsync } from '@/lib/useAsync'

/**
 * What we may send, what we hold, and the way out.
 *
 * Two switches, not five. Every settings screen in this category lists SMS,
 * email, WhatsApp and voice calls; this app sends on none of them, and a
 * switch for a channel nobody sends on is a promise the customer will act on
 * and then wonder why nothing changed. When one of those channels exists, its
 * switch is one line here and one field in the schema.
 *
 * The messages about a booking in progress have no switch at all, and the
 * screen says so rather than leaving the gap to be noticed. Turning those off
 * would mean a technician arriving at a door nobody was told about — that is
 * the service, not something we send.
 *
 * Downloading everything we hold is a button, not a request form: it is built
 * on the device out of reads the customer is already allowed to make, so there
 * is no job to queue, no email with a link in it, and nothing waiting in a
 * bucket. Closing the account is under it, in the danger tone, behind a typed
 * confirmation — but it is here and plainly labelled. An app that makes
 * leaving hard has decided its customers are a resource.
 */

const LEGAL = [
  { href: '/legal/terms', label: 'Terms of Service' },
  { href: '/legal/privacy', label: 'Privacy Policy' },
  { href: '/legal/cancellation', label: 'Cancellation and refunds' },
] as const satisfies ReadonlyArray<{ href: Route; label: string }>

export function SettingsScreen() {
  return (
    <ProfileShell
      title="Settings"
      signedOut={
        <SignInPrompt
          icon={SettingsIcon}
          title="Your settings"
          description="What we may send you, a copy of everything we hold, and closing your account. Sign in to change them."
        />
      }
    >
      {(user) => <Settings uid={user.uid} />}
    </ProfileShell>
  )
}

function Settings({ uid }: { uid: string }) {
  const router = useRouter()
  const toast = useToast()
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
    if (exporting) return
    setExporting(true)
    try {
      const data = await collectMyData(uid)
      const stamp = new Date().toISOString().slice(0, 10)
      downloadJson(data, `24x7-my-data-${stamp}.json`)
      toast.show('Your data has been downloaded.', { tone: 'success' })
    } catch {
      toast.show('We could not put that file together. Please try again.', {
        tone: 'error',
      })
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      <Notifications uid={uid} />

      <Band />

      <section>
        <h2 className="text-lg font-bold text-ink">Privacy &amp; data</h2>
        <ul className="mt-2 divide-y divide-border border-y border-border">
          <li>
            <button
              type="button"
              onClick={() => void exportData()}
              disabled={exporting}
              className="flex w-full items-center gap-4 py-4 text-left hover:bg-surface disabled:opacity-60"
            >
              <Download className="size-5 shrink-0 text-ink" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block text-base font-medium text-ink">
                  {exporting ? 'Putting your file together…' : 'Download your data'}
                </span>
                <span className="mt-0.5 block text-xs text-muted">
                  Everything we hold about you, as one file
                </span>
              </span>
              <ChevronRight
                className="size-5 shrink-0 text-muted"
                aria-hidden="true"
              />
            </button>
          </li>

          <li>
            <button
              type="button"
              onClick={() => setClosing(true)}
              className="flex w-full items-center gap-4 py-4 text-left hover:bg-surface"
            >
              <ShieldAlert
                className="size-5 shrink-0 text-error"
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-base font-medium text-error">
                  Close your account
                </span>
                <span className="mt-0.5 block text-xs text-muted">
                  Removes your profile, addresses and saved appliances
                </span>
              </span>
              <ChevronRight
                className="size-5 shrink-0 text-muted"
                aria-hidden="true"
              />
            </button>
          </li>
        </ul>

        <p className="mt-3 text-xs leading-relaxed text-muted">
          Invoices we have already issued you are kept — the law requires it —
          with your name taken off them. Any booking that is still open has to
          be cancelled or finished before an account can close.
        </p>
      </section>

      <Band />

      <section className="pb-6">
        <h2 className="text-lg font-bold text-ink">The legal bits</h2>
        <ul className="mt-2 divide-y divide-border border-y border-border">
          {LEGAL.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex items-center gap-4 py-4 hover:bg-surface"
              >
                <span className="flex-1 text-base font-medium text-ink">
                  {item.label}
                </span>
                <ChevronRight
                  className="size-5 shrink-0 text-muted"
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
        </ul>
      </section>

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
          onChange={(event) => setConfirmation(event.target.value.toUpperCase())}
          placeholder="DELETE"
          autoComplete="off"
        />
        {confirmation !== 'DELETE' ? (
          <p className="mt-2 text-xs text-muted">
            The button below does nothing until this says DELETE.
          </p>
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
 * permission only the browser can grant. The switch asks for the permission
 * first and only stores the preference if it is given — storing "on" against a
 * browser that is blocking notifications would be a setting that reads as on
 * and sends nothing.
 */
function Notifications({ uid }: { uid: string }) {
  const toast = useToast()
  const load = useCallback(async (): Promise<NotificationPrefs> => {
    const snap = await getDoc(doc(db(), COL.users, uid))
    const parsed = userProfileSchema.safeParse(snap.data())
    return (
      (parsed.success ? parsed.data.notifications : undefined) ??
      DEFAULT_NOTIFICATION_PREFS
    )
  }, [uid])

  const prefs = useAsync(load)
  const [local, setLocal] = useState<NotificationPrefs | null>(null)
  const [saving, setSaving] = useState<keyof NotificationPrefs | null>(null)

  const current = local ?? prefs.data ?? DEFAULT_NOTIFICATION_PREFS

  async function set(key: keyof NotificationPrefs, next: boolean): Promise<void> {
    if (saving) return
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
              ? 'Your browser is blocking notifications. Turn them on in its site settings.'
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
      <SkeletonGroup label="Loading settings" className="mt-6 flex flex-col gap-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </SkeletonGroup>
    )
  }

  return (
    <section className="mt-6">
      <h2 className="text-lg font-bold text-ink">Notifications</h2>

      <div className="mt-1 divide-y divide-border border-y border-border">
        <SwitchRow
          icon={BellRing}
          label="Push notifications"
          description={
            PUSH_IS_CONFIGURED
              ? 'On this device, when a booking moves'
              : 'Not set up on this build yet'
          }
          checked={current.push && PUSH_IS_CONFIGURED}
          onChange={(next) => void set('push', next)}
          busy={saving === 'push'}
          disabled={!PUSH_IS_CONFIGURED}
        />

        <SwitchRow
          icon={Bell}
          label="In-app notifications"
          description="The list under Profile, Notifications"
          checked={current.inApp}
          onChange={(next) => void set('inApp', next)}
          busy={saving === 'inApp'}
        />
      </div>

      {/* The gap, named. Leaving it to be noticed is how a customer decides
          the switches above are not the whole story. */}
      <Card className="mt-3 bg-surface p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Lock className="size-4 shrink-0 text-muted" aria-hidden="true" />
          Messages about a booking cannot be turned off
        </p>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          When a technician is assigned, when they set off, and when a quote
          needs your answer. Those are the service itself — switching them off
          would mean somebody arriving at your door unannounced. We send nothing
          else: no offers, no reminders to book again.
        </p>
      </Card>
    </section>
  )
}

/**
 * The write, kept outside the component — `Date.now` in a render is a bug
 * waiting for a re-render, even when it only ever runs from a tap.
 */
async function savePrefs(uid: string, prefs: NotificationPrefs): Promise<void> {
  await setDoc(
    doc(db(), COL.users, uid),
    { notifications: prefs, updatedAt: Date.now() },
    { merge: true }
  )
}

function Band() {
  return <div aria-hidden="true" className="-mx-4 my-6 h-2 bg-surface" />
}
