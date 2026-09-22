'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Route } from 'next'
import { doc, getDoc } from 'firebase/firestore'
import {
  BadgeCheck,
  Bell,
  CalendarCheck,
  ChevronRight,
  CircleAlert,
  ClipboardList,
  CreditCard,
  FileText,
  Gift,
  Headset,
  Info,
  LogOut,
  MapPin,
  Settings,
  ShieldCheck,
  Star,
  User,
  WalletMinimal,
  WashingMachine,
} from 'lucide-react'
import {
  COL,
  REFERRAL_REWARD,
  formatPaise,
  userProfileSchema,
  type UserProfile,
} from '@app/shared'

import { AppShell } from '@/components/AppShell'
import { Header } from '@/components/Header'
import { Button } from '@/components/ui/Button'
import { ProfileSkeleton } from '@/components/SkeletonLoader'
import { useToast } from '@/components/Toast'
import { signOut, useAuth } from '@/lib/auth'
import { db } from '@/lib/firebase'
import { formatPhone } from '@/lib/format'
import { useAsync } from '@/lib/useAsync'

/**
 * The account, and everything filed under it.
 *
 * Laid out the way an account screen is laid out everywhere, because a
 * customer opening Profile is not reading it — they are aiming at one row. Who
 * they are at the top, the three places people actually go as tiles under it,
 * then everything else as a plain list, and signing out at the bottom where it
 * cannot be pressed by accident. Each row is one thing a customer might have
 * come here to do, named as they would say it — "Saved addresses", not
 * "Address management".
 *
 * The phone number is shown and cannot be edited, because it is the account. A
 * row that looks editable and is not is worse than one that never offered.
 *
 * Nobody is turned away at the door, and that now goes for the rows as well as
 * for this screen. It used to send a signed-out customer straight to the login
 * form, which answers a question they had not asked: they tapped Profile to see
 * what an account here even holds, and got a phone field. Then every row did
 * the same thing, which made thirteen screens into one — whichever you tapped,
 * you got the same phone field, and nothing told you what you had tapped.
 *
 * So a row goes to its own screen whether or not anyone is signed in, and that
 * screen says what it holds and offers the way in. Some of them have plenty to
 * show without an account: the plans on offer, what a membership costs, how a
 * gift card works. `ProfileShell` is where that decision now lives.
 */

/** Where a row sends someone who is not signed in yet. */
function signInTo(href: Route): Route {
  return `/login?next=${encodeURIComponent(href)}` as Route
}

/** The three that the rest of this screen exists to be less important than. */
const TILES = [
  { href: '/bookings', label: 'My bookings', icon: ClipboardList },
  { href: '/profile/appliances', label: 'My appliances', icon: WashingMachine },
  { href: '/support', label: 'Help & support', icon: Headset },
] as const satisfies ReadonlyArray<{
  href: Route
  label: string
  icon: typeof User
}>

const ROWS = [
  {
    href: '/profile/personal',
    label: 'Personal details',
    detail: 'Your name and email',
    icon: User,
  },
  {
    href: '/profile/plans',
    label: 'Plans',
    detail: 'Yearly cover on your appliances',
    icon: CalendarCheck,
  },
  {
    href: '/profile/wallet',
    label: 'Balance',
    detail: 'Credits, and money you have added',
    icon: WalletMinimal,
  },
  {
    href: '/profile/gift-cards',
    label: 'Gift cards',
    detail: 'Redeem one, or buy one for someone',
    icon: Gift,
  },
  {
    href: '/profile/membership',
    label: 'Membership',
    detail: '24X7 Plus — no visit fee, 10% off repairs',
    icon: BadgeCheck,
  },
  {
    href: '/profile/reviews',
    label: 'Your reviews',
    detail: 'What you told us',
    icon: Star,
  },
  {
    href: '/profile/addresses',
    label: 'Saved addresses',
    detail: 'Where we come to',
    icon: MapPin,
  },
  {
    href: '/profile/payment-methods',
    label: 'Payment methods',
    detail: 'How you would rather pay',
    icon: CreditCard,
  },
  {
    href: '/profile/warranties',
    label: 'Warranties',
    detail: 'What is still covered',
    icon: ShieldCheck,
  },
  {
    href: '/profile/payments',
    label: 'Invoices',
    detail: 'Every bill we have issued you',
    icon: FileText,
  },
  {
    href: '/profile/notifications',
    label: 'Notifications',
    detail: 'Everything we have sent you',
    icon: Bell,
  },
  {
    href: '/profile/settings',
    label: 'Settings',
    detail: 'Permissions, legal, closing your account',
    icon: Settings,
  },
  {
    href: '/profile/about',
    label: 'About 24X7',
    detail: 'Who we are, and the paperwork',
    icon: Info,
  },
] as const satisfies ReadonlyArray<{
  href: Route
  label: string
  detail: string
  icon: typeof User
}>

/** Inlined at build time from package.json — see next.config.ts. */
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION

export function ProfileScreen() {
  const router = useRouter()
  const { user, ready } = useAuth()
  const toast = useToast()
  const uid = user?.uid

  const load = useCallback(async (): Promise<UserProfile | null> => {
    if (!uid) return null
    const snap = await getDoc(doc(db(), COL.users, uid))
    const parsed = userProfileSchema.safeParse(snap.data())
    return parsed.success ? parsed.data : null
  }, [uid])

  const profile = useAsync(load)

  // A name is what the technician is handed and what an invoice is made out
  // to, so an account without one is worth saying out loud here rather than
  // leaving the customer to find out at checkout.
  const incomplete =
    profile.status === 'ready' && (profile.data?.name ?? '').trim().length === 0

  async function leave(): Promise<void> {
    try {
      await signOut()
      router.replace('/home')
    } catch {
      toast.show('We could not sign you out. Please try again.', {
        tone: 'error',
      })
    }
  }

  return (
    <AppShell mobileHeader={<Header title="Profile" />}>
      {!ready || (user && profile.status === 'loading') ? (
        <div className="mt-6">
          <ProfileSkeleton />
        </div>
      ) : (
        <>
          <div className="mt-6">
            {user && incomplete ? (
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-pill bg-error-soft px-3 py-1.5 text-xs font-bold text-error">
                  <CircleAlert className="size-3.5" aria-hidden="true" />
                  Incomplete profile
                </span>
                <Link
                  href="/profile/personal"
                  className="inline-flex h-9 shrink-0 items-center rounded-pill border border-border px-4 text-sm font-bold text-ink hover:border-brand hover:text-brand"
                >
                  Complete
                </Link>
              </div>
            ) : null}

            <h1 className="text-3xl font-bold leading-tight text-ink">
              {(user ? profile.data?.name : undefined) ?? 'Your account'}
            </h1>

            {user ? (
              <p className="mt-1.5 text-base text-muted">
                {/* The account is the number, so it is stated and not offered
                    as something to change. */}
                {user.phoneNumber ? formatPhone(user.phoneNumber) : 'Signed in'}
              </p>
            ) : (
              <>
                <p className="mt-1.5 text-base text-muted">
                  Sign in to see your bookings, your addresses and everything on
                  your balance.
                </p>
                <Link
                  href={signInTo('/profile')}
                  className="mt-4 flex h-12 w-full items-center justify-center rounded-pill bg-brand text-base font-semibold text-bg hover:bg-brand-deep sm:w-auto sm:px-8"
                >
                  Sign in
                </Link>
              </>
            )}
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            {TILES.map((tile) => (
              <Link
                key={tile.href}
                href={tile.href}
                className="flex flex-col gap-3 rounded-card border border-border p-4 hover:border-brand"
              >
                <tile.icon className="size-6 text-ink" aria-hidden="true" />
                <span className="text-sm font-bold leading-snug text-ink">
                  {tile.label}
                </span>
              </Link>
            ))}
          </div>

          {/* Full bleed, so the list below reads as a different part of the
              screen rather than as more of the same column. */}
          <div className="-mx-4 mt-8 h-2 bg-surface lg:-mx-6" />

          <ul className="-mx-4 lg:-mx-6">
            {ROWS.map((row) => (
              <li
                key={row.href}
                className="border-b border-border last:border-b-0"
              >
                <Link
                  href={row.href}
                  className="flex items-center gap-4 px-4 py-4 hover:bg-surface lg:px-6"
                >
                  <row.icon
                    className="size-5 shrink-0 text-ink"
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-medium text-ink">
                      {row.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {row.detail}
                    </span>
                  </span>
                  <ChevronRight
                    className="size-5 shrink-0 text-muted"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>

          <ReferCard />

          {user ? (
            <Button
              className="mt-8"
              variant="secondary"
              fullWidth
              onClick={() => void leave()}
              iconLeft={<LogOut className="size-4" aria-hidden="true" />}
            >
              Sign out
            </Button>
          ) : null}

          <p className="mt-8 flex items-center justify-center gap-1.5 text-xs text-muted">
            <CreditCard className="size-3.5" aria-hidden="true" />
            We never store your card details. Payments go through Razorpay.
          </p>

          {APP_VERSION ? (
            <p className="mt-3 text-center text-xs text-muted">
              Version {APP_VERSION}
            </p>
          ) : null}
        </>
      )}
    </AppShell>
  )
}

/**
 * The one thing on this screen that is not a row.
 *
 * It sits below the list rather than above it because it is an offer, not
 * something the customer came here to do — and an offer placed above the rows
 * people actually came for is an advertisement wearing a navigation item's
 * clothes. Below the list, after everything useful, it is still the largest
 * thing on the screen at that point and impossible to miss.
 *
 * The figure comes from the same constant the server pays out, so the promise
 * on this card cannot drift from what lands on the balance.
 */
function ReferCard() {
  return (
    <div className="mt-8 overflow-hidden rounded-card bg-brand-soft p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xl font-bold leading-snug text-ink">
            Refer &amp; earn {formatPaise(REFERRAL_REWARD)}
          </p>
          {/*
            The space after the amount is written out. A JSX text run that
            both follows an expression and contains an HTML entity loses its
            leading whitespace through this toolchain's transform — it
            compiled to "₹250in credits" and nothing warned.
          */}
          <p className="mt-1 max-w-[22rem] text-sm text-muted">
            Get {formatPaise(REFERRAL_REWARD)}{' '}
            in credits when a friend&apos;s first booking is finished. They get
            the same.
          </p>
        </div>

        <span
          className="flex size-14 shrink-0 items-center justify-center rounded-full bg-bg text-brand"
          aria-hidden="true"
        >
          <Gift className="size-7" />
        </span>
      </div>

      <Link
        href="/profile/refer"
        className="mt-4 inline-flex h-12 items-center justify-center rounded-pill bg-brand px-6 text-base font-semibold text-bg hover:bg-brand-deep"
      >
        Refer now
      </Link>
    </div>
  )
}
