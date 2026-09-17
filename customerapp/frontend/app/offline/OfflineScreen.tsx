'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { RefreshCw, WifiOff } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useOnline } from '@/lib/useOnline'

/**
 * The screen the service worker falls back to when a page cannot be reached.
 *
 * It says what still works, because on a patchy connection that is the useful
 * information — Firestore keeps its own copy of the bookings this customer has
 * already opened, so the booking they are trying to check is very often still
 * readable a tap away.
 *
 * It watches `online` rather than asking the customer to keep pressing a
 * button. When the connection comes back it says so and offers the way
 * forward; it does not navigate on its own, because a page that jumps
 * underneath somebody who has just walked into signal is disorienting.
 */
export function OfflineScreen() {
  const router = useRouter()
  const online = useOnline()

  return (
    <main id="content" className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <span
        className={`flex size-14 items-center justify-center rounded-full ${
          online ? 'bg-success-soft' : 'bg-surface'
        }`}
      >
        <WifiOff
          className={`size-6 ${online ? 'text-success' : 'text-muted'}`}
          aria-hidden="true"
        />
      </span>

      <h1 className="text-xl font-semibold text-ink">
        {online ? 'You are back online' : 'You are offline'}
      </h1>
      <p className="max-w-xs text-sm leading-relaxed text-muted">
        {online
          ? 'The connection is back. Reload to pick up where you were.'
          : 'We could not reach the network. Anything you had filled in is still here.'}
      </p>

      <Button
        className="mt-1"
        onClick={() => router.refresh()}
        iconLeft={<RefreshCw className="size-4" aria-hidden="true" />}
      >
        Try again
      </Button>

      {!online ? (
        <Card className="mt-4 p-4 text-left">
          <p className="text-sm font-medium text-ink">What still works</p>
          <ul className="mt-2 flex flex-col gap-1.5 text-sm leading-relaxed text-muted">
            <li>Bookings you have already opened, from this device.</li>
            <li>A booking you were part-way through filling in.</li>
            <li>
              Your expert&rsquo;s phone number, if they have already been
              assigned.
            </li>
          </ul>
          <Link
            href="/bookings"
            className="mt-3 inline-flex min-h-11 items-center rounded-pill border border-ink px-5 text-sm font-semibold text-ink"
          >
            Your bookings
          </Link>
        </Card>
      ) : null}
    </main>
  )
}
