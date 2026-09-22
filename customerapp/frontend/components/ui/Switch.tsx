'use client'

import Link from 'next/link'
import type { Route } from 'next'
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
 *
 * `href` is the exception, and it is what a setting that cannot be set yet
 * should do. A disabled switch with a note under it is a control that answers
 * a press with nothing, which reads as broken however carefully the note is
 * worded. With `href` the whole row becomes one link to whatever unlocks it —
 * usually the sign-in — and the switch is painted rather than pressed.
 */
export function SwitchRow({
  icon: Icon,
  label,
  description,
  checked,
  onChange,
  busy,
  disabled,
  href,
}: {
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  label: string
  description?: string
  checked: boolean
  onChange: (next: boolean) => void
  busy?: boolean
  disabled?: boolean
  /** Turns the row into a link to whatever has to happen first. */
  href?: Route
}) {
  const body = (
    <>
      <Icon className="mt-0.5 size-5 shrink-0 text-ink" aria-hidden={true} />
      <div className="min-w-0 flex-1">
        <p className="text-base font-medium text-ink">{label}</p>
        {description ? (
          <p className="mt-0.5 text-sm text-muted">{description}</p>
        ) : null}
      </div>
    </>
  )

  if (href) {
    return (
      <Link
        href={href}
        // The switch inside is scenery — the link already carries the whole
        // row, and a second target inside it would be one thing to tab to
        // that a screen reader cannot describe without repeating the first.
        className="-mx-4 flex items-start gap-3 px-4 py-4 hover:bg-surface lg:mx-0 lg:px-0"
      >
        {body}
        <span aria-hidden="true">
          <Switch
            checked={checked}
            onChange={() => undefined}
            label={label}
            disabled
          />
        </span>
      </Link>
    )
  }

  return (
    <div className="flex items-start gap-3 py-4">
      {body}
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
