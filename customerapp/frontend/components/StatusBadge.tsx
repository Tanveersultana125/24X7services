import type { BookingStatus } from '@app/shared'
import { STATUS_PRESENTATION, type Tone } from '@/lib/status'
import { cn } from '@/lib/cn'

/**
 * One of the three places colour is allowed. The dot and the text carry the
 * tone; the surface stays near-white so the badge never turns into a coloured
 * block on a monochrome page.
 *
 * The label is always present as text, so the colour is reinforcement rather
 * than the only signal — which is what keeps it readable to someone who cannot
 * separate the three hues.
 */

const tones: Record<Tone, { dot: string; text: string; surface: string }> = {
  neutral: {
    dot: 'bg-ink',
    text: 'text-ink',
    surface: 'bg-surface border-border',
  },
  success: {
    dot: 'bg-success',
    text: 'text-success',
    surface: 'bg-success-soft border-success/20',
  },
  warning: {
    dot: 'bg-warning',
    text: 'text-warning',
    surface: 'bg-warning-soft border-warning/20',
  },
  error: {
    dot: 'bg-error',
    text: 'text-error',
    surface: 'bg-error-soft border-error/20',
  },
}

export function StatusBadge({
  status,
  className,
}: {
  status: BookingStatus
  className?: string
}) {
  const { label, tone } = STATUS_PRESENTATION[status]
  return <ToneBadge tone={tone} label={label} className={className} />
}

export function ToneBadge({
  tone,
  label,
  className,
}: {
  tone: Tone
  label: string
  className?: string
}) {
  const t = tones[tone]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1',
        'text-xs font-semibold whitespace-nowrap',
        t.surface,
        t.text,
        className
      )}
    >
      <span className={cn('size-1.5 rounded-full', t.dot)} aria-hidden="true" />
      {label}
    </span>
  )
}
