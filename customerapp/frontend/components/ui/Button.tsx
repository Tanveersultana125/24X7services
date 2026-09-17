'use client'

import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  /** Shows a spinner and blocks the click without collapsing the button width. */
  loading?: boolean
  fullWidth?: boolean
  iconLeft?: React.ReactNode
  iconRight?: React.ReactNode
}

const variants: Record<Variant, string> = {
  // Solid black on white is the only primary in the system.
  primary:
    'bg-ink text-bg border border-ink hover:bg-ink/90 active:bg-ink/85 disabled:bg-muted disabled:border-muted',
  secondary:
    'bg-bg text-ink border border-ink hover:bg-surface active:bg-border disabled:text-muted disabled:border-border',
  ghost:
    'bg-transparent text-ink border border-transparent hover:bg-surface active:bg-border disabled:text-muted',
  // Destructive confirmations only — cancelling a booking, deleting an account.
  danger:
    'bg-error text-white border border-error hover:bg-error/90 active:bg-error/85 disabled:bg-muted disabled:border-muted',
}

const sizes: Record<Size, string> = {
  sm: 'h-11 px-4 text-sm',
  md: 'h-12 px-5 text-base',
  lg: 'h-14 px-6 text-base',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      iconLeft,
      iconRight,
      className,
      children,
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled === true || loading}
        // Screen readers get told the button is busy rather than silently dead.
        aria-busy={loading || undefined}
        className={cn(
          'relative inline-flex items-center justify-center gap-2',
          'rounded-pill font-semibold whitespace-nowrap',
          'transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out-soft)]',
          'disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {/* The label stays in the layout while loading so the button does not
            change width mid-tap and move whatever sits beside it. */}
        <span
          className={cn(
            'inline-flex items-center gap-2',
            loading && 'invisible'
          )}
        >
          {iconLeft}
          {children}
          {iconRight}
        </span>
        {loading ? (
          <Loader2
            className="absolute size-5 animate-spin"
            aria-hidden="true"
          />
        ) : null}
      </button>
    )
  }
)
