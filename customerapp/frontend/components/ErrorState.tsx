'use client'

import { CloudOff, RefreshCw, TriangleAlert, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'

/**
 * Something went wrong that the customer did not cause. It says what failed in
 * plain words, offers Try Again, and never shows a raw error — a Firestore
 * permission string on screen tells the customer nothing and tells everyone
 * else too much.
 */

type Kind = 'generic' | 'offline' | 'notFound'

const presets: Record<
  Kind,
  { icon: typeof TriangleAlert; title: string; description: string }
> = {
  generic: {
    icon: TriangleAlert,
    title: 'Something went wrong',
    description: 'We could not load this just now. Please try again.',
  },
  offline: {
    icon: WifiOff,
    title: 'You are offline',
    description:
      'Check your connection. Anything you had filled in is still here.',
  },
  notFound: {
    icon: CloudOff,
    title: 'We could not find that',
    description: 'It may have been removed, or the link may be out of date.',
  },
}

export interface ErrorStateProps {
  kind?: Kind
  title?: string
  description?: string
  onRetry?: () => void
  retrying?: boolean
  className?: string
}

export function ErrorState({
  kind = 'generic',
  title,
  description,
  onRetry,
  retrying = false,
  className,
}: ErrorStateProps) {
  const preset = presets[kind]
  const Icon = preset.icon

  return (
    <div
      // Announced when it replaces content the customer was waiting on.
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center gap-3 px-6 py-14 text-center',
        className
      )}
    >
      <span className="flex size-14 items-center justify-center rounded-full bg-error-soft">
        <Icon className="size-6 text-error" aria-hidden="true" />
      </span>
      <h2 className="text-lg font-semibold text-ink">
        {title ?? preset.title}
      </h2>
      <p className="max-w-xs text-sm text-muted">
        {description ?? preset.description}
      </p>
      {onRetry ? (
        <Button
          className="mt-2"
          size="sm"
          variant="secondary"
          onClick={onRetry}
          loading={retrying}
          iconLeft={<RefreshCw className="size-4" aria-hidden="true" />}
        >
          Try again
        </Button>
      ) : null}
    </div>
  )
}

/**
 * The thin bar that appears at the top of any screen while the device is
 * offline. Separate from ErrorState because the screen underneath is still
 * usable — cached data, a half-filled form — and should not be replaced.
 */
export function OfflineBanner({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex items-center justify-center gap-2 bg-ink px-4 py-2 text-xs font-medium text-bg',
        className
      )}
    >
      <WifiOff className="size-3.5" aria-hidden="true" />
      You are offline. Some things may be out of date.
    </div>
  )
}
