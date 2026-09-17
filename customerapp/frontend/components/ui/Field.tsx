'use client'

import { forwardRef, useId } from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/cn'

/**
 * Text inputs, textareas and the label/error scaffolding around them.
 *
 * The error is wired to the control with aria-describedby and aria-invalid
 * rather than only being painted red, so a screen reader announces what is
 * wrong with the field it is sitting on.
 */

interface FieldShellProps {
  label: string
  /** Hidden visually but still read out — used where the label is obvious. */
  hideLabel?: boolean
  hint?: string
  error?: string
  required?: boolean
  children: (ids: {
    id: string
    describedBy: string | undefined
    invalid: boolean
  }) => React.ReactNode
}

export function FieldShell({
  label,
  hideLabel = false,
  hint,
  error,
  required = false,
  children,
}: FieldShellProps) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') ||
    undefined

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className={cn(
          'text-sm font-medium text-ink',
          hideLabel && 'sr-only'
        )}
      >
        {label}
        {required ? (
          <span className="text-error" aria-hidden="true">
            {' '}
            *
          </span>
        ) : null}
      </label>

      {children({ id, describedBy, invalid: Boolean(error) })}

      {hint && !error ? (
        <p id={hintId} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}

      {error ? (
        <p
          id={errorId}
          className="flex items-start gap-1.5 text-xs text-error"
          // Announced when it appears, without stealing focus from the field.
          role="alert"
        >
          <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}
    </div>
  )
}

const controlClasses =
  'w-full rounded-card border bg-bg px-4 py-3 text-base text-ink ' +
  'transition-colors duration-[var(--duration-fast)] ' +
  'placeholder:text-muted disabled:bg-surface disabled:text-muted'

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string
  hideLabel?: boolean
  hint?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hideLabel, hint, error, className, required, ...props },
  ref
) {
  return (
    <FieldShell
      label={label}
      hideLabel={hideLabel}
      hint={hint}
      error={error}
      required={required}
    >
      {({ id, describedBy, invalid }) => (
        <input
          ref={ref}
          id={id}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          required={required}
          className={cn(
            controlClasses,
            invalid ? 'border-error' : 'border-border focus:border-brand',
            className
          )}
          {...props}
        />
      )}
    </FieldShell>
  )
})

export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  label: string
  hideLabel?: boolean
  hint?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    { label, hideLabel, hint, error, className, required, rows = 4, ...props },
    ref
  ) {
    return (
      <FieldShell
        label={label}
        hideLabel={hideLabel}
        hint={hint}
        error={error}
        required={required}
      >
        {({ id, describedBy, invalid }) => (
          <textarea
            ref={ref}
            id={id}
            rows={rows}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            required={required}
            className={cn(
              controlClasses,
              'resize-y',
              invalid ? 'border-error' : 'border-border focus:border-brand',
              className
            )}
            {...props}
          />
        )}
      </FieldShell>
    )
  }
)
