'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Route } from 'next'
import type { User } from 'firebase/auth'
import type { LucideIcon } from 'lucide-react'

import { Header } from '@/components/Header'
import {
  BottomNavigation,
  BOTTOM_NAV_CLEARANCE,
} from '@/components/BottomNavigation'
import { Skeleton, SkeletonGroup } from '@/components/SkeletonLoader'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/cn'

/**
 * The frame every screen under the profile shares: a title, a way back, and
 * what to show when nobody is signed in.
 *
 * It used to send a signed-out visitor to the login form. That turned thirteen
 * different screens into one: whichever row you tapped — Plans, Gift cards,
 * Invoices — you landed on a phone number field, which answers a question you
 * had not asked and tells you nothing about what you tapped. The Balance screen
 * had already been let out of that arrangement for exactly this reason; this
 * puts the rest of the profile on the same footing.
 *
 * So each screen now says its own sentence to someone who has not signed in,
 * through `signedOut`. Screens with something public to show — the plans on
 * offer, what a membership costs, how a gift card works — show it and put the
 * sign-in underneath. Screens that are nothing but this customer's own records
 * say so plainly and offer the one button that fills them in.
 *
 * `next` is built from the current URL rather than passed in, so signing in
 * from deep inside the profile comes back to the screen you were reading and
 * not to its parent.
 */
export function ProfileShell({
  title,
  subtitle,
  backFallback = '/profile',
  signedOut,
  children,
}: {
  title: string
  subtitle?: string
  backFallback?: Route
  /**
   * This screen, told to someone who is not signed in. Usually a
   * `<SignInPrompt>`, on its own or under whatever the screen can show anyway.
   */
  signedOut: React.ReactNode
  children: (user: User) => React.ReactNode
}) {
  const { user, ready } = useAuth()

  return (
    <div className="min-h-dvh bg-bg">
      <Header
        title={title}
        subtitle={subtitle}
        showBack
        backFallback={backFallback}
      />
      <main
        id="content"
        className={cn(
          'mx-auto w-full max-w-lg px-4 lg:max-w-2xl',
          BOTTOM_NAV_CLEARANCE
        )}
      >
        {!ready ? (
          <SkeletonGroup label="Loading" className="mt-6 flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </SkeletonGroup>
        ) : user ? (
          children(user)
        ) : (
          signedOut
        )}
      </main>

      <BottomNavigation />
    </div>
  )
}

/**
 * Where the sign-in button on one of these screens goes.
 *
 * `usePathname` rather than `window.location`, so the href is the same during
 * prerender and after hydration — these pages are statically exported, and a
 * link that changes underneath hydration is a link that sometimes points at
 * the wrong screen.
 *
 * It carries no query string. Reading one would mean `useSearchParams`, which
 * cannot be read during prerender and would put every profile page behind a
 * Suspense boundary for the sake of a parameter only one of them has. That one
 * passes its own `next` instead.
 */
export function useSignInHref(next?: string): Route {
  const pathname = usePathname()
  const here = next ?? pathname ?? '/profile'
  return `/login?next=${encodeURIComponent(here)}` as Route
}

/**
 * The block a signed-out visitor sees on a profile screen.
 *
 * Shaped like an empty state rather than like a wall, because that is what it
 * is: the screen is right, the records are simply not there yet. The title
 * names what this screen holds, so the same component reads differently on
 * every screen that uses it.
 */
export function SignInPrompt({
  icon: Icon,
  title,
  description,
  next,
  className,
}: {
  icon: LucideIcon
  title: string
  description: string
  /** Where to come back to, when the path alone is not enough. */
  next?: string
  className?: string
}) {
  const href = useSignInHref(next)

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 px-6 py-14 text-center',
        className
      )}
    >
      <span className="flex size-14 items-center justify-center rounded-full bg-surface">
        <Icon className="size-6 text-muted" aria-hidden="true" />
      </span>
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <p className="max-w-xs text-sm text-muted">{description}</p>
      <Link
        href={href}
        className="mt-2 inline-flex min-h-11 items-center justify-center rounded-pill bg-brand px-5 text-sm font-semibold text-bg hover:bg-brand-deep"
      >
        Sign in
      </Link>
    </div>
  )
}
