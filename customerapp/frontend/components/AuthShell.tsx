'use client'

import { useRouter } from 'next/navigation'
import type { Route } from 'next'
import { ArrowLeft } from 'lucide-react'
import { brand } from '@/config/brand'
import { cn } from '@/lib/cn'

/**
 * The frame the three sign-in steps sit in: number, code, name.
 *
 * They used to be a white page with an empty grey bar at the top holding a
 * lone back arrow, which is what a form looks like when nobody has decided
 * what the screen is. This gives them the front door's brand block and drops
 * the form onto a sheet that laps over it.
 *
 * The question is in the coloured block rather than on the sheet. Someone
 * handing over their phone number is deciding whether to trust an app, and the
 * two things they check first — whose app is this, what is it asking for — now
 * arrive in the same glance instead of a title on an otherwise blank page.
 *
 * A step counter would be dishonest here: the name step only happens for
 * somebody we have never met, so "2 of 3" would be a lie to half the people
 * who read it.
 */
export function AuthShell({
  title,
  subtitle,
  showBack = true,
  backFallback = '/home',
  children,
}: {
  title: string
  /** One line under it, on the brand block. */
  subtitle?: React.ReactNode
  showBack?: boolean
  backFallback?: Route
  children: React.ReactNode
}) {
  const router = useRouter()

  function goBack(): void {
    // Someone who opened the app on this URL has nothing behind them.
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push(backFallback)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-brand-deep">
      <div className="bg-linear-to-b from-brand-deep to-brand pt-[var(--safe-top)]">
        <div className="mx-auto w-full max-w-lg px-4 lg:max-w-md">
          <div className="flex min-h-14 items-center justify-between gap-3">
            {showBack ? (
              <button
                type="button"
                onClick={goBack}
                aria-label="Go back"
                className="-ml-2 flex size-11 items-center justify-center rounded-full text-bg hover:bg-bg/10"
              >
                <ArrowLeft className="size-5" aria-hidden="true" />
              </button>
            ) : (
              <span className="size-11" />
            )}
            <span className="text-lg font-extrabold tracking-tight text-bg">
              {brand.wordmark}
            </span>
          </div>

          <h1 className="mt-3 text-2xl font-bold text-bg">{title}</h1>
          {subtitle ? (
            <p className="mt-2 text-sm leading-relaxed text-bg/75">{subtitle}</p>
          ) : null}
        </div>
        {/* The sheet laps over this, so the block needs height under the text
            for it to lap onto. */}
        <div className="h-8" />
      </div>

      <main
        id="content"
        className="-mt-5 flex-1 rounded-t-[1.75rem] bg-bg pb-[calc(3rem+var(--safe-bottom))]"
      >
        <div className="mx-auto w-full max-w-lg px-4 pt-7 lg:max-w-md">
          {children}
        </div>
      </main>
    </div>
  )
}

/**
 * A note that only exists because the emulators are running.
 *
 * Marked as a developer aid rather than dressed as product copy. The first
 * version of this was a plain grey panel directly under the primary button,
 * the same weight as everything around it — on the screen where a customer is
 * deciding whether to hand over their phone number, the most prominent thing
 * after the button was a paragraph about localhost.
 */
export function DevNote({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <p
      className={cn(
        'rounded-card border border-dashed border-border px-3 py-2.5 text-xs leading-relaxed text-muted',
        className
      )}
    >
      <span className="mr-1.5 font-semibold tracking-[0.06em] text-ink uppercase">
        Dev
      </span>
      {children}
    </p>
  )
}
