'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Route } from 'next'
import { Header } from '@/components/Header'
import { StickyCTA, StickySpacer } from '@/components/StickyCTA'
import { Button } from '@/components/ui/Button'
import { SkeletonGroup, Skeleton } from '@/components/SkeletonLoader'
import { useAuth } from '@/lib/auth'
import {
  BOOKING_STEPS,
  hasService,
  redirectFor,
  requiresAuth,
  stepIndex,
  useBookingDraft,
} from '@/lib/bookingDraft'
import { cn } from '@/lib/cn'

/**
 * The frame every step of the booking flow sits in, and the gate in front of it.
 *
 * Three things can be wrong when a screen loads, and all three are the same
 * kind of wrong — the customer is somewhere the draft does not support yet:
 *
 *   - Nothing has been chosen to book. Back to the service list.
 *   - An earlier step is unfilled, because this URL was opened directly or a
 *     stale draft was dropped. Back to the first thing missing.
 *   - The step needs an account and there is not one. To sign-in, with where
 *     to return afterwards.
 *
 * Doing this once means no step screen has to remember it, and adding a step is
 * a row in BOOKING_STEPS rather than a set of redirects to get right.
 *
 * Nothing renders until the draft and the auth state have both been read.
 * Deciding on either before it is known sends a signed-in customer with a full
 * draft back to the beginning of the flow.
 */

export interface BookingStepProps {
  stepKey: string
  title: string
  /** Sits under the title, before the step counter. */
  subtitle?: string
  cta?: {
    label: string
    onClick: () => void
    disabled?: boolean
    loading?: boolean
  }
  /** The left-hand side of the sticky bar — usually the visit fee. */
  ctaDetail?: React.ReactNode
  children: React.ReactNode
}

export function BookingStep({
  stepKey,
  title,
  subtitle,
  cta,
  ctaDetail,
  children,
}: BookingStepProps) {
  const router = useRouter()
  const { draft, ready: draftReady } = useBookingDraft()
  const { user, ready: authReady } = useAuth()

  const index = stepIndex(stepKey)
  const needsAuth = requiresAuth(stepKey)
  const step = BOOKING_STEPS[index]

  const missing = draftReady ? redirectFor(stepKey, draft) : null
  const noService = draftReady && !hasService(draft)
  const signedOut = needsAuth && authReady && user === null
  const blocked = !draftReady || !authReady || noService || missing || signedOut

  useEffect(() => {
    if (!draftReady) return
    if (noService) {
      router.replace('/services')
      return
    }
    if (missing) {
      router.replace(missing)
      return
    }
    if (needsAuth && authReady && user === null) {
      // `next` brings them back to this exact step rather than to Home, which
      // would leave a filled-in draft stranded behind a nav bar.
      router.replace(
        `/login?next=${encodeURIComponent(step?.route ?? '/book/brand')}` as Route
      )
    }
  }, [draftReady, authReady, user, noService, missing, needsAuth, step, router])

  return (
    <div className="min-h-dvh bg-bg">
      <Header
        title={title}
        subtitle={subtitle ?? `Step ${index + 1} of ${BOOKING_STEPS.length}`}
        showBack
        backFallback="/home"
      />
      <StepProgress index={index} />

      <main id="content" className="mx-auto w-full max-w-lg px-4 pb-6 lg:max-w-2xl">
        {blocked ? (
          <SkeletonGroup label="Loading" className="mt-6 flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </SkeletonGroup>
        ) : (
          <>
            {children}
            {cta ? <StickySpacer /> : null}
          </>
        )}
      </main>

      {cta && !blocked ? (
        <StickyCTA detail={ctaDetail}>
          <Button
            onClick={cta.onClick}
            disabled={cta.disabled}
            loading={cta.loading}
            fullWidth={!ctaDetail}
          >
            {cta.label}
          </Button>
        </StickyCTA>
      ) : null}
    </div>
  )
}

/**
 * How far along, as a bar rather than a row of numbered circles. Ten steps of
 * dots on a phone is a line of confetti; a bar says the same thing in the space
 * available, and the counter in the header says it in words.
 */
function StepProgress({ index }: { index: number }) {
  const percent = ((index + 1) / BOOKING_STEPS.length) * 100
  return (
    <div
      className="sticky top-14 z-20 h-0.5 w-full bg-border lg:top-0"
      role="progressbar"
      aria-label="Booking progress"
      aria-valuemin={1}
      aria-valuemax={BOOKING_STEPS.length}
      aria-valuenow={index + 1}
    >
      <div
        className={cn(
          'h-full bg-brand transition-[width] duration-[var(--duration-slow)]'
        )}
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}
