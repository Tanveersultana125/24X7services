'use client'

import { useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Route } from 'next'
import { doc, getDoc } from 'firebase/firestore'
import {
  Bell,
  ChevronRight,
  CreditCard,
  FileText,
  LogOut,
  MapPin,
  Settings,
  ShieldCheck,
  Star,
  User,
  WalletMinimal,
  WashingMachine,
} from 'lucide-react'
import { COL, userProfileSchema, type UserProfile } from '@app/shared'

import { AppShell, Section } from '@/components/AppShell'
import { Header } from '@/components/Header'
import { Card } from '@/components/ui/Card'
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
 * A list of doors rather than a screen of settings. Each row is one thing a
 * customer might have come here to do, named as they would say it — "Saved
 * addresses", not "Address management".
 *
 * The phone number is shown and cannot be edited, because it is the account. A
 * row that looks editable and is not is worse than one that never offered.
 */

const ROWS = [
  {
    href: '/profile/personal',
    label: 'Personal details',
    detail: 'Your name and email',
    icon: User,
  },
  {
    href: '/profile/addresses',
    label: 'Saved addresses',
    detail: 'Where we come to',
    icon: MapPin,
  },
  {
    href: '/profile/appliances',
    label: 'My appliances',
    detail: 'What we have serviced',
    icon: WashingMachine,
  },
  {
    href: '/profile/warranties',
    label: 'Warranties',
    detail: 'What is still covered',
    icon: ShieldCheck,
  },
  {
    href: '/profile/wallet',
    label: 'Credits',
    detail: 'What we owe you, and why',
    icon: WalletMinimal,
  },
  {
    href: '/profile/payments',
    label: 'Invoices',
    detail: 'Every bill we have issued you',
    icon: FileText,
  },
  {
    href: '/profile/reviews',
    label: 'Your reviews',
    detail: 'What you told us',
    icon: Star,
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
] as const satisfies ReadonlyArray<{
  href: Route
  label: string
  detail: string
  icon: typeof User
}>

export function ProfileScreen() {
  const router = useRouter()
  const { user, ready } = useAuth()
  const toast = useToast()
  const uid = user?.uid

  useEffect(() => {
    if (ready && !user) router.replace('/login?next=%2Fprofile')
  }, [ready, user, router])

  const load = useCallback(async (): Promise<UserProfile | null> => {
    if (!uid) return null
    const snap = await getDoc(doc(db(), COL.users, uid))
    const parsed = userProfileSchema.safeParse(snap.data())
    return parsed.success ? parsed.data : null
  }, [uid])

  const profile = useAsync(load)

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
      {!ready || profile.status === 'loading' ? (
        <div className="mt-6">
          <ProfileSkeleton />
        </div>
      ) : (
        <>
          <Card className="mt-5 flex items-center gap-4 p-4">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-surface text-xl font-bold text-muted">
              {(profile.data?.name ?? '?').charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-ink">
                {profile.data?.name ?? 'Your account'}
              </p>
              <p className="mt-0.5 text-sm text-muted">
                {/* The account is the number, so it is stated and not offered
                    as something to change. */}
                {user?.phoneNumber
                  ? formatPhone(user.phoneNumber)
                  : 'Signed in'}
              </p>
            </div>
          </Card>

          <Section className="mt-6">
            <Card className="overflow-hidden">
              <ul>
                {ROWS.map((row) => (
                  <li
                    key={row.href}
                    className="border-b border-border last:border-b-0"
                  >
                    <Link
                      href={row.href}
                      className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface"
                    >
                      <row.icon
                        className="size-4 shrink-0 text-muted"
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-ink">
                          {row.label}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted">
                          {row.detail}
                        </span>
                      </span>
                      <ChevronRight
                        className="size-4 shrink-0 text-muted"
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          </Section>

          <Button
            className="mt-6"
            variant="secondary"
            fullWidth
            onClick={() => void leave()}
            iconLeft={<LogOut className="size-4" aria-hidden="true" />}
          >
            Sign out
          </Button>

          <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted">
            <CreditCard className="size-3.5" aria-hidden="true" />
            We never store your card details. Payments go through Razorpay.
          </p>
        </>
      )}
    </AppShell>
  )
}
