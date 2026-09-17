'use client'

import { useId, useRef } from 'react'
import { cn } from '@/lib/cn'

/**
 * The boxed code entry, used for the sign-in OTP and for reading back a job
 * OTP.
 *
 * Underneath the boxes is one real input holding the whole value. Six separate
 * inputs look the same and behave badly: a paste lands in one box, autofill
 * fills one box, and a backspace at the start of one has to reach into the
 * previous. One field with `one-time-code` lets the platform do all of it.
 */

export interface OtpInputProps {
  length?: number
  value: string
  onChange: (value: string) => void
  /** Called once the last digit lands, so the screen can submit itself. */
  onComplete?: (value: string) => void
  label?: string
  error?: string
  disabled?: boolean
  autoFocus?: boolean
  className?: string
}

export function OtpInput({
  length = 6,
  value,
  onChange,
  onComplete,
  label = 'Enter the code',
  error,
  disabled = false,
  autoFocus = false,
  className,
}: OtpInputProps) {
  const id = useId()
  const errorId = `${id}-error`
  const inputRef = useRef<HTMLInputElement>(null)

  function handleChange(next: string): void {
    const digits = next.replace(/\D/g, '').slice(0, length)
    onChange(digits)
    if (digits.length === length) onComplete?.(digits)
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>

      <div
        className="relative"
        // Tapping anywhere on the boxes focuses the field behind them.
        onClick={() => inputRef.current?.focus()}
      >
        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode="numeric"
          // The one attribute that makes the SMS autofill suggestion appear.
          autoComplete="one-time-code"
          maxLength={length}
          value={value}
          disabled={disabled}
          autoFocus={autoFocus}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => handleChange(event.target.value)}
          // Invisible, but still the focused element — so the caret, the
          // keyboard and autofill all behave normally.
          className="absolute inset-0 z-10 h-full w-full cursor-default opacity-0"
        />

        <div className="flex justify-between gap-2" aria-hidden="true">
          {Array.from({ length }).map((_, index) => {
            const char = value[index]
            const isCursor = index === value.length
            return (
              <span
                key={index}
                className={cn(
                  'flex h-14 flex-1 items-center justify-center rounded-card border text-xl font-bold',
                  'transition-colors duration-[var(--duration-fast)]',
                  error
                    ? 'border-error text-error'
                    : char
                      ? 'border-ink text-ink'
                      : isCursor
                        ? 'border-ink'
                        : 'border-border text-muted'
                )}
              >
                {char ?? ''}
              </span>
            )
          })}
        </div>
      </div>

      {error ? (
        <p id={errorId} role="alert" className="text-xs text-error">
          {error}
        </p>
      ) : null}
    </div>
  )
}

/**
 * The read-only counterpart: the job OTP the customer reads out to the
 * technician. Four digits, spaced so they can be spoken.
 */
export function OtpDisplay({
  otp,
  caption,
  className,
}: {
  otp: string
  caption: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2 rounded-card border border-ink bg-bg p-5 text-center',
        className
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        {caption}
      </p>
      <p className="text-3xl font-extrabold tracking-[0.35em] text-ink">
        {/* The trailing letter-spacing pushes the group off-centre otherwise. */}
        <span className="ml-[0.35em]">{otp}</span>
      </p>
    </div>
  )
}
