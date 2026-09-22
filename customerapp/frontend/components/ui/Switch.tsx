'use client'

import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

/**
 * A setting that is on or off, and takes effect the moment it is pressed.
 *
 * A real `role="switch"` button rather than a styled checkbox: a screen reader
 * announces "on"/"off" rather than "checked", which is what this is, and there
 * is no hidden input to keep in step with the paint.
 *
 * `busy` is the state every switch in an app like this actually has and most
 * of them pretend they do not — the write is on a network. The knob moves the
 * instant it is pressed, because a control that waits for a round trip feels
 * broken, and a spinner sits in the track until the write lands. If it fails,
 * the caller puts the knob back; that is the one honest way to report it.
 */
export function Switch({
  checked,
  onChange,
  label,
  description,
  busy = false,
  disabled = false,
  className,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  /** Read out in place of the row, so the press is never a surprise. */
  label: string
  description?: string
  busy?: boolean
  disabled?: boolean
  className?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={description ? `${label}. ${description}` : label}
      aria-busy={busy || undefined}
      disabled={disabled || busy}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-7 w-12 shrink-0 items-center rounded-pill border',
        'transition-colors duration-[var(--duration-fast)]',
        checked ? 'border-success bg-success' : 'border-border bg-surface',
        (disabled || busy) && 'opacity-60',
        className
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'flex size-5 items-center justify-center rounded-full bg-bg shadow-sm',
          'transition-transform duration-[var(--duration-fast)] ease-[var(--ease-out-soft)]',
          checked ? 'translate-x-6' : 'translate-x-1'
        )}
      >
        {busy ? (
          <Loader2 className="size-3 animate-spin text-muted" />
        ) : null}
      </span>
    </button>
  )
}

/**
 * The row a switch usually lives in: an icon, what it controls, and the switch
 * on the right.
 *
 * The whole row is not the target. A row that toggles when tapped anywhere is
 * a row a customer turns off while trying to read it, and this is a list where
 * every wrong tap is a message somebody stops getting.
 */
export function SwitchRow({
  icon: Icon,
  label,
  description,
  checked,
  onChange,
  busy,
  disabled,
}: {
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  label: string
  description?: string
  checked: boolean
  onChange: (next: boolean) => void
  busy?: boolean
  disabled?: boolean
}) {
  return (
    <div className="flex items-start gap-3 py-4">
      <Icon className="mt-0.5 size-5 shrink-0 text-ink" aria-hidden={true} />
      <div className="min-w-0 flex-1">
        <p className="text-base font-medium text-ink">{label}</p>
        {description ? (
          <p className="mt-0.5 text-sm text-muted">{description}</p>
        ) : null}
      </div>
      <Switch
        checked={checked}
        onChange={onChange}
        label={label}
        {...(description ? { description } : {})}
        {...(busy === undefined ? {} : { busy })}
        {...(disabled === undefined ? {} : { disabled })}
      />
    </div>
  )
}
