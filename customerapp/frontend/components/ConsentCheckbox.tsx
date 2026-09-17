'use client'

import { useId } from 'react'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'

/**
 * The Terms and Privacy tick on the login screen. Required — sign-in is blocked
 * until it is checked, and the version accepted is stamped onto the user
 * document so a later change to the terms is a re-consent rather than a silent
 * substitution.
 *
 * The box is a real checkbox behind a drawn one, so the browser handles focus,
 * space-to-toggle and form association.
 */

export interface ConsentCheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  error?: string
  className?: string
}

export function ConsentCheckbox({
  checked,
  onChange,
  error,
  className,
}: ConsentCheckboxProps) {
  const id = useId()
  const errorId = `${id}-error`

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-start gap-3">
        <span className="relative flex size-11 shrink-0 items-center justify-center">
          <input
            id={id}
            type="checkbox"
            checked={checked}
            onChange={(event) => onChange(event.target.checked)}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={error ? errorId : undefined}
            required
            // Invisible but focusable and hit-testable across the full 44px.
            className="peer absolute inset-0 size-full cursor-pointer opacity-0"
          />
          <span
            aria-hidden="true"
            className={cn(
              'flex size-5 items-center justify-center rounded border-2',
              'transition-colors duration-[var(--duration-fast)]',
              'peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink',
              checked
                ? 'border-ink bg-ink text-bg'
                : error
                  ? 'border-error bg-bg'
                  : 'border-border bg-bg'
            )}
          >
            {checked ? <Check className="size-3.5" strokeWidth={3} /> : null}
          </span>
        </span>

        <label htmlFor={id} className="pt-2.5 text-sm leading-relaxed text-muted">
          I agree to the{' '}
          <Link href="/legal/terms" className="font-medium text-ink underline">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/legal/privacy" className="font-medium text-ink underline">
            Privacy Policy
          </Link>
          .
        </label>
      </div>

      {error ? (
        <p id={errorId} role="alert" className="pl-14 text-xs text-error">
          {error}
        </p>
      ) : null}
    </div>
  )
}
