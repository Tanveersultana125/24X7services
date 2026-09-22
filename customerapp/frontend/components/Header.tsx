'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Route } from 'next'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/cn'

/**
 * The mobile screen header: a back affordance, a title, and whatever the screen
 * needs on the right.
 *
 * Back calls router.back() rather than linking to a fixed parent, so the
 * Android hardware back button and this button do the same thing — the booking
 * flow is a stack, and jumping to a canonical parent would skip steps the
 * customer just filled in.
 *
 * `onBack` is for the screens where that is wrong: the end of a flow you must
 * not walk back into. There, back is a way out rather than a way back, and the
 * screen says where to.
 */

export interface HeaderProps {
  title?: string
  /** Shown under the title — a booking reference, a step counter. */
  subtitle?: string
  showBack?: boolean
  /** Used when there is no history to go back to, e.g. a deep link. */
  backFallback?: Route
  /** Replaces router.back() entirely. See the note above. */
  onBack?: () => void
  right?: React.ReactNode
  /** Border and background vanish, for a header over a hero or a map. */
  transparent?: boolean
  className?: string
}

export function Header({
  title,
  subtitle,
  showBack = false,
  backFallback = '/home',
  onBack,
  right,
  transparent = false,
  className,
}: HeaderProps) {
  const router = useRouter()

  function goBack(): void {
    if (onBack) {
      onBack()
      return
    }
    // A customer who opened the app on this URL has nothing behind them.
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push(backFallback)
    }
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-30 lg:hidden',
        'pt-[var(--safe-top)]',
        transparent ? 'bg-transparent' : 'border-b border-border bg-bg',
        className
      )}
    >
      <div className="flex min-h-14 items-center gap-2 px-2">
        {showBack ? (
          <button
            type="button"
            onClick={goBack}
            aria-label="Go back"
            className="flex size-11 items-center justify-center rounded-full text-ink hover:bg-surface"
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
          </button>
        ) : (
          <span className="w-2" />
        )}

        <div className="min-w-0 flex-1">
          {title ? (
            <h1 className="truncate text-lg font-semibold text-ink">{title}</h1>
          ) : null}
          {subtitle ? (
            <p className="truncate text-xs text-muted">{subtitle}</p>
          ) : null}
        </div>

        {right ? <div className="flex items-center gap-1">{right}</div> : null}
      </div>
    </header>
  )
}

/** The icon button shape the header's right slot expects. */
export function HeaderAction({
  href,
  onClick,
  label,
  badge = false,
  children,
}: {
  href?: Route
  onClick?: () => void
  label: string
  /** A dot in the corner — unread notifications, an unanswered message. */
  badge?: boolean
  children: React.ReactNode
}) {
  const inner = (
    <>
      {children}
      {badge ? (
        <span
          className="absolute right-2 top-2 size-2 rounded-full bg-error"
          aria-hidden="true"
        />
      ) : null}
    </>
  )

  const classes =
    'relative flex size-11 items-center justify-center rounded-full text-ink hover:bg-surface'

  if (href) {
    return (
      <Link href={href} aria-label={label} className={classes}>
        {inner}
      </Link>
    )
  }

  return (
    <button type="button" onClick={onClick} aria-label={label} className={classes}>
      {inner}
    </button>
  )
}
