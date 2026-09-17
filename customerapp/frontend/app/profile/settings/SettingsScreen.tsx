'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Route } from 'next'
import { Bell, ChevronRight, ShieldAlert } from 'lucide-react'

import { ProfileShell } from '@/components/ProfileShell'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { ConfirmModal } from '@/components/Modal'
import { useToast } from '@/components/Toast'
import { callFn, friendlyError } from '@/lib/callables'
import { signOut } from '@/lib/auth'
import { enablePushNotifications, PUSH_IS_CONFIGURED } from '@/lib/push'

/**
 * Permissions, the legal documents, and the way out.
 *
 * Closing an account is at the bottom, in the danger tone, behind a typed
 * confirmation — but it is here, and it is plainly labelled. An app that makes
 * leaving hard is an app that has decided its customers are a resource.
 */

const LEGAL = [
  { href: '/legal/terms', label: 'Terms of Service' },
  { href: '/legal/privacy', label: 'Privacy Policy' },
  { href: '/legal/cancellation', label: 'Cancellation and refunds' },
] as const satisfies ReadonlyArray<{ href: Route; label: string }>

export function SettingsScreen() {
  return <ProfileShell title="Settings">{() => <Settings />}</ProfileShell>
}

function Settings() {
  const router = useRouter()
  const toast = useToast()
  const [enabling, setEnabling] = useState(false)
  const [closing, setClosing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmation, setConfirmation] = useState('')

  async function enablePush(): Promise<void> {
    setEnabling(true)
    try {
      const outcome = await enablePushNotifications()
      if (outcome.kind === 'enabled') {
        await callFn('registerFcmToken', { token: outcome.token })
        toast.show('Notifications are on for this device.', { tone: 'success' })
      } else if (outcome.kind === 'denied') {
        toast.show(
          'Your browser is blocking notifications. Turn them on in its site settings.',
          { tone: 'warning' }
        )
      } else {
        toast.show(outcome.reason, { tone: 'warning' })
      }
    } catch (error) {
      toast.show(friendlyError(error), { tone: 'error' })
    } finally {
      setEnabling(false)
    }
  }

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

  return (
    <>
      <section className="mt-5">
        <h2 className="mb-2 text-sm font-semibold text-muted">Notifications</h2>
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <Bell className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink">
                Updates about your bookings
              </p>
              <p className="mt-0.5 text-sm leading-relaxed text-muted">
                When an expert is assigned, when they set off, and when a quote
                needs your answer. Nothing else — we do not send offers.
              </p>
            </div>
          </div>
          <Button
            className="mt-3"
            variant="secondary"
            fullWidth
            loading={enabling}
            disabled={!PUSH_IS_CONFIGURED}
            onClick={() => void enablePush()}
          >
            {PUSH_IS_CONFIGURED
              ? 'Turn on notifications'
              : 'Not available yet'}
          </Button>
          {!PUSH_IS_CONFIGURED ? (
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Push is not set up on this build. Your bookings screen shows the
              same updates live in the meantime.
            </p>
          ) : null}
        </Card>
      </section>

      <section className="mt-7">
        <h2 className="mb-2 text-sm font-semibold text-muted">The legal bits</h2>
        <Card className="overflow-hidden">
          <ul>
            {LEGAL.map((item) => (
              <li key={item.href} className="border-b border-border last:border-b-0">
                <Link
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-ink hover:bg-surface"
                >
                  <span className="flex-1">{item.label}</span>
                  <ChevronRight
                    className="size-4 shrink-0 text-muted"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section className="mt-7">
        <h2 className="mb-2 text-sm font-semibold text-muted">Your account</h2>
        <Card className="border-error p-4">
          <div className="flex items-start gap-3">
            <ShieldAlert
              className="mt-0.5 size-4 shrink-0 text-error"
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink">Close your account</p>
              <p className="mt-0.5 text-sm leading-relaxed text-muted">
                Removes your profile, addresses, saved appliances and support
                conversations. Invoices we have already issued you are kept —
                the law requires it — with your name taken off them.
              </p>
            </div>
          </div>
          <Button
            className="mt-3"
            variant="danger"
            fullWidth
            onClick={() => setClosing(true)}
          >
            Close my account
          </Button>
        </Card>
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
